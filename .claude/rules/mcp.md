# MCP Server Integration

Roles can connect to user-hosted MCP (Model Context Protocol) servers to access external tools.

## Key Facts

- **Transport**: SSE only (Edge runtime compatible, no subprocess spawning)
- **Assignment**: Role-level (each role has its own MCP servers)
- **Storage**: `mcp_servers` table with RLS

## Architecture

```
lib/mcp/
├── types.ts          — MCP JSON-RPC protocol types
├── client.ts         — Edge-compatible SSE client (no SDK dependency)
├── errors.ts         — Error classes and formatting
└── url-validation.ts — URL security validation

lib/tools/
└── mcp-tools.ts      — Tool registry integration
```

## How It Works

1. At chat start, role's MCP servers are fetched from `mcp_servers` table
2. For each SSE server, we initialize and list available tools
3. MCP tools are prefixed: `mcp_{serverName}_{toolName}` to avoid conflicts
4. Tool calls are routed to the appropriate MCP server
5. Errors are returned to AI (so it can explain) AND shown to user via warning banner

## UI Flow

1. Role Settings → MCP Servers tab
2. Add server name, URL, optional auth headers (JSON)
3. "Test Connection" button verifies and shows available tools
4. Toggle enable/disable per server

## Server Actions

Located in `app/actions/mcp.ts`:
```typescript
createMcpServer(roleId, { name, url, headers })
deleteMcpServer(serverId)
toggleMcpServer(serverId, enabled)
testMcpServerConnection(url, headers)
```

## Settings UI

`components/settings/role-mcp-manager.tsx`
