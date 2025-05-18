# Product Catalog MCP Server

This microservice implements a Model Context Protocol (MCP) server that provides a standardized interface to access the TM Forum Product Catalog API. It allows AI agents to interact with the Product Catalog component through the MCP standard.

## What is MCP?

Model Context Protocol (MCP) is a standard designed to enable AI agents to interact with tools and services in a consistent way. It allows AI agents to discover and use your API's capabilities without requiring custom integration for each service. For more information, see:

- [Model Context Protocol Documentation](https://docs.anthropic.com/en/docs/agents-and-tools/mcp)
- [MCP Specification](https://modelcontextprotocol.io/quickstart/server)
- [Python MCP SDK](https://github.com/modelcontextprotocol/python-sdk)

## Features

- Exposes Product Catalog API functionalities as MCP tools
- Provides resource-based access to catalog data using the MCP resource standard
- Supports both Server-Sent Events (SSE) and standard input/output transports
- Containerized for easy deployment
- Kubernetes-ready with health checks
- Integration with TM Forum ODA Component standard

## MCP Tools

The MCP server exposes the following Product Catalog operations as tools:

- `catalog_get`: Retrieve catalog information
- `catalog_create`: Create a new catalog
- `catalog_update`: Update an existing catalog
- `catalog_delete`: Delete a catalog

## MCP Resources

The server also provides the following resource-based access:

- `resource://tmf620/catalog/{catalog_id}`: Access catalog data directly as a resource
- `resource://tmf620/catalog`: Access the catalog schema and list of catalogs

Resources provide a more schema-aware way to access the TMF620 API data, with proper type definitions and relationship information.

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



## example demo script

```
list all the product offerings and their corresponding prices. Show the output as a table artefact.
```

```
Add a one-time price of 100 USD to the Standard Virtual Server.
```

```
Add a setup fee of 100 dollars to the Business Firewall Solution.
```

```
Show the categories with an Active lifecycle status.
```

```
Show a diagram of all the resources in the catalog.
```

```
Show a diagram of all the products in the Metro Ethernet Services category, including their specification and price.
```
(Metro Ethernet Services is actually a specification - Agent should handle this).


```
Remove all one-time fees from all products.
```