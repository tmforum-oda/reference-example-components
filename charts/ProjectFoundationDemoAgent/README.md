# Project Foundation Demo Agent

This is a demonstration AI-native ODA Canvas data agent for the Project Foundation reference implementation.

This folder is the Helm Chart package for the demo agent. The agent showcases how an AI-native component can discover and consume MCP (Model Context Protocol) and A2A (Agent-to-Agent) APIs exposed by other ODA components on the Canvas.

## Functionality

### Core function

The demo agent is an AI-native ODA component that:
* Exposes a custom agent API for receiving task instructions.
* Discovers and consumes downstream APIs through the ODA Canvas info endpoint.

It has the following dependent APIs:
* The *optional* dependency on a **productcatalogmcp** MCP API — discovered at runtime from the Canvas, allowing the agent to use the Product Catalog as a tool.
* The *optional* dependency on a **productcataloga2a** A2A API — discovered at runtime from the Canvas, enabling agent-to-agent communication.

### Management function

In its **management function** it includes:
* An embedded OpenTelemetry collector that captures and exports traces from the agent's AI reasoning steps.

The component includes a sidecar OpenTelemetry Collector that forwards traces to a configurable backend.

## Microservices

The implementation consists of the following services:
* A `demoagent` microservice (image: `akumartmf/databricks-demo-agent:v0.12`) — the main AI agent.
* An `otel-collector` sidecar that collects and exports OpenTelemetry traces.

This reference component is intended to be used as a showcase for the ODA Component model and AI-native agent capabilities on the ODA Canvas. It is not intended for production deployments.

## Installation

Install this component (assuming the kubectl config is connected to a Kubernetes cluster with an operational ODA Canvas) using:
```
helm install r1 .\projectfoundationdemoagent -n components
```

You can test the component has deployed successfully using
```
kubectl get components -n components
```

## Configuration

You can configure the following aspects of the component by changing values in the `values.yaml` file, or by setting them on the command line using the `--set` parameter.

| Variable Name              | Default                                | Explanation                                                                  |
|----------------------------|----------------------------------------|------------------------------------------------------------------------------|
| `image.repository`         | akumartmf/databricks-demo-agent        | The image repository for the demo agent                                      |
| `image.tag`                | v0.12                                  | The image tag for the demo agent                                             |
| `canvas.infoEndpoint`      | http://info.canvas.svc.cluster.local   | The ODA Canvas info endpoint for discovering downstream APIs                 |
| `replicaCount`             | 1                                      | Number of agent replicas                                                     |

# ODA Canvas

To know more about the ODA Canvas visit: https://github.com/tmforum-oda/oda-canvas
