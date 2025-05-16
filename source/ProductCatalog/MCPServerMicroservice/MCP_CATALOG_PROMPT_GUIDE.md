# Creating a Catalog Using MCP Prompts

This document provides examples of how to create catalogs using the MCP prompts provided by the Product Catalog Management API.

## Basic Catalog Creation

The `catalog_creation_prompt` provides a template for creating a new catalog in the TMF620 Product Catalog Management API. The prompt ensures that all required properties of the Catalog resource are properly populated according to the TMF620 schema.

### Example 1: Create a Product Catalog

```python
from mcp.client import MCPClient

# Connect to the MCP server
client = MCPClient("http://localhost:8000/r1-productcatalogmanagement")

# Get the catalog creation prompt
prompt = client.get_prompt(
    "catalog_creation_prompt", 
    {
        "name": "Enterprise Solutions",
        "description": "Catalog of enterprise telecommunications products and services",
        "catalog_type": "Product",
        "version": "1.0",
        "lifecycle_status": "Active"
    }
)

# The prompt can be used to guide a model or user interaction
print(prompt)
```

When executed, this will generate a prompt that includes all the required fields for creating a catalog:

```
I want to create a new catalog in the Product Catalog Management system with the following details:

- Name: Enterprise Solutions
- Description: Catalog of enterprise telecommunications products and services 
- Type: Product
- Version: 1.0
- Status: Active
- Valid from: 2025-05-16T10:30:00.000Z to 2026-05-16T10:30:00.000Z

The catalog should follow the TMF620 schema with this structure:
{
  "name": "Enterprise Solutions",
  "description": "Catalog of enterprise telecommunications products and services",
  "catalogType": "Product",
  "version": "1.0",
  "lifecycleStatus": "Active",
  "validFor": {
    "startDateTime": "2025-05-16T10:30:00.000Z",
    "endDateTime": "2026-05-16T10:30:00.000Z"
  },
  "@baseType": "Catalog",
  "@type": "Catalog",
  "@schemaLocation": "https://tmf-open-api.org/schema/TMF620/v4/Catalog.schema.json"
}

Please help me create this catalog in the system.
```

### Example 2: Create a Service Catalog

```python
prompt = client.get_prompt(
    "catalog_creation_prompt", 
    {
        "name": "Professional Services",
        "description": "Catalog of professional services offered to enterprise customers",
        "catalog_type": "Service",
        "version": "2.1",
        "lifecycle_status": "In Design"
    }
)
```

### Example 3: Create a Resource Catalog

```python
prompt = client.get_prompt(
    "catalog_creation_prompt", 
    {
        "name": "Network Resources",
        "description": "Catalog of available network resources",
        "catalog_type": "Resource",
        "version": "1.3",
        "lifecycle_status": "Active"
    }
)
```

## Catalog Schema

The prompt follows the TMF620 specification for the Catalog resource, which includes the following properties:

| Property | Type | Description |
|----------|------|-------------|
| name | string | Name of the catalog (required) |
| description | string | Description of the catalog |
| catalogType | string | Indicates if the catalog is a product, service or resource catalog |
| version | string | Catalog version |
| lifecycleStatus | string | Used to indicate the current lifecycle status |
| validFor | object | The period for which the catalog is valid |
| category | array | List of root categories contained in this catalog |
| relatedParty | array | List of parties involved in this catalog |
| @baseType | string | When sub-classing, this defines the super-class |
| @schemaLocation | string | A URI to a JSON-Schema file that defines additional attributes |
| @type | string | When sub-classing, this defines the sub-class entity name |

The prompt template automatically populates the `validFor` object with a default validity period of one year from the current date.

## Using the Prompt with AI Models

When using the prompt with AI models like Claude, the model can:

1. Understand the schema requirements for creating a catalog
2. Generate appropriate catalog data based on the user's needs
3. Use the `catalog_create` tool to create the catalog in the system
4. Provide feedback on the success or failure of the operation

Example interaction:

```
User: I need to create a catalog for our new IoT products.

AI: I'll help you create a catalog for your IoT products. Could you provide some basic information?
    - What should we name this catalog?
    - Any specific description you'd like to add?
    - When should this catalog become valid, and for how long?

User: Let's call it "IoT Solutions Catalog" with a description of "Comprehensive IoT products and services for enterprise and industrial applications".

AI: I'll create the IoT Solutions Catalog for you. I'll set it up as follows:
    - Name: IoT Solutions Catalog
    - Description: Comprehensive IoT products and services for enterprise and industrial applications
    - Type: Product
    - Valid for one year starting today
    - Status: Active

    Creating the catalog now...
    
    Success! The IoT Solutions Catalog has been created with ID: 157.
    You can now start adding product offerings to this catalog.
```

## Additional Resources

For more information on working with the Product Catalog API through MCP, see:
- MCP_CLIENT_USAGE_GUIDE.md
- MCP_CLIENT_PROMPT_EXAMPLES.md
- MCP_REQUEST_RESPONSE_EXAMPLES.md
