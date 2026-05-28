package httpx

import "net/http"

// AppError is a typed error with HTTP status, code and optional details.
type AppError struct {
	Status  int    `json:"-"`
	Code    string `json:"code"`
	Message string `json:"message"`
	Details any    `json:"details,omitempty"`
}

func (e *AppError) Error() string { return e.Message }

func NewAppError(status int, code, msg string, details any) *AppError {
	return &AppError{Status: status, Code: code, Message: msg, Details: details}
}

func BadRequest(msg string, details any) *AppError {
	return NewAppError(http.StatusBadRequest, "BAD_REQUEST", msg, details)
}
func Unauthorized(msg string) *AppError {
	if msg == "" {
		msg = "No autenticado"
	}
	return NewAppError(http.StatusUnauthorized, "UNAUTHORIZED", msg, nil)
}
func Forbidden(msg string) *AppError {
	if msg == "" {
		msg = "Acceso denegado"
	}
	return NewAppError(http.StatusForbidden, "FORBIDDEN", msg, nil)
}
func NotFound(msg string) *AppError {
	if msg == "" {
		msg = "Recurso no encontrado"
	}
	return NewAppError(http.StatusNotFound, "NOT_FOUND", msg, nil)
}
func Conflict(msg string, details any) *AppError {
	return NewAppError(http.StatusConflict, "CONFLICT", msg, details)
}
func Validation(msg string, details any) *AppError {
	if msg == "" {
		msg = "Datos inválidos"
	}
	return NewAppError(http.StatusUnprocessableEntity, "VALIDATION_ERROR", msg, details)
}
func Internal(msg string) *AppError {
	if msg == "" {
		msg = "Error interno del servidor"
	}
	return NewAppError(http.StatusInternalServerError, "INTERNAL_ERROR", msg, nil)
}
