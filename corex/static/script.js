window.addEventListener("load", () => {
    document.body.classList.replace("unloaded", "loaded");
});

const SIDEBAR_SMALL = "52px";
const SIDEBAR_NORMAL = "260px";
const root = document.documentElement;
const sidebarResizeButton = document.getElementById("hide-sidebar-button");
const sidebarResizeSVG = document.getElementById("hide-sidebar-svg");
const newChatSpan = document.getElementById("new-chat-span");
const CorexButton = document.getElementById("corex-button");
const sidebarChats = document.getElementById("sidebar-chats");
const chatsContainer = document.querySelector(".sidebar-chats-content");
const settingsButton = document.getElementById("settings-button");
const chatContextMenu = document.getElementById("chat-context-menu");
const renameChatsButton = document.getElementById("rename-button");
const deleteChatsButton = document.getElementById("delete-button");
const newChatButton = document.getElementById("new-chat");
const textarea = document.getElementById("textarea-field");
const sendButton = document.getElementById("send-button");
const stopButton = document.getElementById("stop-button");
const chatContainer = document.getElementById("chat-messages");

let sidebarWidth = localStorage.getItem("sidebar-width") || SIDEBAR_NORMAL;
root.style.setProperty("--sidebar-width", sidebarWidth);

let chatMenuTarget = null;
let sidebarChatButtonTarget = null;
let activeRenameInput = null;
let controller;

function smoothScrollToBottom() {
    window.scrollTo({
        top: chatContainer.scrollHeight,
        behavior: 'smooth'
    });
};

function updateSidebarState(isCollapsed) {
    const newWidth = isCollapsed ? SIDEBAR_SMALL : SIDEBAR_NORMAL;
    root.style.setProperty("--sidebar-width", newWidth);
    localStorage.setItem("sidebar-width", newWidth);
    const opacity = isCollapsed ? "0" : "1";
    const pointerEvents = isCollapsed ? "none" : "all";
    [newChatSpan, sidebarChats, CorexButton].forEach(el => {
        if (!el) return;
        el.style.opacity = opacity;
        el.style.pointerEvents = pointerEvents;
    });
    if (sidebarResizeSVG) sidebarResizeSVG.style.transform = isCollapsed ? "rotate(0deg)" : "rotate(180deg)";
    if (sidebarChats) sidebarChats.style.overflowY = isCollapsed ? "hidden" : "auto";
    if (newChatSpan) newChatSpan.innerHTML = isCollapsed ? "" : "New chat";
};

function toggleSidebar() {
    const currentWidth = getComputedStyle(root).getPropertyValue("--sidebar-width").trim();
    updateSidebarState(currentWidth === SIDEBAR_NORMAL);
};

function handleWindowResize() {
    const shouldCollapse = window.innerWidth <= 800;
    root.style.setProperty(
        "--sidebar-width",
        shouldCollapse ? "0px" : localStorage.getItem("sidebar-width") || SIDEBAR_NORMAL
    );
};

function checkEmptyChats() {
    if (!chatsContainer.querySelector(".sidebar-chats-button")) {
        let label = chatsContainer.querySelector(".no-chat-label");
        if (!label) {
            label = document.createElement("label");
            label.className = "no-chat-label";
            label.textContent = "No chat history";
            chatsContainer.appendChild(label);
        };
    } else {
        const label = chatsContainer.querySelector(".no-chat-label");
        if (label) label.remove();
    }
}

function menuChatsButtonFunc() {
    document.querySelectorAll(".sidebar-chats-menu-button").forEach(chatButton => {
        chatButton.addEventListener("click", e => {
            e.stopPropagation();
            const isSameTarget = chatMenuTarget === chatButton;
            const isMenuOpen = chatContextMenu.style.display === "flex";
            if (isMenuOpen && isSameTarget) {
                chatContextMenu.style.display = "none";
                chatMenuTarget = null;
                return;
            };
            chatContextMenu.style.display = "flex";
            chatContextMenu.style.top = `${chatButton.getBoundingClientRect().top + 28}px`;
            chatContextMenu.style.left = `${chatButton.getBoundingClientRect().left - chatContextMenu.offsetWidth + chatButton.offsetWidth}px`;
            chatMenuTarget = chatButton;
        });
    });

    document.addEventListener("click", e => {
        if (!chatContextMenu.contains(e.target)) {
            chatContextMenu.style.display = "none";
            chatMenuTarget = null;
        }
    });

    renameChatsButton.addEventListener("click", () => {
        chatContextMenu.style.display = "none";
        const chatBlock = chatMenuTarget.closest(".sidebar-chats-button");
        const chatButton = chatBlock.querySelector(".sidebar-chats-a-button");
        const chatSpan = chatButton.querySelector(".sidebar-chats-span");
        const chatId = chatButton.dataset.chatId;
        const currentName = chatSpan.textContent;
        const input = document.createElement("input");
        input.type = "text";
        input.className = "rename-input";
        input.maxLength = 36;
        input.value = currentName;
        chatSpan.replaceWith(input);
        input.focus();
        input.select();
        let renamed = false;
        const finalizeRename = () => {
            if (renamed) return;
            renamed = true;
            input.replaceWith(chatSpan);
            input.remove();
        };
        input.addEventListener("keydown", e => {
            if (e.key === "Enter") {
                const chatName = input.value;
                chatSpan.textContent = chatName;
                finalizeRename();
                chatRenameDB(chatId, chatName);
                document.title = chatName;
            } else if (e.key === "Escape") {
                finalizeRename();
            }
        });
        input.addEventListener("blur", () => {
            finalizeRename();
        });
        chatMenuTarget = null;
    });

    deleteChatsButton.addEventListener("click", () => {
        const chatBlock = chatMenuTarget?.closest(".sidebar-chats-button");
        if (!chatMenuTarget || !chatBlock) return;
        const chatButton = chatBlock.querySelector(".sidebar-chats-a-button");
        const chatId = chatButton.dataset.chatId;
        if (window.location.pathname === `/chat/${chatId}`) {
            history.replaceState(null, "", "/");
            chatContainer.innerHTML = "";
            renderChat("/");
        }
        chatDeleteDB(chatId);
        chatBlock.remove();
        checkEmptyChats();
        chatContextMenu.style.display = "none";
        chatMenuTarget = null;
    });

    document.querySelectorAll(".sidebar-chats-a-button").forEach(sidebarChatButton => {
        sidebarChatButton.addEventListener("click", () => {
            const chatId = sidebarChatButton.dataset.chatId;
            if (chatId === window.location.pathname.split("/")[2]) return;
            history.replaceState(null, "", `/chat/${chatId}`);
            renderChat(chatId);
        });
    });
}

settingsButton.addEventListener("click", () => {
    alert("This button is currently under development...");
});

newChatButton.addEventListener("click", () => {
    history.replaceState(null, "", "/");
    chatMenuTarget = null;
    renderChat("/");
});

CorexButton.addEventListener("click", () => {
    history.replaceState(null, "", "/");
    chatMenuTarget = null;
    renderChat("/");
});

textarea.addEventListener("input", () => {
    const textareaFill = textarea.value.trim().length > 0;
    sendButton.disabled = textareaFill ? false : true;
});

textarea.addEventListener("blur", () => {
    const textareaFill = textarea.value.trim().length > 0;
    sendButton.disabled = textareaFill ? false : true;
});

textarea.addEventListener("focus", () => {
    const textareaFill = textarea.value.trim().length > 0;
    sendButton.disabled = textareaFill ? false : true;
});

textarea.addEventListener("keydown", function(e) {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendButton.click();
    }
});

sendButton.addEventListener("click", async (e) => {
    if (stopButton.style.display === "flex") return;
    const message = textarea.value;
    textarea.value = "";
    sendButton.disabled = true;
    if (window.location.pathname === "/") {
        const chatName = message.trim().slice(0, 36);
        const chatId = await chatCreateDB(chatName, message);
        history.replaceState(null, "", `/chat/${chatId}`);
        await renderChat(chatId);
        await sidebarChatsContainer();
        controller = new AbortController();
        insertAssistantMessageDB(chatId, message);
        return;
    }
    const chatId = window.location.pathname.split("/")[2];
    await insertUserMessageDB(chatId, message);
    controller = new AbortController();
    insertAssistantMessageDB(chatId, message);
});

stopButton.addEventListener("click", () => {
    if (controller) controller.abort();
});

async function getChatsDB() {
    const response = await fetch("/api/get_chats", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });
    return await response.json();
}

async function chatCreateDB(chatName, message) {
    const response = await fetch("/api/create_chat", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({name: chatName, message: message})
    });
    return await response.json();
}

async function chatRenameDB(chatId, chatName) {
    const response = await fetch("/api/rename_chat", {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({id: chatId, name: chatName})
    });
    return await response.json().catch(() => {});
}

async function chatDeleteDB(chatId) {
    const response = await fetch(`/api/delete_chat/${chatId}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        },
    });
    return await response.json().catch(() => {});
}

async function getChatTitleDB(chatId) {
    const response = await fetch(`/api/get_chat_title/${chatId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });
    return await response.json();
}

async function getChatHistoryDB(chatId) {
    const response = await fetch(`/api/get_chat_history/${chatId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });
    return await response.json();
}

async function insertAssistantMessageDB(chatId, message) {
    sendButton.style.display = "none";
    stopButton.style.display = "flex";
    const assistant_div = document.createElement("div");
    assistant_div.className = "chat-assistant-message";
    assistant_div.style.whiteSpace = "pre-wrap";
    chatContainer.appendChild(assistant_div);
    const loader = document.createElement("div");
    loader.className = "loader";
    assistant_div.appendChild(loader);
    smoothScrollToBottom();
    try {
        await new Promise(res => setTimeout(res, 300));
        const response = await fetch(`/api/assistant_typing/${chatId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            signal: controller?.signal
        });
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        loader.remove();
        assistant_div.textContent = "";
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            assistant_div.textContent += decoder.decode(value, { stream: true });
        }
    } catch (err) {
        if (err?.name !== "AbortError") console.error(err);
    } finally {
        sendButton.style.display = "flex";
        stopButton.style.display = "none";
    }
}

async function insertUserMessageDB(chatId, message) {
    const response = await fetch("/api/insert_user_message", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ id: chatId, message: message })
    });
    const assistant_div = document.createElement("div");
    assistant_div.className = "chat-user-message";
    assistant_div.style.whiteSpace = "pre-wrap";
    chatContainer.appendChild(assistant_div);
    assistant_div.textContent = message;
    smoothScrollToBottom();
    return await response.json().catch(() => {});
}

async function renderChat(chatId) {
    const newChatWrapper = document.getElementById("new-chat-wrapper");
    const chatTextareaHide = document.getElementById("chat-textarea-hide");
    const newChatContainer = document.getElementById("new-chat-container");
    const corexCentered = document.getElementById("corex-centered");
    newChatWrapper.style.display = "inline";
    chatContainer.innerHTML = "";
    if (chatId !== "/") {
        chatTextareaHide.style.display = "inline";
        newChatWrapper.className = "chat-textarea-wrapper";
        newChatContainer.className = "chat-textarea-container";
        corexCentered.style.display = "none";
        document.title = await getChatTitleDB(chatId);
        const chatHistory = await getChatHistoryDB(chatId);
        chatHistory.forEach(message => {
            const div = document.createElement("div");
            const isUser = message.role === "user" ? "chat-user-message" : "chat-assistant-message";
            div.className = isUser;
            div.style.whiteSpace = "pre-wrap";
            div.textContent = message.content;
            chatContainer.appendChild(div);
        });
        window.scrollTo({
            top: chatContainer.scrollHeight,
            behavior: "auto"
        });
    } else {
        chatTextareaHide.style.display = "none";
        newChatWrapper.className = "new-chat-wrapper";
        newChatContainer.className = "new-chat-container";
        corexCentered.style.display = "flex";
        document.title = "Corex";
    }
}

async function sidebarChatsContainer() {
    const sidebarChatsContent = document.getElementById("sidebar-chats-content");
    sidebarChatsContent.innerHTML = "";
    const chats = await getChatsDB();
    const fragment = document.createDocumentFragment();
    chats.forEach(chat => {
        const div = document.createElement("div");
        div.className = "sidebar-chats-button";
        div.innerHTML = `
            <button class="sidebar-chats-a-button" data-chat-id="${chat[0]}">
                <span class="sidebar-chats-span">${chat[1]}</span>
            </button>
            <button class="sidebar-chats-menu-button">
                <svg width="14" height="14" viewBox="0 0 512 512" fill="white">
                    <circle cx="60" cy="256" r="50"/>
                    <circle cx="256" cy="256" r="50"/>
                    <circle cx="452" cy="256" r="50"/>
                </svg>
            </button>
        `;
        fragment.appendChild(div);
    });
    sidebarChatsContent.appendChild(fragment);
    menuChatsButtonFunc();
    checkEmptyChats();
}

updateSidebarState(sidebarWidth === SIDEBAR_SMALL);
sidebarResizeButton.addEventListener("click", toggleSidebar);
window.addEventListener("resize", handleWindowResize);

if (window.location.pathname === "/") {
    renderChat("/");
} else {
    renderChat(window.location.pathname.split("/")[2]);
}

sidebarChatsContainer();