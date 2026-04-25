from langchain_ollama import OllamaLLM

llm = OllamaLLM(model="llama3.1:8b")


def generate_chat_response(query, movies):
    movie_titles = [m.title for m in movies]

    prompt = f"""
You are a movie recommendation assistant.

User query:
{query}

Recommended movies:
{movie_titles}

Respond conversationally and recommend these movies.
Explain briefly why they match the request.
"""

    return llm.invoke(prompt)