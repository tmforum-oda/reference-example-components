# Product Catalog MCP Server

This microservice implements a Model Context Protocol (MCP) server that provides a standardized interface to access the TM Forum Product Catalog API. It allows AI agents to interact with the Product Catalog component through the MCP standard.

## What is MCP?

Model Context Protocol (MCP) is a standard designed to enable AI agents to interact with tools and services in a consistent way. It allows AI agents to discover and use your API's capabilities without requiring custom integration for each service. For more information, see:

- [Model Context Protocol Documentation](https://docs.anthropic.com/en/docs/agents-and-tools/mcp)
- [MCP Specification](https://modelcontextprotocol.io/quickstart/server)
- [Python MCP SDK](https://github.com/modelcontextprotocol/python-sdk)

## Features

- Exposes Product Catalog API functionalities as MCP tools
- Supports both Server-Sent Events (SSE) and standard input/output transports
- Containerized for easy deployment
- Kubernetes-ready with health checks
- Integration with TM Forum ODA Component standard

## API Operations

The MCP server exposes the following Product Catalog operations:

- `catalog_get`: Retrieve catalog information
- `catalog_create`: Create a new catalog
- `catalog_update`: Update an existing catalog
- `catalog_delete`: Delete a catalog

## Getting Started

### Prerequisites

- Docker
- Python 3.13+ (for development without Docker)

### Running with Docker

1. Build the Docker image:

```
docker buildx build -t "lesterthomas/productcatalogmcp:0.1"  --platform "linux/amd64,linux/arm64" -f prodcat-mcp-dockerfile . --push
```





### Running Locally (Development)


```
uv run .\product_catalog_mcp_server.py 
```


## Configuration

Environment variables:

- `MCP_PORT`: Port for SSE transport (default: 8080)

## Deployment in Kubernetes

The MCP server can be deployed alongside the Product Catalog component in Kubernetes. The necessary Kubernetes manifests are in the `charts/ProductCatalog/templates/` directory.

```bash
# From the root of the repository
helm install productcatalog ./charts/ProductCatalog
```

## Testing

You can test the MCP server using the MCP client or by making HTTP requests to the SSE endpoints. Examples are available in the `example_payloads` directory.



## Issues

The MCP server is working, but in dev environments we are using self-signed certificates that the MCP Clients (or proxies) are rejecting.
The temporary workaround is to configure the MCP proxy to use http against the internal service (and ensure it is directly exposed). This workaround is suitable to demonstrate the capability of the MCP server.