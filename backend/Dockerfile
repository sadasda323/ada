# syntax=docker/dockerfile:1.6
# ─── Build stage ──────────────────────────────────────────────────────────────
FROM golang:1.22-alpine AS build
WORKDIR /src

RUN apk add --no-cache git ca-certificates build-base

COPY go.mod go.sum* ./
RUN go mod download || true

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -trimpath -ldflags="-s -w" -o /out/api ./cmd/api && \
    CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -trimpath -ldflags="-s -w" -o /out/seed ./cmd/seed

# ─── Runtime stage ────────────────────────────────────────────────────────────
FROM alpine:3.20
WORKDIR /app
RUN apk add --no-cache ca-certificates tzdata && \
    addgroup -S app && adduser -S app -G app

COPY --from=build /out/api /app/api
COPY --from=build /out/seed /app/seed

USER app
EXPOSE 4000
ENV PORT=4000

CMD ["/app/api"]
