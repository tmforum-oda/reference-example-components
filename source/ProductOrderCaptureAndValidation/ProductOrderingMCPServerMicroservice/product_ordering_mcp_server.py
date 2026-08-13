"""Streamable HTTP MCP server for TMF622 Product Ordering."""
import argparse
import logging
import os
from contextlib import asynccontextmanager
from typing import Any
import uvicorn
from mcp.server.fastmcp import FastMCP
from pydantic import BaseModel, ConfigDict, Field
from starlette.applications import Starlette
from starlette.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.routing import Mount, Route
from product_ordering_api import ProductOrderingAPI

logging.basicConfig(level=getattr(logging, os.getenv("LOG_LEVEL", "INFO").upper(), logging.INFO), format="%(asctime)s %(levelname)s %(name)s %(message)s")
LOGGER = logging.getLogger("product-ordering-mcp")
api = ProductOrderingAPI()
mcp = FastMCP(name="product_ordering", host=os.getenv("MCP_HOST", "0.0.0.0"), port=int(os.getenv("MCP_PORT", "8080")))


class ProductOrderCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="allow")
    product_order_item: list[dict[str, Any]] = Field(alias="productOrderItem")


class CancelProductOrderCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="allow")
    product_order: dict[str, Any] = Field(alias="productOrder")


async def _get(resource: str, resource_id: str | None, fields: str | None, offset: int | None, limit: int | None, filter: dict[str, Any] | None) -> Any:
    return await api.get(resource, resource_id, fields=fields, offset=offset, limit=limit, filter=filter)


@mcp.tool()
async def product_order_get(product_order_id: str | None = None, fields: str | None = None, offset: int | None = None, limit: int | None = None, filter: dict[str, Any] | None = None) -> Any:
    """List product orders or retrieve one by API-generated ID."""
    return await _get("productOrder", product_order_id, fields, offset, limit, filter)


@mcp.tool()
async def product_order_create(product_order_data: ProductOrderCreate) -> Any:
    """Create a product order. This mutating operation requires confirmation."""
    return await api.create("productOrder", product_order_data.model_dump(by_alias=True, exclude_none=True))


@mcp.tool()
async def product_order_update(product_order_id: str, product_order_data: dict[str, Any]) -> Any:
    """Patch a product order. This mutating operation requires confirmation."""
    return await api.update("productOrder", product_order_id, product_order_data)


@mcp.tool()
async def product_order_delete(product_order_id: str) -> Any:
    """Delete a product order. This mutating operation requires confirmation."""
    return await api.delete("productOrder", product_order_id)


@mcp.tool()
async def cancel_product_order_get(cancel_order_id: str | None = None, fields: str | None = None, offset: int | None = None, limit: int | None = None, filter: dict[str, Any] | None = None) -> Any:
    """List cancellation requests or retrieve one by API-generated ID."""
    return await _get("cancelProductOrder", cancel_order_id, fields, offset, limit, filter)


@mcp.tool()
async def cancel_product_order_create(cancel_order_data: CancelProductOrderCreate) -> Any:
    """Create a product-order cancellation request. This mutating operation requires confirmation."""
    return await api.create("cancelProductOrder", cancel_order_data.model_dump(by_alias=True, exclude_none=True))


async def health(_: Request) -> JSONResponse:
    return JSONResponse({"status": "ok", "service": "productorderingmcp"})


def create_app(component_name: str | None = None) -> Starlette:
    mcp_app = mcp.streamable_http_app()
    prefix = component_name or os.getenv("COMPONENT_NAME", "").strip("/")
    @asynccontextmanager
    async def lifespan(_: Starlette):
        async with mcp_app.router.lifespan_context(mcp_app):
            yield
        await api.close()
    app = Starlette(routes=[Route("/health", health), Mount(f"/{prefix}" if prefix else "/", app=mcp_app)], lifespan=lifespan)
    app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=False, allow_methods=["GET", "POST", "DELETE", "OPTIONS"], allow_headers=["*"], expose_headers=["Mcp-Session-Id"])
    return app


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default=os.getenv("MCP_HOST", "0.0.0.0"))
    parser.add_argument("--port", type=int, default=int(os.getenv("MCP_PORT", "8080")))
    args = parser.parse_args()
    LOGGER.info("Starting productorderingmcp on %s:%s", args.host, args.port)
    uvicorn.run(create_app(), host=args.host, port=args.port)


if __name__ == "__main__":
    main()
