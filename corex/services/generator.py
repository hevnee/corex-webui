from ollama import AsyncClient
from .web_search import search
from .database import update_assistant_message


async def text_generation(
    chat_id: str,
    model: str,
    chat_history: list[tuple[str]],
    system_msg: str | None = None,
    web_search: bool = False,
    agent: bool = False
):
    try:
        client = AsyncClient()
        message = chat_history[-1][1]
        results = None

        if web_search:
            if agent:
                response = await client.generate(
                    model=model,
                    prompt=message,
                    system="You are an AI Agent for writing Google queries. Write a clean query for the user to search the internet.",
                    think=False
                )
                message = response.response
            results = search(message)

        messages = []
        if system_msg:
            messages.append({"role": "system", "content": system_msg})
        
        messages += [{"role": r, "content": c} for r,c in chat_history]
        
        if results:
            messages.append({"role": "user", "type": "search", "content": f"Search results: {results}"})
        
        async for chunk in await client.chat(
            model=model,
            messages=messages,
            stream=True,
        ):
            message = chunk.message.content
            yield message
            update_assistant_message(chat_id, message)

    except Exception as e:
        yield f"ERROR: {e}"
        update_assistant_message(chat_id, f"ERROR: {e}")