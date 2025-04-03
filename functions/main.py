from firebase_functions import https_fn
from firebase_functions.params import StringParam
from firebase_admin import initialize_app
import dspy

initialize_app()  # Initialize Firebase Admin SDK

# Define the parameter with a default value (can be empty for required parameters)
api_key = StringParam("OPENAI_KEY", default="")

@https_fn.on_call()
def hello_world(req: https_fn.CallableRequest) -> https_fn.Response:
    # Get the actual value of the parameter
    openai_key = api_key.value
    
    # Use in your DSPy code
    lm = dspy.LM('openai/gpt-4o-mini', api_key=openai_key)
    dspy.configure(lm=lm)
    math = dspy.ChainOfThought("question -> answer: float")
    
    result = math(question="Two dice are tossed. What is the probability that the sum equals two?")
    print(result.reasoning)
    return {"data": str(result)}