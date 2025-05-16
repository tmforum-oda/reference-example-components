#!/bin/bash

# Example script showing how to run the Product Catalog MCP server with different configurations

# Run with stdio transport (default)
# python product_catalog_mcp_server.py

# Run with SSE transport on the default port (8000)
# python product_catalog_mcp_server.py --transport sse

# Run with SSE transport on a custom port (9000)
python product_catalog_mcp_server.py --transport sse --port 9000

# Alternatively, you can use environment variables
# export MCP_TRANSPORT=sse
# export MCP_PORT=9000
# python product_catalog_mcp_server.py
