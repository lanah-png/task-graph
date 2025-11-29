import os
from .tools import tools, TaskBreakdownSignature
import dspy
import json
import logging
from typing import AsyncGenerator, Dict, Any

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

max_iters = 5

class Agent:
    def __init__(self):
        # Get OpenAI API key from environment
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is not set")

        # Check if key is a placeholder
        if 'your_openai_api_key_here' in api_key.lower() or 'sk-' not in api_key:
            raise ValueError(f"OPENAI_API_KEY appears to be invalid. Please set a real OpenAI API key in backend/.env")

        logger.info(f"Initializing Agent with OpenAI API key: {api_key[:10]}...")

        # Configure DSPy with OpenAI GPT-4o-mini
        dspy.configure(lm=dspy.LM('openai/gpt-4o-mini', api_key=api_key))
        self.react_agent = dspy.ReAct(
            TaskBreakdownSignature,
            tools=list(tools.values()),
            max_iters=max_iters
        )

    def query(self, chat_history, graph_data):
        """
        Non-streaming query method for backward compatibility.

        Args:
            chat_history: List of chat messages
            graph_data: Current graph state with nodes and links

        Returns:
            Agent result with response and updated graph
        """
        result = self.react_agent(
            conversation_history=chat_history,
            task_nodes=graph_data
        )

        # Process tool calls and update graph
        for i in range(max_iters):
            current_tool = f"tool_name_{i}"
            tool_result = f'observation_{i}'

            if current_tool not in result.trajectory:
                break

            match result.trajectory[current_tool]:
                case "create_task_node":
                    # Create a new task node
                    node_data = result.trajectory[tool_result]

                    # Check if this is an error message
                    if isinstance(node_data, str) and ("error" in node_data.lower() or "execution error" in node_data.lower()):
                        logger.error(f"Tool execution failed: {node_data}")
                        break

                    # Parse if it's a string (JSON or dict representation)
                    if isinstance(node_data, str):
                        try:
                            node = json.loads(node_data)
                        except json.JSONDecodeError:
                            # Try eval as fallback (for dict string representation)
                            try:
                                import ast
                                node = ast.literal_eval(node_data)
                            except (SyntaxError, ValueError) as e:
                                logger.error(f"Failed to parse node data: {node_data}. Error: {e}")
                                break
                    else:
                        node = node_data

                    # Validate node has required fields
                    if not isinstance(node, dict) or "id" not in node or "name" not in node:
                        logger.error(f"Invalid node data: {node}")
                        break

                    if len(graph_data["nodes"]) > 0 and node.get("parent_id"):
                        graph_data["links"].append({
                            "source": node["parent_id"],
                            "target": node["id"]
                        })

                    graph_data["nodes"].append({
                        "id": node["id"],
                        "name": node["name"],
                        "description": node["description"]
                    })
                case _:
                    break

        return result

    async def query_stream(self, chat_history, graph_data) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Streaming query method that yields response chunks and graph updates.

        Yields:
            Dict with 'type' and corresponding data:
            - {'type': 'token', 'content': str} - Text chunk
            - {'type': 'graph_update', 'graph_data': dict} - Updated graph
            - {'type': 'done'} - Completion signal
        """
        # For now, we'll simulate streaming by yielding the full response
        # In a future update, you can integrate OpenAI's streaming API here

        result = self.react_agent(
            conversation_history=chat_history,
            task_nodes=graph_data
        )

        # Process tool calls and update graph
        for i in range(max_iters):
            current_tool = f"tool_name_{i}"
            tool_result = f'observation_{i}'

            if current_tool not in result.trajectory:
                break

            match result.trajectory[current_tool]:
                case "create_task_node":
                    # Create a new task node
                    node_data = result.trajectory[tool_result]

                    # Check if this is an error message
                    if isinstance(node_data, str) and ("error" in node_data.lower() or "execution error" in node_data.lower()):
                        logger.error(f"Tool execution failed: {node_data}")
                        break

                    # Parse if it's a string (JSON or dict representation)
                    if isinstance(node_data, str):
                        try:
                            node = json.loads(node_data)
                        except json.JSONDecodeError:
                            # Try eval as fallback (for dict string representation)
                            try:
                                import ast
                                node = ast.literal_eval(node_data)
                            except (SyntaxError, ValueError) as e:
                                logger.error(f"Failed to parse node data: {node_data}. Error: {e}")
                                break
                    else:
                        node = node_data

                    # Validate node has required fields
                    if not isinstance(node, dict) or "id" not in node or "name" not in node:
                        logger.error(f"Invalid node data: {node}")
                        break

                    if len(graph_data["nodes"]) > 0 and node.get("parent_id"):
                        graph_data["links"].append({
                            "source": node["parent_id"],
                            "target": node["id"]
                        })

                    graph_data["nodes"].append({
                        "id": node["id"],
                        "name": node["name"],
                        "description": node["description"]
                    })
                case _:
                    break

        # Simulate streaming by breaking response into chunks
        response_text = str(result.response)
        chunk_size = 10  # Characters per chunk

        for i in range(0, len(response_text), chunk_size):
            chunk = response_text[i:i + chunk_size]
            yield {
                'type': 'token',
                'content': chunk
            }

        # Send final graph update
        yield {
            'type': 'graph_update',
            'graph_data': graph_data
        }
