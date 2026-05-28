package httpx

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-playground/validator/v10"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

// Envelope ─────────────────────────────────────────────────────────────────────

type successEnvelope struct {
	Success bool `json:"success"`
	Data    any  `json:"data"`
	Meta    any  `json:"meta,omitempty"`
}

type errorEnvelope struct {
	Success bool      `json:"success"`
	Error   *AppError `json:"error"`
}

type PaginationMeta struct {
	Page       int   `json:"page"`
	PageSize   int   `json:"pageSize"`
	Total      int64 `json:"total"`
	TotalPages int   `json:"totalPages"`
}

// JSON helpers ─────────────────────────────────────────────────────────────────

func JSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if payload == nil {
		return
	}
	_ = json.NewEncoder(w).Encode(payload)
}

func OK(w http.ResponseWriter, data any) {
	JSON(w, http.StatusOK, successEnvelope{Success: true, Data: data})
}

func Created(w http.ResponseWriter, data any) {
	JSON(w, http.StatusCreated, successEnvelope{Success: true, Data: data})
}

func NoContent(w http.ResponseWriter) {
	w.WriteHeader(http.StatusNoContent)
}

func Paginated(w http.ResponseWriter, data any, meta PaginationMeta) {
	JSON(w, http.StatusOK, successEnvelope{Success: true, Data: data, Meta: meta})
}

// WriteError maps any error to a JSON error envelope.
func WriteError(w http.ResponseWriter, log *zap.Logger, err error) {
	var appErr *AppError
	if errors.As(err, &appErr) {
		JSON(w, appErr.Status, errorEnvelope{Success: false, Error: appErr})
		return
	}

	var verrs validator.ValidationErrors
	if errors.As(err, &verrs) {
		details := make(map[string]string, len(verrs))
		for _, fe := range verrs {
			details[fe.Field()] = fe.Tag()
		}
		ae := Validation("Datos de entrada inválidos", details)
		JSON(w, ae.Status, errorEnvelope{Success: false, Error: ae})
		return
	}

	if errors.Is(err, gorm.ErrRecordNotFound) {
		ae := NotFound("Registro no encontrado")
		JSON(w, ae.Status, errorEnvelope{Success: false, Error: ae})
		return
	}

	if log != nil {
		log.Error("unhandled error", zap.Error(err))
	}
	ae := Internal("")
	JSON(w, ae.Status, errorEnvelope{Success: false, Error: ae})
}

// DecodeJSON parses request body as JSON into dst.
func DecodeJSON(r *http.Request, dst any) error {
	defer r.Body.Close()
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(dst); err != nil {
		return BadRequest("JSON inválido: "+err.Error(), nil)
	}
	return nil
}
