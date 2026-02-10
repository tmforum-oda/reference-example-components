# ProductCatalog MCP Server - Streamable HTTP Migration Guide

## Overview

This document describes the upgrade of the ProductCatalog MCP Server from the legacy HTTP+SSE transport to the modern Streamable HTTP transport, as specified in the Model Context Protocol specification 2025-06-18.

## What Changed

### Transport Layer
- **Before**: HTTP+SSE (Server-Sent Events) transport with separate message and SSE endpoints
- **After**: Streamable HTTP transport with unified `/mcp` endpoint

### Benefits of Streamable HTTP

1. **Unified Endpoint**: All MCP traffic flows through a single `/mcp` endpoint, simplifying configuration and routing
2. **Better Security**: Easier to secure behind firewalls, API gateways, and reverse proxies
3. **Cloud-Friendly**: Works well in serverless and containerized environments
4. **Flexible Responses**: Supports both immediate JSON responses and SSE streams as needed
5. **Session Management**: Built-in support for stateful and stateless operation
6. **Modern Standard**: Aligns with MCP specification 2025-06-18

## Server Changes

### Before (SSE Transport)
```python
# Create a main FastAPI app
main_app = FastAPI(title="Product Catalog MCP Server")

# Create the SSE app
mcp_app = mcp.sse_app()

# Mount the MCP server app
main_app.mount("/" + url + "/mcp", mcp_app)

# Run with uvicorn
uvicorn.run(main_app, host="0.0.0.0", port=port)
```

### After (Streamable HTTP)
```python
# Initialize FastMCP with host and port
mcp = FastMCP(
    name="product_catalog",
    host=os.environ.get("MCP_HOST", "0.0.0.0"),
    port=int(os.environ.get("MCP_PORT", 8000)),
)

# ... define tools, resources, prompts ...

# Run with Streamable HTTP transport
mcp.run(transport="streamable-http")
```

## Configuration

### Environment Variables
- `MCP_HOST`: Host address to bind to (default: 0.0.0.0)
- `MCP_PORT`: Port for the server (default: 8000)

### Command-Line Arguments
```bash
python3 product_catalog_mcp_server.py --host 0.0.0.0 --port 8000
```

## Running the Server

### Development
```bash
cd source/ProductCatalog/MCPServerMicroservice
python3 product_catalog_mcp_server.py
```

The server will start on `http://localhost:8000` with the MCP endpoint at `http://localhost:8000/mcp`.

### Production
```bash
# With custom configuration
MCP_HOST=0.0.0.0 MCP_PORT=8080 python3 product_catalog_mcp_server.py
```

## Testing

### Integration Tests
```bash
# Start the server
python3 product_catalog_mcp_server.py

# In another terminal, run tests
python3 test_mcp_integration.py --url http://localhost:8000/mcp
```

Expected output:
```
Test Results: 5/5 passed
✓ All tests passed!
```

### Using MCP Inspector
```bash
# Start the server
python3 product_catalog_mcp_server.py

# In another terminal
npx @modelcontextprotocol/inspector
```

Then connect to `http://localhost:8000/mcp` in the Inspector UI.

## Client Integration

### Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "product-catalog": {
      "url": "http://localhost:8000/mcp",
      "transport": "http"
    }
  }
}
```

### GitHub Copilot

Add to VS Code settings:

```json
{
  "github.copilot.advanced": {
    "mcp": {
      "servers": {
        "product-catalog": {
          "url": "http://localhost:8000/mcp",
          "transport": "http"
        }
      }
    }
  }
}
```

### Python MCP Client

```python
from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client

async with streamable_http_client("http://localhost:8000/mcp") as (read, write, get_session_id):
    async with ClientSession(read, write) as session:
        await session.initialize()
        
        # List available tools
        tools = await session.list_tools()
        print(f"Available tools: {len(tools.tools)}")
        
        # Call a tool
        result = await session.call_tool("catalog_get", arguments={})
        print(result)
```

## Available MCP Features

### Tools (20)
- Catalog management: catalog_get, catalog_create, catalog_update, catalog_delete
- Category management: category_get, category_create, category_update, category_delete
- Product Specification: product_specification_get, product_specification_create, etc.
- Product Offering: product_offering_get, product_offering_create, etc.
- Product Offering Price: product_offering_price_get, product_offering_price_create, etc.

### Resources (5)
- schema://tmf620/catalog
- schema://tmf620/category
- schema://tmf620/productSpecification
- schema://tmf620/productOffering
- schema://tmf620/productOfferingPrice

### Prompts (13)
Templates for common operations like creating catalogs, categories, product specifications, etc.

## Troubleshooting

### Port Already in Use
```bash
# Use a different port
python3 product_catalog_mcp_server.py --port 8001
```

### Connection Refused
- Verify the server is running: `curl http://localhost:8000/mcp`
- Check firewall rules
- Ensure correct host/port configuration

### SSL/TLS Issues in Development
For development with self-signed certificates:
- Configure MCP clients to accept self-signed certificates
- Use HTTP for local development
- Use proper TLS certificates in production

## Migration Checklist

- [x] Update server code to use Streamable HTTP
- [x] Remove SSE-specific code
- [x] Update configuration and command-line arguments
- [x] Update documentation
- [x] Create integration tests
- [x] Verify all tools work correctly
- [x] Test with MCP Inspector
- [x] Document client integration examples

## References

- [MCP Specification - Transports](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports)
- [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)
- [FastMCP Documentation](https://github.com/modelcontextprotocol/python-sdk)
- [MCP Inspector](https://github.com/modelcontextprotocol/inspector)

## Support

For issues or questions, please refer to:
- Project README: `source/ProductCatalog/MCPServerMicroservice/README.md`
- Integration tests: `test_mcp_integration.py`
- MCP community resources
