# Retail and Wholesale Test Data — Product Catalog Management

This folder contains Postman collections for loading and cleaning up sample test data in a **Product Catalog Management v4** (`pc1`) component instance.

The test data models a Vodafone scenario with two catalogs:

- **RedBrand** — consumer retail catalog containing Mobile and Broadband product offerings
- **MVNO** — wholesale catalog containing MVNO network access product offerings

## Collections

| File | Purpose |
|------|---------|
| `RetailandWholesale.postman_collection.json` | Creates all catalogs, categories, product specifications, prices, offerings, and permission specification sets |
| `RetailandWholesale_Cleanup.postman_collection.json` | Deletes all resources from the catalog and roles & permissions instances |

## Data Created

### RedBrand Catalog
**Mobile category**
| Offering | Price |
|----------|-------|
| Unlimited Max SIM Only 24-month | £28/month |
| Unlimited Lite SIM Only 12-month | £18/month |
| Pay As You Go Starter | £1 one-off |

**Broadband category**
| Offering | Price |
|----------|-------|
| Fibre 100 Broadband | £27/month |
| Fibre 900 Pro Broadband | £38/month |
| Home Broadband + Mobile Bundle | £40/month |

### MVNO Catalog
**MVNO Wholesale category**
| Offering | Price |
|----------|-------|
| MVNO Data Access - Standard | £500/month |
| MVNO Voice Access - National | £0.005/minute |
| Full MVNE Managed Service | £2000/month |
| MVNO IoT Connectivity Pack | £2/SIM/month |

## Permission Specification Sets

One `PermissionSpecificationSet` is created per catalog via the `rolesAndPermissionsManagement/v5` API:

### RedBrand PermissionSpecificationSet
| Permission | Function | Action |
|-----------|----------|--------|
| `RedBrand:read` | productCatalog | Read |
| `RedBrand:write` | productCatalog | ReadWrite |

### MVNO PermissionSpecificationSet
| Permission | Function | Action |
|-----------|----------|--------|
| `MVNO:read` | productCatalog | Read |
| `MVNO:write` | productCatalog | ReadWrite |

## Prerequisites

- A running `pc1` ProductCatalog component instance (see `charts/ProductCatalog`)
- [Postman](https://www.postman.com/) desktop app or [Newman](https://github.com/postmanlabs/newman) CLI

## Configuration

Both collections use two collection variables. Update them to point to your instance before running:

| Variable | Description | Default |
|----------|-------------|--------|
| `baseUrl` | Product Catalog Management v4 base URL | `https://localhost/pc1-productcatalogmanagement/tmf-api/productCatalogManagement/v4` |
| `permBaseUrl` | Roles and Permissions Management v5 base URL | `https://localhost/pc1-productcatalogmanagement/rolesAndPermissionsManagement/v5` |

Find the NodePorts with:
```bash
kubectl get svc pc1-prodcatapi pc1-permissionspecapi -n components
```

## Running with Postman

1. Import the collection file into Postman
2. Update the `baseUrl` collection variable to match your instance
3. Open the **Collection Runner**, select all requests, and run them **in order**

## Running with Newman

### Install Newman

```bash
npm install -g newman
```

### Load test data

```bash
newman run RetailandWholesale.postman_collection.json --env-var baseUrl=https://localhost/pc1-productcatalogmanagement/tmf-api/productCatalogManagement/v4 --env-var permBaseUrl=https://localhost/pc1-productcatalogmanagement/rolesAndPermissionsManagement/v5 --insecure
```

### Clean up

```bash
newman run RetailandWholesale_Cleanup.postman_collection.json --env-var baseUrl=https://localhost/pc1-productcatalogmanagement/tmf-api/productCatalogManagement/v4 --env-var permBaseUrl=https://localhost/pc1-productcatalogmanagement/rolesAndPermissionsManagement/v5 --insecure
```

> **Note:** `--insecure` disables SSL certificate verification, which is required when using a self-signed certificate on `localhost`. Remove this flag if your instance uses a trusted certificate.

### Useful Newman flags

| Flag | Description |
|------|-------------|
| `--reporters cli,json` | Output results to console and save a JSON report |
| `--reporter-json-export results.json` | Path for the JSON report file (use with `--reporters cli,json`) |
| `--delay-request 200` | Add 200 ms between requests (useful if the API has rate limits) |
| `--bail` | Stop the run on the first test failure |
