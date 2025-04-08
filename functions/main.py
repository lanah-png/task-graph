from firebase_functions import https_fn
from firebase_admin import initialize_app
import os
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

@https_fn.on_call()
def hello_world(req: https_fn.CallableRequest) -> https_fn.Response:

    
    messages = convert_chat_history_to_openai_messages(req.data["chatHistory"])
    print(messages)
    result = dog.query(messages)
    # print(result)
    

    return {"message_response":str(result.response)}