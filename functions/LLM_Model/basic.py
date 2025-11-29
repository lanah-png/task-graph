from firebase_functions.params import StringParam
from .tools import tools, TaskBreakdownSignature
import dspy
import json

max_itters = 5

class Base:
    def __init__(self):
        firebase_key = StringParam('OPENAI_API_KEY')

        # Use in your DSPy code
        dspy.configure(lm = dspy.LM('openai/gpt-4o-mini', api_key=firebase_key.value))
        self.react_agent = dspy.ReAct(TaskBreakdownSignature, tools=list(tools.values()), max_iters=max_itters)

    def query(self, chat_history, graph_data):
        result = self.react_agent(
            conversation_history = chat_history,
            task_nodes = graph_data
        )
        
        for i in range(max_itters):
            current_tool = f"tool_name_{i}"
            tool_result = f'observation_{i}'
            match result.trajectory[current_tool]:
                case "create_task_node":
                    # Create a new task node
                    node = result.trajectory[tool_result]

                    if len(graph_data["nodes"]) > 0:
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