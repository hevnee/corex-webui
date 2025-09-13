from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import RedirectResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from .config import STATIC_DIR, TEMPLATES_DIR
from .services.generator import text_generation
from .services.database import *
from .schemas import *
import uuid
import ollama
import asyncio


app = FastAPI()
app.mount(path="/static", app=StaticFiles(directory=STATIC_DIR), name="static")
templates = Jinja2Templates(directory=TEMPLATES_DIR)

@app.get("/")
async def home_page(request: Request):
    return templates.TemplateResponse(request=request, name="index.html")

@app.get("/chat/{id}")
async def home_page(id: str, request: Request):
    chats = get_chats()
    for chat in chats:
        if id in chat:
            return templates.TemplateResponse(request=request, name="index.html")
    return RedirectResponse("/")

api = FastAPI()

@api.post("/assistant_typing")
async def api_assistant_typing(data: ChatRequest):
    chat_history = get_chat_history(data.id)
    insert_assistant_message(data.id)
    return StreamingResponse(text_generation(
        chat_id=data.id,
        model=data.model,
        chat_history=chat_history,
        web_search=data.search
    ), media_type="text/event-stream")

@api.post("/create_chat")
async def api_create_chat(data: CreateChatData):
    chat_id = str(uuid.uuid4())
    chat_create(chat_id, data.name, data.message)
    return chat_id

@api.patch("/rename_chat")
async def api_rename_chat(data: RenameChatData):
    chat_rename(data.id, data.name)
    return {"id": data.id, "name": data.name}

@api.delete("/delete_chat/{id}")
async def api_delete_chat(id: str):
    chat_delete(id)
    return {"id": id}

@api.post("/insert_user_message")
async def api_insert_user_message(data: InsertUserMessageData):
    insert_user_message(data.id, data.message)
    return {"id": data.id, "message": data.message}

@api.get("/get_chat_history/{id}")
async def api_get_chat_history(id: str):
    chat_history = get_chat_history(id)
    return [{"role": r, "content": c} for r,c in chat_history]

@api.get("/get_chats")
async def api_get_chats():
    chats = get_chats()
    return chats

@api.get("/get_chat_title/{id}")
async def api_get_chat_title(id: str):
    title = get_chat_title(id)
    return title

@api.get("/get_models")
async def api_get_models():
    loop = asyncio.get_event_loop()
    try:
        models_list = await loop.run_in_executor(None, ollama.list)
        models = [model["model"] for model in models_list.models]
        return models
    except Exception as e:
        return f"ERROR: {e}"


async def not_found(request: Request, exc: HTTPException):
    return RedirectResponse("/")

app.add_exception_handler(exc_class_or_status_code=404, handler=not_found)
api.add_exception_handler(exc_class_or_status_code=404, handler=not_found)
app.mount(path="/api", app=api)