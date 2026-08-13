"""Streamable HTTP MCP server for TMF637 Product Inventory."""

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

from product_inventory_api import ProductInventoryAPI


logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO").upper(), logging.INFO),
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
LOGGER = logging.getLogger("product-inventory-mcp")

api = ProductInventoryAPI()
mcp = FastMCP(
    name="product_inventory",
    host=os.getenv("MCP_HOST", "0.0.0.0"),
    port=int(os.getenv("MCP_PORT", "8080")),
)


class ProductFVO(BaseModel):
    """Bounded workshop schema for a TMF637 Product_FVO create payload."""

    model_config = ConfigDict(populate_by_name=True, extra="allow")

    type_: str = Field(alias="@type", description="TMF polymorphic type")


@mcp.tool()
async def product_get(
    product_id: str | None = None,
    fields: str | None = None,
    offset: int | None = None,
    limit: int | None = None,
    filter: dict[str, Any] | None = None,
) -> Any:
    """List products or retrieve one product from the TMF637 Product Inventory.

    Args:
        product_id: Optional API-generated product ID. Omit it to list products.
        fields: Optional comma-separated response fields.
        offset: Optional pagination offset.
        limit: Optional maximum number of products to return.
        filter: Optional flat TMF filter criteria, such as status, name, or external ID.
    """
    return await api.get_product(
        product_id,
        fields=fields,
        offset=offset,
        limit=limit,
        filter=filter,
    )


@mcp.tool()
async def product_create(product_data: ProductFVO) -> Any:
    """Create a TMF637 product using a Product_FVO payload.

    The payload must contain ``@type`` and conform to the deployed TMF637 schema.
    This is a mutating operation and requires orchestrator confirmation.
    """
    return await api.create_product(
        product_data.model_dump(by_alias=True, exclude_none=True)
    )


@mcp.tool()
async def product_update(product_id: str, product_data: dict[str, Any]) -> Any:
    """Patch an existing TMF637 product by API-generated ID.

    This is a mutating operation and requires orchestrator confirmation.
    """
    return await api.update_product(product_id, product_data)


@mcp.tool()
async def product_delete(product_id: str) -> Any:
    """Delete an existing TMF637 product by API-generated ID.

    This is a mutating operation and requires orchestrator confirmation.
    """
    return await api.delete_product(product_id)


async def health(_: Request) -> JSONResponse:
    return JSONResponse({"status": "ok", "service": "productinventorymcp"})


def create_app(component_name: str | None = None) -> Starlette:
    """Create the HTTP application with health and MCP routes."""
    mcp_app = mcp.streamable_http_app()
    prefix = component_name or os.getenv("COMPONENT_NAME", "").strip("/")

    @asynccontextmanager
    async def lifespan(_: Starlette):
        async with mcp_app.router.lifespan_context(mcp_app):
            yield
        await api.close()

    routes = [Route("/health", health)]
    routes.append(Mount(f"/{prefix}" if prefix else "/", app=mcp_app))
    app = Starlette(routes=routes, lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["Mcp-Session-Id"],
    )
    return app


def main() -> None:
    parser = argparse.ArgumentParser(description="TMF637 Product Inventory MCP server")
    parser.add_argument("--host", default=os.getenv("MCP_HOST", "0.0.0.0"))
    parser.add_argument(
        "--port", type=int, default=int(os.getenv("MCP_PORT", "8080"))
    )
    args = parser.parse_args()
    LOGGER.info("Starting productinventorymcp on %s:%s", args.host, args.port)
    uvicorn.run(create_app(), host=args.host, port=args.port)


if __name__ == "__main__":
    main()
