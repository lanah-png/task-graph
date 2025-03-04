# Welcome to Cloud Functions for Firebase for Python!
# To get started, simply uncomment the below code or create your own.
# Deploy with `firebase deploy`

from firebase_functions import https_fn
from firebase_admin import initialize_app
from LLM_Model import Base


initialize_app()  # Initialize Firebase Admin SDK
dog = Base()


@https_fn.on_call()
def hello_world(req: https_fn.CallableRequest) -> https_fn.Response:
    
    result = dog.query("I want to go shopping for my sister's birthday")
    print(result)
    return {"data": str(result)}