from ollama import AsyncClient
from .database import update_assistant_message
from .config import MODEL

async def text_generation(id, chat_history):
    async for chunk in await AsyncClient().chat(model=MODEL, messages=[{"role": r, "content": c} for r,c in chat_history], stream=True, keep_alive=300):
        message = chunk["message"]["content"]
        yield message
        update_assistant_message(id, message)