# PoC: Delegated AI Agent Identity for A2A-to-MCP Tool Invocation

| | |
|---|---|
| Status | Proposed |
| Component folder | `source/ProductAdvisorAgent` (new), `source/ProductCatalog/MCPServerMicroservice` (extended) |
| Standards baseline | A2A 1.0, MCP 2026-07-28, OAuth 2.0 (RFC 8693, RFC 9396, RFC 8707, RFC 9068, RFC 9728, RFC 9700) |
| TM Forum alignment | TMFC001 Product Catalog Management, TMF620 Product Catalog Management API (v4, as implemented by the existing Product Catalog component) |

## Contents

1. [Summary](#1-summary)
2. [Business objective](#2-business-objective)
3. [Scope and relationship to existing work](#3-scope-and-relationship-to-existing-work)
4. [Identity model](#4-identity-model)
5. [Standards profile](#5-standards-profile)
6. [Logical component model](#6-logical-component-model)
7. [Effective authorization rule](#7-effective-authorization-rule)
8. [Token model](#8-token-model)
9. [Token exchange](#9-token-exchange)
10. [Authorization Server: Keycloak](#10-authorization-server-keycloak)
11. [Product Advisor Agent: A2A API](#11-product-advisor-agent-a2a-api)
12. [Product Catalog MCP server](#12-product-catalog-mcp-server)
13. [TMF620 data mapping and test data](#13-tmf620-data-mapping-and-test-data)
14. [Scenario 1: agent identity only (denied)](#14-scenario-1-agent-identity-only-denied)
15. [Scenario 2: user-delegated access (permitted)](#15-scenario-2-user-delegated-access-permitted)
16. [ODA Component expectations](#16-oda-component-expectations)
17. [Security requirements](#17-security-requirements)
18. [Audit event model](#18-audit-event-model)
19. [Negative security tests](#19-negative-security-tests)
20. [Implementation notes](#20-implementation-notes)
21. [Open questions](#21-open-questions)
22. [Definition of done](#22-definition-of-done)

---

## 1. Summary

Build a proof of concept showing how an AI agent invokes a protected MCP tool:

1. **With only its workload identity:** access is denied.
2. **On behalf of an authenticated user with explicitly delegated, fine-grained permissions:** access is granted. The returned product offers are limited by the user's delegation.

The PoC contains:

- **A Product Advisor Agent ODA Component** (new) that exposes an A2A API.
- **The existing Product Catalog Management ODA Component** (TMFC001 / TMF620). Its MCP server is extended with OAuth protection and a new `search_product_offers` tool.
- **An OAuth 2.0 Authorization Server / Security Token Service**: the Canvas Keycloak, upgraded (see [section 10](#10-authorization-server-keycloak)).
- **Two product brands:**
  - **RED**, representing Vodafone;
  - **MVNO**, representing partner or wholesale offers.
- **Two test scenarios:**
  - agent-only access is denied;
  - delegated user access succeeds and returns only offers inside the delegated price range and brand entitlement.

TMFC001 Product Catalog Management must expose TMF620 Product Catalog Management. TMF620 covers product catalogs, product offerings, product specifications and product offering prices.

## 2. Business objective

The PoC demonstrates that an AI agent:

1. **Has its own identity.** It has a distinct, independently authenticated workload identity.
2. **Gets no broad access by default.** Being trusted, or deployed inside the platform, does not give it broad access.
3. **Needs two permissions to use a protected tool:**
   - permission for the agent to use that class of tool;
   - authority, delegated by a user, for the specific task.
4. **Cannot change its delegation.** It cannot increase, broaden or reinterpret the authority the user delegated.
5. **Receives only data within all four limits.** The data must be allowed by every one of:
   - the user's permissions;
   - the agent's permissions;
   - the constraints on the delegated task;
   - the Product Catalog's policy.
6. **Leaves an auditable identity chain** showing:
   - which user started the task;
   - which agent acted;
   - which tool it called;
   - which constraints were applied;
   - which products were returned.

## 3. Scope and relationship to existing work

| Existing asset | How this PoC uses it |
|---|---|
| `source/ProductCatalog/MCPServerMicroservice` (FastMCP, Streamable HTTP, exposed as `apiType: mcp` `productcatalogmcp`) | **Extended**, not replaced:<br>- upgrade to MCP 2026-07-28 and MCP Python SDK 2.x;<br>- add the `search_product_offers` tool;<br>- add OAuth resource-server protection behind a Helm values flag ([section 12.1](#121-authentication-behind-a-values-flag)). |
| Existing MCP CRUD tools (`catalog_*`, `category_*`, `product_offering_*` …) | When authentication is on, **every** tool is protected:<br>- read tools need `product-catalog.read`;<br>- write tools need `product-catalog.write`.<br>The agent is granted neither, so an agent-only token cannot read or change the catalog through other tools. |
| `feature/demo-agent-foundation` branch (A2A wrappers, `ProjectFoundationDemoAgent`) | Kept **separate**. The PoC may reuse that branch's A2A patterns (the Agent Card at `/.well-known/agent-card.json`, the message-handling wrapper), updated to A2A 1.0. Nothing in this PoC depends on that branch being merged. |
| Canvas Keycloak (`canvas-oda` chart, currently `bitnamilegacy/keycloak:20.0.5`) | Needs upgrading. See [section 10](#10-authorization-server-keycloak). |
| AI-Native Canvas ADR-004 (gateway mediation) and oda-canvas#343 (coarse-grained authorization by JWT audience) | The Canvas API gateway can validate tokens at the edge as defence in depth. **The MCP server stays the final enforcement point** and never relies on the gateway having checked the token. |

## 4. Identity model

The PoC uses four separate credentials. Do **not** call the user's incoming A2A token a "delegation token".

| Term | Meaning |
|---|---|
| **A2A user access token** | Authenticates the user and authorises them to submit a task to the agent. Its audience is the agent's A2A API. |
| **Delegation authorization details** | Structured `authorization_details` (RFC 9396) defining what the user permits for this task. |
| **Agent workload credential** | Authenticates the agent itself. It is a confidential OAuth client using one of:<br>- `private_key_jwt` (preferred);<br>- mutual TLS;<br>- a client secret, for a simplified local PoC only. |
| **Delegated MCP access token** | Issued by token exchange (RFC 8693) and used by the agent to call the MCP server. Its subject is the user, its actor is the agent, and its audience is only the MCP resource. |

The delegated token expresses:

```text
User U has delegated authority D
to Agent A
for MCP resource M
for a short period T.
```

Token exchange is used instead of forwarding two independent bearer tokens to the MCP server. With token exchange, the Authorization Server validates the delegation and issues **one** downstream token with a clear issuer, audience, actor and effective permission set. MCP also forbids token passthrough: an MCP server "MUST NOT accept or transit any other tokens". The ADR in [section 22](#22-definition-of-done) records this decision.

## 5. Standards profile

| Standard | Use in this PoC |
|---|---|
| **RFC 8693** OAuth 2.0 Token Exchange | Exchange the user's authority and the agent's identity for an MCP-specific delegated token.<br>- The user is the `sub`; the agent is the actor (`act`). This is delegation, not impersonation.<br>- The user token carries `may_act`, naming the agent that may act for them. |
| **RFC 9396** Rich Authorization Requests | `authorization_details` carries the price, brand and category constraints. Scopes only express coarse permissions such as `product-offer.search`.<br>`product_offer_search` is a **PoC-defined type**, documented as a local implementation profile and not a registered type. |
| **RFC 8707** Resource Indicators | The token request names the MCP resource, so the issued token is audience-restricted to it. See [section 10](#10-authorization-server-keycloak) for the Keycloak equivalent. |
| **RFC 9068** JWT access tokens | Short-lived JWT access tokens that the MCP server validates locally. |
| **RFC 9728** Protected Resource Metadata | The MCP server publishes `/.well-known/oauth-protected-resource`, and its `WWW-Authenticate` challenges carry `resource_metadata`. |
| **RFC 6750** Bearer token usage | Defines the error codes: `invalid_token` (401) and `insufficient_scope` (403). |
| **RFC 9700** OAuth security BCP | Authorization code flow with PKCE for the user; restricted token privileges. |
| **MCP 2026-07-28** | Stateless Streamable HTTP, the MCP authorization profile, `structuredContent` with `outputSchema`. |
| **A2A 1.0** | Agent Card discovery, `securitySchemes` / `securityRequirements`, JSON-RPC `SendMessage`. |

Combining RFC 8693 with custom RFC 9396 types is not fully prescribed by either RFC. This PoC documents the combination as a **local OAuth profile**.

## 6. Logical component model

```text
+--------------------+
| Human User         |
| Role: RED_BRAND    |
+---------+----------+
          |
          | 1. OAuth access token (authorization code + PKCE)
          |    aud = product-advisor-agent A2A API
          |    scope = agent.task.submit
          |    may_act.sub = agent
          |    authorization_details = price/brand constraints
          v
+-------------------------------+
| Product Advisor Agent         |
| ODA Component                 |
|                               |
| - A2A API (A2A 1.0)           |
| - Agent orchestration         |
| - MCP client                  |
| - Workload identity           |
+---------------+---------------+
                |
                | 2. RFC 8693 token exchange
                |    subject_token = user token
                |    actor_token   = agent token
                |    resource      = product-catalog MCP
                v
+-------------------------------+
| Authorization Server / STS    |
| (Canvas Keycloak, upgraded)   |
|                               |
| - Validates user authority    |
| - Validates agent identity    |
| - Calculates intersection     |
| - Issues delegated MCP token  |
+---------------+---------------+
                |
                | 3. Delegated access token
                |    sub = user
                |    act.sub = agent
                |    aud = product-catalog MCP
                |    scope = product-offer.search
                |    authorization_details = constraints
                v
+-------------------------------+
| Product Catalog ODA Component |
| TMFC001 / TMF620              |
|                               |
| - MCP endpoint (2026-07-28)   |
| - Token validation            |
| - Policy enforcement          |
| - TMF620 Product Offerings    |
+-------------------------------+
```

## 7. Effective authorization rule

The Authorization Server and the MCP server both apply an intersection:

```text
Effective authority =
    user authority
  ∩ user delegation
  ∩ agent permissions
  ∩ MCP tool policy
```

The agent can never widen a delegated price range or add brands. For example:

```text
User role permits:              RED products
User task delegation permits:   RED products, £30 to £60
Agent permits:                  Search product offers
MCP policy permits:             Search only
---------------------------------------------------------
Effective authority:            RED products, £30 to £60
```

Suppose the agent asks for £20 to £80 during token exchange. The Authorization Server **rejects** the exchange with HTTP 400 `invalid_authorization_details` (RFC 9396). It does not narrow the range silently: one deterministic outcome keeps the tests unambiguous. Silent widening must never occur.

## 8. Token model

All access tokens are JWTs (RFC 9068) with a lifetime of about **five minutes**. Every token has a `jti`. The `jti` is used for **audit correlation and is not single-use**: the agent may reuse a delegated token for several tool calls within one task until it expires.

### 8.1 A2A user access token

```json
{
  "iss": "https://auth.example.com",
  "sub": "user:lester.thomas",
  "aud": "https://product-advisor-agent.example.com/a2a",
  "client_id": "small-business-advisor-ui",
  "scope": "agent.task.submit",
  "roles": ["RED_BRAND_CUSTOMER_ADVISOR"],
  "may_act": {
    "sub": "agent:product-advisor-agent"
  },
  "authorization_details": [
    {
      "type": "product_offer_search",
      "locations": ["https://product-catalog.example.com/mcp"],
      "actions": ["search"],
      "productCategory": "small-business-broadband",
      "monthlyPrice": {
        "currency": "GBP",
        "taxIncluded": true,
        "minimum": 30,
        "maximum": 60
      },
      "permittedBrands": ["RED"]
    }
  ],
  "iat": 1791291300,
  "exp": 1791291600,
  "jti": "user-token-001"
}
```

The `may_act` claim (RFC 8693 §4.4) tells the Authorization Server that this user allows `agent:product-advisor-agent` to act for them.

### 8.2 Agent-only access token

The agent obtains this token with the `client_credentials` grant, aimed at the MCP resource.

```json
{
  "iss": "https://auth.example.com",
  "sub": "agent:product-advisor-agent",
  "aud": "https://product-catalog.example.com/mcp",
  "client_id": "product-advisor-agent",
  "scope": "mcp.connect",
  "iat": 1791291300,
  "exp": 1791291600,
  "jti": "agent-token-001"
}
```

This token proves who the agent is. It deliberately does **not** include:

- `product-offer.search`;
- a human user subject;
- an `act` delegation chain;
- `product_offer_search` authorization details.

### 8.3 Delegated MCP access token

```json
{
  "iss": "https://auth.example.com",
  "sub": "user:lester.thomas",
  "aud": "https://product-catalog.example.com/mcp",
  "client_id": "product-advisor-agent",
  "act": {
    "sub": "agent:product-advisor-agent"
  },
  "scope": "product-offer.search",
  "authorization_details": [
    {
      "type": "product_offer_search",
      "locations": ["https://product-catalog.example.com/mcp"],
      "actions": ["search"],
      "productCategory": "small-business-broadband",
      "monthlyPrice": {
        "currency": "GBP",
        "taxIncluded": true,
        "minimum": 30,
        "maximum": 60
      },
      "permittedBrands": ["RED"]
    }
  ],
  "iat": 1791291310,
  "exp": 1791291610,
  "jti": "delegated-token-001"
}
```

The identity claims mean:

```text
sub     = user who owns or granted the authority
act.sub = agent currently exercising the authority
aud     = Product Catalog MCP server only
```

## 9. Token exchange

The agent sends the user's access token as the subject token and its own token as the actor token. It authenticates to the token endpoint as a confidential client.

```http
POST /oauth2/token HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=urn:ietf:params:oauth:grant-type:token-exchange
&subject_token=<USER_ACCESS_TOKEN>
&subject_token_type=urn:ietf:params:oauth:token-type:access_token
&actor_token=<AGENT_ACCESS_TOKEN>
&actor_token_type=urn:ietf:params:oauth:token-type:access_token
&requested_token_type=urn:ietf:params:oauth:token-type:access_token
&resource=https%3A%2F%2Fproduct-catalog.example.com%2Fmcp
&scope=product-offer.search
&authorization_details=<URL_ENCODED_JSON>
```

The Authorization Server must check that:

1. The user token is valid and has not expired.
2. The user token's audience is the agent's A2A API.
3. The user token's `may_act` names this agent.
4. The `actor_token` represents the same agent client that is performing the exchange.
5. The user may delegate `product-offer.search`.
6. The agent may request `product-offer.search`.
7. The requested MCP resource is permitted.
8. The requested `authorization_details` do not exceed the user's delegation. If they do, the exchange fails with `invalid_authorization_details`.
9. The issued token's audience is the MCP resource.
10. The issued token is short-lived and has a unique `jti`.

## 10. Authorization Server: Keycloak

The Canvas installs Keycloak `bitnamilegacy/keycloak:20.0.5`. That version has no standard (RFC 8693) token exchange. Current Keycloak capabilities, checked against the [Keycloak 26.2 announcement](https://www.keycloak.org/2025/05/standard-token-exchange-kc-26-2) and the [token exchange guide](https://www.keycloak.org/securing-apps/token-exchange) for release 26.8.0:

| Need | Keycloak 26.8 | Consequence for the PoC |
|---|---|---|
| Standard token exchange (RFC 8693) | Fully supported since 26.2 (`token-exchange-standard:v2`, on by default) | **Upgrade Keycloak to ≥ 26.8.** |
| Delegation: `actor_token`, `may_act`, `act` | **Preview.** Needs `--features=token-exchange-delegation,parameterized-scopes`. The user's token gets `may_act` when the client requests the scope `delegation:client:<agent-client-id>`. Also needs consent on the requesting client and FGAP v2 `delegate` permission. | Use the preview for the PoC and document that it is not production-supported. |
| `resource` parameter (RFC 8707) | Not supported. Keycloak uses `audience=<client_id>`, which only narrows the token's audience. | Send `audience` to Keycloak. Register the MCP server's Keycloak client with client ID `https://product-catalog.example.com/mcp`, so that `aud` equals the RFC 9728 resource identifier. |
| `authorization_details` (RFC 9396) with a custom type | No general support found | Add a small Keycloak extension (protocol mapper or token-exchange policy) that copies and intersects `product_offer_search`. If that is impractical, place a thin PoC STS in front of Keycloak (see [Open questions](#21-open-questions)). |
| Requester must be in the subject token's `aud` | Required: the subject token must list the requesting client in `aud` | The user token's audience must include the agent's client ID. |

The upgrade should be coordinated with the Canvas Keycloak chart work in tmforum-oda/canvas-prerequisites#1 and with oda-canvas#474.

## 11. Product Advisor Agent: A2A API

The agent implements **A2A 1.0**. Credentials travel in HTTP headers, never in the task payload. Requests carry the `A2A-Version: 1.0` header.

### 11.1 Agent Card

The agent publishes its card at `GET /.well-known/agent-card.json`:

```json
{
  "name": "Product Advisor Agent",
  "description": "Recommends authorised small-business broadband product offers.",
  "version": "0.1.0",
  "supportedInterfaces": [
    {
      "url": "https://product-advisor-agent.example.com/a2a",
      "protocolBinding": "JSONRPC",
      "protocolVersion": "1.0"
    }
  ],
  "capabilities": {
    "streaming": false
  },
  "defaultInputModes": ["text/plain"],
  "defaultOutputModes": ["text/plain", "application/json"],
  "skills": [
    {
      "id": "recommend-broadband-offers",
      "name": "Recommend small-business broadband offers",
      "description": "Recommends broadband product offers the delegating user is entitled to see.",
      "tags": ["product-catalog", "broadband", "small-business"]
    }
  ],
  "securitySchemes": {
    "oauth2": {
      "oauth2SecurityScheme": {
        "oauth2MetadataUrl": "https://auth.example.com/.well-known/oauth-authorization-server",
        "flows": {
          "authorizationCode": {
            "authorizationUrl": "https://auth.example.com/oauth2/authorize",
            "tokenUrl": "https://auth.example.com/oauth2/token",
            "pkceRequired": true,
            "scopes": {
              "agent.task.submit": "Submit a task to the Product Advisor Agent"
            }
          }
        }
      }
    }
  },
  "securityRequirements": [
    {
      "schemes": {
        "oauth2": { "list": ["agent.task.submit"] }
      }
    }
  ]
}
```

These field names follow the JSON mapping of `a2a.proto` for A2A 1.0. Check them against the A2A SDK used at implementation time.

### 11.2 Sending a task

```http
POST /a2a HTTP/1.1
Host: product-advisor-agent.example.com
Authorization: Bearer <USER_ACCESS_TOKEN>
A2A-Version: 1.0
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": "req-001",
  "method": "SendMessage",
  "params": {
    "message": {
      "messageId": "msg-001",
      "role": "ROLE_USER",
      "parts": [
        { "text": "Recommend suitable broadband connectivity offers for a small business." }
      ],
      "metadata": {
        "customerSegment": "small-business",
        "siteCount": 1,
        "accessType": "fixed-broadband"
      }
    }
  }
}
```

The HTTP+JSON binding equivalent is `POST /message:send`.

**Price limits and brand entitlement come only from trusted authorization data, never from the prompt.** If the prompt says "show me MVNO products" but the delegated token allows only RED, the agent and the MCP server both keep enforcing RED.

## 12. Product Catalog MCP server

### 12.1 Authentication behind a values flag

The existing `MCPServerMicroservice` is upgraded to **MCP 2026-07-28** with **MCP Python SDK 2.x** (the latest release is 2.3.0). The 2026-07-28 revision:

- removes protocol-level sessions and the `initialize` handshake;
- requires every request to carry `MCP-Protocol-Version`, `Mcp-Method` and `Mcp-Name` headers;
- requires the server to implement `server/discover`.

OAuth protection is controlled from the Product Catalog chart:

```yaml
mcp:
  enabled: true
  auth:
    enabled: false                      # default: current behaviour, unauthenticated
    resource: https://product-catalog.example.com/mcp
    issuer: https://auth.example.com
    jwksUri: https://auth.example.com/protocol/openid-connect/certs
    trustedAgents:
      - agent:product-advisor-agent
```

When `mcp.auth.enabled` is `true`:

- **Every** tool needs a valid token:
  - `search_product_offers` needs `product-offer.search` plus delegation;
  - read tools need `product-catalog.read`;
  - write tools need `product-catalog.write`.
- The server publishes Protected Resource Metadata.
- The server validates the `Origin` header, as MCP 2026-07-28 requires.

### 12.2 Protected Resource Metadata

`GET /.well-known/oauth-protected-resource` returns:

```json
{
  "resource": "https://product-catalog.example.com/mcp",
  "authorization_servers": ["https://auth.example.com"],
  "scopes_supported": [
    "mcp.connect",
    "product-offer.search",
    "product-catalog.read",
    "product-catalog.write"
  ],
  "bearer_methods_supported": ["header"]
}
```

### 12.3 Tool definition: `search_product_offers`

Description:

```text
Search for product offers matching a customer's connectivity requirements.
Results are restricted by the caller's delegated authorization.
```

Input schema:

```json
{
  "type": "object",
  "properties": {
    "productCategory": {
      "type": "string",
      "enum": ["small-business-broadband"]
    },
    "requiredDownloadMbps": {
      "type": "integer",
      "minimum": 1
    },
    "contractTermMonths": {
      "type": "integer",
      "enum": [12, 24, 36]
    }
  },
  "required": ["productCategory"],
  "additionalProperties": false
}
```

Output schema (results are returned as `structuredContent`):

```json
{
  "type": "object",
  "properties": {
    "productOfferings": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "brand": { "type": "string" },
          "downloadSpeedMbps": { "type": "integer" },
          "contractTermMonths": { "type": "integer" },
          "monthlyPrice": {
            "type": "object",
            "properties": {
              "unit": { "type": "string" },
              "value": { "type": "number" },
              "taxIncluded": { "type": "boolean" }
            },
            "required": ["unit", "value", "taxIncluded"]
          },
          "href": { "type": "string" }
        },
        "required": ["id", "name", "brand", "monthlyPrice"]
      }
    }
  },
  "required": ["productOfferings"]
}
```

The tool never accepts the following as arguments (`additionalProperties: false` rejects them):

- minimum price;
- maximum price;
- permitted brands;
- user role;
- user identifier.

Those values come only from the validated delegated token, so the model cannot change security constraints through tool arguments.

### 12.4 Tool-side authorization algorithm

The MCP server must:

1. Take the access token from the `Authorization` header.
2. Validate the JWT signature with the trusted issuer's published keys.
3. Validate `iss`, `exp`, `nbf` (if present) and `aud`, and check that `jti` is present.
4. Require the scope `product-offer.search`.
5. Require a valid delegation:
   - `sub` identifies a user;
   - `act.sub` identifies an agent in `trustedAgents`.
6. Require exactly one `product_offer_search` authorization detail, and validate it:
   - `locations` includes this MCP resource;
   - `actions` includes `search`;
   - the currency is `GBP` and `taxIncluded` is `true`;
   - `minimum` ≤ `maximum`;
   - `permittedBrands` is not empty.
7. Query the catalog with server-side predicates derived from the token.
8. Return only the matching records.
9. Record the authorization decision and the returned product offering IDs.

Filtering happens in the Product Catalog component or its trusted data-access layer. It never happens after a wider dataset has been returned to the model. The query is equivalent to:

```sql
SELECT *
FROM product_offering po
WHERE po.lifecycle_status = 'Launched'
  AND :segment IN po.market_segment
  AND po.category = :delegated_product_category
  AND po.recurring_monthly_price_tax_included >= :delegated_minimum
  AND po.recurring_monthly_price_tax_included <= :delegated_maximum
  AND po.product_specification.brand IN (:delegated_permitted_brands);
```

### 12.5 HTTP status codes

| Condition | Status | `WWW-Authenticate` error |
|---|---|---|
| Token missing | 401 | none; just `Bearer resource_metadata="…"` |
| Token invalid, expired, wrong issuer, bad signature, **wrong audience** | 401 | `invalid_token` |
| Valid token without the required scope or delegation | 403 | `insufficient_scope`, with `scope="product-offer.search"` |
| Malformed or contradictory `authorization_details` | 403 | `insufficient_scope`, with an `error_description` |

No product data is returned in any error response.

## 13. TMF620 data mapping and test data

### 13.1 Mapping to TMF620

| PoC concept | TMF620 representation |
|---|---|
| Lifecycle | `ProductOffering.lifecycleStatus = "Launched"` |
| Category | `ProductOffering.category[]` → `CategoryRef` named `small-business-broadband` |
| Segment | `ProductOffering.marketSegment[]` → `MarketSegmentRef` named `small-business` or `consumer` |
| Brand | `ProductSpecification.brand` (`RED` or `MVNO`), reached through `ProductOffering.productSpecification` |
| Download speed | `ProductSpecification.productSpecCharacteristic` named `downloadSpeed`, unit `Mbps` |
| Contract term | `ProductOffering.productOfferingTerm[]` with `duration { amount, units: "month" }` |
| Monthly price | `ProductOfferingPrice` with:<br>- `priceType = "recurring"`;<br>- `recurringChargePeriodType = "month"`;<br>- `recurringChargePeriodLength = 1`;<br>- `price { unit: "GBP", value }`, the price **before** tax;<br>- `tax[]` with one `TaxItem { taxCategory: "VAT", taxRate: 20, taxAmount { unit: "GBP", value } }`. |
| Tax basis | **The delegation compares the price including tax**, worked out as `price.value` + the sum of `tax[].taxAmount.value`. TMF620 v4 `ProductOfferingPrice` has no tax-included amount field. |

### 13.2 Test data

All offers are `Launched` and available on a 24-month term.

| ID | Offer | Brand | Download | Monthly price (inc. tax) | Segment | In the happy path? |
|---|---|---|---:|---:|---|---|
| PO-RED-001 | Red Business Broadband 100 | RED | 100 Mbps | £35 | Small business | Yes |
| PO-RED-002 | Red Business Broadband 500 | RED | 500 Mbps | £50 | Small business | Yes |
| PO-RED-003 | Red Business Broadband 1Gb | RED | 1000 Mbps | £75 | Small business | No, above maximum |
| PO-MVNO-001 | Partner Broadband 100 | MVNO | 100 Mbps | £32 | Small business | No, wrong brand |
| PO-MVNO-002 | Partner Broadband 500 | MVNO | 500 Mbps | £45 | Small business | No, wrong brand |
| PO-RED-004 | Red Consumer Fibre 100 | RED | 100 Mbps | £40 | Consumer | No, wrong segment |
| PO-RED-005 | Red Business Broadband Basic | RED | 100 Mbps | £25 | Small business | No, below minimum |

The test data is loaded as TMF620 resources (ProductSpecification, ProductOfferingPrice, ProductOffering) through the Product Catalog API, following the existing `test_payloads` pattern.

## 14. Scenario 1: agent identity only (denied)

### Objective

Prove that the agent's own workload identity is not enough to search Product Catalog offers.

### Preconditions

- The agent has a valid workload identity.
- The agent's token is aimed at the MCP server and has `mcp.connect`.
- The agent does **not** have:
  - `product-offer.search`;
  - a user delegation;
  - `product_offer_search` authorization details.

### Flow

1. The agent obtains an agent-only token (`client_credentials`).
2. The agent calls `search_product_offers`.
3. The MCP server validates the token: authentication succeeds.
4. The MCP server finds that the token lacks the required delegated permission.
5. The MCP server refuses the tool call. No catalog query runs and no product data is returned.

### Expected response

The token is valid but insufficient, so the status is **403**, not 401.

```http
HTTP/1.1 403 Forbidden
Content-Type: application/json
WWW-Authenticate: Bearer error="insufficient_scope", scope="product-offer.search", resource_metadata="https://product-catalog.example.com/.well-known/oauth-protected-resource", error_description="Delegated user authority required"

{
  "error": "insufficient_scope",
  "error_description": "The agent workload identity is authenticated but is not authorised to search product offers without delegated user authority.",
  "required_scope": "product-offer.search",
  "correlation_id": "corr-scenario-1"
}
```

### Acceptance criteria

- [ ] The MCP server authenticates the agent identity.
- [ ] The MCP server rejects the tool call with HTTP 403.
- [ ] The response contains `insufficient_scope`.
- [ ] No product records are returned.
- [ ] No Product Catalog query runs. This is verified by a query counter or an audit event.
- [ ] The audit log records:
  - [ ] the agent subject;
  - [ ] that no delegating user was present;
  - [ ] the decision `DENY`.
- [ ] The A2A task ends in `TASK_STATE_FAILED` with a controlled message. The agent does not invent offers.

## 15. Scenario 2: user-delegated access (permitted)

### Objective

Prove two things:

- the agent can search offers when acting under a valid user delegation;
- the Product Catalog MCP server enforces the price, brand and segment constraints.

### Preconditions

- The user is authenticated and has the role `RED_BRAND_CUSTOMER_ADVISOR`.
- The user delegates:
  - the action `search`;
  - the category small-business broadband;
  - a monthly price, including tax, from £30 to £60;
  - the brand RED.
- The user's token carries `may_act` naming the agent.
- The agent is allowed to request `product-offer.search`.
- The Product Catalog MCP server trusts the Authorization Server.

### Flow

1. The user gets an A2A access token (authorization code with PKCE).
2. The user calls the agent's A2A API (`SendMessage`) with that token.
3. The agent validates the A2A token and accepts the recommendation task.
4. The agent works out that it needs the Product Catalog MCP tool.
5. The agent authenticates to the Authorization Server with its workload identity.
6. The agent performs RFC 8693 token exchange:
   - the user token is the `subject_token`;
   - the agent's token is the `actor_token`;
   - the MCP endpoint is the requested resource;
   - `product-offer.search` is the requested scope.
7. The Authorization Server computes the intersection and issues a short-lived delegated MCP token.
8. The agent calls `search_product_offers` with the delegated token.
9. The MCP server validates the token and the delegation.
10. The MCP server takes the constraints from the token, runs a constrained query, and returns only PO-RED-001 and PO-RED-002.
11. The agent writes a recommendation using only those offers. The A2A task ends in `TASK_STATE_COMPLETED`.

### Expected MCP request (MCP 2026-07-28)

The request's `_meta` also carries the client capabilities that the 2026-07-28 revision requires.

```http
POST /mcp HTTP/1.1
Host: product-catalog.example.com
Authorization: Bearer <DELEGATED_MCP_ACCESS_TOKEN>
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: search_product_offers
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": "tool-call-001",
  "method": "tools/call",
  "params": {
    "name": "search_product_offers",
    "arguments": {
      "productCategory": "small-business-broadband",
      "requiredDownloadMbps": 100,
      "contractTermMonths": 24
    },
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28"
    }
  }
}
```

### Expected tool result

```json
{
  "resultType": "complete",
  "content": [
    {
      "type": "text",
      "text": "{\"productOfferings\":[{\"id\":\"PO-RED-001\",…},{\"id\":\"PO-RED-002\",…}]}"
    }
  ],
  "structuredContent": {
    "productOfferings": [
      {
        "id": "PO-RED-001",
        "name": "Red Business Broadband 100",
        "brand": "RED",
        "downloadSpeedMbps": 100,
        "contractTermMonths": 24,
        "monthlyPrice": { "unit": "GBP", "value": 35, "taxIncluded": true },
        "href": "/tmf-api/productCatalogManagement/v4/productOffering/PO-RED-001"
      },
      {
        "id": "PO-RED-002",
        "name": "Red Business Broadband 500",
        "brand": "RED",
        "downloadSpeedMbps": 500,
        "contractTermMonths": 24,
        "monthlyPrice": { "unit": "GBP", "value": 50, "taxIncluded": true },
        "href": "/tmf-api/productCatalogManagement/v4/productOffering/PO-RED-002"
      }
    ]
  },
  "isError": false
}
```

The `text` block carries the serialized JSON, as MCP recommends for clients that don't read `structuredContent`.

### Acceptance criteria

**A2A and identity**

- [ ] The user can submit the task through A2A `SendMessage`.
- [ ] The A2A request needs `agent.task.submit`.
- [ ] The agent's identity is distinct from the user's.
- [ ] The agent performs token exchange before calling the MCP tool.

**The delegated token**

- [ ] Its only audience is the MCP resource.
- [ ] It has `sub` for the user and `act.sub` for the agent.
- [ ] It has `product-offer.search`.
- [ ] It has the effective price range £30 to £60, including tax.
- [ ] It allows only the brand RED.

**The MCP server's results**

- [ ] It derives its security filters from the token.
- [ ] It returns PO-RED-001 and PO-RED-002, and nothing else.
- [ ] It does not return:
  - [ ] PO-RED-003, which is above £60;
  - [ ] PO-RED-005, which is below £30;
  - [ ] either MVNO offer;
  - [ ] the consumer offer.

**Recommendation and audit**

- [ ] The agent's recommendation mentions only authorised offers.
- [ ] The audit logs correlate the A2A request, the token exchange and the MCP call.

## 16. ODA Component expectations

### 16.1 Product Advisor Agent ODA Component (new)

**Location:** `source/ProductAdvisorAgent`, with chart `charts/ProductAdvisorAgent`.

**Component YAML:**

- `exposedAPIs`: an `apiType: a2a` API for the agent;
- `dependentAPIs`: an `apiType: mcp` dependency on the Product Catalog's `productcatalogmcp`;
- `securityFunction`: the component's own identity configuration.

**Exposes:**

- the A2A Agent Card and the A2A JSON-RPC endpoint;
- health and readiness endpoints;
- operational metrics (`apiType: openmetrics`);
- audit events.

**Configuration:**

- workload identity: client ID and key material;
- the Authorization Server's issuer and token endpoint;
- the Product Catalog MCP resource identifier.

**Runtime responsibilities:**

- A2A authentication and the task lifecycle;
- agent orchestration;
- token exchange, with the delegated token cached for the task only;
- MCP discovery (`server/discover`) and tool calls;
- response generation;
- audit and trace propagation.

The A2A wrapper pattern on `feature/demo-agent-foundation` (`ProductOrderingA2AWrapper`) may be reused, updated to A2A 1.0.

### 16.2 Product Catalog ODA Component (extended)

**Keeps** its existing TMF620 API.

**Its MCP endpoint gains:**

- MCP 2026-07-28 support;
- `search_product_offers`;
- OAuth Protected Resource Metadata;
- token validation and policy enforcement (behind `mcp.auth.enabled`);
- audit events.

**The chart version is bumped** (patch or minor), as the repo's release workflow requires.

### 16.3 Who decides what

**The Authorization Server:**

- authenticates the user and the agent;
- validates the token exchange and decides whether the agent may act for the user;
- prevents delegation from being broadened;
- converts user roles into entitlements;
- issues and signs the MCP-specific token;
- publishes its key and issuer metadata.

**The MCP server:**

- validates the token, its audience and scope, and that a delegation is present;
- enforces the structured authorization details by filtering rows;
- rejects invalid or contradictory constraints;
- prevents tool arguments from overriding the token's constraints;
- returns only authorised products.

It never trusts the agent just because the agent runs in the same ODA Canvas or Kubernetes cluster.

## 17. Security requirements

### 17.1 Mandatory for the PoC

**Transport and identity**

- [ ] HTTPS for the A2A, OAuth and MCP endpoints.
- [ ] A separate client registration for the Product Advisor Agent Component.
- [ ] Separate audience identifiers for A2A and MCP.

**Token validation**

- [ ] Short-lived access tokens (five minutes).
- [ ] JWT signature, issuer, audience and expiry validation.
- [ ] A `jti` in every token, used for audit; it is not single-use.

**Logging**

- [ ] No tokens in logs.
- [ ] No `Authorization` headers in traces.

**Policy enforcement**

- [ ] Price and brand constraints enforced on the server.
- [ ] No fallback from delegated access to agent-only access.
- [ ] No broad Product Catalog result returned to the model before filtering.
- [ ] A correlation ID propagated across the A2A request, the token exchange and the MCP calls.
- [ ] Existing MCP CRUD tools protected whenever `mcp.auth.enabled` is `true`.

### 17.2 Recommended enhancement

Use sender-constrained tokens (DPoP or mutual TLS), so that holding the token alone isn't enough to replay it.

- **Phase 1:** bearer JWTs over TLS.
- **Phase 2:** bind the delegated MCP token to the agent's DPoP key or mTLS certificate.

## 18. Audit event model

Each decision emits a structured event:

```json
{
  "timestamp": "2026-10-06T13:30:00.000Z",
  "correlationId": "corr-scenario-2",
  "a2aTaskId": "task-001",
  "toolCallId": "tool-call-001",
  "userSubject": "user:lester.thomas",
  "agentSubject": "agent:product-advisor-agent",
  "clientId": "product-advisor-agent",
  "resource": "https://product-catalog.example.com/mcp",
  "tool": "search_product_offers",
  "scope": ["product-offer.search"],
  "constraints": {
    "currency": "GBP",
    "taxIncluded": true,
    "minimumMonthlyPrice": 30,
    "maximumMonthlyPrice": 60,
    "permittedBrands": ["RED"],
    "productCategory": "small-business-broadband"
  },
  "decision": "PERMIT",
  "returnedProductOfferingIds": ["PO-RED-001", "PO-RED-002"],
  "delegatedTokenJti": "delegated-token-001"
}
```

Logs store the token identifier and the relevant decision claims, never the raw access token.

## 19. Negative security tests

In addition to the two scenarios, automated tests cover:

**Missing or invalid tokens: 401 `invalid_token`**

- [ ] A missing access token returns 401.
- [ ] An expired token returns 401.
- [ ] An invalid signature returns 401.
- [ ] A wrong issuer returns 401.
- [ ] A wrong audience returns 401.
- [ ] A user token sent directly to the MCP server returns 401, because its audience is the A2A API.
- [ ] A token issued for another MCP server returns 401.
- [ ] A token sent after it has expired returns 401.

**Valid tokens without the right authority: 403**

- [ ] An agent-only token returns 403 `insufficient_scope`.
- [ ] A delegated token without `act` is rejected.
- [ ] A delegated token whose `act.sub` is an unrecognised agent is rejected.
- [ ] A token without `product-offer.search` is rejected.
- [ ] A token with malformed price constraints is rejected.
- [ ] A token whose minimum price is greater than its maximum is rejected.

**Attempts to widen access**

- [ ] Tool arguments that try to widen the range (`minPrice`, `brands`) are rejected by the input schema.
- [ ] A prompt asking for MVNO offers does not override the token.
- [ ] A token exchange asking for £20 to £80 is rejected with `invalid_authorization_details`.
- [ ] A token exchange without `may_act` for this agent is rejected.

**Disclosure and other tools**

- [ ] No product data is returned in an authorization error.
- [ ] With `mcp.auth.enabled`, an agent-only token cannot call `product_offering_create`, `_update` or `_delete`.

## 20. Implementation notes

| Area | Suggested choice |
|---|---|
| Authorization Server | Canvas Keycloak upgraded to ≥ 26.8, with the `token-exchange-delegation` and `parameterized-scopes` features, plus a small extension for `authorization_details` ([section 10](#10-authorization-server-keycloak)) |
| Agent | Python with the A2A Python SDK (A2A 1.0) |
| MCP server | The existing `MCPServerMicroservice`, upgraded to MCP Python SDK 2.x (its `TokenVerifier` / resource-server auth helpers support RFC 9728) |
| Catalog API | The existing Product Catalog TMF620 microservice |
| Policy | Application logic first; optionally Open Policy Agent later |
| Deployment | Two separately deployable ODA Components on the Canvas |
| Testing | Pytest for unit and negative tests; BDD scenarios for the two demonstration scenarios |
| Tracing | OpenTelemetry with a shared correlation ID |

The `example.com` URLs in this spec are placeholders. In a Canvas deployment, use the component's gateway paths, for example `/<release>-productcatalogmanagement/mcp`.

## 21. Open questions

1. **Carrying `authorization_details` through Keycloak.** Should this be:
   - a Keycloak extension (protocol mapper or token-exchange policy SPI), or
   - a thin PoC STS in front of Keycloak that performs the intersection and signs the delegated token?
   
   The extension keeps one issuer. The STS is quicker to build but adds a second issuer the MCP server must trust.
2. **When to upgrade Keycloak.** Should the Keycloak 26.8 upgrade be a prerequisite delivered through tmforum-oda/canvas-prerequisites#1, or carried in this PoC's own test environment first?
3. **Gateway checks.** Should the Canvas gateway also enforce the MCP audience (oda-canvas#343) for this PoC, or is that left to a follow-up?

## 22. Definition of done

**Components**

- [ ] Both ODA Components can be deployed independently.
- [ ] The Product Advisor Agent publishes an A2A 1.0 Agent Card.
- [ ] The Product Catalog MCP server:
  - [ ] supports MCP 2026-07-28;
  - [ ] publishes Protected Resource Metadata when `mcp.auth.enabled` is `true`;
  - [ ] exposes the protected `search_product_offers` tool.

**Identity and delegation**

- [ ] The agent has its own workload identity.
- [ ] A user can authenticate and submit an A2A task.
- [ ] RFC 8693 token exchange with an actor token is implemented.
- [ ] The delegated MCP token identifies both the user and the agent.
- [ ] Price and brand restrictions are expressed as structured authorization details.

**Scenarios and tests**

- [ ] Scenario 1 reliably fails, with no data disclosed.
- [ ] Scenario 2 returns exactly two RED offers between £30 and £60, including tax.
- [ ] MVNO, out-of-range and wrong-segment offers are excluded.
- [ ] Automated positive and negative tests pass.

**Audit and documentation**

- [ ] The audit trail shows the user, agent, resource, tool, constraints and decision.
- [ ] `source/ProductAdvisorAgent/README.md` has setup instructions and example requests.
- [ ] `source/ProductAdvisorAgent/docs/adr/ADR-001-token-exchange-for-delegated-agent-access.md` explains why token exchange is used instead of forwarding two independent bearer tokens.

---

This specification separates authentication, delegation and policy enforcement. The Product Catalog MCP server is the final enforcement point, so neither the AI model nor the agent orchestration can widen the user's authority or retrieve data before the authorization filters are applied.
