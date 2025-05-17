# MCP Request/Response Examples for TM Forum Product Catalog Management API

This document provides concrete examples of MCP (Model Context Protocol) requests and responses for the TM Forum TMF620 Product Catalog Management API. These examples follow the MCP specification format.

## Basic MCP Structure

The Model Context Protocol uses JSON objects for communication between clients and servers. The basic structure includes:

- **Agent Messages**: Messages from the client (AI agent) to the server
- **Tool Calls**: Requests from the agent to execute specific functions on the server
- **Tool Responses**: Responses from the server with the results of tool execution

## Catalog Operations Examples

### Get Catalog Example

**MCP Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Show me the catalog with ID 42"
    },
    {
      "role": "agent",
      "content": "I'll retrieve information about catalog 42 for you.",
      "tool_calls": [
        {
          "id": "call_001",
          "type": "function",
          "function": {
            "name": "catalog_get",
            "arguments": {
              "catalog_id": "42"
            }
          }
        }
      ]
    }
  ]
}
```

**MCP Response:**
```json
{
  "tool_responses": [
    {
      "tool_call_id": "call_001",
      "role": "tool",
      "content": {
        "id": "42",
        "href": "/productCatalogManagement/v4/catalog/42",
        "name": "Catalog Wholesale Business",
        "description": "This catalog describes Product Offerings and technical specifications intended to address the wholesale business segment.",
        "@type": "Catalog",
        "@baseType": "Catalog"
      }
    }
  ]
}
```

### Create Catalog Example

**MCP Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Create a new catalog for retail customers"
    },
    {
      "role": "agent",
      "content": "I'll create a new catalog for retail customers.",
      "tool_calls": [
        {
          "id": "call_002",
          "type": "function",
          "function": {
            "name": "catalog_create",
            "arguments": {
              "catalog_data": {
                "name": "Retail Consumer Catalog",
                "description": "This catalog describes Product Offerings intended for the retail consumer segment.",
                "@type": "Catalog"
              }
            }
          }
        }
      ]
    }
  ]
}
```

**MCP Response:**
```json
{
  "tool_responses": [
    {
      "tool_call_id": "call_002",
      "role": "tool",
      "content": {
        "id": "43",
        "href": "/productCatalogManagement/v4/catalog/43",
        "name": "Retail Consumer Catalog",
        "description": "This catalog describes Product Offerings intended for the retail consumer segment.",
        "@type": "Catalog",
        "@baseType": "Catalog",
        "creationDate": "2025-05-16T10:30:45Z"
      }
    }
  ]
}
```

### Update Catalog Example

**MCP Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Update the description of catalog 43"
    },
    {
      "role": "agent",
      "content": "I'll update the description of catalog 43 for you.",
      "tool_calls": [
        {
          "id": "call_003",
          "type": "function",
          "function": {
            "name": "catalog_update",
            "arguments": {
              "catalog_id": "43",
              "catalog_data": {
                "description": "Updated catalog for retail consumers with expanded product offerings"
              }
            }
          }
        }
      ]
    }
  ]
}
```

**MCP Response:**
```json
{
  "tool_responses": [
    {
      "tool_call_id": "call_003",
      "role": "tool",
      "content": {
        "id": "43",
        "href": "/productCatalogManagement/v4/catalog/43",
        "name": "Retail Consumer Catalog",
        "description": "Updated catalog for retail consumers with expanded product offerings",
        "@type": "Catalog",
        "@baseType": "Catalog",
        "lastUpdate": "2025-05-16T10:45:12Z"
      }
    }
  ]
}
```

### Delete Catalog Example

**MCP Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Delete catalog 43"
    },
    {
      "role": "agent",
      "content": "I'll delete catalog 43 for you.",
      "tool_calls": [
        {
          "id": "call_004",
          "type": "function",
          "function": {
            "name": "catalog_delete",
            "arguments": {
              "catalog_id": "43"
            }
          }
        }
      ]
    }
  ]
}
```

**MCP Response:**
```json
{
  "tool_responses": [
    {
      "tool_call_id": "call_004",
      "role": "tool",
      "content": {
        "success": true,
        "message": "Catalog 43 deleted successfully"
      }
    }
  ]
}
```

## Category Operations Examples

### Create Category Example

**MCP Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Create a network services category"
    },
    {
      "role": "agent",
      "content": "I'll create a new category for network services.",
      "tool_calls": [
        {
          "id": "call_005",
          "type": "function",
          "function": {
            "name": "category_create",
            "arguments": {
              "category_data": {
                "name": "Network Services",
                "description": "Category for all network-related products and services",
                "@type": "Category"
              }
            }
          }
        }
      ]
    }
  ]
}
```

**MCP Response:**
```json
{
  "tool_responses": [
    {
      "tool_call_id": "call_005",
      "role": "tool",
      "content": {
        "id": "104",
        "href": "/productCatalogManagement/v4/category/104",
        "name": "Network Services",
        "description": "Category for all network-related products and services",
        "@type": "Category",
        "@baseType": "Category",
        "creationDate": "2025-05-16T11:05:22Z"
      }
    }
  ]
}
```

## Product Specification Operations Examples

### Get Product Specification Example

**MCP Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Find all product specifications"
    },
    {
      "role": "agent",
      "content": "I'll retrieve all product specifications for you.",
      "tool_calls": [
        {
          "id": "call_006",
          "type": "function",
          "function": {
            "name": "product_specification_get"
          }
        }
      ]
    }
  ]
}
```

**MCP Response:**
```json
{
  "tool_responses": [
    {
      "tool_call_id": "call_006",
      "role": "tool",
      "content": [
        {
          "id": "201",
          "href": "/productCatalogManagement/v4/productSpecification/201",
          "name": "Cisco Firepower NGFW",
          "description": "Powerful product that integrates with a firewall...",
          "version": "2.1"
        },
        {
          "id": "202",
          "href": "/productCatalogManagement/v4/productSpecification/202",
          "name": "Palo Alto PA-5280",
          "description": "High-performance next-generation firewall...",
          "version": "1.0"
        }
      ]
    }
  ]
}
```

### Create Product Specification Example

**MCP Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Create a new product specification for cloud storage"
    },
    {
      "role": "agent",
      "content": "I'll create a new product specification for cloud storage.",
      "tool_calls": [
        {
          "id": "call_007",
          "type": "function",
          "function": {
            "name": "product_specification_create",
            "arguments": {
              "product_specification_data": {
                "name": "Enterprise Cloud Storage",
                "description": "High-performance cloud storage platform with encryption and redundancy",
                "version": "1.0",
                "isBundle": false,
                "brand": "CloudTech",
                "productNumber": "CTS-500"
              }
            }
          }
        }
      ]
    }
  ]
}
```

**MCP Response:**
```json
{
  "tool_responses": [
    {
      "tool_call_id": "call_007",
      "role": "tool",
      "content": {
        "id": "206",
        "href": "/productCatalogManagement/v4/productSpecification/206",
        "name": "Enterprise Cloud Storage",
        "description": "High-performance cloud storage platform with encryption and redundancy",
        "version": "1.0",
        "isBundle": false,
        "brand": "CloudTech",
        "productNumber": "CTS-500",
        "creationDate": "2025-05-16T11:30:15Z"
      }
    }
  ]
}
```

## Product Offering Operations Examples

### Create Product Offering Example

**MCP Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Create a product offering for the Enterprise Cloud Storage"
    },
    {
      "role": "agent",
      "content": "I'll create a product offering based on the Enterprise Cloud Storage specification.",
      "tool_calls": [
        {
          "id": "call_008",
          "type": "function",
          "function": {
            "name": "product_offering_create",
            "arguments": {
              "product_offering_data": {
                "name": "Enterprise Cloud Storage Solution",
                "description": "Scalable enterprise cloud storage offering with 99.999% uptime SLA",
                "version": "1.0",
                "isBundle": false,
                "isSellable": true,
                "statusReason": "New Release",
                "productSpecification": {
                  "id": "206",
                  "href": "/productCatalogManagement/v4/productSpecification/206",
                  "name": "Enterprise Cloud Storage"
                }
              }
            }
          }
        }
      ]
    }
  ]
}
```

**MCP Response:**
```json
{
  "tool_responses": [
    {
      "tool_call_id": "call_008",
      "role": "tool",
      "content": {
        "id": "336",
        "href": "/productCatalogManagement/v4/productOffering/336",
        "name": "Enterprise Cloud Storage Solution",
        "description": "Scalable enterprise cloud storage offering with 99.999% uptime SLA",
        "version": "1.0",
        "isBundle": false,
        "isSellable": true,
        "statusReason": "New Release",
        "productSpecification": {
          "id": "206",
          "href": "/productCatalogManagement/v4/productSpecification/206",
          "name": "Enterprise Cloud Storage"
        },
        "creationDate": "2025-05-16T11:45:30Z"
      }
    }
  ]
}
```

## Product Offering Price Operations Examples

### Create Product Offering Price Example

**MCP Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Create pricing for the Enterprise Cloud Storage Solution offering"
    },
    {
      "role": "agent",
      "content": "I'll create pricing for the Enterprise Cloud Storage Solution offering.",
      "tool_calls": [
        {
          "id": "call_009",
          "type": "function",
          "function": {
            "name": "product_offering_price_create",
            "arguments": {
              "product_offering_price_data": {
                "name": "Enterprise Cloud Storage - Per GB Monthly Fee",
                "description": "Monthly recurring charge based on storage usage",
                "priceType": "recurring",
                "recurringChargePeriodType": "monthly",
                "price": {
                  "unit": "USD",
                  "amount": 0.05
                },
                "unitOfMeasure": "GB",
                "productOffering": {
                  "id": "336",
                  "href": "/productCatalogManagement/v4/productOffering/336",
                  "name": "Enterprise Cloud Storage Solution"
                }
              }
            }
          }
        }
      ]
    }
  ]
}
```

**MCP Response:**
```json
{
  "tool_responses": [
    {
      "tool_call_id": "call_009",
      "role": "tool",
      "content": {
        "id": "471",
        "href": "/productCatalogManagement/v4/productOfferingPrice/471",
        "name": "Enterprise Cloud Storage - Per GB Monthly Fee",
        "description": "Monthly recurring charge based on storage usage",
        "priceType": "recurring",
        "recurringChargePeriodType": "monthly",
        "price": {
          "unit": "USD",
          "amount": 0.05
        },
        "unitOfMeasure": "GB",
        "productOffering": {
          "id": "336",
          "href": "/productCatalogManagement/v4/productOffering/336",
          "name": "Enterprise Cloud Storage Solution"
        },
        "creationDate": "2025-05-16T12:00:45Z"
      }
    }
  ]
}
```

## Combined Operations Example

This example demonstrates how an MCP client might perform multiple operations in sequence:

**MCP Request (Step 1 - Create a product specification):**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Set up a new VPN service with specifications and pricing"
    },
    {
      "role": "agent",
      "content": "I'll help you set up a new VPN service. First, let's create the product specification.",
      "tool_calls": [
        {
          "id": "call_010",
          "type": "function",
          "function": {
            "name": "product_specification_create",
            "arguments": {
              "product_specification_data": {
                "name": "Enterprise VPN Service",
                "description": "Secure VPN solution for enterprise customers with multi-region support",
                "version": "1.0",
                "isBundle": false,
                "brand": "SecureNet",
                "productNumber": "VPN-ENT-100"
              }
            }
          }
        }
      ]
    }
  ]
}
```

**MCP Response (Step 1):**
```json
{
  "tool_responses": [
    {
      "tool_call_id": "call_010",
      "role": "tool",
      "content": {
        "id": "207",
        "href": "/productCatalogManagement/v4/productSpecification/207",
        "name": "Enterprise VPN Service",
        "description": "Secure VPN solution for enterprise customers with multi-region support",
        "version": "1.0",
        "isBundle": false,
        "brand": "SecureNet",
        "productNumber": "VPN-ENT-100",
        "creationDate": "2025-05-16T12:15:22Z"
      }
    }
  ]
}
```

**MCP Request (Step 2 - Create a product offering):**
```json
{
  "messages": [
    {
      "role": "agent",
      "content": "Now I'll create a product offering based on this specification.",
      "tool_calls": [
        {
          "id": "call_011",
          "type": "function",
          "function": {
            "name": "product_offering_create",
            "arguments": {
              "product_offering_data": {
                "name": "Enterprise VPN Solution",
                "description": "Managed VPN service for secure enterprise connectivity",
                "version": "1.0",
                "isBundle": false,
                "isSellable": true,
                "productSpecification": {
                  "id": "207",
                  "href": "/productCatalogManagement/v4/productSpecification/207",
                  "name": "Enterprise VPN Service"
                }
              }
            }
          }
        }
      ]
    }
  ]
}
```

**MCP Response (Step 2):**
```json
{
  "tool_responses": [
    {
      "tool_call_id": "call_011",
      "role": "tool",
      "content": {
        "id": "337",
        "href": "/productCatalogManagement/v4/productOffering/337",
        "name": "Enterprise VPN Solution",
        "description": "Managed VPN service for secure enterprise connectivity",
        "version": "1.0",
        "isBundle": false,
        "isSellable": true,
        "productSpecification": {
          "id": "207",
          "href": "/productCatalogManagement/v4/productSpecification/207",
          "name": "Enterprise VPN Service"
        },
        "creationDate": "2025-05-16T12:20:10Z"
      }
    }
  ]
}
```

**MCP Request (Step 3 - Create pricing):**
```json
{
  "messages": [
    {
      "role": "agent",
      "content": "Finally, I'll add pricing for the VPN service offering.",
      "tool_calls": [
        {
          "id": "call_012",
          "type": "function",
          "function": {
            "name": "product_offering_price_create",
            "arguments": {
              "product_offering_price_data": {
                "name": "Enterprise VPN Monthly Subscription",
                "description": "Monthly fee for Enterprise VPN service",
                "priceType": "recurring",
                "recurringChargePeriodType": "monthly",
                "price": {
                  "unit": "USD",
                  "amount": 299
                },
                "productOffering": {
                  "id": "337",
                  "href": "/productCatalogManagement/v4/productOffering/337",
                  "name": "Enterprise VPN Solution"
                }
              }
            }
          }
        }
      ]
    }
  ]
}
```

**MCP Response (Step 3):**
```json
{
  "tool_responses": [
    {
      "tool_call_id": "call_012",
      "role": "tool",
      "content": {
        "id": "472",
        "href": "/productCatalogManagement/v4/productOfferingPrice/472",
        "name": "Enterprise VPN Monthly Subscription",
        "description": "Monthly fee for Enterprise VPN service",
        "priceType": "recurring",
        "recurringChargePeriodType": "monthly",
        "price": {
          "unit": "USD",
          "amount": 299
        },
        "productOffering": {
          "id": "337",
          "href": "/productCatalogManagement/v4/productOffering/337",
          "name": "Enterprise VPN Solution"
        },
        "creationDate": "2025-05-16T12:25:35Z"
      }
    }
  ]
}
```

**MCP Request (Step 4 - Add to a catalog):**
```json
{
  "messages": [
    {
      "role": "agent",
      "content": "Let's add this VPN offering to the Enterprise Solutions Catalog.",
      "tool_calls": [
        {
          "id": "call_013",
          "type": "function",
          "function": {
            "name": "catalog_get",
            "arguments": {
              "catalog_id": "44"
            }
          }
        }
      ]
    }
  ]
}
```

**MCP Response (Step 4):**
```json
{
  "tool_responses": [
    {
      "tool_call_id": "call_013",
      "role": "tool",
      "content": {
        "id": "44",
        "href": "/productCatalogManagement/v4/catalog/44",
        "name": "Enterprise Solutions Catalog",
        "description": "This catalog contains business-grade offerings for enterprise customers and specialized services for financial institutions.",
        "@type": "Catalog"
      }
    }
  ]
}
```

**MCP Request (Step 5 - Update catalog with new offering):**
```json
{
  "messages": [
    {
      "role": "agent",
      "content": "Now I'll update the catalog to include our new VPN offering.",
      "tool_calls": [
        {
          "id": "call_014",
          "type": "function",
          "function": {
            "name": "catalog_update",
            "arguments": {
              "catalog_id": "44",
              "catalog_data": {
                "productOffering": [
                  {
                    "id": "337",
                    "href": "/productCatalogManagement/v4/productOffering/337",
                    "name": "Enterprise VPN Solution"
                  }
                ]
              }
            }
          }
        }
      ]
    }
  ]
}
```

**MCP Response (Step 5):**
```json
{
  "tool_responses": [
    {
      "tool_call_id": "call_014",
      "role": "tool",
      "content": {
        "id": "44",
        "href": "/productCatalogManagement/v4/catalog/44",
        "name": "Enterprise Solutions Catalog",
        "description": "This catalog contains business-grade offerings for enterprise customers and specialized services for financial institutions.",
        "@type": "Catalog",
        "productOffering": [
          {
            "id": "337",
            "href": "/productCatalogManagement/v4/productOffering/337",
            "name": "Enterprise VPN Solution"
          }
        ],
        "lastUpdate": "2025-05-16T12:30:20Z"
      }
    }
  ]
}
```

## Resource-Based Access Examples

### Resource List Example

**MCP Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "What resources are available in the TMF620 API?"
    },
    {
      "role": "agent",
      "content": "Let me check the available resources in the TMF620 API.",
      "resource_access": [
        {
          "id": "resource_access_001",
          "type": "resource",
          "resource": {
            "uri": "resource://tmf620/catalog",
            "operation": "list"
          }
        }
      ]
    }
  ]
}
```

**MCP Response:**
```json
{
  "resources": [
    {
      "id": "resource_access_001",
      "content": {
        "type": "application/json",
        "text": {
          "name": "TMF620 Catalog",
          "description": "TM Forum Product Catalog Management API - Catalog Resource",
          "resources": [
            {
              "id": "enterprise-1",
              "name": "Enterprise Service Catalog",
              "description": "A catalog containing enterprise telecom service offerings"
            },
            {
              "id": "consumer-mobile-1",
              "name": "Consumer Mobile Offerings",
              "description": "Consumer mobile products and services"
            }
          ]
        }
      }
    }
  ]
}
```

### Get Specific Resource Example

**MCP Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Get details about the Enterprise Service Catalog"
    },
    {
      "role": "agent",
      "content": "I'll retrieve the details of the Enterprise Service Catalog.",
      "resource_access": [
        {
          "id": "resource_access_002",
          "type": "resource",
          "resource": {
            "uri": "resource://tmf620/catalog/enterprise-1",
            "operation": "get"
          }
        }
      ]
    }
  ]
}
```

**MCP Response:**
```json
{
  "resources": [
    {
      "id": "resource_access_002",
      "content": {
        "type": "application/json",
        "text": {
          "id": "enterprise-1",
          "name": "Enterprise Service Catalog",
          "description": "A catalog containing enterprise telecom service offerings",
          "catalogType": "Product",
          "version": "1.0",
          "lifecycleStatus": "Active",
          "validFor": {
            "startDateTime": "2025-01-01T00:00:00Z",
            "endDateTime": "2026-01-01T00:00:00Z"
          },
          "category": [
            {
              "id": "business-internet",
              "name": "Business Internet Service"
            },
            {
              "id": "cloud-pbx",
              "name": "Cloud PBX Solutions"
            },
            {
              "id": "managed-security",
              "name": "Managed Security Services"
            },
            {
              "id": "sd-wan",
              "name": "SD-WAN Connectivity"
            }
          ]
        }
      }
    }
  ]
}
```

### Get Resource Schema Example

**MCP Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "What is the schema for a catalog in TMF620?"
    },
    {
      "role": "agent",
      "content": "Let me retrieve the catalog schema from TMF620.",
      "resource_access": [
        {
          "id": "resource_access_003",
          "type": "resource",
          "resource": {
            "uri": "resource://tmf620/catalog",
            "operation": "schema"
          }
        }
      ]
    }
  ]
}
```

**MCP Response:**
```json
{
  "resources": [
    {
      "id": "resource_access_003",
      "content": {
        "type": "application/json",
        "text": {
          "type": "object",
          "description": "A collection of Product Offerings, intended for a specific DistributionChannel, enhanced with additional information such as SLA parameters, invoicing and shipping details",
          "properties": {
            "@baseType": {
              "type": "string",
              "description": "When sub-classing, this defines the super-class"
            },
            "@schemaLocation": {
              "type": "string",
              "format": "uri",
              "description": "A URI to a JSON-Schema file that defines additional attributes and relationships"
            },
            "@type": {
              "type": "string",
              "description": "When sub-classing, this defines the sub-class entity name"
            },
            "catalogType": {
              "type": "string",
              "description": "Indicates if the catalog is a product, service or resource catalog"
            },
            "category": {
              "type": "array",
              "description": "List of root categories contained in this catalog",
              "items": {
                "$ref": "#/definitions/CategoryRef"
              }
            },
            "description": {
              "type": "string",
              "description": "Description of this catalog"
            },
            "href": {
              "type": "string",
              "description": "Unique reference of the catalog"
            },
            "id": {
              "type": "string",
              "description": "Unique identifier of the Catalog"
            },
            "lastUpdate": {
              "type": "string",
              "format": "date-time",
              "description": "Date and time of the last update"
            },
            "lifecycleStatus": {
              "type": "string",
              "description": "Used to indicate the current lifecycle status"
            },
            "name": {
              "type": "string",
              "description": "Name of the catalog"
            },
            "relatedParty": {
              "type": "array",
              "description": "List of parties involved in this catalog",
              "items": {
                "$ref": "#/definitions/RelatedParty"
              }
            },
            "validFor": {
              "$ref": "#/definitions/TimePeriod",
              "description": "The period for which the catalog is valid"
            },
            "version": {
              "type": "string",
              "description": "Catalog version"
            }
          }
        }
      }
    }
  ]
}
```

## Error Handling Examples

The MCP Server now provides detailed error responses with HTTP status codes when operations fail. This section shows examples of error scenarios and their responses.

### Invalid Catalog Creation Example (400 Bad Request)

**MCP Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Create a new catalog with invalid data"
    },
    {
      "role": "agent",
      "content": "I'll create a new catalog with the details you provided.",
      "tool_calls": [
        {
          "id": "call_error_001",
          "type": "function",
          "function": {
            "name": "catalog_create",
            "arguments": {
              "catalog_data": {
                "name": "Invalid Catalog",
                "invalidField": "This field doesn't exist in TMF620 schema"
              }
            }
          }
        }
      ]
    }
  ]
}
```

**MCP Response with Error:**
```json
{
  "tool_responses": [
    {
      "tool_call_id": "call_error_001",
      "role": "tool",
      "content": {
        "error": {
          "status": 400,
          "detail": "Invalid field: 'invalidField' is not recognized. Request body doesn't conform to the TMF620 schema."
        }
      }
    }
  ]
}
```

### Catalog Not Found Example (404 Not Found)

**MCP Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Get details for catalog with ID 999999"
    },
    {
      "role": "agent",
      "content": "I'll retrieve information about catalog 999999 for you.",
      "tool_calls": [
        {
          "id": "call_error_002",
          "type": "function",
          "function": {
            "name": "catalog_get",
            "arguments": {
              "catalog_id": "999999"
            }
          }
        }
      ]
    }
  ]
}
```

**MCP Response with Error:**
```json
{
  "tool_responses": [
    {
      "tool_call_id": "call_error_002",
      "role": "tool",
      "content": {
        "error": {
          "status": 404,
          "detail": "Catalog with ID '999999' not found."
        }
      }
    }
  ]
}
```

### Server Error Example (500 Internal Server Error)

**MCP Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Create a new catalog"
    },
    {
      "role": "agent",
      "content": "I'll create a new catalog for you.",
      "tool_calls": [
        {
          "id": "call_error_003",
          "type": "function",
          "function": {
            "name": "catalog_create",
            "arguments": {
              "catalog_data": {
                "name": "Test Catalog",
                "description": "This is a test catalog",
                "version": "1.0"
              }
            }
          }
        }
      ]
    }
  ]
}
```

**MCP Response with Server Error:**
```json
{
  "tool_responses": [
    {
      "tool_call_id": "call_error_003",
      "role": "tool",
      "content": {
        "error": {
          "status": 500,
          "detail": "Unexpected server error: Database connection failed."
        }
      }
    }
  ]
}
```

### Error Handling in Client Applications

Client applications should check for the presence of an `error` object in the response and handle different status codes appropriately:

```python
from mcp.client import MCPClient

# Connect to the MCP server
client = MCPClient("http://localhost:8000/r1-productcatalogmanagement")

# Attempt to create a catalog
response = client.call_tool(
    "catalog_create", 
    {
        "catalog_data": {
            "name": "Test Catalog",
            "description": "This is a test catalog"
        }
    }
)

# Error handling
if "error" in response:
    status_code = response["error"]["status"]
    error_detail = response["error"]["detail"]
    
    if status_code == 400:
        print(f"Bad request: {error_detail}")
        # Handle validation errors
    elif status_code == 401 or status_code == 403:
        print(f"Authentication error: {error_detail}")
        # Handle auth errors
    elif status_code == 404:
        print(f"Not found: {error_detail}")
        # Handle not found errors
    elif status_code >= 500:
        print(f"Server error: {error_detail}")
        # Handle server errors
else:
    print("Catalog created successfully:", response)
```
