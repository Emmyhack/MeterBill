.PHONY: dev web-install test build run clean

web-install:
	cd web && pnpm install --frozen-lockfile

dev:
	cd web && pnpm dev

test:
	cd web && pnpm typecheck && pnpm lint && pnpm test
	go test ./...

build:
	cd web && pnpm build
	rm -rf internal/frontend/dist/assets
	mkdir -p internal/frontend/dist/assets
	cp web/dist/index.html internal/frontend/dist/index.html
	cp -R web/dist/assets/. internal/frontend/dist/assets/
	mkdir -p bin
	go build -trimpath -ldflags="-s -w" -o bin/light-bill ./cmd/server

run: build
	./bin/light-bill

clean:
	go clean
