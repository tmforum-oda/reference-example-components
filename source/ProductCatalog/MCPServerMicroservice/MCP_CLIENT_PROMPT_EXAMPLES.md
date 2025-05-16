# MCP Client Prompt Examples for TM Forum Product Catalog Management API

This document provides example prompts and responses that demonstrate how an MCP client can interact with the TM Forum TMF620 Product Catalog Management API. These examples follow the Model Context Protocol (MCP) standard.

## Catalog Operations

### Example 1: Listing All Catalogs

**Client Prompt:**
```
Can you list all the product catalogs in the system?
```

**MCP Server Response:**
```
I'll retrieve all product catalogs for you.

I found the following product catalogs:
1. Catalog Wholesale Business (ID: 42) - This catalog describes Product Offerings and technical specifications intended to address the wholesale business segment.
2. Retail Consumer Catalog (ID: 43) - This catalog describes Product Offerings intended for the retail consumer segment.

Would you like to see more details about any of these catalogs?
```

### Example 2: Creating a New Catalog

**Client Prompt:**
```
I need to create a new catalog for enterprise customers called "Enterprise Solutions Catalog" with a description explaining it contains business-grade offerings.
```

**MCP Server Response:**
```
I'll help you create a new catalog for enterprise customers.

I've created the new catalog with the following details:
- ID: 44
- Name: Enterprise Solutions Catalog
- Description: This catalog contains business-grade offerings for enterprise customers.
- Type: Catalog
- URL: /productCatalogManagement/v4/catalog/44

The catalog has been successfully created in the system. Is there anything else you'd like to do with this catalog?
```

### Example 3: Updating a Catalog

**Client Prompt:**
```
I'd like to update the description of catalog 44 to include that it also offers specialized services for financial institutions.
```

**MCP Server Response:**
```
I'll update the description of the Enterprise Solutions Catalog (ID: 44) for you.

The catalog has been successfully updated with the following details:
- ID: 44
- Name: Enterprise Solutions Catalog
- Description: This catalog contains business-grade offerings for enterprise customers and specialized services for financial institutions.
- Type: Catalog
- URL: /productCatalogManagement/v4/catalog/44

Is there anything else you would like to modify?
```

## Resource-Based Catalog Access

### Accessing Catalog Resources

**Client Prompt:**
```
Can you access the Catalog resource to view what's available in the product catalog?
```

**MCP Server Response:**
```
I'll access the Catalog resource to retrieve information about available product catalogs.

Using the resource at "resource://tmf620/catalog", I found the following catalogs:

1. Enterprise Service Catalog
   - Description: A catalog containing enterprise telecom service offerings
   - Status: Active
   - Valid From: January 1, 2025 to January 1, 2026
   - Type: Product

2. Consumer Mobile Offerings
   - Description: Consumer mobile products and services
   - Status: Active
   - Valid From: March 15, 2025 to December 31, 2025
   - Type: Product

These catalogs contain product offerings that can be browsed for more details. Would you like me to retrieve any specific catalog by ID?
```

### Accessing a Specific Catalog Resource

**Client Prompt:**
```
Could you retrieve the details for the Enterprise Service Catalog using its resource ID?
```

**MCP Server Response:**
```
I'll retrieve the specific catalog using its resource identifier.

Using the resource at "resource://tmf620/catalog/enterprise-1", I found the following details:

Catalog: Enterprise Service Catalog
- Description: A catalog containing enterprise telecom service offerings
- Type: Product
- Version: 1.0
- Status: Active
- Valid From: January 1, 2025 to January 1, 2026

This catalog contains several product offerings for enterprise customers, including:
1. Business Internet Service
2. Cloud PBX Solutions 
3. Managed Security Services
4. SD-WAN Connectivity

Would you like me to retrieve information about any of these specific offerings?
```

### Accessing Catalog Schema Information

**Client Prompt:**
```
What are the properties and structure of a catalog in the TMF620 API?
```

**MCP Server Response:**
```
I'll provide you with the catalog schema structure from the TMF620 API.

According to the resource definition at "resource://tmf620/catalog", a catalog has the following structure:

Main Properties:
- id: Unique identifier of the Catalog
- name: Name of the catalog
- description: Description of this catalog
- catalogType: Indicates if the catalog is a product, service or resource catalog
- version: Catalog version
- lifecycleStatus: Used to indicate the current lifecycle status
- validFor: The period for which the catalog is valid (contains startDateTime and endDateTime)

Related Entities:
- category: List of root categories contained in this catalog
- relatedParty: List of parties involved in this catalog

The catalog resource supports the following operations:
- get: Retrieve catalog information
- create: Create a new catalog
- update: Update an existing catalog
- delete: Delete a catalog

Is there a specific aspect of the catalog schema you'd like me to explain in more detail?
```

## Category Operations

### Example 1: Creating a New Product Category

**Client Prompt:**
```
We need a new category for our networking products. Please create a "Network Infrastructure" category with a description about it containing routers, switches, and access points.
```

**MCP Server Response:**
```
I'll create a new category for networking products.

I've created the new category with the following details:
- ID: 103
- Name: Network Infrastructure
- Description: This category contains networking products including routers, switches, and access points.
- Type: Category
- URL: /productCatalogManagement/v4/category/103

The category has been successfully created. Would you like to add this category to a specific catalog?
```

### Example 2: Getting Category Details and Products

**Client Prompt:**
```
Show me all the products in the Cloud Services category.
```

**MCP Server Response:**
```
I'll find all products in the Cloud Services category for you.

First, I'll retrieve the details of the Cloud Services category (ID: 101).

The Cloud Services category contains the following product offerings:
1. Basic Cloud Storage (ID: 305) - Simple cloud storage solution for small businesses
2. Enterprise Cloud Backup (ID: 306) - Comprehensive backup solution with encryption
3. Cloud Compute Instances (ID: 307) - Scalable virtual machine instances

Would you like more details about any of these product offerings?
```

## Product Specification Operations

### Example 1: Creating a Complex Product Specification

**Client Prompt:**
```
I need to create a product specification for our new SD-WAN solution. It should be called "Managed SD-WAN Service" with details about secure connectivity between branch locations. It should include specifications for bandwidth options and security features.
```

**MCP Server Response:**
```
I'll help you create a product specification for your new SD-WAN solution.

I've created the following product specification:
- ID: 205
- Name: Managed SD-WAN Service
- Description: Secure connectivity solution between branch locations with centralized management and monitoring
- Version: 1.0
- URL: /productCatalogManagement/v4/productSpecification/205

I've also added the following characteristics:
- Bandwidth Options: [50Mbps, 100Mbps, 250Mbps, 500Mbps, 1Gbps]
- Security Features: [Advanced Firewall, IPS, URL Filtering, Application Control]
- Deployment Types: [On-premise, Cloud-managed, Hybrid]
- SLA Tiers: [Standard, Premium, Enterprise]

The product specification has been created successfully. Would you like to create a product offering based on this specification?
```

### Example 2: Searching for Product Specifications

**Client Prompt:**
```
Find all firewall product specifications in the system.
```

**MCP Server Response:**
```
I'll search for all firewall product specifications in the system.

Here are the firewall product specifications I found:
1. Cisco Firepower NGFW (ID: 201) - Powerful product that integrates with a firewall, including intrusion prevention, advanced malware protection...
2. Palo Alto PA-5280 (ID: 202) - High-performance next-generation firewall with advanced threat protection
3. FortiGate 100F (ID: 203) - Next-generation firewall for mid-sized businesses
4. SonicWall TZ670 (ID: 204) - Advanced security appliance for branch offices and distributed enterprises

Would you like more details about any of these product specifications?
```

## Product Offering Operations

### Example 1: Creating a Bundled Product Offering

**Client Prompt:**
```
Please create a bundled product offering called "Complete Security Suite" that includes the Cisco Firepower NGFW and the FortiGate 100F. It should be priced at $1500/month with a 12-month contract term. Add a description that it's our premium security package for enterprise customers.
```

**MCP Server Response:**
```
I'll create a bundled product offering for your Complete Security Suite.

First, I need to verify the product specifications that will be included:
- Cisco Firepower NGFW (ID: 201)
- FortiGate 100F (ID: 203)

I've created the bundled product offering with the following details:
- ID: 310
- Name: Complete Security Suite
- Description: Premium security package for enterprise customers combining multiple vendor technologies
- Version: 1.0
- Is Bundle: Yes
- Is Sellable: Yes
- URL: /productCatalogManagement/v4/productOffering/310

The bundle includes the following product specifications:
- Cisco Firepower NGFW (ID: 201)
- FortiGate 100F (ID: 203)

I've also created a product offering price with these details:
- Price Type: recurring
- Recurring Charge Period: monthly
- Price: $1500 USD
- Contract Term: 12 months

The bundled offering has been successfully created. Would you like to add this offering to a specific catalog?
```

### Example 2: Updating a Product Offering

**Client Prompt:**
```
The Basic Firewall for Business offering needs to be updated. Please add a new feature description mentioning enhanced DDoS protection and change the status reason to "Updated with new features".
```

**MCP Server Response:**
```
I'll update the Basic Firewall for Business product offering for you.

I've updated the product offering (ID: 301) with the following changes:
- Description now includes: "with enhanced DDoS protection"
- Status Reason changed to: "Updated with new features"

Here's the updated information:
- ID: 301
- Name: Basic Firewall for Business
- Description: This product offering suggests a firewall service that can be deployed in business customer premise, with enhanced DDoS protection.
- Version: 1.0
- Status Reason: Updated with new features
- URL: /productCatalogManagement/v4/productOffering/301

The product offering has been successfully updated. Is there anything else you'd like to modify?
```

## Product Offering Price Operations

### Example 1: Creating Different Price Types

**Client Prompt:**
```
I need to create pricing for our new Cloud Storage offering (ID: 305). It should have tiered pricing as follows:
- A one-time setup fee of $99
- Monthly recurring charges of:
  - $10/month for up to 100GB
  - $25/month for up to 500GB
  - $45/month for up to 1TB
Please set these up in the system.
```

**MCP Server Response:**
```
I'll create the pricing structure for your Cloud Storage offering.

I've created the following price points for Cloud Storage (ID: 305):

1. One-time setup fee:
   - ID: 450
   - Name: Cloud Storage Setup Fee
   - Price Type: one time
   - Amount: $99 USD
   - URL: /productCatalogManagement/v4/productOfferingPrice/450

2. Tiered monthly pricing:
   - ID: 451
   - Name: Cloud Storage 100GB
   - Price Type: recurring
   - Recurring Charge Period: monthly
   - Amount: $10 USD
   - URL: /productCatalogManagement/v4/productOfferingPrice/451

   - ID: 452
   - Name: Cloud Storage 500GB
   - Price Type: recurring
   - Recurring Charge Period: monthly
   - Amount: $25 USD
   - URL: /productCatalogManagement/v4/productOfferingPrice/452

   - ID: 453
   - Name: Cloud Storage 1TB
   - Price Type: recurring
   - Recurring Charge Period: monthly
   - Amount: $45 USD
   - URL: /productCatalogManagement/v4/productOfferingPrice/453

All price options have been successfully created and associated with the Cloud Storage offering. Would you like to make any adjustments to the pricing?
```

### Example 2: Price Update and Promotion

**Client Prompt:**
```
We're running a promotion for the next 3 months. Can you update the Cloud Storage 1TB price to $39.99/month and add a note that it's a limited-time promotional price valid until August 31, 2025?
```

**MCP Server Response:**
```
I'll update the Cloud Storage 1TB price for your promotion.

I've updated the product offering price (ID: 453) with the following changes:
- Price amount changed from $45.00 to $39.99 USD
- Added note: "Limited-time promotional price valid until August 31, 2025"
- Added validity period: May 16, 2025 - August 31, 2025

Here's the updated price information:
- ID: 453
- Name: Cloud Storage 1TB
- Price Type: recurring
- Recurring Charge Period: monthly
- Amount: $39.99 USD
- Note: Limited-time promotional price valid until August 31, 2025
- Valid From: May 16, 2025
- Valid To: August 31, 2025
- URL: /productCatalogManagement/v4/productOfferingPrice/453

The promotional pricing has been successfully updated. Is there anything else you'd like to do with your product pricing?
```

## Complex Scenarios

### Example 1: Building a Complete Product Catalog

**Client Prompt:**
```
I need to create a complete catalog for our new cloud services. It should include:
1. A catalog called "Cloud Services Portfolio"
2. Three categories: "Storage Solutions", "Compute Services", and "Security Services"
3. At least one product specification in each category
4. Product offerings based on those specifications
5. Appropriate pricing for each offering

Can you help me set this up step by step?
```

**MCP Server Response:**
```
I'll help you create a complete cloud services catalog step by step.

Step 1: Creating the "Cloud Services Portfolio" catalog
I've created a new catalog with ID: 50 and name: "Cloud Services Portfolio"

Step 2: Creating the three categories
I've created the following categories:
- "Storage Solutions" (ID: 110)
- "Compute Services" (ID: 111)
- "Security Services" (ID: 112)

Step 3: Creating product specifications for each category

For Storage Solutions:
- Created "Object Storage Platform" specification (ID: 220)
- Created "Block Storage Platform" specification (ID: 221)

For Compute Services:
- Created "Virtual Server Instances" specification (ID: 222)
- Created "Kubernetes Container Service" specification (ID: 223)

For Security Services:
- Created "Cloud Firewall Service" specification (ID: 224)
- Created "Identity & Access Management" specification (ID: 225)

Step 4: Creating product offerings based on the specifications

Storage Solutions offerings:
- Created "Standard Object Storage" offering (ID: 330)
- Created "Performance Block Storage" offering (ID: 331)

Compute Services offerings:
- Created "General Purpose Compute Instances" offering (ID: 332)
- Created "Managed Kubernetes Cluster" offering (ID: 333)

Security Services offerings:
- Created "Enterprise Cloud Firewall" offering (ID: 334)
- Created "Advanced IAM Service" offering (ID: 335)

Step 5: Creating pricing for each offering

For Standard Object Storage:
- Created tiered pricing starting at $0.02 per GB/month (ID: 460)
- Created data transfer fees at $0.05 per GB (ID: 461)

For Performance Block Storage:
- Created pricing at $0.15 per GB/month (ID: 462)

For General Purpose Compute Instances:
- Created pricing starting at $0.05 per vCPU-hour (ID: 463)
- Created memory pricing at $0.01 per GB-hour (ID: 464)

For Managed Kubernetes Cluster:
- Created control plane fee at $0.10 per hour (ID: 465)
- Created node pricing at standard compute rates

For Enterprise Cloud Firewall:
- Created pricing at $0.075 per hour (ID: 466)

For Advanced IAM Service:
- Created pricing at $2 per user per month (ID: 467)

All components have been successfully created and associated with the "Cloud Services Portfolio" catalog. Would you like me to provide more details on any specific component?
```

### Example 2: Product Migration and Lifecycle Management

**Client Prompt:**
```
We're phasing out our Basic Firewall for Business offering (ID: 301) and replacing it with our new Enhanced Firewall Suite (ID: 350). I need to:
1. Mark the Basic Firewall offering as deprecated
2. Set an end-of-life date for it (December 31, 2025)
3. Create a note for customers to migrate to the Enhanced Firewall Suite
4. Set up a special migration price for existing customers

Can you help me implement this transition plan?
```

**MCP Server Response:**
```
I'll help you implement the transition plan for phasing out the Basic Firewall offering.

Step 1: Updating the Basic Firewall for Business offering (ID: 301)
I've updated the offering with the following changes:
- Status Reason changed to: "Deprecated - Migration Required"
- Added lifecycle status: "End of Life"
- Added end of life date: December 31, 2025
- Added note: "This product is being phased out. Please migrate to Enhanced Firewall Suite (ID: 350) before the end-of-life date."
- Added reference to replacement product: Enhanced Firewall Suite (ID: 350)

Step 2: Creating a special migration price
I've created a new product offering price:
- ID: 470
- Name: "Basic to Enhanced Firewall Migration Discount"
- Description: "Special pricing for customers migrating from Basic Firewall to Enhanced Firewall Suite"
- Price Type: one time
- Amount: $199 USD (standard setup fee is $499)
- Valid From: May 16, 2025
- Valid To: December 31, 2025
- Eligibility: "Available only for existing Basic Firewall customers"

Step 3: Creating a migration path relationship
I've created a relationship between the two offerings to indicate the migration path.

Step 4: Adding a banner to the Basic Firewall offering page
Added a notice banner that will display to customers viewing this product.

All transition plan elements have been implemented successfully. Would you like to notify existing customers about this migration plan?
```

These examples provide realistic scenarios for how MCP clients would interact with the Product Catalog Management API through natural language prompts, following the MCP standard.
