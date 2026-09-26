# Retail and Wholesale Test Data — Product Inventory Management

This folder contains Postman collections for loading and cleaning up sample test data in a **Product Inventory Management v4** (`pi1`) component instance.

The test data models a Vodafone scenario with two roles:

- **RedBrand** — consumer retail role with read/write access to product inventory
- **MVNO** — wholesale role with read/write access to product inventory

## Collections

| File | Purpose |
|------|---------|
| `RetailandWholesale.postman_collection.json` | Creates RedBrand and MVNO PermissionSpecificationSets |
| `RetailandWholesale_Cleanup.postman_collection.json` | Deletes all PermissionSpecificationSets from the instance |

## Data Created

### Permission Specification Sets

One `PermissionSpecificationSet` is created per role via the `rolesAndPermissionsManagement/v5` API:

#### RedBrand PermissionSpecificationSet
| Permission | Function | Action |
|-----------|----------|--------|
| `RedBrand:read` | productInventory | Read |
| `RedBrand:write` | productInventory | ReadWrite |

#### MVNO PermissionSpecificationSet
| Permission | Function | Action |
|-----------|----------|--------|
| `MVNO:read` | productInventory | Read |
| `MVNO:write` | productInventory | ReadWrite |

## Prerequisites

- A running `pi1` ProductInventory component instance (see `charts/ProductInventory`)
- [Newman](https://github.com/postmanlabs/newman) CLI or [Postman](https://www.postman.com/) desktop app

## Configuration

Both collections use one collection variable:

| Variable | Description | Default |
|----------|-------------|---------|
| `permBaseUrl` | Roles and Permissions Management v5 base URL | `https://localhost/pi1-productinventory/rolesAndPermissionsManagement/v5` |

Verify the exposed API URL with:
```bash
kubectl get exposedapi pi1-productinventory-userrolesandpermissions-v5 -n components
```

## Running with Postman

1. Import the collection file into Postman
2. Update the `permBaseUrl` collection variable if needed
3. Open the **Collection Runner** and run all requests in order

## Running with Newman

### Install Newman

```bash
npm install -g newman
```

### Load test data

```bash
newman run RetailandWholesale.postman_collection.json  --env-var permBaseUrl=https://localhost/pi1-productinventory/rolesAndPermissionsManagement/v5 --insecure
```

### Clean up

```bash
newman run RetailandWholesale_Cleanup.postman_collection.json --env-var permBaseUrl=https://localhost/pi1-productinventory/rolesAndPermissionsManagement/v5 --insecure
```

> **Note:** `--insecure` disables SSL certificate verification for self-signed localhost certificates.
