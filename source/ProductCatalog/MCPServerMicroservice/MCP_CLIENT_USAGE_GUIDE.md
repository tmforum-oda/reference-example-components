# TM Forum Product Catalog Management API - MCP Client Usage Guide

This guide demonstrates how to use the TM Forum TMF620 Product Catalog Management API through the Model Context Protocol (MCP) interface. The guide includes resource descriptions, sample requests, and example prompts for an MCP client.

## Table of Contents

1. [Introduction](#introduction)
2. [Resources](#resources)
3. [API Operations](#api-operations)
   - [Catalog Operations](#catalog-operations)
   - [Category Operations](#category-operations)
   - [Product Specification Operations](#product-specification-operations)
   - [Product Offering Operations](#product-offering-operations)
   - [Product Offering Price Operations](#product-offering-price-operations)
4. [Example Prompts](#example-prompts)
5. [Advanced Usage](#advanced-usage)

## Introduction

The Product Catalog Management API implements the TM Forum TMF620 standard for managing product catalogs, categories, product specifications, product offerings, and product offering prices. This API is exposed through an MCP server that allows AI agents to interact with the API using natural language.

The MCP interface provides the following tools for each resource:
- **GET** - Retrieve resource(s) by ID or list all resources
- **CREATE** - Create a new resource
- **UPDATE** - Update an existing resource
- **DELETE** - Delete a resource

## Resources

### Catalog
A collection of Product Offerings intended for a specific distribution channel. Catalog resources can be accessed in two ways:

1. Using the MCP tools API (`catalog_get`, `catalog_create`, `catalog_update`, `catalog_delete`)
2. Using the resource URI pattern: `resource://tmf620/catalog/{catalog_id}`

The catalog schema follows the TMF620 specification with properties like id, name, description, catalogType, version, lifecycleStatus, and validFor. It also contains relationships to categories and related parties.

### Category
Used to group product offerings, service and resource candidates in logical containers.

### Product Specification
A detailed description of a tangible or intangible object made available externally.

### Product Offering
A sellable item defined by its production specification, commercial terms, and additional services.

### Product Offering Price
Represents the price of a product offering, including recurring charges, one time charges, and usage-based pricing.

## API Operations

### Catalog Operations

#### Get Catalog

**Tool Name**: `catalog_get`

**Parameters**:
- `catalog_id` (optional): ID of a specific catalog to retrieve
- `fields` (optional): Comma-separated list of field names to include
- `offset` (optional): Offset for pagination
- `limit` (optional): Limit for pagination

**Example Request**:
```json
{
  "tool_use": {
    "name": "catalog_get",
    "parameters": {
      "catalog_id": "42"
    }
  }
}
```

**Example Response**:
```json
{
  "id": "42",
  "name": "Catalog Wholesale Business",
  "description": "This catalog describes Product Offerings and technical specifications intended to address the wholesale business segment.",
  "@type": "Catalog"
}
```

#### Create Catalog

**Tool Name**: `catalog_create`

**Parameters**:
- `catalog_data`: Dictionary containing the catalog data

**Example Request**:
```json
{
  "tool_use": {
    "name": "catalog_create",
    "parameters": {
      "catalog_data": {
        "name": "Retail Consumer Catalog",
        "description": "This catalog describes Product Offerings intended for the retail consumer segment.",
        "@type": "Catalog"
      }
    }
  }
}
```

**Example Response**:
```json
{
  "id": "43",
  "name": "Retail Consumer Catalog",
  "description": "This catalog describes Product Offerings intended for the retail consumer segment.",
  "@type": "Catalog",
  "href": "/productCatalogManagement/v4/catalog/43"
}
```

#### Update Catalog

**Tool Name**: `catalog_update`

**Parameters**:
- `catalog_id`: ID of the catalog to update
- `catalog_data`: Dictionary containing the catalog data to update

**Example Request**:
```json
{
  "tool_use": {
    "name": "catalog_update",
    "parameters": {
      "catalog_id": "43",
      "catalog_data": {
        "description": "Updated description for the retail consumer catalog"
      }
    }
  }
}
```

**Example Response**:
```json
{
  "id": "43",
  "name": "Retail Consumer Catalog",
  "description": "Updated description for the retail consumer catalog",
  "@type": "Catalog",
  "href": "/productCatalogManagement/v4/catalog/43"
}
```

#### Delete Catalog

**Tool Name**: `catalog_delete`

**Parameters**:
- `catalog_id`: ID of the catalog to delete

**Example Request**:
```json
{
  "tool_use": {
    "name": "catalog_delete",
    "parameters": {
      "catalog_id": "43"
    }
  }
}
```

**Example Response**:
```json
{
  "success": true,
  "message": "Catalog 43 deleted successfully"
}
```

### Category Operations

#### Get Category

**Tool Name**: `category_get`

**Parameters**:
- `category_id` (optional): ID of a specific category to retrieve
- `fields` (optional): Comma-separated list of field names to include
- `offset` (optional): Offset for pagination
- `limit` (optional): Limit for pagination

**Example Request**:
```json
{
  "tool_use": {
    "name": "category_get",
    "parameters": {
      "category_id": "101"
    }
  }
}
```

**Example Response**:
```json
{
  "id": "101",
  "name": "Cloud Services",
  "description": "A category to hold all available cloud service offers",
  "@type": "Category"
}
```

#### Create Category

**Tool Name**: `category_create`

**Parameters**:
- `category_data`: Dictionary containing the category data

**Example Request**:
```json
{
  "tool_use": {
    "name": "category_create",
    "parameters": {
      "category_data": {
        "name": "Security Solutions",
        "description": "Category for all security-related products and services",
        "@type": "Category"
      }
    }
  }
}
```

**Example Response**:
```json
{
  "id": "102",
  "name": "Security Solutions",
  "description": "Category for all security-related products and services",
  "@type": "Category",
  "href": "/productCatalogManagement/v4/category/102"
}
```

#### Update Category

**Tool Name**: `category_update`

**Parameters**:
- `category_id`: ID of the category to update
- `category_data`: Dictionary containing the category data to update

**Example Request**:
```json
{
  "tool_use": {
    "name": "category_update",
    "parameters": {
      "category_id": "102",
      "category_data": {
        "description": "Updated category for cybersecurity products and services"
      }
    }
  }
}
```

**Example Response**:
```json
{
  "id": "102",
  "name": "Security Solutions",
  "description": "Updated category for cybersecurity products and services",
  "@type": "Category",
  "href": "/productCatalogManagement/v4/category/102"
}
```

#### Delete Category

**Tool Name**: `category_delete`

**Parameters**:
- `category_id`: ID of the category to delete

**Example Request**:
```json
{
  "tool_use": {
    "name": "category_delete",
    "parameters": {
      "category_id": "102"
    }
  }
}
```

**Example Response**:
```json
{
  "success": true,
  "message": "Category 102 deleted successfully"
}
```

### Product Specification Operations

#### Get Product Specification

**Tool Name**: `product_specification_get`

**Parameters**:
- `product_specification_id` (optional): ID of a specific product specification to retrieve
- `fields` (optional): Comma-separated list of field names to include
- `offset` (optional): Offset for pagination
- `limit` (optional): Limit for pagination

**Example Request**:
```json
{
  "tool_use": {
    "name": "product_specification_get",
    "parameters": {
      "product_specification_id": "201"
    }
  }
}
```

**Example Response**:
```json
{
  "id": "201",
  "name": "Cisco Firepower NGFW",
  "brand": "Cisco",
  "productNumber": "CSC-340-NGFW",
  "description": "Powerful product that integrates with a firewall, including intrusion prevention, advanced malware protection, cloud-based sandboxing, URL filtering, endpoint protection, web gateway, email security, network traffic analysis, network access control and CASB."
}
```

#### Create Product Specification

**Tool Name**: `product_specification_create`

**Parameters**:
- `product_specification_data`: Dictionary containing the product specification data

**Example Request**:
```json
{
  "tool_use": {
    "name": "product_specification_create",
    "parameters": {
      "product_specification_data": {
        "name": "Palo Alto PA-5280",
        "brand": "Palo Alto Networks",
        "productNumber": "PA-5280",
        "description": "High-performance next-generation firewall with advanced threat protection",
        "isBundle": false,
        "version": "1.0"
      }
    }
  }
}
```

**Example Response**:
```json
{
  "id": "202",
  "name": "Palo Alto PA-5280",
  "brand": "Palo Alto Networks",
  "productNumber": "PA-5280",
  "description": "High-performance next-generation firewall with advanced threat protection",
  "isBundle": false,
  "version": "1.0",
  "href": "/productCatalogManagement/v4/productSpecification/202"
}
```

#### Update Product Specification

**Tool Name**: `product_specification_update`

**Parameters**:
- `product_specification_id`: ID of the product specification to update
- `product_specification_data`: Dictionary containing the product specification data to update

**Example Request**:
```json
{
  "tool_use": {
    "name": "product_specification_update",
    "parameters": {
      "product_specification_id": "202",
      "product_specification_data": {
        "description": "Updated high-performance next-generation firewall with advanced threat protection and enhanced features"
      }
    }
  }
}
```

**Example Response**:
```json
{
  "id": "202",
  "name": "Palo Alto PA-5280",
  "brand": "Palo Alto Networks",
  "productNumber": "PA-5280",
  "description": "Updated high-performance next-generation firewall with advanced threat protection and enhanced features",
  "isBundle": false,
  "version": "1.0",
  "href": "/productCatalogManagement/v4/productSpecification/202"
}
```

#### Delete Product Specification

**Tool Name**: `product_specification_delete`

**Parameters**:
- `product_specification_id`: ID of the product specification to delete

**Example Request**:
```json
{
  "tool_use": {
    "name": "product_specification_delete",
    "parameters": {
      "product_specification_id": "202"
    }
  }
}
```

**Example Response**:
```json
{
  "success": true,
  "message": "Product specification 202 deleted successfully"
}
```

### Product Offering Operations

#### Get Product Offering

**Tool Name**: `product_offering_get`

**Parameters**:
- `product_offering_id` (optional): ID of a specific product offering to retrieve
- `fields` (optional): Comma-separated list of field names to include
- `offset` (optional): Offset for pagination
- `limit` (optional): Limit for pagination

**Example Request**:
```json
{
  "tool_use": {
    "name": "product_offering_get",
    "parameters": {
      "product_offering_id": "301"
    }
  }
}
```

**Example Response**:
```json
{
  "id": "301",
  "name": "Basic Firewall for Business",
  "description": "This product offering suggests a firewall service that can be deployed in business customer premise.",
  "version": "1.0",
  "statusReason": "Released for sale",
  "isBundle": false,
  "isSellable": true
}
```

#### Create Product Offering

**Tool Name**: `product_offering_create`

**Parameters**:
- `product_offering_data`: Dictionary containing the product offering data

**Example Request**:
```json
{
  "tool_use": {
    "name": "product_offering_create",
    "parameters": {
      "product_offering_data": {
        "name": "Premium Firewall for Enterprise",
        "description": "High-performance firewall service for enterprise customers with 24/7 support",
        "version": "1.0",
        "isBundle": false,
        "isSellable": true,
        "statusReason": "New Release",
        "productSpecification": {
          "id": "201",
          "href": "https://mycsp.com:8080/tmf-api/productCatalogManagement/v4/productSpecification/201",
          "name": "Cisco Firepower NGFW"
        }
      }
    }
  }
}
```

**Example Response**:
```json
{
  "id": "302",
  "name": "Premium Firewall for Enterprise",
  "description": "High-performance firewall service for enterprise customers with 24/7 support",
  "version": "1.0",
  "isBundle": false,
  "isSellable": true,
  "statusReason": "New Release",
  "href": "/productCatalogManagement/v4/productOffering/302",
  "productSpecification": {
    "id": "201",
    "href": "https://mycsp.com:8080/tmf-api/productCatalogManagement/v4/productSpecification/201",
    "name": "Cisco Firepower NGFW"
  }
}
```

#### Update Product Offering

**Tool Name**: `product_offering_update`

**Parameters**:
- `product_offering_id`: ID of the product offering to update
- `product_offering_data`: Dictionary containing the product offering data to update

**Example Request**:
```json
{
  "tool_use": {
    "name": "product_offering_update",
    "parameters": {
      "product_offering_id": "302",
      "product_offering_data": {
        "description": "Updated high-performance firewall service for enterprise customers with 24/7 premium support and SLA"
      }
    }
  }
}
```

**Example Response**:
```json
{
  "id": "302",
  "name": "Premium Firewall for Enterprise",
  "description": "Updated high-performance firewall service for enterprise customers with 24/7 premium support and SLA",
  "version": "1.0",
  "isBundle": false,
  "isSellable": true,
  "statusReason": "New Release",
  "href": "/productCatalogManagement/v4/productOffering/302"
}
```

#### Delete Product Offering

**Tool Name**: `product_offering_delete`

**Parameters**:
- `product_offering_id`: ID of the product offering to delete

**Example Request**:
```json
{
  "tool_use": {
    "name": "product_offering_delete",
    "parameters": {
      "product_offering_id": "302"
    }
  }
}
```

**Example Response**:
```json
{
  "success": true,
  "message": "Product offering 302 deleted successfully"
}
```

### Product Offering Price Operations

#### Get Product Offering Price

**Tool Name**: `product_offering_price_get`

**Parameters**:
- `product_offering_price_id` (optional): ID of a specific product offering price to retrieve
- `fields` (optional): Comma-separated list of field names to include
- `offset` (optional): Offset for pagination
- `limit` (optional): Limit for pagination

**Example Request**:
```json
{
  "tool_use": {
    "name": "product_offering_price_get",
    "parameters": {
      "product_offering_price_id": "401"
    }
  }
}
```

**Example Response**:
```json
{
  "id": "401",
  "name": "Recurring Charge for Business Firewall",
  "description": "This pricing describes the recurring charge for a firewall service that can be deployed in business customer premise.",
  "priceType": "recurring",
  "recurringChargePeriodType": "monthly",
  "recurringChargePeriodLength": 1,
  "price": {
    "unit": "EUR",
    "amount": 50
  }
}
```

#### Create Product Offering Price

**Tool Name**: `product_offering_price_create`

**Parameters**:
- `product_offering_price_data`: Dictionary containing the product offering price data

**Example Request**:
```json
{
  "tool_use": {
    "name": "product_offering_price_create",
    "parameters": {
      "product_offering_price_data": {
        "name": "One-time Setup Fee for Enterprise Firewall",
        "description": "One-time installation and configuration fee for enterprise firewall solution",
        "version": "1.0",
        "priceType": "one time",
        "isBundle": false,
        "price": {
          "unit": "USD",
          "amount": 499
        }
      }
    }
  }
}
```

**Example Response**:
```json
{
  "id": "402",
  "name": "One-time Setup Fee for Enterprise Firewall",
  "description": "One-time installation and configuration fee for enterprise firewall solution",
  "version": "1.0",
  "priceType": "one time",
  "isBundle": false,
  "price": {
    "unit": "USD",
    "amount": 499
  },
  "href": "/productCatalogManagement/v4/productOfferingPrice/402"
}
```

#### Update Product Offering Price

**Tool Name**: `product_offering_price_update`

**Parameters**:
- `product_offering_price_id`: ID of the product offering price to update
- `product_offering_price_data`: Dictionary containing the product offering price data to update

**Example Request**:
```json
{
  "tool_use": {
    "name": "product_offering_price_update",
    "parameters": {
      "product_offering_price_id": "402",
      "product_offering_price_data": {
        "price": {
          "unit": "USD",
          "amount": 399
        },
        "description": "Updated one-time installation and configuration fee for enterprise firewall solution with discount"
      }
    }
  }
}
```

**Example Response**:
```json
{
  "id": "402",
  "name": "One-time Setup Fee for Enterprise Firewall",
  "description": "Updated one-time installation and configuration fee for enterprise firewall solution with discount",
  "version": "1.0",
  "priceType": "one time",
  "isBundle": false,
  "price": {
    "unit": "USD",
    "amount": 399
  },
  "href": "/productCatalogManagement/v4/productOfferingPrice/402"
}
```

#### Delete Product Offering Price

**Tool Name**: `product_offering_price_delete`

**Parameters**:
- `product_offering_price_id`: ID of the product offering price to delete

**Example Request**:
```json
{
  "tool_use": {
    "name": "product_offering_price_delete",
    "parameters": {
      "product_offering_price_id": "402"
    }
  }
}
```

**Example Response**:
```json
{
  "success": true,
  "message": "Product offering price 402 deleted successfully"
}
```

## Example Prompts

Here are some example prompts that an MCP client can use to interact with the Product Catalog Management API:

### Basic Prompts

1. **List all product catalogs**:
   ```
   Please show me all the product catalogs available in the system.
   ```

2. **Create a new catalog**:
   ```
   Create a new product catalog named "Enterprise Solutions Catalog" with the description "This catalog contains enterprise-grade products and services for corporate customers."
   ```

3. **Get a specific category**:
   ```
   Retrieve the details of the Cloud Services category.
   ```

4. **Create a product specification**:
   ```
   Create a product specification for a new FortiGate firewall with the following details:
   - Name: FortiGate 100F
   - Brand: Fortinet
   - Product Number: FG-100F
   - Description: Next-generation firewall for mid-sized businesses
   - Version: 1.0
   - Bundle: No
   ```

5. **Update a product offering**:
   ```
   Update the description of the "Basic Firewall for Business" product offering to "Enhanced firewall solution for small and medium businesses with improved threat detection."
   ```

6. **Delete a product offering price**:
   ```
   Delete the product offering price with ID 402.
   ```

### Advanced Prompts

1. **Create a bundled product offering**:
   ```
   Create a new bundled product offering named "Complete Security Suite" that includes the existing Cisco Firepower NGFW product specification (ID: 201) and the Palo Alto PA-5280 product specification (ID: 202). The description should be "Comprehensive security solution combining multiple vendor technologies." Set it as sellable and mark it as a bundle.
   ```

2. **Search products by category**:
   ```
   Find all product offerings under the Security Solutions category (ID: 102).
   ```

3. **Update price information**:
   ```
   Update the monthly recurring charge for the Business Firewall (price ID: 401) to 60 EUR and add a note that this is a promotional price valid until the end of the year.
   ```

4. **Create a time-limited offering**:
   ```
   Create a new product offering for the FortiGate 100F (product spec ID: 203) that's only valid from June 1, 2025, to December 31, 2025, with a special holiday season promotion.
   ```

5. **Manage catalog relationships**:
   ```
   Add the Premium Firewall for Enterprise product offering (ID: 302) to the Enterprise Solutions Catalog (ID: 44).
   ```

## Advanced Usage

### Combining Operations

You can combine multiple operations to create complex workflows. For example, to create a new product offering with associated pricing:

1. First, create a product specification:
   ```
   Create a product specification for a new SonicWall TZ670 firewall with the description "Advanced security appliance for branch offices and distributed enterprises."
   ```

2. Then, create a product offering based on that specification:
   ```
   Create a product offering for the SonicWall TZ670 (product spec ID: 204) with the name "SonicWall Branch Office Security" and description "Complete security solution for branch offices."
   ```

3. Finally, add pricing information:
   ```
   Create two price options for the SonicWall Branch Office Security offering (ID: 303):
   1. A one-time setup fee of $299 USD
   2. A monthly recurring charge of $79 USD
   ```

### Working with Relationships

The Product Catalog Management API includes various relationships between resources:

- Products can be part of catalogs
- Products can be in categories
- Product offerings are based on product specifications
- Product offering prices are associated with product offerings
- Products can have related parties (vendors, owners, etc.)

When working with these relationships, you'll typically need to include reference objects in your requests. For example:

```json
{
  "category": [
    {
      "id": "102",
      "href": "/productCatalogManagement/v4/category/102",
      "name": "Security Solutions",
      "@referredType": "Category"
    }
  ],
  "productSpecification": {
    "id": "204",
    "href": "/productCatalogManagement/v4/productSpecification/204",
    "name": "SonicWall TZ670",
    "@referredType": "ProductSpecification"
  }
}
```

This documentation provides a foundation for working with the TM Forum Product Catalog Management API through the MCP interface. For more detailed information on specific fields and relationships, refer to the official TM Forum TMF620 specification.
