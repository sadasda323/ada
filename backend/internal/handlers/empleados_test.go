package handlers_test

import (
	"encoding/json"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestEmpleados_CRUDFlow(t *testing.T) {
	app, _ := testApp(t)
	r := registerAdmin(t, app, "900444444-4", "rrhh@test.com")
	tok := r.Data.AccessToken

	// Crea un cargo y un área primero
	rr := doJSON(t, app, "POST", "/api/areas", map[string]any{
		"nombre": "Tecnología",
	}, tok)
	require.Equal(t, http.StatusCreated, rr.Code, rr.Body.String())
	var areaResp struct {
		Data struct {
			ID string `json:"id"`
		} `json:"data"`
	}
	require.NoError(t, json.Unmarshal(rr.Body.Bytes(), &areaResp))

	rr = doJSON(t, app, "POST", "/api/cargos", map[string]any{
		"nombre":      "Backend Dev",
		"salarioBase": "5000000",
	}, tok)
	require.Equal(t, http.StatusCreated, rr.Code, rr.Body.String())
	var cargoResp struct {
		Data struct {
			ID string `json:"id"`
		} `json:"data"`
	}
	require.NoError(t, json.Unmarshal(rr.Body.Bytes(), &cargoResp))

	// Crea empleado
	rr = doJSON(t, app, "POST", "/api/empleados", map[string]any{
		"documento":    "1010111222",
		"nombre":       "Pedro",
		"apellido":     "Páramo",
		"fechaIngreso": "2024-06-01T00:00:00Z",
		"salario":      "5000000",
		"areaId":       areaResp.Data.ID,
		"cargoId":      cargoResp.Data.ID,
	}, tok)
	require.Equal(t, http.StatusCreated, rr.Code, rr.Body.String())
	var empResp struct {
		Data struct {
			ID     string `json:"id"`
			Nombre string `json:"nombre"`
		} `json:"data"`
	}
	require.NoError(t, json.Unmarshal(rr.Body.Bytes(), &empResp))
	assert.Equal(t, "Pedro", empResp.Data.Nombre)

	// Lista
	rr = doJSON(t, app, "GET", "/api/empleados?page=1&pageSize=10", nil, tok)
	require.Equal(t, http.StatusOK, rr.Code)

	// Update
	rr = doJSON(t, app, "PUT", "/api/empleados/"+empResp.Data.ID, map[string]any{
		"documento":    "1010111222",
		"nombre":       "Pedro",
		"apellido":     "Romero",
		"fechaIngreso": "2024-06-01T00:00:00Z",
		"salario":      "5500000",
	}, tok)
	assert.Equal(t, http.StatusOK, rr.Code, rr.Body.String())

	// Delete
	rr = doJSON(t, app, "DELETE", "/api/empleados/"+empResp.Data.ID, nil, tok)
	assert.Equal(t, http.StatusNoContent, rr.Code)
}

func TestEmpleados_TenantIsolation(t *testing.T) {
	app, _ := testApp(t)
	a := registerAdmin(t, app, "900555555-5", "a@a.com")
	b := registerAdmin(t, app, "900666666-6", "b@b.com")

	// Empresa A crea empleado
	rr := doJSON(t, app, "POST", "/api/empleados", map[string]any{
		"documento":    "1111",
		"nombre":       "Empleado",
		"apellido":     "A",
		"fechaIngreso": "2024-01-01T00:00:00Z",
		"salario":      "3000000",
	}, a.Data.AccessToken)
	require.Equal(t, http.StatusCreated, rr.Code)
	var emp struct {
		Data struct {
			ID string `json:"id"`
		} `json:"data"`
	}
	require.NoError(t, json.Unmarshal(rr.Body.Bytes(), &emp))

	// Empresa B no debe verlo
	rr = doJSON(t, app, "GET", "/api/empleados/"+emp.Data.ID, nil, b.Data.AccessToken)
	assert.Equal(t, http.StatusNotFound, rr.Code)

	// Empresa A sí
	rr = doJSON(t, app, "GET", "/api/empleados/"+emp.Data.ID, nil, a.Data.AccessToken)
	assert.Equal(t, http.StatusOK, rr.Code)
}
