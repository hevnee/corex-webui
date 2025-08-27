from pydantic import BaseModel

class CreateChatData(BaseModel):
    name: str
    message: str

class RenameChatData(BaseModel):
    id: str
    name: str

class InsertUserMessageData(BaseModel):
    id: str
    message: str

class ChatRequest(BaseModel):
    id: str