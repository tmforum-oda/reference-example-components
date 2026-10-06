# Tasks: Delegated AI Agent Identity PoC

This plan builds the PoC in [SPEC.md](SPEC.md) in small phases. You can build, test and demonstrate at the end of every phase. Tracking issue: [#78](https://github.com/tmforum-oda/reference-example-components/issues/78).

| Phase | Name | What you can demonstrate at the end |
|---|---|---|
| 0 | Developer baseline | The local stack runs; the 7 test offers load as TMF620 resources; the existing MCP tests pass |
| 1 | MCP upgrade | The Product Catalog MCP server runs MCP 2026-07-28, with no change in behaviour |
| **2** | **Minimum viable PoC** | **Scenario 1 is denied and Scenario 2 returns exactly PO-RED-001 and PO-RED-002, enforced by the MCP server.** Tokens are minted by a test issuer. |
| 3 | Real tokens | Keycloak 26.8 issues the user, agent and delegated tokens through RFC 8693 token exchange |
| 4 | Product Advisor Agent | A user sends an A2A 1.0 task; the agent exchanges tokens and calls the MCP tool from end to end |
| 5 | ODA Components on the Canvas | Both components are installed by Helm on an ODA Canvas and the end-to-end tests pass through the gateway |
| 6 | Complete PoC | Full audit trail and tracing, every negative test, README, ADR: the definition of done in SPEC §22 |
| 7 | Hardening (optional) | Sender-constrained tokens, `private_key_jwt`, OPA policy, gateway audience check |

**The minimum viable PoC is the end of Phase 2.** It proves the central claim of the spec: the MCP server is the final enforcement point, and an agent's own identity is not enough. Phases 3 and 4 then replace the test token issuer and the test client with the real Authorization Server and the real agent, without changing what the MCP server enforces.

## Conventions

**Branches and PRs**
- Each phase is delivered as one or more PRs into the feature branch `78-delegated-agent-identity-poc`.
- Phase 1 has value on its own, and may also go straight to `master`.

**Default behaviour**
- Everything new in the Product Catalog component sits behind `mcp.auth.enabled`, which defaults to `false`.
- Merging any phase must leave the current Product Catalog behaviour unchanged.

**Charts**
- Any change to a chart bumps its chart version. Otherwise the Release Charts workflow fails with `422 already_exists`.

**Tests**
- Python tests use `pytest`, with a marker for each phase so each phase can be run on its own:

  | Marker | Phase |
  |---|---|
  | `baseline` | 0 |
  | `mcp` | 1 |
  | `mvp` | 2 |
  | `keycloak` | 3 |
  | `a2a` | 4 |
  | `canvas` | 5 |
  | `security` | 6 |

- A phase is complete only when its own tests **and all earlier phases' tests** pass.

**Proposed layout**

```text
source/ProductAdvisorAgent/
  SPEC.md  TASK.md  README.md
  agent/                  # Product Advisor Agent (Python, A2A 1.0)
  dev/
    docker-compose.yaml   # local stack
    keycloak/             # realm export, extension or STS
    seed/                 # TMF620 test data and loader
  tests/                  # end-to-end and cross-component tests
  docs/adr/
source/ProductCatalog/MCPServerMicroservice/
  auth/                   # token validation and policy (new)
  tests/                  # unit and MCP-level tests (new)
charts/ProductAdvisorAgent/      # Phase 5
charts/ProductCatalog/           # mcp.auth.* values (Phase 2), version bumps
```

---

## Phase 0: Developer baseline

**Goal:** a repeatable local environment with the PoC test data. No behaviour changes.

- [ ] **0.1 Local stack.** Write `dev/docker-compose.yaml` that runs:
  - MongoDB;
  - the Product Catalog TMF620 API (`prodcat-dockerfile`);
  - the existing MCP server (`prodcat-mcp-dockerfile`).
  
  The MCP server reads the TMF620 API URL from its environment, and the ports are documented.
- [ ] **0.2 TMF620 test data** (SPEC §13): `dev/seed/` holds the 7 offers as TMF620 v4 resources.
  - **ProductSpecification:**
    - `brand` (`RED` or `MVNO`);
    - the characteristic `downloadSpeed` in Mbps.
  - **ProductOfferingPrice:**
    - recurring, monthly;
    - `price` before tax, plus a VAT `TaxItem` at 20%.
  - **ProductOffering:**
    - `category` `small-business-broadband`;
    - `marketSegment` `small-business` or `consumer`;
    - a 24-month `productOfferingTerm`;
    - `lifecycleStatus: Launched`.
  
  Pick prices before tax so that the price including tax comes to exactly £35, £50, £75, £32, £45, £40 and £25.
- [ ] **0.3 Seed loader.** `dev/seed/load.py` POSTs the resources through the TMF620 API. It can be re-run safely: existing IDs are replaced.
- [ ] **0.4 Test harness.** Add `pytest` configuration, the phase markers, and a `conftest.py` with fixtures for the stack URLs.

**Build and test**

```bash
docker compose -f source/ProductAdvisorAgent/dev/docker-compose.yaml up -d --build
uv run python source/ProductAdvisorAgent/dev/seed/load.py
uv run pytest -m baseline
uv run python source/ProductCatalog/MCPServerMicroservice/test_mcp_integration.py --url http://localhost:8000/mcp
```

**Exit criteria**
- `GET /productOffering` returns the 7 offers, each with its brand, segment, term and price including tax.
- The existing MCP integration test passes unchanged.

---

## Phase 1: MCP upgrade

**Goal:** the existing Product Catalog MCP server runs on the current MCP revision. Behaviour is otherwise unchanged. SPEC §3, §12.1.

- [ ] **1.1 Upgrade the SDK.** Move to MCP Python SDK 2.x (2.3.0 or later) and refresh `uv.lock`. Note any breaking API changes in `MIGRATION_GUIDE.md`.
- [ ] **1.2 Adopt MCP 2026-07-28:**
  - stateless Streamable HTTP (no sessions, no `initialize`);
  - `server/discover`;
  - `MCP-Protocol-Version`, `Mcp-Method` and `Mcp-Name` header handling;
  - `Origin` validation;
  - `tools/list` returns `ttlMs` and `cacheScope`.
- [ ] **1.3 Update the existing tests.** Move `test_mcp_integration.py` and `test_streamable_http.py` to the 2.x client, and make them collectable by `pytest -m mcp`.
- [ ] **1.4 Release plumbing.**
  - Bump the MCP image version in the build configuration.
  - Bump the Product Catalog chart version, with a changelog comment.
- [ ] **1.5 Canvas check.** Install the Product Catalog chart on a Canvas and confirm that the `productcatalogmcp` ExposedAPI is ready.

**Build and test**

```bash
cd source/ProductCatalog/MCPServerMicroservice
uv sync
uv run pytest -m "baseline or mcp"
```

**Exit criteria**
- Every existing MCP tool still works through the new client.
- A request without `MCP-Protocol-Version` gets HTTP 400.
- The chart installs on a Canvas.

---

## Phase 2: Minimum viable PoC (enforcement at the MCP server)

**Goal:** both demonstration scenarios work against the MCP server.
- The tokens come from a **test issuer**: an RSA key pair and a JWKS file served by the test harness.
- The tokens have exactly the claims in SPEC §8.
- No Keycloak and no agent are involved yet.

SPEC §7, §8, §12, §13, §14, §15.

- [ ] **2.1 Values flag.** Add `mcp.auth.enabled`, `resource`, `issuer`, `jwksUri` and `trustedAgents` to:
  - the Product Catalog chart;
  - the MCP server's environment and configuration.
  
  With the flag off, nothing changes.
- [ ] **2.2 Protected Resource Metadata.** Serve `/.well-known/oauth-protected-resource` (RFC 9728) when auth is on. Every 401 carries `WWW-Authenticate: Bearer resource_metadata="…"`.
- [ ] **2.3 Token validation** (`auth/`), using the SDK's resource-server `TokenVerifier`:
  - signature checked against the JWKS;
  - `iss`, `exp`, `nbf` and `aud` validated;
  - `jti` must be present.
  
  Return 401 `invalid_token` for invalid tokens and for a wrong audience (SPEC §12.5).
- [ ] **2.4 Scopes on every tool.**
  - `search_product_offers` needs `product-offer.search`.
  - Existing read tools need `product-catalog.read`.
  - Existing write tools need `product-catalog.write`.
  - A valid token without the right scope gets 403 `insufficient_scope`, with `scope` and `resource_metadata` in the challenge.
- [ ] **2.5 Delegation and authorization-details checks** (SPEC §12.4, steps 5–6):
  - `sub` and `act.sub`, where the agent is one of the `trustedAgents`;
  - exactly one `product_offer_search` authorization detail;
  - `locations` and `actions`;
  - GBP;
  - `minimum` ≤ `maximum`;
  - a non-empty brand list.
- [ ] **2.6 The `search_product_offers` tool:**
  - the input schema has `additionalProperties: false`;
  - the output schema returns `structuredContent` plus serialized text (SPEC §12.3, §15).
- [ ] **2.7 Constrained query.** A data-access function builds the TMF620 query from the token's constraints:
  - `lifecycleStatus`, category, market segment and brand are filtered before results go anywhere;
  - the price including tax is computed from `price` + `tax[]`;
  - speed and term come from the tool arguments.
  
  No unfiltered list is ever returned to the caller.
- [ ] **2.8 Minimal audit event.** For every decision, write one structured JSON log line with:
  - `decision`;
  - `userSubject` and `agentSubject`;
  - `tool`;
  - `returnedProductOfferingIds`;
  - `delegatedTokenJti`.
  
  Never log the raw token.
- [ ] **2.9 Test token issuer.** A `pytest` fixture that mints:
  - the agent-only token (SPEC §8.2);
  - the delegated token (SPEC §8.3);
  - a user token with the A2A audience (SPEC §8.1).
  
  It serves the JWKS on a local port.
- [ ] **2.10 Scenario tests** (`-m mvp`):
  - Scenario 1 gets 403 `insufficient_scope`, no catalog query runs (checked with a query counter or the audit event), and the audit shows `DENY`.
  - Scenario 2 returns exactly PO-RED-001 and PO-RED-002, and the audit shows `PERMIT`.
- [ ] **2.11 Core negative tests** (from SPEC §19):
  - a missing token;
  - an expired token;
  - a bad signature;
  - a wrong issuer;
  - a wrong audience;
  - the user's A2A token sent directly;
  - no `act`;
  - an unknown `act.sub`;
  - no `product-offer.search` scope;
  - `minimum` > `maximum`;
  - widening arguments rejected by the schema;
  - an agent-only token calling `product_offering_create`.
- [ ] **2.12 Demo script.** `dev/demo_mvp.py` runs both scenarios and prints the HTTP status, the returned IDs and the audit lines.
- [ ] **2.13 Chart version.** Bump the Product Catalog chart.

**Build and test**

```bash
docker compose -f source/ProductAdvisorAgent/dev/docker-compose.yaml up -d --build
uv run python source/ProductAdvisorAgent/dev/seed/load.py
uv run pytest -m "baseline or mcp or mvp"
uv run python source/ProductAdvisorAgent/dev/demo_mvp.py
```

**Exit criteria (MVP)**
- Scenario 1 is denied with no data disclosed.
- Scenario 2 returns exactly the two RED offers between £30 and £60 including tax.
- All the Phase 2 negative tests pass.
- With `mcp.auth.enabled: false`, the Phase 1 tests still pass.

---

## Phase 3: Real tokens (Keycloak 26.8 and token exchange)

**Goal:** replace the test issuer with Keycloak. SPEC §9, §10.

- [ ] **3.1 Spike: Keycloak 26.8 delegation preview.**
  - Run Keycloak 26.8 in the dev stack with `--features=token-exchange-delegation,parameterized-scopes`.
  - Confirm that:
    - a user login with the scope `delegation:client:product-advisor-agent` produces `may_act`;
    - an exchange with `actor_token` produces `act.sub`;
    - `audience=https://product-catalog.example.com/mcp` gives the expected `aud`.
  - Record what works, what doesn't, and the exact claim shapes.
- [ ] **3.2 Decision: carrying `authorization_details`** (SPEC §21, Q1). Using the spike results, choose:
  - a Keycloak extension (protocol mapper or token-exchange policy SPI); or
  - a thin PoC STS in front of Keycloak.
  
  Record the choice as `docs/adr/ADR-002-authorization-details-in-keycloak.md`.
- [ ] **3.3 Realm as code.** Write `dev/keycloak/realm-poc.json` with:
  - **Clients:**
    - `small-business-advisor-ui`: public, with PKCE;
    - `product-advisor-agent`: confidential, with a service account and standard token exchange on;
    - the MCP resource client, whose client ID is the resource URL.
  - **The user** `lester.thomas`, with the role `RED_BRAND_CUSTOMER_ADVISOR`.
  - **Scopes:** `agent.task.submit`, `product-offer.search`, `mcp.connect`, `product-catalog.read` and `product-catalog.write`.
  - **The FGAP v2 `delegate` permission.**
  - **For automated tests only,** direct access grants enabled on a test client, clearly marked as not for production.
- [ ] **3.4 Implement the 3.2 decision.** The user token carries the `product_offer_search` details. Token exchange intersects the requested details with the user's:
  - if the request widens them, the exchange is rejected with `invalid_authorization_details`;
  - otherwise the details are copied into the delegated token.
- [ ] **3.5 Point the MCP server at Keycloak.** Use Keycloak's issuer and JWKS. The token claim shapes found in 3.1 are handled; for example, `act.sub` may be a service-account ID, which is mapped to the agent name.
- [ ] **3.6 Token-exchange tests** (`-m keycloak`):
  - a valid exchange produces `sub`, `act.sub`, `aud`, `scope` and the details;
  - a widening request (£20–£80) is rejected;
  - a request without `may_act` is rejected;
  - a different agent's `actor_token` is rejected;
  - the subject token's audience must include the agent.
- [ ] **3.7 Re-run the Phase 2 scenarios with real tokens.** Run the MVP scenario tests with tokens from Keycloak instead of the test issuer.

**Build and test**

```bash
docker compose -f source/ProductAdvisorAgent/dev/docker-compose.yaml --profile keycloak up -d --build
uv run pytest -m "baseline or mcp or mvp or keycloak"
```

**Exit criteria**
- The delegated MCP token is issued by Keycloak through RFC 8693, with the user as `sub` and the agent as `act.sub`.
- The Phase 2 scenarios pass unchanged with Keycloak tokens.

---

## Phase 4: Product Advisor Agent (A2A 1.0)

**Goal:** the agent runs the end-to-end flow. SPEC §11, §15, §16.1.

- [ ] **4.1 Scaffold.** Create `agent/` with the A2A Python SDK (A2A 1.0), the MCP Python SDK 2.x client, `pyproject.toml` and a Dockerfile.
  - The A2A wrapper on `feature/demo-agent-foundation` (`ProductOrderingA2AWrapper`) may be reused, adapted to A2A 1.0.
  - It is not a dependency.
- [ ] **4.2 Agent Card.** Serve `/.well-known/agent-card.json` exactly as in SPEC §11.1, with a test that validates it against the A2A 1.0 schema.
- [ ] **4.3 Inbound authentication.** Validate the user's bearer token:
  - `aud` is the A2A API;
  - the scope includes `agent.task.submit`.
  
  Reject a missing or invalid token with 401.
- [ ] **4.4 `SendMessage` handler.** Use the JSON-RPC binding, and also `POST /message:send` if the SDK provides it. Handle the task lifecycle:
  - `TASK_STATE_COMPLETED` on success;
  - `TASK_STATE_FAILED` on denial or error.
- [ ] **4.5 Token exchange client.**
  - The agent authenticates with its client credentials.
  - The delegated token is cached for one task only.
  - There is **no fallback** to the agent-only token.
- [ ] **4.6 MCP client.**
  - Call `server/discover`.
  - Call `search_product_offers` with only the input-schema arguments.
  - Read the results from `structuredContent`.
- [ ] **4.7 Response generation.**
  - First, a deterministic template that lists only the returned offers.
  - An LLM is optional, behind a flag. The prompt is grounded only in the tool results.
- [ ] **4.8 Correlation ID.** Generate one per A2A request and send it on the token exchange and on the MCP call.
- [ ] **4.9 End-to-end tests** (`-m a2a`):
  - **Scenario 2 from end to end:** a user token, then `SendMessage`, ends in `TASK_STATE_COMPLETED` and mentions only PO-RED-001 and PO-RED-002.
  - **Scenario 1:** the agent's own token sent to MCP is denied, and the agent's task ends in `TASK_STATE_FAILED` without inventing offers.
  - **Prompt injection:** a prompt asking for MVNO offers still gets only RED offers.

**Build and test**

```bash
docker compose -f source/ProductAdvisorAgent/dev/docker-compose.yaml --profile keycloak --profile agent up -d --build
uv run pytest -m "baseline or mcp or mvp or keycloak or a2a"
```

**Exit criteria**
- Scenario 2 runs from end to end through A2A, token exchange and MCP.
- Scenario 1 gives a controlled failure.
- The prompt-injection test passes.

---

## Phase 5: ODA Components on the Canvas

**Goal:** both components are deployed as ODA Components. SPEC §16.

- [ ] **5.1 Authorization Server for the Canvas** (SPEC §21, Q2). Choose one:
  - upgrade the Canvas Keycloak to 26.8 or later (coordinate with tmforum-oda/canvas-prerequisites#1 and oda-canvas#474);
  - deploy a separate PoC Keycloak 26.8 for this PoC.
  
  Either way, load `realm-poc.json`.
- [ ] **5.2 `charts/ProductAdvisorAgent`.** The Component YAML has:
  - an `exposedAPIs` entry with `apiType: a2a`;
  - a `dependentAPIs` entry with `apiType: mcp`, pointing to `productcatalogmcp`;
  - an `openmetrics` endpoint;
  - `securityFunction`.
  
  Add the deployment, service and values for the client ID, issuer and MCP resource.
- [ ] **5.3 Product Catalog chart.** Set the `mcp.auth.*` values for the Canvas, and use gateway paths in place of the `example.com` URLs.
- [ ] **5.4 Images.** Add the agent image to the build configuration, then build and push both images.
- [ ] **5.5 Canvas end-to-end tests** (`-m canvas`): re-run the `a2a` tests against the Canvas gateway URLs.
- [ ] **5.6 Chart versions.** Bump both charts, and confirm that the Release Charts workflow passes.

**Build and test**

```bash
helm install poc-catalog charts/ProductCatalog -n components --set mcp.auth.enabled=true
helm install poc-advisor charts/ProductAdvisorAgent -n components
kubectl get components,exposedapis,dependentapis -n components
uv run pytest -m canvas --gateway-url https://<canvas-gateway>
```

**Exit criteria**
- Both components reach the `Complete` deployment status.
- The Agent's DependentAPI resolves to the Product Catalog MCP API.
- The end-to-end tests pass on the Canvas.

---

## Phase 6: Complete PoC (definition of done)

**Goal:** meet every item in SPEC §22.

- [ ] **6.1 Full audit events** (SPEC §18) from the agent, the token exchange (where possible) and the MCP server, all correlated by `correlationId`.
- [ ] **6.2 OpenTelemetry tracing** across A2A, token exchange and MCP. A test checks that the `Authorization` header and token values never appear in spans.
- [ ] **6.3 Log scan test.** Run all the scenarios, then assert that no JWT pattern appears in any container log.
- [ ] **6.4 Every remaining negative test from SPEC §19** (`-m security`):
  - a token issued for another MCP server;
  - a token used after expiry;
  - malformed price constraints;
  - no product data in any error body.
- [ ] **6.5 Documentation.**
  - **`README.md`:** architecture, setup (local and Canvas), example requests for each scenario, how to run each phase's tests.
  - **`docs/adr/ADR-001-token-exchange-for-delegated-agent-access.md`:** why token exchange is used instead of forwarding two bearer tokens.
- [ ] **6.6 CI.** A GitHub workflow runs `pytest -m "baseline or mcp or mvp"` on PRs that touch these folders. Later phases run where their services are available.

**Build and test**

```bash
uv run pytest
```

**Exit criteria**
- Every checkbox in SPEC §22 is ticked.

---

## Phase 7: Hardening (optional)

- [ ] **7.1 Sender-constrained delegated tokens.** Bind the token to the agent with DPoP or mTLS (SPEC §17.2, Phase 2 of that section).
- [ ] **7.2 Agent client authentication.** Use `private_key_jwt` for the agent, if Phase 3 used a client secret.
- [ ] **7.3 Policy engine.** Move the MCP policy decision into Open Policy Agent; the same tests must pass.
- [ ] **7.4 Gateway audience check.** The Canvas API gateway enforces the MCP audience as an extra layer (oda-canvas#343).

---

## Traceability

| SPEC section | Phases |
|---|---|
| §7 Effective authorization rule | 2 (MCP side), 3 (exchange side) |
| §8 Token model | 2 (shapes, test issuer), 3 (issued by Keycloak) |
| §9 Token exchange | 3, 4.5 |
| §10 Keycloak | 3, 5.1 |
| §11 A2A API | 4 |
| §12 MCP server | 1, 2 |
| §13 TMF620 data | 0 |
| §14 Scenario 1 | 2 (MCP), 4 (via the agent) |
| §15 Scenario 2 | 2 (MCP), 4 (end to end), 5 (Canvas) |
| §16 ODA Components | 5 |
| §17 Security requirements | 2, 6, 7 |
| §18 Audit | 2 (minimal), 6 (full) |
| §19 Negative tests | 2 (core), 3 (exchange), 4 (prompt injection), 6 (the rest) |
| §22 Definition of done | 6 |
