from langchain_ollama import OllamaLLM

llm = OllamaLLM(model="llama3.1:8b")

def generate_explanation(user_history, recommended_movies):
    prompt = f"""
    You are an intelligent movie recommendation system.

    User's recent watch history:
    {user_history}

    Recommended movies:
    {recommended_movies}

    Explain clearly and naturally why these movies match the user's taste.
    Keep it short (1-2 sentences).
    Avoid generic responses.
    """

    response = llm.invoke(prompt)

    return response