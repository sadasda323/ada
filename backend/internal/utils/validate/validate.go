package validate

import (
	"reflect"
	"strings"
	"sync"

	"github.com/go-playground/validator/v10"
)

var (
	once    sync.Once
	v       *validator.Validate
)

func V() *validator.Validate {
	once.Do(func() {
		v = validator.New(validator.WithRequiredStructEnabled())
		// Use json tag names in error fields.
		v.RegisterTagNameFunc(func(fld reflect.StructField) string {
			name := strings.SplitN(fld.Tag.Get("json"), ",", 2)[0]
			if name == "-" {
				return ""
			}
			return name
		})
	})
	return v
}

func Struct(s any) error {
	return V().Struct(s)
}
