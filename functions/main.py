# Welcome to Cloud Functions for Firebase for Python!
# To get started, simply uncomment the below code or create your own.
# Deploy with `firebase deploy`

from firebase_functions import https_fn
from firebase_admin import initialize_app

initialize_app()


@https_fn.on_call()
def hello_world(req: https_fn.CallableRequest) -> https_fn.Response:
    # Set CORS headers
    return {"data":"Hello world!"}