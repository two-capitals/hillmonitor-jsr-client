# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is `@hillmonitor/client`, a Deno/JSR package providing an SDK for building Supabase Edge Functions that integrate with the HillMonitor Platform API. It's published to JSR (JavaScript Registry).

## Commands

```bash
# Publish to JSR (requires authentication)
deno publish

# Type check
deno check mod.ts

# Format code
deno fmt

# Lint
deno lint
```

## Architecture

The SDK provides three main patterns for Edge Functions:

### 1. Resource Handler (`serveResource`)
Factory for RESTful CRUD endpoints that proxy to the HillMonitor Platform API. Handles auth, CORS, routing, and user ID injection automatically.

```
src/resource-handler.ts  - Main factory, creates Deno.serve() with full CRUD routing
src/platform-client.ts   - Makes authenticated requests to Platform API with user filtering
```

### 2. Webhook Handler (`serveWebhook`)
Factory for webhook endpoints with HMAC-SHA256 signature verification.

```
src/webhook/handler.ts      - Main factory, creates Deno.serve() with signature verification
src/webhook/verification.ts - HMAC signature verification logic
src/webhook/types.ts        - Webhook payload type definitions
```

### 3. Building Blocks for Custom Functions
Low-level utilities for building custom Edge Functions:

```
src/auth.ts            - Supabase JWT verification (verifyAuth)
src/cors.ts            - CORS handler factory (createCorsHandler, getDefaultCorsHandler)
src/response.ts        - Standardized JSON response helpers
src/supabase-client.ts - Supabase client factories (service/authenticated)
src/platform-types.ts  - TypeScript types for Platform API entities
```

## Key Patterns

- **User filtering**: `platformRequest` automatically injects `external_user_id` into requests (GET: query param, POST/PATCH/PUT: body) unless `HILLMONITOR_FILTER_BY_USER=false`
- **CORS handling**: Set `HILLMONITOR_ALLOWED_ORIGINS` env var for automatic CORS, or pass explicit `cors` option
- **Module exports**: All public API exports go through `mod.ts`

## Environment Variables

Used by the SDK at runtime in Edge Functions:
- `HILLMONITOR_ALLOWED_ORIGINS` - Comma-separated allowed CORS origins
- `HILLMONITOR_API_URL` - Platform API base URL (defaults to https://api.hillmonitor.ca)
- `HILLMONITOR_SECRET_KEY` - Platform API authentication
- `HILLMONITOR_WEBHOOK_SECRET` - Webhook signature verification
- `HILLMONITOR_FILTER_BY_USER` - Enable/disable automatic user filtering (default: true)
