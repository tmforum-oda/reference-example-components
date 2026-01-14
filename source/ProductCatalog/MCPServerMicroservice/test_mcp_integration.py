#!/usr/bin/env python3
"""
Integration test for the Product Catalog MCP Server using the official MCP Python SDK client.

This script tests the MCP server's Streamable HTTP endpoint using the proper MCP client
to verify:
1. Server initialization and capabilities discovery
2. Tools can be discovered and called
3. Resources can be accessed
4. Prompts can be listed and used

Usage:
    python test_mcp_integration.py [--url http://localhost:8000/mcp]
"""

import argparse
import asyncio
import logging
import sys
from contextlib import asynccontextmanager

from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("test_mcp_integration")


@asynccontextmanager
async def create_mcp_client(url: str):
    """Create and initialize an MCP client session."""
    logger.info(f"Connecting to MCP server at: {url}")
    
    async with streamable_http_client(url) as (read, write, get_session_id):
        async with ClientSession(read, write) as session:
            # Initialize the session
            result = await session.initialize()
            logger.info("✓ MCP session initialized successfully")
            server_info = result.serverInfo if hasattr(result, 'serverInfo') else result.server_info
            logger.info(f"  Server: {server_info.name}")
            logger.info(f"  Version: {server_info.version}")
            
            yield session


async def test_list_tools(session: ClientSession) -> bool:
    """Test listing available tools."""
    logger.info("\n" + "=" * 70)
    logger.info("Test: List Available Tools")
    logger.info("=" * 70)
    
    try:
        tools_result = await session.list_tools()
        tools = tools_result.tools
        
        logger.info(f"✓ Found {len(tools)} tools")
        logger.info("\nAvailable tools:")
        for tool in tools[:10]:  # Show first 10
            logger.info(f"  - {tool.name}")
            if tool.description:
                desc = tool.description[:80] + "..." if len(tool.description) > 80 else tool.description
                logger.info(f"    {desc}")
        
        if len(tools) > 10:
            logger.info(f"  ... and {len(tools) - 10} more tools")
        
        return True
        
    except Exception as e:
        logger.error(f"✗ Failed to list tools: {e}")
        return False


async def test_list_resources(session: ClientSession) -> bool:
    """Test listing available resources."""
    logger.info("\n" + "=" * 70)
    logger.info("Test: List Available Resources")
    logger.info("=" * 70)
    
    try:
        resources_result = await session.list_resources()
        resources = resources_result.resources
        
        logger.info(f"✓ Found {len(resources)} resources")
        logger.info("\nAvailable resources:")
        for resource in resources[:10]:  # Show first 10
            logger.info(f"  - {resource.uri}")
            if resource.name:
                logger.info(f"    Name: {resource.name}")
        
        if len(resources) > 10:
            logger.info(f"  ... and {len(resources) - 10} more resources")
        
        return True
        
    except Exception as e:
        logger.error(f"✗ Failed to list resources: {e}")
        return False


async def test_list_prompts(session: ClientSession) -> bool:
    """Test listing available prompts."""
    logger.info("\n" + "=" * 70)
    logger.info("Test: List Available Prompts")
    logger.info("=" * 70)
    
    try:
        prompts_result = await session.list_prompts()
        prompts = prompts_result.prompts
        
        logger.info(f"✓ Found {len(prompts)} prompts")
        logger.info("\nAvailable prompts:")
        for prompt in prompts[:10]:  # Show first 10
            logger.info(f"  - {prompt.name}")
            if prompt.description:
                desc = prompt.description[:80] + "..." if len(prompt.description) > 80 else prompt.description
                logger.info(f"    {desc}")
        
        if len(prompts) > 10:
            logger.info(f"  ... and {len(prompts) - 10} more prompts")
        
        return True
        
    except Exception as e:
        logger.error(f"✗ Failed to list prompts: {e}")
        return False


async def test_call_tool(session: ClientSession) -> bool:
    """Test calling a simple tool."""
    logger.info("\n" + "=" * 70)
    logger.info("Test: Call catalog_get Tool")
    logger.info("=" * 70)
    
    try:
        # Call the catalog_get tool without arguments to get all catalogs
        logger.info("Calling catalog_get tool...")
        result = await session.call_tool("catalog_get", arguments={})
        
        logger.info("✓ Tool executed successfully")
        logger.info(f"  Result has {len(result.content)} content items")
        
        # Display the first content item
        if result.content:
            first_content = result.content[0]
            if hasattr(first_content, 'text'):
                text = first_content.text
                # Truncate if too long
                if len(text) > 200:
                    logger.info(f"  Response preview: {text[:200]}...")
                else:
                    logger.info(f"  Response: {text}")
        
        return True
        
    except Exception as e:
        logger.error(f"✗ Failed to call tool: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_read_resource(session: ClientSession) -> bool:
    """Test reading a resource."""
    logger.info("\n" + "=" * 70)
    logger.info("Test: Read a Schema Resource")
    logger.info("=" * 70)
    
    try:
        # Read the catalog schema resource
        logger.info("Reading schema://tmf620/catalog resource...")
        result = await session.read_resource("schema://tmf620/catalog")
        
        logger.info("✓ Resource read successfully")
        logger.info(f"  Result has {len(result.contents)} content items")
        
        # Display info about the first content item
        if result.contents:
            first_content = result.contents[0]
            if hasattr(first_content, 'text'):
                text = first_content.text
                logger.info(f"  Response length: {len(text)} characters")
        
        return True
        
    except Exception as e:
        logger.error(f"✗ Failed to read resource: {e}")
        import traceback
        traceback.print_exc()
        return False


async def run_all_tests(server_url: str) -> bool:
    """Run all integration tests."""
    logger.info("=" * 70)
    logger.info("Product Catalog MCP Server - Integration Tests")
    logger.info("=" * 70)
    
    try:
        async with create_mcp_client(server_url) as session:
            # Run all tests
            results = []
            
            results.append(await test_list_tools(session))
            results.append(await test_list_resources(session))
            results.append(await test_list_prompts(session))
            results.append(await test_call_tool(session))
            results.append(await test_read_resource(session))
            
            # Summary
            logger.info("\n" + "=" * 70)
            passed = sum(results)
            total = len(results)
            logger.info(f"Test Results: {passed}/{total} passed")
            logger.info("=" * 70)
            
            if passed == total:
                logger.info("✓ All tests passed!")
                return True
            else:
                logger.error(f"✗ {total - passed} test(s) failed")
                return False
        
    except Exception as e:
        logger.error(f"✗ Test suite failed with exception: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Integration test for Product Catalog MCP Server"
    )
    parser.add_argument(
        "--url",
        default="http://localhost:8000/mcp",
        help="MCP server URL (default: http://localhost:8000/mcp)",
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Enable verbose debug logging",
    )
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Run the tests
    success = asyncio.run(run_all_tests(args.url))
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
