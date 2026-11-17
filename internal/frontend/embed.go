package frontend

import "embed"

// FS contains the production frontend. Make build refreshes dist from web/dist.
//
//go:embed dist/*
var FS embed.FS
