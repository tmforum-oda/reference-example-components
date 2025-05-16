# MCP Server implementation on top of TM Forum AI Assistant (AIVA).
# This script sets up a FastMCP server that interacts with the AIVA API to handle queries and responses.
#
# Transport can be configured via the MCP_TRANSPORT environment variable:
# - Set MCP_TRANSPORT=stdio for standard input/output (default)
# - Set MCP_TRANSPORT=sse for Server-Sent Events

# logging and system imports
import logging
import os
import sys
from pathlib import Path

# MCP Server imports
from typing import Any
import httpx
from mcp.server.fastmcp import FastMCP

# Import AIVA API functionality
from aiva_api import query_aiva_api

# ---------------------------------------------------------------------------------------------
# Configure logging
log_dir = Path("logs")
log_dir.mkdir(exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(log_dir / "aiva-mcp-server.log"),
    ],
)

logger = logging.getLogger("aiva-mcp")
logger.info("AIVA MCP Server")

# ---------------------------------------------------------------------------------------------
# MCP server code

# Initialize FastMCP server
mcp = FastMCP(name="aiva", version="1.0.0")


# Resources
@mcp.resource("apis://categories")
async def get_api_categories() -> str:
    """Get the main categories of TM Forum Open APIs."""
    return """TM Forum Open APIs are organized into these main categories:

1. Customer Management APIs
   - Customer management, engagement, and experience
   - Party management and privacy

2. Product Management APIs
   - Product catalog and inventory
   - Product ordering and qualification
   - Product specifications and offering management
   - Product Quote management
   - Product Configuration management

3. Service Management APIs
   - Service catalog and inventory
   - Service ordering and activation
   - Service quality management
   - Service problem management
   - Service test management
   - Service performance management
   - Service Level Agreement management
   - Service Level Assurance management

4. Resource Management APIs
   - Resource catalog and inventory
   - Resource ordering and activation
   - Resource function management
   - Resource performance management
   - Resource trouble management

5. Common APIs
   - Event management
   - Notification management
   - Alarm management
   - Usage management
   - Audit Management
   - Authorization Management
   - Identity Management
   """


@mcp.resource("code://swagger-codegen")
async def get_swagger_codegen_info() -> str:
    """Get information about swagger code generation for TM Forum APIs."""
    return """Swagger Codegen Tool for TM Forum APIs:

Available Code Generation Options:
   - Backend Server Stubs:
     - python-flask, nodejs-express, spring-boot, go-server, etc.
   - Client SDKs:
     - python, java, typescript, csharp, go, etc.
   """


@mcp.resource("knowledge://frameworks")
async def get_frameworks() -> str:
    """Get information about key TM Forum frameworks."""
    return """Key TM Forum frameworks include:

1. Open Digital Architecture (ODA)
   - Component-based architecture
   - Open APIs and standard interfaces
   - Cloud-native design principles

2. Business Process Framework (eTOM)
   - End-to-end business processes
   - Operations and strategy mapping
   - Process decomposition

3. Information Framework (SID)
   - Common information model
   - Business entity definitions
   - Data model standards

4. Application Framework (TAM)
   - Application component mapping
   - System integration patterns
   - Application capabilities"""


# Example prompts
@mcp.prompt()
def api_list_prompt() -> str:
    """Get a list of all TM Forum Open APIs."""
    return "List all the TM Forum Open APIs and their main purposes."


@mcp.prompt()
def api_list_prompt_subsection() -> str:
    """Query APIs for a specific area."""
    return "What specific TM Forum API are required to implement the TM Forum Wholesale Broadband standard?"


@mcp.prompt()
def api_details_prompt() -> str:
    """Get detailed information about a specific TM Forum API."""
    return "What are the key features and capabilities of TMF620 Product Catalog Management API?"


@mcp.prompt()
def standards_prompt() -> str:
    """Get information about TM Forum standards for a specific domain."""
    return "What specific TM Forum APIs are required to implement the TM Forum Wholesale Broadband standard?"


@mcp.prompt()
def best_practices_prompt() -> str:
    """Get TM Forum best practices for implementation."""
    return "What are the best practices for implementing TMF620 Product Catalog Management API?"


@mcp.prompt()
def generate_api_code_prompt() -> str:
    """Use swagger gen tool to generate code assets."""
    return "Use swagger gen tool to generate code for Product catalogue management version 4 for python-flask."


@mcp.tool()
async def query_tmforum_ai_assistant(query: str) -> str:
    """Get information from the TM Forum knowledge base using AIVA AI Assistant.

    Queries the TM Forum AIVA AI Assistant to retrieve expert knowledge about TM Forum standards,
    APIs, frameworks, and best practices.

    Args:
        query: A natural language question about TM Forum topics (e.g., standards, APIs, frameworks)

    Returns:
        str: AIVA's response containing relevant TM Forum information or an error message if the query fails
    """
    response = await query_aiva_api(query)
    if not response:
        return "Unable to fetch data from AIVA."

    return response.get("output", {}).get("output", "No response from AIVA.")


if __name__ == "__main__":
    # Get the transport type from environment variable, default to stdio if not set
    transport = os.environ.get("MCP_TRANSPORT", "stdio")

    # Validate transport type
    valid_transports = ["stdio", "sse"]
    if transport not in valid_transports:
        logger.warning(
            f"Invalid transport '{transport}'. Using default transport 'stdio'."
        )
        transport = "stdio"

    logger.info(f"Starting AIVA MCP Server with {transport} transport")
    try:
        mcp.run(transport=transport)
    except KeyboardInterrupt:
        logger.info("Server shutting down")
    except Exception as e:
        logger.exception("Server error")
        sys.exit(1)
