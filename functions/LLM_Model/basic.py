from firebase_functions.params import StringParam
import dspy

class Base:
    def __init__(self):
        api_key = StringParam('OPENAI_API_KEY')

        # Use in your DSPy code
        lm = dspy.LM('openai/gpt-4o-mini', api_key=str(api_key))
        dspy.configure(lm=lm)
    
    def query(self, query):
        math = dspy.Predict("question -> break down of task")
        result = math(question = query)
        print(result)
        return result