#!/usr/bin/env python3
"""
Test script for the Product Catalog MCP Server using Streamable HTTP transport.

This script tests the MCP server's streamable HTTP endpoint to verify:
1. Server is running and accessible
2. MCP protocol initialization works
3. Tools can be discovered and called
4. Resources can be accessed

Usage:
    python test_streamable_http.py [--url http://localhost:8000/mcp]
"""

import argparse
import asyncio
import json
import logging
import sys
from typing import Any, Dict

import httpx

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("test_streamable_http")


class MCPStreamableHTTPClient:
    """Simple MCP client using Streamable HTTP transport."""

    def __init__(self, url: str):
        """Initialize the client with the MCP server URL."""
        self.url = url
        self.session_id = None
        self.request_id = 0

    def _get_next_request_id(self) -> int:
        """Get the next request ID."""
        self.request_id += 1
        return self.request_id

    async def send_request(self, method: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Send a JSON-RPC request to the MCP server.
        
        Args:
            method: The JSON-RPC method name
            params: Optional parameters for the request
            
        Returns:
            The JSON-RPC response
        """
        request_id = self._get_next_request_id()
        
        request = {
            "jsonrpc": "2.0",
            "id": request_id,
            "method": method,
        }
        
        if params:
            request["params"] = params
            
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
        }
        
        if self.session_id:
            headers["Mcp-Session-Id"] = self.session_id

        logger.debug(f"Sending request: {json.dumps(request, indent=2)}")

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(
                    self.url,
                    json=request,
                    headers=headers,
                )
                response.raise_for_status()
                
                # Store session ID if provided
                if "Mcp-Session-Id" in response.headers:
                    self.session_id = response.headers["Mcp-Session-Id"]
                
                result = response.json()
                logger.debug(f"Received response: {json.dumps(result, indent=2)}")
                
                if "error" in result:
                    logger.error(f"RPC Error: {result['error']}")
                    return result
                    
                return result
                
            except httpx.HTTPError as e:
                logger.error(f"HTTP Error: {e}")
                raise
            except json.JSONDecodeError as e:
                logger.error(f"JSON Decode Error: {e}")
                logger.error(f"Response text: {response.text}")
                raise

    async def initialize(self) -> Dict[str, Any]:
        """Initialize the MCP session."""
        logger.info("Initializing MCP session...")
        result = await self.send_request(
            "initialize",
            {
                "protocolVersion": "2024-11-05",
                "capabilities": {
                    "roots": {"listChanged": True},
                    "sampling": {},
                },
                "clientInfo": {
                    "name": "test-client",
                    "version": "1.0.0",
                },
            },
        )
        
        if "result" in result:
            logger.info("✓ MCP session initialized successfully")
            logger.info(f"  Server: {result['result'].get('serverInfo', {}).get('name', 'Unknown')}")
            logger.info(f"  Version: {result['result'].get('serverInfo', {}).get('version', 'Unknown')}")
        
        return result

    async def list_tools(self) -> Dict[str, Any]:
        """List available tools from the MCP server."""
        logger.info("Listing available tools...")
        result = await self.send_request("tools/list")
        
        if "result" in result:
            tools = result["result"].get("tools", [])
            logger.info(f"✓ Found {len(tools)} tools")
            for tool in tools[:5]:  # Show first 5
                logger.info(f"  - {tool['name']}: {tool.get('description', 'No description')[:60]}...")
        
        return result

    async def list_resources(self) -> Dict[str, Any]:
        """List available resources from the MCP server."""
        logger.info("Listing available resources...")
        result = await self.send_request("resources/list")
        
        if "result" in result:
            resources = result["result"].get("resources", [])
            logger.info(f"✓ Found {len(resources)} resources")
            for resource in resources[:5]:  # Show first 5
                logger.info(f"  - {resource['uri']}: {resource.get('name', 'No name')}")
        
        return result

    async def list_prompts(self) -> Dict[str, Any]:
        """List available prompts from the MCP server."""
        logger.info("Listing available prompts...")
        result = await self.send_request("prompts/list")
        
        if "result" in result:
            prompts = result["result"].get("prompts", [])
            logger.info(f"✓ Found {len(prompts)} prompts")
            for prompt in prompts[:5]:  # Show first 5
                logger.info(f"  - {prompt['name']}: {prompt.get('description', 'No description')[:60]}...")
        
        return result

    async def call_tool(self, tool_name: str, arguments: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Call a tool on the MCP server.
        
        Args:
            tool_name: Name of the tool to call
            arguments: Arguments to pass to the tool
            
        Returns:
            The tool response
        """
        logger.info(f"Calling tool: {tool_name}")
        result = await self.send_request(
            "tools/call",
            {"name": tool_name, "arguments": arguments or {}},
        )
        
        if "result" in result:
            logger.info(f"✓ Tool '{tool_name}' executed successfully")
            
        return result


async def run_tests(server_url: str):
    """Run a series of tests against the MCP server."""
    logger.info(f"Testing MCP Server at: {server_url}")
    logger.info("=" * 70)
    
    client = MCPStreamableHTTPClient(server_url)
    
    try:
        # Test 1: Initialize
        logger.info("\nTest 1: Initialize MCP Session")
        logger.info("-" * 70)
        init_result = await client.initialize()
        if "error" in init_result:
            logger.error("Failed to initialize MCP session")
            return False
        
        # Test 2: List Tools
        logger.info("\nTest 2: List Available Tools")
        logger.info("-" * 70)
        tools_result = await client.list_tools()
        if "error" in tools_result:
            logger.error("Failed to list tools")
            return False
        
        # Test 3: List Resources
        logger.info("\nTest 3: List Available Resources")
        logger.info("-" * 70)
        resources_result = await client.list_resources()
        if "error" in resources_result:
            logger.error("Failed to list resources")
            return False
        
        # Test 4: List Prompts
        logger.info("\nTest 4: List Available Prompts")
        logger.info("-" * 70)
        prompts_result = await client.list_prompts()
        if "error" in prompts_result:
            logger.error("Failed to list prompts")
            return False
        
        # Test 5: Call a simple tool (catalog_get)
        logger.info("\nTest 5: Call catalog_get Tool")
        logger.info("-" * 70)
        tool_result = await client.call_tool("catalog_get")
        if "error" in tool_result:
            logger.error("Failed to call tool")
            return False
        
        logger.info("\n" + "=" * 70)
        logger.info("✓ All tests passed!")
        logger.info("=" * 70)
        return True
        
    except Exception as e:
        logger.error(f"\n✗ Test failed with exception: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Test Product Catalog MCP Server with Streamable HTTP"
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
    success = asyncio.run(run_tests(args.url))
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
