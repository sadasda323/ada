package handlers

import (
	"net/http"
	"strconv"
	"strings"
)

// Pagination parses page/pageSize query params with sane defaults & limits.
type Pagination struct {
	Page     int
	PageSize int
	Search   string
	SortBy   string
	SortDir  string
}

func ParsePagination(r *http.Request) Pagination {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}
	size, _ := strconv.Atoi(r.URL.Query().Get("pageSize"))
	if size < 1 || size > 200 {
		size = 20
	}
	dir := strings.ToLower(r.URL.Query().Get("sortDir"))
	if dir != "asc" && dir != "desc" {
		dir = "desc"
	}
	return Pagination{
		Page:     page,
		PageSize: size,
		Search:   strings.TrimSpace(r.URL.Query().Get("q")),
		SortBy:   r.URL.Query().Get("sortBy"),
		SortDir:  dir,
	}
}

func (p Pagination) Offset() int { return (p.Page - 1) * p.PageSize }
