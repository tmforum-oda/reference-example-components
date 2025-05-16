# Copilot Instructions for Reference Example Components

## Project Overview

This repository contains the Reference Example components conforming to the ODA Component standard and used to test the ODA Canvas.

## Key Concepts and Terminology

- **ODA Canvas**: An execution environment that supports ODA Components by providing access to cloud-native services required by the components (API Gateway, Service Mesh, Observability services, Identity Management, etc.). Defined in the repository https://github.com/tmforum-oda/oda-canvas
- **ODA Component**: Software components that follow the ODA Component Specification, which the Canvas reads as metadata to execute lifecycle processes. The Kubernetes Custom Resource Definition (CRD) for a component is at https://github.com/tmforum-oda/oda-canvas/blob/main/charts/oda-crds/templates/oda-component-crd.yaml
- **Operators**: Management-plane functions that manage ODA Components by reading the Component's requirements and executing lifecycle processes. Operators follow the Kubernetes Operator Pattern.


This Component implements Open-API specifications based on the TM Forum's Open Digital Architecture (ODA) standards. The Component is designed to be deployed in a Kubernetes environment and is managed by the ODA Canvas. The Component's lifecycle is managed by the ODA Canvas, which provides the necessary cloud-native services required by the Component.

It also implements AI services based on Model Context Protocol (MCP) - see documentation at https://docs.anthropic.com/en/docs/agents-and-tools/mcp and https://modelcontextprotocol.io/quickstart/server and https://github.com/modelcontextprotocol/python-sdk