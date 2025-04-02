from firebase_functions.params import StringParam
import dspy

class Base:
    def __init__(self):
        firebase_key = StringParam('OPENAI_API_KEY')

        # Use in your DSPy code
        lm = dspy.LM('openai/gpt-4o-mini', api_key=firebase_key.value)
        dspy.configure(lm=lm)
    
    def query(self, query):
        math = dspy.Predict("chat_history -> response: str")
        result = math(chat_history = str(query))
        print(result.response)
        return result
    
    def do_this(self):
        return self.api_key.value