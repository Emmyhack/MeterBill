package server

import (
	"io"
	"log/slog"
	"net/http"
	"strings"
	"testing"
	"testing/fstest"
)

type recorder struct {
	header http.Header
	code   int
	body   strings.Builder
}

func newRecorder() *recorder                        { return &recorder{header: make(http.Header), code: http.StatusOK} }
func (r *recorder) Header() http.Header             { return r.header }
func (r *recorder) Write(value []byte) (int, error) { return r.body.Write(value) }
func (r *recorder) WriteHeader(code int)            { r.code = code }
func request(target string) *http.Request {
	value, _ := http.NewRequest(http.MethodGet, target, nil)
	return value
}

func fixture(t *testing.T) http.Handler {
	t.Helper()
	filesystem := fstest.MapFS{"dist/index.html": {Data: []byte("app")}, "dist/assets/app-abc.js": {Data: []byte("js")}}
	server, err := New(filesystem, slog.New(slog.NewTextHandler(io.Discard, nil)))
	if err != nil {
		t.Fatal(err)
	}
	return server.Handler()
}
func TestHealth(t *testing.T) {
	response := newRecorder()
	fixture(t).ServeHTTP(response, request("/healthz"))
	if response.code != 200 || response.Header().Get("Content-Type") != "application/json" {
		t.Fatalf("unexpected response: %d", response.code)
	}
}
func TestSPAFallbackAndHeaders(t *testing.T) {
	response := newRecorder()
	fixture(t).ServeHTTP(response, request("/some/client/route"))
	if response.code != 200 || response.body.String() != "app" {
		t.Fatalf("fallback failed: %d %q", response.code, response.body.String())
	}
	if response.Header().Get("Content-Security-Policy") == "" || response.Header().Get("X-Content-Type-Options") != "nosniff" {
		t.Fatal("security headers missing")
	}
	if response.Header().Get("Cache-Control") != "no-cache" {
		t.Fatal("index must not be cached")
	}
}
func TestHashedAssetCaching(t *testing.T) {
	response := newRecorder()
	fixture(t).ServeHTTP(response, request("/assets/app-abc.js"))
	if response.Header().Get("Cache-Control") != "public, max-age=31536000, immutable" {
		t.Fatal("asset cache policy missing")
	}
}
