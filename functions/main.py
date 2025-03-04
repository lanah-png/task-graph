# Welcome to Cloud Functions for Firebase for Python!
# To get started, simply uncomment the below code or create your own.
# Deploy with `firebase deploy`

from firebase_functions import https_fn
from firebase_functions.params import StringParam
from firebase_admin import initialize_app
import dspy

initialize_app()  # Initialize Firebase Admin SDK

# Then access it like this
api_key = str(StringParam('OPENAI_API_KEY'))

# Use in your DSPy code
lm = dspy.LM('openai/gpt-4o-mini', api_key=api_key)
dspy.configure(lm=lm)
math = dspy.ChainOfThought("question -> answer: float")

@https_fn.on_call()
def hello_world(req: https_fn.CallableRequest) -> https_fn.Response:
    
    result = math(question="Two dice are tossed. What is the probability that the sum equals two?")
    print(result.reasoning)
    return {"data": str(result)}