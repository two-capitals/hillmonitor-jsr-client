# @hillmonitor/client

Shared SDK for HillMonitor Supabase Edge Functions. Provides utilities for building applications that interact with the HillMonitor Platform API.

## Installation

```typescript
// In your supabase/functions/deno.json
{
  "imports": {
    "@hillmonitor/client": "jsr:@hillmonitor/client@^0.1.0"
  }
}
```

## Features

- **Platform API Client** - Authenticated requests to HillMonitor Platform API
- **Resource Handler** - RESTful CRUD endpoint factory
- **Auth Utilities** - Supabase JWT verification
- **CORS Handler** - Configurable CORS for Edge Functions
- **Response Helpers** - Standardized JSON responses
- **Supabase Clients** - Service and authenticated client factories

## Quick Start

### RESTful Resource Endpoint

```typescript
import { serveResource, createCorsHandler } from "@hillmonitor/client";

const cors = createCorsHandler([
  'http://localhost:3000',
  'https://myapp.example.com',
]);

serveResource({
  platformPath: '/api/v1/alerts/',
  cors,
  operations: 'all', // or 'read', or ['list', 'get', 'create']
});
```

### Custom Edge Function

```typescript
import {
  createCorsHandler,
  verifyAuth,
  platformRequest,
  successResponse,
  unauthorizedResponse,
} from "@hillmonitor/client";

const { getCorsHeaders, handleCorsPrelight } = createCorsHandler([
  'http://localhost:3000',
]);

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return handleCorsPrelight(origin);
  }

  const { user, error } = await verifyAuth(req);
  if (error) {
    return unauthorizedResponse(corsHeaders);
  }

  const { data, status } = await platformRequest({
    path: '/api/v1/alerts/',
    method: 'GET',
    userId: user.id,
  });

  return successResponse(data, corsHeaders);
});
```

## API Reference

### CORS

```typescript
import { createCorsHandler } from "@hillmonitor/client";

const { getCorsHeaders, handleCorsPrelight } = createCorsHandler([
  'http://localhost:3000',
  'https://app.example.com',
]);
```

### Authentication

```typescript
import { verifyAuth } from "@hillmonitor/client";

const { user, error } = await verifyAuth(req);
// user.id - Supabase user UUID
// user.email - User email (if available)
```

### Platform Client

```typescript
import { platformRequest, getFullMeeting, isPlatformConfigured } from "@hillmonitor/client";

// Check configuration
if (!isPlatformConfigured()) {
  throw new Error('HILLMONITOR_SECRET_KEY not set');
}

// Make authenticated request
const { data, status } = await platformRequest({
  path: '/api/v1/alerts/',
  method: 'GET',
  userId: 'user-uuid',
});

// Get full meeting with alert matches
const { data: meeting } = await getFullMeeting(123);
```

### Supabase Clients

```typescript
import { createServiceClient, createAuthenticatedClient } from "@hillmonitor/client";

// Admin client (bypasses RLS)
const admin = createServiceClient();

// User client (respects RLS)
const userClient = createAuthenticatedClient(authHeader);
```

### Response Helpers

```typescript
import {
  successResponse,
  createdResponse,
  errorResponse,
  badRequestResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from "@hillmonitor/client";

// All response functions take corsHeaders as the last parameter
return successResponse({ id: 1 }, corsHeaders);
return errorResponse('Something went wrong', 400, corsHeaders);
```

## Environment Variables

Required environment variables for Edge Functions:

```bash
# Supabase configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # For createServiceClient()
SUPABASE_PUBLISHABLE_KEY=your-publishable-key     # For createAuthenticatedClient() and verifyAuth()

# HillMonitor API configuration
HILLMONITOR_API_URL=https://api.hillmonitor.ca    # Optional, defaults to this value
HILLMONITOR_SECRET_KEY=your-secret-key            # Required for HillMonitor API requests
```

## License

MIT
