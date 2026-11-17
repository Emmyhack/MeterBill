package server

import (
	"encoding/json"
	"errors"
	"io/fs"
	"log/slog"
	"net/http"
	"path"
	"strings"
	"time"
)

type Server struct{ handler http.Handler }

func New(static fs.FS, logger *slog.Logger) (*Server, error) {
	if logger == nil {
		logger = slog.Default()
	}
	assets, err := fs.Sub(static, "dist")
	if err != nil {
		return nil, err
	}
	files := http.FileServer(http.FS(assets))
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})
	mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		clean := strings.TrimPrefix(path.Clean(r.URL.Path), "/")
		if clean == "." || clean == "" {
			clean = "index.html"
		}
		if _, statErr := fs.Stat(assets, clean); statErr != nil {
			if !errors.Is(statErr, fs.ErrNotExist) {
				http.Error(w, "internal error", http.StatusInternalServerError)
				return
			}
			clean = "index.html"
		}
		if clean == "index.html" {
			w.Header().Set("Cache-Control", "no-cache")
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			index, readErr := fs.ReadFile(assets, "index.html")
			if readErr != nil {
				http.Error(w, "frontend unavailable", http.StatusInternalServerError)
				return
			}
			_, _ = w.Write(index)
			return
		} else if strings.HasPrefix(clean, "assets/") {
			w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
		}
		files.ServeHTTP(w, r)
	})
	s := &Server{}
	s.handler = security(logging(mux, logger))
	return s, nil
}

func (s *Server) Handler() http.Handler { return s.handler }

func security(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'")
		w.Header().Set("Referrer-Policy", "no-referrer")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
		w.Header().Set("Cross-Origin-Opener-Policy", "same-origin")
		next.ServeHTTP(w, r)
	})
}

func logging(next http.Handler, logger *slog.Logger) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		started := time.Now()
		next.ServeHTTP(w, r)
		logger.Info("http request", "method", r.Method, "path", r.URL.Path, "duration", time.Since(started))
	})
}
