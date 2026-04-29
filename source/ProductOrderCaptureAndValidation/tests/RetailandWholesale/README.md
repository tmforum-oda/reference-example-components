# Retail and Wholesale Test Data — Product Order Capture and Validation

This folder contains Postman collections for loading and cleaning up sample test data in a **Product Ordering Management v4** (`po1`) component instance.

The test data models a Vodafone RedBrand scenario with three customer product orders and a RedBrand `PermissionSpecificationSet`.

## Collections

| File | Purpose |
|------|---------|
| `RetailandWholesale.postman_collection.json` | Creates 3 product orders and the RedBrand PermissionSpecificationSet |
| `RetailandWholesale_Cleanup.postman_collection.json` | Deletes all product orders and PermissionSpecificationSets (except `canvasRole`) |

## Data Created

### Product Orders

| Order | Products |
|-------|---------|
| Unlimited Max SIM Only 24-month | Unlimited Max SIM Only 24-month (×1) |
| Fibre 900 Pro + Unlimited Lite Bundle | Fibre 900 Pro Broadband (×1), Unlimited Lite SIM Only 12-month (×1) |
| Pay As You Go Starter | Pay As You Go Starter (×3) |

### Permission Specification Sets

#### RedBrand PermissionSpecificationSet
| Permission | Function | Action |
|-----------|----------|--------|
| `RedBrand:read` | productOrder | Read |
| `RedBrand:write` | productOrder | ReadWrite |

## Prerequisites

- A running `po1` ProductOrderCaptureAndValidation component instance (see `charts/ProductOrderCaptureAndValidation`)
- [Newman](https://github.com/postmanlabs/newman) CLI or [Postman](https://www.postman.com/) desktop app

## Configuration

Both collections use two collection variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `baseUrl` | Product Ordering Management v4 base URL | `https://localhost/po1-productordercaptureandvalidation/tmf-api/productOrderingManagement/v4` |
| `permBaseUrl` | Roles and Permissions Management v5 base URL | `https://localhost/po1-productordercaptureandvalidation/rolesAndPermissionsManagement/v5` |
| `pc1BaseUrl` | Product Catalog Management v4 base URL (used to look up product offering IDs) | `https://localhost/pc1-productcatalogmanagement/tmf-api/productCatalogManagement/v4` |

Verify the exposed API URLs with:
```bash
kubectl get exposedapi -n components | grep po1
```

## Running with Postman

1. Import the collection file into Postman
2. Update the collection variables if needed
3. Open the **Collection Runner** and run all requests in order

## Running with Newman

### Install Newman

```bash
npm install -g newman
```

### Load test data

```bash
newman run RetailandWholesale.postman_collection.json --env-var baseUrl=https://localhost/po1-productordercaptureandvalidation/tmf-api/productOrderingManagement/v4 --env-var permBaseUrl=https://localhost/po1-productordercaptureandvalidation/rolesAndPermissionsManagement/v5 --env-var pc1BaseUrl=https://localhost/pc1-productcatalogmanagement/tmf-api/productCatalogManagement/v4 --insecure
```

### Clean up

```bash
newman run RetailandWholesale_Cleanup.postman_collection.json --env-var baseUrl=https://localhost/po1-productordercaptureandvalidation/tmf-api/productOrderingManagement/v4 --env-var permBaseUrl=https://localhost/po1-productordercaptureandvalidation/rolesAndPermissionsManagement/v5 --insecure
```

> **Note:** `--insecure` disables SSL certificate verification for self-signed localhost certificates.
