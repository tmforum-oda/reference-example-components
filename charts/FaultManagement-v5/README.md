# Example Fault Management component

This is an example implementation of a [TM Forum Fault Management](https://www.tmforum.org/oda/directory/components-map/production/TMFC043) component.

This folder is the Helm Chart package which you distribute or host in a Helm Chart Repository. This README describes the functionality of the Fault Management component. The source code is available at [../source/FaultManagement-v5](/source/FaultManagement-v5/). The source file readme contains all the implementation documentation.

## Functionality

### Core function

In its **core function** it implements:
* The *mandatory* TMF642 Alarm Management Open API v5, covering alarm, ackAlarm, unAckAlarm, clearAlarm, commentAlarm, groupAlarm and unGroupAlarm resources.

It has no dependent APIs.

Optional exposed APIs defined by the specification (TMF656 Service Problem Management, TMF701 Process Flow Management) are not implemented in this reference build. To add either, follow the `create-oda-component` skill's Step 2 optional-API flow.

### Management function

In its **management function** it implements:
* An *optional* metrics API supporting the open metrics standard (formerly the prometheus de-facto standard). This metrics endpoint provides business metrics about all the Create/Update/Delete/state-change events for the Alarm Management resources.

## Security function

In its **security function** it declares a static role managed by the ODA Canvas and it exposes no role management APIs.

## Microservices

The implementation consists of the following microservices:
* A `faultmanagement` microservice that implements the TMF642 Alarm Management Open API v5.
* A `faultmanagementinitialization` microservice that registers the metrics microservice as a listener for alarm business events. This is deployed as a Kubernetes Job that runs once when the component is initialised.
* An `openMetrics` microservice that implements the open metrics API.
* A simple deployment of MongoDB. This is deployed as a Kubernetes Deployment with a PersistentVolumeClaim.

This reference component is intended to be used as a showcase for the ODA Component model, and to be used for testing the ODA Canvas. It is not intended for production deployments.

## Installation

Install this component (assuming the kubectl config is connected to a Kubernetes cluster with an operational ODA Canvas) using:
```
helm install r1 .\faultmanagement-v5 -n components
```

You can test the component has deployed successfully using
```
kubectl get components -n components
```

You should get an output like
```
NAME                       DEPLOYMENT_STATUS
r1-faultmanagement         Complete
```

(The DEPLOYMENT_STATUS will cycle through a number of interim states as part of the deployment).
If the deployment fails, refer to the [Troubleshooting-Guide](https://github.com/tmforum-oda/oda-ca-docs/tree/master/Troubleshooting-Guide).


## Configuration

You can configure the following aspects of the component by changing values in the `values.yaml` file, or by setting them on the command line using the `--set` parameter.

| Variable Name         | Default                                   | Explanation                                                              |
|-----------------------|-------------------------------------------|---------------------------------------------------------------------------|
| `mongodb.port`        | 27017                                     | The port to connect to the MongoDB instance                              |
| `mongodb.database`    | tmf                                       | The database name to connect to the MongoDB instance                     |
| `api.image`           | akumartmf/faultmanagementapiv5:0.1        | The image for the implementation of the main API microservice            |
| `api.port`            | 8080                                      | The port on which the API microservice listens                           |
| `metrics.image`       | akumartmf/faultmanagementmetricsv5:0.1    | The image for the open metrics microservice                              |

# ODA Canvas

To know more about the ODA Canvas visit: https://github.com/tmforum-oda/oda-canvas
