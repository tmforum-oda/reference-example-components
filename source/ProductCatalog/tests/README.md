# Postman collections to test the Product Catalog Component

Here is a sample postman collection to test the Product Catalog Component.
These can be used to test the code as a standalone software running on the command-line, or as a deployed component running in an ODA Canvas. You need to create an environment in Postman declaring the {{Hostname}}. 
* For testing standalone, this will typically be `localhost:8080`.
* For testing in an ODA Canvas you need to query the API_ENDPOINT on the r1-productcatalog-productcatalogmanagement API resource - just use the first part of the URL with the hostname.

If you have applied API Keys or other authentication tokens in your deployment, you will need to add these in the headders in the postman collection.

There are three test colections for the Product Catalog Management:
* Functional test of the Product Catalog API
* Bulk deletion from the Product Catalog API
* Testing the role and event listeners

And one test collection for the Promotion Management.


# Testing TMF620 v4 and v5 support

The Product Catalog serves TMF620 Product Catalog Management v4 and v5 side by side over one MongoDB in the v5 format (issue #87, see [the spec](../../../specs/87-productcatalog-tmf620-v4-v5/spec.md)). It is tested at three levels:

* **Unit tests** for each part:
  * the v4 to v5 conversion library: [`shared/tmf620-compat/test`](../shared/tmf620-compat/test)
  * the v4 service's storage and startup migration: [`productCatalogMicroservice/implementation/test`](../productCatalogMicroservice/implementation/test)
  * the v5 service: [`productCatalogV5Microservice/implementation/test`](../productCatalogV5Microservice/implementation/test)
  * the compatibility counter: [`openMetricsMicroservice/compatibility.test.js`](../openMetricsMicroservice/compatibility.test.js)
* **BDD tests** in [`bdd`](bdd), which call both API versions the way a client would, against a local docker-compose stack or a component deployed in an ODA Canvas:
  * every resource on v4 and on v5;
  * data written through one version and read and changed through the other;
  * the warnings and errors where v4 cannot carry v5 data (one scenario per row of the compatibility matrix), with the compatibility metric;
  * an end-to-end telco catalogue built through both versions.
* **The TM Forum v4.1.0 conformance test kit (CTK)**, run against the v4 API to show that adding v5 has not changed v4.

The upgrade from chart 1.4.5 (v4 only) was also tested on a Canvas: existing v4 data is migrated to the v5 format and stays readable through both versions.

See [the BDD README](bdd/README.md) for what each kind of test covers and how to run it, and the [task list](../../../specs/87-productcatalog-tmf620-v4-v5/tasks.md) for the recorded results.


# Testing the dependent API implementation

The product catalog implements the optional dependency on other Product Catalogs. It federates any resources from downstream catalogs for both retrieve by ID and list operations. It does not allow any updates to the downstream product catalogs. The product catalog microservice queries a Canvas.Info API service to get details of the downstream APIs.

For standalone testing of the Canvas.Info service, there is a standalone Nodejs implementation of the Service Inventory Open API. To execute this as standalone, execute `npm start` in the `standalone-canvas-info-service` folder.

## Test setup for standalone dependent API testing

* Create 2 downstream product catalogs by deploying two instances of the Product Catalog component:

```
helm install cat-1 oda-components/productcatalog -n components
helm install cat-2 oda-components/productcatalog -n components
```


* In a separate terminal, start the Canvas.Info service:

```
cd standalone-canvas-info-service
npm start
```

* Execute the Product Catalog code in nodejs:

Set environment variables for your local mongo database:
* `MONGODB_DATABASE` - typically set to 'tmf'.
* `MONGODB_HOST` - localhost (or whatever your local MongoDb host is).
* `MONGODB_PORT` - the default value is `27017`.
* `CANVAS_INFO_HOST_PORT` - 'localhost:8638' for the stub testing.

```
cd productCatalogMicroservice/implementation
npm start
```

* Open the `federating multiple product catalogs` Postman collection. This includes operations for cleaning the product catalogs and Canvas.Info service inventory (ensuring they are empyty at the beginning of the test), Populting two downstream catalogs with test data, populating the Canvas.Info service inventory with references to the two downstream APIs and then testing the correct data is listed and retrieved. The test execution should look like:

![Postman](Postman.png)

