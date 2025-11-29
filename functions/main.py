from firebase_functions import https_fn
from firebase_admin import initialize_app
import os
import json
from LLM_Model import Base


initialize_app()  # Initialize Firebase Admin SDK
dog = Base()

def convert_chat_history_to_openai_messages(chat_history):
    """
    Converts the chat history from your custom JSON format to the format needed
    for the OpenAI API chat completion endpoint.

    Parameters:
        chat_history (list): A list of message dictionaries. Each dictionary should have
                             keys 'id', 'type', 'content', and 'timestamp'.

    Returns:
        list: A list of messages formatted for the OpenAI API.
    """
    openai_messages = []
    for message in chat_history:
        # Map the 'type' field from your JSON to the expected 'role' field.
        # Here we assume the values are either 'user' or 'assistant'.
        role = message.get("type", "user")  # Default to 'user' if type is missing.
        content = message.get("content", "")
        openai_messages.append({"role": role, "content": content})
    
    return openai_messages

def parse_graph_data(input_data):
    """
    Parse the graph data to extract essential node information and link pairs.
    
    Args:
        input_data (str or dict): The graph data as a string or dictionary
        
    Returns:
        dict: A dictionary containing simplified nodes and links
    """
    # If input is a string, parse it as JSON
    if isinstance(input_data, str):
        try:
            data = json.loads(input_data)
        except json.JSONDecodeError:
            # Handle the case where the string might be a Python dictionary representation
            import ast
            try:
                data = ast.literal_eval(input_data)
            except (SyntaxError, ValueError):
                raise ValueError("Invalid input format. Expected JSON or Python dict string.")
    else:
        data = input_data
    
    # Extract essential node information
    simplified_nodes = []
    for node in data.get('nodes', []):
        node_info = {
            'id': node.get('id', ''),
            'name': node.get('name', ''),
            'description': node.get('description', '')
        }
        
        # Only include status if it exists
        if 'status' in node:
            node_info['status'] = node.get('status')
            
        simplified_nodes.append(node_info)
    
    # Extract link pairs
    simplified_links = []
    for link in data.get('links', []):
        source_id = link.get('source', {}).get('id') if isinstance(link.get('source'), dict) else link.get('source')
        target_id = link.get('target', {}).get('id') if isinstance(link.get('target'), dict) else link.get('target')
        
        if source_id and target_id:
            simplified_links.append({
                'source': source_id,
                'target': target_id
            })
    
    return {
        'nodes': simplified_nodes,
        'links': simplified_links
    }

@https_fn.on_call()
def hello_world(req: https_fn.CallableRequest) -> https_fn.Response:

    
    messages = convert_chat_history_to_openai_messages(req.data["chatHistory"])
    graph = parse_graph_data(req.data["graph"])
    nodes = graph["nodes"]
    links = graph["links"]
    print(nodes)
    print(links)
    result = dog.query(messages, graph)
    print(result)
    

    return {"message_response":str(result.response), "graph_data": graph}