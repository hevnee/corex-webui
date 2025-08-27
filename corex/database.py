import sqlite3
import time
import os
from .config import DATA_DIR

os.makedirs(DATA_DIR, exist_ok=True)
file_name = f"{DATA_DIR}/data.db"

def create_db():
    database = sqlite3.connect(file_name)
    database.execute("""
        CREATE TABLE IF NOT EXISTS chats (
            id TEXT PRIMARY KEY,
            name TEXT,
            last_iteraction INTEGER
        )"""
    )
    database.execute("""
        CREATE TABLE IF NOT EXISTS chat_history (
            id TEXT REFERENCES chats(id),
            message_order INTEGER,
            role TEXT,
            content TEXT
        )"""
    )
    database.commit()
    database.close()
create_db()

def chat_create(id: str, name: str, message: str) -> None:
    database = sqlite3.connect(file_name)
    database.execute("""INSERT OR IGNORE INTO chats VALUES (?, ?, ?)""", (id, name, time.time()))
    database.execute("INSERT OR IGNORE INTO chat_history VALUES (?, ?, ?, ?)", (id, 1, "user", message))
    database.commit()
    return database.close()

def insert_user_message(id: str, message: str) -> None:
    database = sqlite3.connect(file_name)
    message_order = database.execute("SELECT message_order FROM chat_history WHERE id = ? ORDER BY message_order DESC", (id,)).fetchone()[0]
    database.execute("INSERT OR IGNORE INTO chat_history VALUES (?, ?, ?, ?)", (id, message_order + 1, "user", message))
    database.execute("UPDATE chats SET last_iteraction = ? WHERE id = ?", (time.time(), id))
    database.commit()
    return database.close()

def insert_assistant_message(id: str) -> None:
    database = sqlite3.connect(file_name)
    message_order = database.execute("SELECT message_order FROM chat_history WHERE id = ? ORDER BY message_order DESC", (id,)).fetchone()[0]
    database.execute("INSERT OR IGNORE INTO chat_history VALUES (?, ?, ?, ?)", (id, message_order + 1, "assistant", ""))
    database.execute("UPDATE chats SET last_iteraction = ? WHERE id = ?", (time.time(), id))
    database.commit()
    return database.close()

def update_assistant_message(id: str, message: str) -> None:
    database = sqlite3.connect(file_name)
    message_order = database.execute("SELECT message_order FROM chat_history WHERE id = ? AND role = ? ORDER BY message_order DESC", (id, "assistant")).fetchone()[0]
    content = database.execute("SELECT content FROM chat_history WHERE id = ? AND message_order = ?", (id, message_order)).fetchone()[0]
    database.execute("UPDATE chat_history SET content = ? WHERE id = ? AND message_order = ?", (content+message, id, message_order))
    database.commit()
    return database.close()

def chat_rename(id: str, name: str) -> None:
    database = sqlite3.connect(file_name)
    database.execute("UPDATE chats SET name = ? WHERE id = ?", (name, id))
    database.commit()
    return database.close()

def chat_delete(id: str) -> None:
    database = sqlite3.connect(file_name)
    database.execute("DELETE FROM chats WHERE id = ?", (id,))
    database.execute("DELETE FROM chat_history WHERE id = ?", (id,))
    database.commit()
    return database.close()

def get_chats() -> list[tuple[str]]:
    database = sqlite3.connect(file_name)
    chats = database.execute("SELECT id, name FROM chats ORDER BY last_iteraction DESC").fetchall()
    database.close()
    return chats

def get_chat_history(id: str) -> list[tuple[str]]:
    database = sqlite3.connect(file_name)
    chat_history = database.execute("SELECT role, content FROM chat_history WHERE id = ? ORDER BY message_order ASC", (id,)).fetchall()
    database.close()
    return chat_history

def get_chat_title(id: str) -> str:
    database = sqlite3.connect(file_name)
    title = database.execute("SELECT name FROM chats WHERE id = ?", (id,)).fetchone()[0]
    database.close()
    return title