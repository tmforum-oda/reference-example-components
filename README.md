# reference-example-components
Reference example ODA Components Helm Chart repository


[Helm](https://helm.sh) must be installed to use the charts.  Please refer to
Helm's [documentation](https://helm.sh/docs) to get started.

Once Helm has been set up correctly, add the repo as follows:

```
helm repo add oda-components https://tmforum-oda.github.io/reference-example-components
```

If you had already added this repo earlier, run `helm repo update` to retrieve
the latest versions of the packages.  You can then run `helm search repo
oda-components` to see the charts.

To install the <chart-name> chart:

    helm install <release name> oda-components/<chart-name> -n components

To uninstall the chart:

    helm delete <release name> -n components


## Available Components

| ODA Component | Chart name | Chart | Source |
|---------------|------------|-------|--------|
| TMFC001 Product Catalog Management | `productcatalog` | [charts/ProductCatalog](charts/ProductCatalog/) | [source/ProductCatalog](source/ProductCatalog/) |
| TMFC002 Product Order Capture And Validation | `productordercaptureandvalidation` | [charts/ProductOrderCaptureAndValidation](charts/ProductOrderCaptureAndValidation/) | [source/ProductOrderCaptureAndValidation](source/ProductOrderCaptureAndValidation/) |
| TMFC005 Product Inventory | `productinventory` | [charts/ProductInventory](charts/ProductInventory/) | [source/ProductInventory](source/ProductInventory/) |
| TMFC006 Service Catalog Management | `servicecatalogmanagement` | [charts/ServiceCatalogManagement](charts/ServiceCatalogManagement/) | [source/ServiceCatalogManagement](source/ServiceCatalogManagement/) |
| TMFC007 Service Order Management | `serviceordermanagement` | [charts/ServiceOrderManagement](charts/ServiceOrderManagement/) | [source/ServiceOrderManagement](source/ServiceOrderManagement/) |
| TMFC008 Service Inventory | `serviceinventory` | [charts/ServiceInventory](charts/ServiceInventory/) | [source/ServiceInventory](source/ServiceInventory/) |
| TMFC028 Party Management | `partymanagement` | [charts/PartyManagement](charts/PartyManagement/) | [source/PartyManagement](source/PartyManagement/) |


## Optional Features

### Optional API Dependency

The Product Catalog component can be installed with an option API dependency (for a downstream Product Catalog API). By default, this dependency is not enabled. You can enable it with:

```
helm install <release name> oda-components/productcatalog --set component.dependentAPIs.enabled=true -n components
```

### Optional MCP Server

The Product Catalog component includes a Model Context Protocol (MCP) server that provides AI agent capabilities. By default, this feature is not enabled. You can enable it with:

```
helm install <release name> oda-components/productcatalog --set component.MCPServer.enabled=true -n components
```

Or when upgrading:

```
helm upgrade <release name> oda-components/productcatalog --set component.MCPServer.enabled=true -n components
```

The Service Order Management component (TMFC007) also includes an optional MCP server, enabled the same way:

```
helm install <release name> oda-components/serviceordermanagement --set component.MCPServer.enabled=true -n components
```


## License

This repository is licensed under the [Apache License, Version 2.0](LICENSE), the same as [oda-canvas](https://github.com/tmforum-oda/oda-canvas). Third-party material vendored into the repository (for example `skills/skill-creator/`) keeps its own license, as stated in the `LICENSE` file in its directory.
