"""Bounded A2A wrapper for a single workshop MCP dependency."""
import json
import os
import re
import uuid
from datetime import timedelta
from typing import Any

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client

MODE = os.getenv("AGENT_MODE", "qualification")
COMPONENT_NAME = os.getenv("COMPONENT_NAME", "").strip("/")
MCP_ENDPOINT = os.getenv("MCP_ENDPOINT", "")
VERIFY_SSL = os.getenv("VERIFY_SSL", "true").lower() in {"1", "true", "yes", "on"}

CONTRACTS = {
    "qualification": {
        "name": "Service Qualification Agent",
        "skill_id": "service-qualification-query",
        "skill_name": "Service Qualification Query",
        "description": "Retrieve seeded service qualification results or create a service qualification request by discovering the available Service Qualification MCP tools, selecting one appropriate tool, invoking it once, and returning a grounded response.",
        "allowed": {"check_service_qualification_get", "check_service_qualification_create", "query_service_qualification_get", "query_service_qualification_create"},
    },
    "order": {
        "name": "Product Order Agent",
        "skill_id": "product-order-status-query",
        "skill_name": "Product Order Status Query",
        "description": "Retrieve and explain product order or cancellation status by discovering the available Product Ordering MCP tools, selecting one read operation, invoking it once, and returning a grounded response.",
        "allowed": {"product_order_get", "cancel_product_order_get"},
    },
}

app = FastAPI(title=CONTRACTS[MODE]["name"], version="0.1.0")


def _prefix(path: str) -> str:
    return f"/{COMPONENT_NAME}/v1/agent{path}" if COMPONENT_NAME else f"/v1/agent{path}"


def _extract_text(payload: dict[str, Any]) -> tuple[Any, str, bool]:
    is_rpc = payload.get("jsonrpc") == "2.0"
    request_id = payload.get("id", str(uuid.uuid4()))
    params = payload.get("params", {}) if is_rpc else payload
    if is_rpc and payload.get("method") not in {"message/send", "tasks/send", "task/send"}:
        raise ValueError(f"Unsupported JSON-RPC method: {payload.get('method')}")
    message = params.get("message", {})
    for part in message.get("parts", []):
        if part.get("kind", "text") == "text" and str(part.get("text", "")).strip():
            return request_id, str(part["text"]).strip(), is_rpc
    raise ValueError("A2A request message must contain a non-empty text part")


def _json_object(text: str) -> dict[str, Any] | None:
    start, end = text.find("{"), text.rfind("}")
    if start < 0 or end <= start:
        return None
    try:
        value = json.loads(text[start:end + 1])
        return value if isinstance(value, dict) else None
    except json.JSONDecodeError:
        return None


def select_tool(mode: str, query: str, available: set[str]) -> tuple[str, dict[str, Any]]:
    q = query.lower()
    stable_id = re.search(r"\b(?:WS-QUAL|PO)-\d+\b", query, re.IGNORECASE)
    if mode == "order":
        if any(word in q for word in ("create", "update", "delete", "cancel ", "cancel order")) and "status" not in q:
            raise ValueError("This A2A skill is status-focused and does not invoke Product Ordering mutation tools")
        tool = "cancel_product_order_get" if "cancel" in q else "product_order_get"
        args = {"filter": {"externalId": stable_id.group(0).upper()}} if stable_id else {}
    else:
        family = "check" if "check" in q else "query"
        is_create = any(word in q for word in ("create", "submit", "request qualification"))
        tool = f"{family}_service_qualification_{'create' if is_create else 'get'}"
        if is_create:
            data = _json_object(query)
            if data is None:
                raise ValueError("A qualification create request must include one JSON payload")
            args = {"qualification_data": data}
        else:
            args = {"filter": {"externalId": stable_id.group(0).upper()}} if stable_id else {}
    if tool not in available or tool not in CONTRACTS[mode]["allowed"]:
        raise ValueError(f"Required bounded capability is unavailable: {tool}")
    return tool, args


def _normalize_result(result: Any) -> Any:
    if getattr(result, "structuredContent", None) is not None:
        return result.structuredContent
    values = []
    for item in getattr(result, "content", []):
        text = getattr(item, "text", None)
        if text is not None:
            try:
                values.append(json.loads(text))
            except json.JSONDecodeError:
                values.append(text)
    return values[0] if len(values) == 1 else values


async def invoke(query: str) -> tuple[str, dict[str, Any], Any]:
    if not MCP_ENDPOINT:
        raise RuntimeError("MCP_ENDPOINT is not configured")
    async with streamablehttp_client(MCP_ENDPOINT, timeout=timedelta(seconds=30)) as transport:
        read_stream, write_stream = transport[0], transport[1]
        async with ClientSession(read_stream, write_stream) as session:
            await session.initialize()
            tools = await session.list_tools()
            available = {tool.name for tool in tools.tools}
            tool, arguments = select_tool(MODE, query, available)
            result = await session.call_tool(tool, arguments)
            if getattr(result, "isError", False):
                raise RuntimeError(f"MCP tool returned an error: {_normalize_result(result)}")
            return tool, arguments, _normalize_result(result)


def _card(request: Request) -> dict[str, Any]:
    contract = CONTRACTS[MODE]
    base = str(request.base_url).rstrip("/")
    return {"name": contract["name"], "description": contract["description"], "url": f"{base}{_prefix('/a2a')}", "version": "0.1.0", "capabilities": {"streaming": False, "pushNotifications": False, "stateTransitionHistory": False}, "defaultInputModes": ["text/plain", "application/json"], "defaultOutputModes": ["text/plain", "application/json"], "skills": [{"id": contract["skill_id"], "name": contract["skill_name"], "description": contract["description"], "tags": ["tmforum", "canvas", "mcp"]}], "metadata": {"componentName": COMPONENT_NAME, "maximumMcpToolCalls": 1, "grounding": "tool-results"}}


@app.get("/healthz")
async def healthz() -> dict[str, str]:
    return {"status": "ok"}


@app.get(_prefix("/.well-known/agent-card.json"))
@app.get(_prefix("/.well-known/agent.json"))
async def agent_card(request: Request) -> dict[str, Any]:
    return _card(request)


@app.post(_prefix("/a2a"))
async def a2a(payload: dict[str, Any]) -> JSONResponse:
    try:
        request_id, query, is_rpc = _extract_text(payload)
        tool, arguments, result = await invoke(query)
        task = {"id": str(request_id), "status": {"state": "completed"}, "artifacts": [{"name": "answer", "parts": [{"kind": "text", "text": json.dumps(result, indent=2, default=str)}], "metadata": {"grounding": "tool-results", "dependency": MCP_ENDPOINT, "tool": tool, "arguments": arguments}}], "metadata": {"toolCallsUsed": 1, "maximumToolCalls": 1}}
        return JSONResponse({"jsonrpc": "2.0", "id": request_id, "result": task} if is_rpc else task)
    except ValueError as exc:
        return JSONResponse({"jsonrpc": "2.0", "id": payload.get("id"), "error": {"code": -32602, "message": str(exc)}} if payload.get("jsonrpc") else {"id": str(payload.get("id", "unknown")), "status": {"state": "failed"}, "artifacts": [], "metadata": {"error": str(exc)}}, status_code=400)
    except Exception as exc:
        return JSONResponse({"jsonrpc": "2.0", "id": payload.get("id"), "error": {"code": -32603, "message": str(exc)}} if payload.get("jsonrpc") else {"id": str(payload.get("id", "unknown")), "status": {"state": "failed"}, "artifacts": [], "metadata": {"error": str(exc)}}, status_code=502)
