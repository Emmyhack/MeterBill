package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"meterbill/internal/frontend"
	appserver "meterbill/internal/server"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	app, err := appserver.New(frontend.FS, logger)
	if err != nil {
		logger.Error("initialize server", "error", err)
		os.Exit(1)
	}
	address := os.Getenv("ADDR")
	if address == "" {
		address = ":8080"
	}
	server := &http.Server{Addr: address, Handler: app.Handler(), ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 15 * time.Second, WriteTimeout: 30 * time.Second, IdleTimeout: 60 * time.Second, MaxHeaderBytes: 1 << 20}
	go func() {
		logger.Info("server listening", "address", address)
		if serveErr := server.ListenAndServe(); serveErr != nil && !errors.Is(serveErr, http.ErrServerClosed) {
			logger.Error("server failed", "error", serveErr)
			os.Exit(1)
		}
	}()
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err = server.Shutdown(ctx); err != nil {
		logger.Error("shutdown failed", "error", err)
		os.Exit(1)
	}
	logger.Info("server stopped")
}
