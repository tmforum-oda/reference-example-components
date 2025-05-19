# Product Catalog MCP Server

This microservice implements a Model Context Protocol (MCP) server that provides a standardized interface to access the TM Forum Product Catalog API. It allows AI agents to interact with the Product Catalog component through the MCP standard.

## What is MCP?

Model Context Protocol (MCP) is a standard designed to enable AI agents to interact with tools and services in a consistent way. It allows AI agents to discover and use your API's capabilities without requiring custom integration for each service. For more information, see:

- [Model Context Protocol Documentation](https://docs.anthropic.com/en/docs/agents-and-tools/mcp)
- [MCP Specification](https://modelcontextprotocol.io/quickstart/server)
- [Python MCP SDK](https://github.com/modelcontextprotocol/python-sdk)


## Basic MCP Structure

The Model Context Protocol uses JSON objects for communication between clients and servers. The basic structure includes:

- **Agent Messages**: Messages from the client (AI agent) to the server
- **Tool Calls**: Requests from the agent to execute specific functions on the server
- **Tool Responses**: Responses from the server with the results of tool execution

## Client discovery

Clients connecting to the MCP Server can discover the tools, resources and example prompts. Using the pPython MCP Server from [https://modelcontextprotocol.io/quickstart/server](https://modelcontextprotocol.io/quickstart/server), you use python decrators to expose the tools, resources and example prompts.

Tools are the most important feature of the MCP server. They are what gives the client Agent *agency* to perform operations. You create a tool for every API operation you want the client to be able to use. There is an example of the `catalog_delete` tool.:

```python
@mcp.tool()
async def catalog_delete(catalog_id: str) -> dict:
    """Delete a catalog from the TM Forum Product Catalog Management API.

    Args:
        catalog_id: ID of the catalog to delete.

    Returns:
        A dictionary with success status.
    """
    logger.info(f"MCP Tool - Deleting catalog with ID: {catalog_id}")
    result = await delete_catalog(catalog_id)
    if result == None:
        logger.warning(f"Failed to delete catalog with ID: {catalog_id}")
        return {
            "success": False,
            "error": f"Failed to delete catalog with ID: {catalog_id}",
        }
    return {"success": True, "message": f"Catalog {catalog_id} deleted successfully"}
```



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
I need to create pricing for our new Business MPLS Network product offering. It should have tiered pricing as follows:
- A one-time setup fee of $99
- Monthly recurring charges of:
    - $299/month for "Basic" tier (50 Mbps bandwidth, 5 sites)
    - $599/month for "Professional" tier (200 Mbps bandwidth, 10 sites)
    - $999/month for "Enterprise" tier (500 Mbps bandwidth, 25 sites)

Please set these up in the system.
```

```
Remove all one-time fees from all products.
```


```
add a property of color to the Enterprise Solution Catalog 
```

Question in French (list all the product offerings and their corresponding prices. Show the output as a table artefact.)
```
Énumérez toutes les offres de produits ainsi que leurs prix respectifs. Présentez le résultat sous forme d’un tableau.
```


## TO make work

'''
Show me all the product offerings under 2000 dollars
'''
At present doesn't use filtering (it get's all and then filters on the client)


## No Rollback

Add compensating undo transactions
