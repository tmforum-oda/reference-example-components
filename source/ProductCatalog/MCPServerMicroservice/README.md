# Product Catalog MCP Server

This microservice implements a Model Context Protocol (MCP) server that provides a standardized interface to access the TM Forum Product Catalog API. It allows AI agents to interact with the Product Catalog component through the MCP standard.

## What is MCP?

Model Context Protocol (MCP) is a standard designed to enable AI agents to interact with tools and services in a consistent way. It allows AI agents to discover and use your API's capabilities without requiring custom integration for each service. For more information, see:

- [Model Context Protocol Documentation](https://docs.anthropic.com/en/docs/agents-and-tools/mcp)
- [MCP Specification](https://modelcontextprotocol.io/quickstart/server)
- [Python MCP SDK](https://github.com/modelcontextprotocol/python-sdk)


### Video demonstration of MCP Server (using Claude Desktop as AI Agent)

[![Video demonstration of MCP Server](https://img.youtube.com/vi/bHsp_-nkZ2g/hqdefault.jpg)](https://www.youtube.com/watch?v=bHsp_-nkZ2g)


### Basic MCP Structure

The Model Context Protocol uses JSON objects for communication between clients and servers. The basic structure includes:

- **Agent Messages**: Messages from the client (AI agent) to the server
- **Tool Calls**: Requests from the agent to execute specific functions on the server
- **Tool Responses**: Responses from the server with the results of tool execution

### Client discovery

Clients connecting to the MCP Server can discover the tools, resources and example prompts. Using the Python MCP Server from [https://modelcontextprotocol.io/quickstart/server](https://modelcontextprotocol.io/quickstart/server), you use Python decorators to expose the tools, resources and example prompts.

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

A more complex example is the `category_get` tool that describes how to get by id, or to get only certain fields. It also allows the client to use pagination and finally to filter to only return certain records.


```python

@mcp.tool()
async def category_get(
    category_id: str = None,
    fields: str = None,
    offset: int = None,
    limit: int = None,
    filter: dict = None,
) -> dict:
    """Retrieve category information from the TM Forum Product Catalog Management API.

    Args:
        category_id: Optional ID of a specific category to retrieve.
        fields: Optional comma-separated list of field names to include in the response.
        offset: Optional offset for pagination.
        limit: Optional limit for pagination.
        filter: Optional dictionary of filter criteria to narrow down the results.
               Examples:
               - {"name": "Wholesale"} - Find categories with name containing "Wholesale"
               - {"lifecycleStatus": "Active"} - Find active categories
               - {"name": "Fiber", "lifecycleStatus": "Active"} - Find active categories with name containing "Fiber"

    Returns:
        A dictionary containing the category data or a list of categories.
        Returns an error dictionary if an error occurs.
    """
    if filter:
        logger.info(f"MCP Tool - Getting categories with filter: {filter}")
    else:
        logger.info(
            f"MCP Tool - Getting category with ID: {category_id if category_id else 'ALL'}"
        )
    result = await get_category(
        category_id=category_id,
        fields=fields,
        offset=offset,
        limit=limit,
        filter=filter,
    )
    if result == None:
        logger.warning("Failed to retrieve category data")
        return {"error": "Failed to retrieve category data"}
    return result
```


For the create operations, you need to describe to the MCP Client the schema of the resource to be created. Here is an example for the `product_specification_create` operation.

```python
@mcp.tool()
async def product_specification_create(product_specification_data: dict) -> dict:
    """Create a new product specification in the TM Forum Product Catalog Management API.

    Args:
        product_specification_data: Dictionary containing the product specification data according to the TMF620 specification - see properties below.
        properties:
        '@baseType':
            description: When sub-classing, this defines the super-class
            type: string
        '@schemaLocation':
            description: A URI to a JSON-Schema file that defines additional attributes
            and relationships
            format: uri
            type: string
        '@type':
            description: When sub-classing, this defines the sub-class entity name
            type: string
        attachment:
            description: Complements the description of an element (for instance a product)
            through video, pictures...
            items:
            $ref: '#/definitions/AttachmentRefOrValue'
            type: array
...
... (data removed)
...
        relatedParty:
            description: A related party defines party or party role linked to a specific
            entity.
            items:
            $ref: '#/definitions/RelatedParty'
            type: array
        version:
            description: Product specification version
            type: string

    Returns:
        A dictionary containing the created product specification data.
        If an error occurs, returns an error object with status code and detailed message.
    """
    logger.info("MCP Tool - Creating a new product specification")
    result = await create_product_specification(product_specification_data)

    # Check if the result contains an error object
    if result and "error" in result:
        logger.warning(
            f"Failed to create product specification: {result['error']['detail']}"
        )
        # Return the error with HTTP status code to the MCP client
        return result
    elif result is None:
        logger.warning("Failed to create product specification - no response received")
        return {
            "error": {
                "status": 500,
                "detail": "Failed to create product specification - no response received",
            }
        }

    # Success case
    return result
```


### MCP Tools

The MCP server exposes the following Product Catalog operations as tools:

- `catalog_get`: Retrieve catalog information
- `catalog_create`: Create a new catalog
- `catalog_update`: Update an existing catalog
- `catalog_delete`: Delete a catalog
- `category_get`: Retrieve category information
- `category_create`: Create a new category
- `category_update`: Update an existing category
- `category_delete`: Delete a category
- `product_specification_get`: Retrieve product specification information
- `product_specification_create`: Create a new product specification
- `product_specification_update`: Update an existing product specification
- `product_specification_delete`: Delete a product specification
- `product_offering_get`: Retrieve product offering information
- `product_offering_create`: Create a new product offering
- `product_offering_update`: Update an existing product offering
- `product_offering_delete`: Delete a product offering
- `product_offering_price_get`: Retrieve product offering price information
- `product_offering_price_create`: Create a new product offering price
- `product_offering_price_update`: Update an existing product offering price
- `product_offering_price_delete`: Delete a product offering price


### MCP Resources

The MCP protocol also allows a server to expose resources to a client. The example MCP server exposes the following resources:

- `resource://tmf620/catalog/{catalog_id}`: Access catalog data directly as a resource
- `schema://tmf620/catalog`: Access the catalog schema
- `schema://tmf620/category`: Access the category schema
- `schema://tmf620/productSpecification`: Access the product specification schema
- `schema://tmf620/productOffering`: Access the product offering schema
- `schema://tmf620/productOfferingPrice`: Access the product offering price schema


Resources provide a more schema-aware way to access the TMF620 API data, with proper type definitions and relationship information.

### MCP Prompt templates

The MCP server provides several pre-built prompt templates to help AI agents interact with the Product Catalog Management API more effectively. These templates provide structured guides for common operations and can be accessed by clients through the MCP protocol.

The following prompt templates are available:

- `create_catalog_prompt`: Guide for creating a new catalog with customizable name, description, type, etc.
- `create_category_prompt`: Guide for creating a new category with options for parent categories and other properties
- `create_product_specification_prompt`: Guide for creating detailed product specifications with characteristics
- `create_product_offering_prompt`: Guide for creating product offerings linked to specifications
- `create_product_offering_price_prompt`: Guide for adding different price types (recurring, one-time, etc.) to product offerings
- `list_catalogs_prompt`: Template for requesting a list of all available catalogs
- `list_product_offerings_prompt`: Template for listing all available product offerings
- `list_product_specifications_prompt`: Template for listing all available product specifications
- `search_offerings_by_name_prompt`: Template for searching product offerings by name pattern
- `find_product_specification_for_offering_prompt`: Guide for finding appropriate specifications for new offerings
- `get_usage_help_prompt`: Guide for getting general help using the TMF620 Product Catalog API
- `search_product_specifications_by_characteristics_prompt`: Template for finding specifications based on their characteristics
- `compare_product_specifications_prompt`: Template for comparing multiple product specifications

These prompt templates help standardize interactions with the Product Catalog Management API and provide guidance for AI agents on how to structure requests for specific operations. When an AI client connects to the MCP server, it can discover these templates and use them to help users accomplish common tasks.

Example usage of a prompt template through an AI agent:
```
User: "I need to create a new product category"
AI: "I can help you with that. Let me guide you through creating a new category in the system."
[AI uses the create_category_prompt template to collect the necessary information]
```






## Running Locally (Development)


You can run locally as a standalone server. By default, it expects a product catalog Open-API to be available at `https://localhost/r1-productcatalogmanagement/tmf-api/productCatalogManagement/v4`
```
uv run .\product_catalog_mcp_server.py 
```

Environment variables:

- `MCP_PORT`: Port for SSE transport (default: 8080)

### Deployment in Kubernetes

The MCP server can be deployed within the Product Catalog component in Kubernetes. The necessary Kubernetes manifests are in the `charts/ProductCatalog/templates/` directory.

```bash
# From the root of the repository
helm install productcatalog ./charts/ProductCatalog
```

### Testing

You can test the MCP server using the MCP client or by making HTTP requests to the SSE endpoints. Examples are available in the `example_payloads` directory.

For the Product Catalog API wrapper, there is a `test_product_catalog_api.py` script that can be run with a number of options:

Run tests only, leave catalog clean
```bash
python test_product_catalog_api.py                        
```

Run tests, then populate catalog with test data
```bash
python test_product_catalog_api.py --populate                        
```

Skip tests, just populate catalog
```bash
python test_product_catalog_api.py --skip-tests --populate                        
```

Skip tests, just clean up all resources
```bash
python test_product_catalog_api.py --skip-tests                         
```


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


### Issues

The MCP server is working, but in dev environments we are using self-signed certificates that the MCP Clients (or proxies) are rejecting.
The temporary workaround is to configure the MCP proxy to use http against the internal service (and ensure it is directly exposed). This workaround is suitable to demonstrate the capability of the MCP server.

To make work:
'''
Show me all the product offerings under 2000 dollars
'''
At present doesn't use filtering (it get's all and then filters on the client)


### No Rollback

At present an Agent can perform a large range of operations with no ability to undo those operations. We should add to the API compensating undo transactions to allow an Agent to review and undo if necessary.
