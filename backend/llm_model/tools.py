import dspy
from dataclasses import dataclass
from typing import Optional
import json
import datetime

def create_task_node(task_name: str, task_description: str, parent_id: Optional[str] = None) -> dict:
    """Create a new task node with an optional parent."""
    # Generate a unique node ID (e.g., using a timestamp or UUID)
    node_id = f"node_{datetime.datetime.now().timestamp()}"

    # Return the new node data
    return {
        "id": node_id,
        "name": task_name,
        "description": task_description,
        "parent_id": parent_id
    }

def finish():
    """Conclude the trajectory."""
    return "Finish"

# Tools dictionary
tools = {
    "create_task_node": dspy.Tool(create_task_node),
    "finish": dspy.Tool(finish)  # To allow the agent to finish
}

class TaskBreakdownSignature(dspy.Signature):
    """Agent for breaking down tasks and managing a task graph. Will guide users to more specific tasks before commiting to creating new task nodes."""
    conversation_history: str = dspy.InputField()
    task_nodes: dict = dspy.InputField(desc="Current list of task nodes and their links")
    response: str = dspy.OutputField(desc="Agent's reply to the user")
