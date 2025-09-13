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
const chatWrapper = document.querySelector(".chat-wrapper");
const copyMessageSVG = `
    <svg width="16" height="16" viewBox="0 0 512 512" fill="white">
        <path d="m 241,4.9 c -61,-1 -119,44 -133,103 -62,15 -107,78 -103,141 0,45 -1,90 1,135 5,69 69,125 137,123 48,0 95,1 143,-1 56,-5 105,-48 118,-103 62,-14 107,-77 103,-140 0,-45 1,-90 -1,-135 C 501,58.9 437,2.9 369,4.9 c -43,0 -85,0 -128,0 z m 0,46 c 46,0 93,-1 139,0 48,3 86,50 81,97 0,44 1,89 -1,133 -3,31 -24,60 -53,72 -1,-43 1,-87 -1,-130 -7,-67 -71,-122 -138,-119 -37,0 -73,0 -110,0 14,-32 48,-54 83,-53 z m -99,99 c 46,0 93,-1 139,0 48,3 86,50 81,97 0,44 1,88 0,132 -3,48 -50,86 -97,81 -44,0 -88,1 -132,0 -48,-3 -86,-50 -81,-97 0,-44 -1,-88 0,-132 4,-45 45,-82 90,-81 z"/>
    </svg>
`

let sidebarWidth = localStorage.getItem("sidebarWidth") || SIDEBAR_NORMAL;
root.style.setProperty("--sidebar-width", sidebarWidth);

let chatMenuTarget = null;
let sidebarChatButtonTarget = null;
let activeRenameInput = null;
let controller;

function smoothScrollToBottom() {
    chatWrapper.scrollTo({
        top: chatContainer.scrollHeight,
        behavior: 'smooth'
    });
};

function updateSidebarState(isCollapsed) {
    const newWidth = isCollapsed ? SIDEBAR_SMALL : SIDEBAR_NORMAL;
    root.style.setProperty("--sidebar-width", newWidth);
    localStorage.setItem("sidebarWidth", newWidth);
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
        shouldCollapse ? "0px" : localStorage.getItem("sidebarWidth") || SIDEBAR_NORMAL
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

    document.addEventListener("click", async (e) => {
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

document.querySelector('.new-chat-textarea-container')
    .addEventListener('click', e => {
        if (e.target.closest('.textarea-left-buttons, .textarea-right-buttons')) return;
        document.getElementById('textarea-field').focus();
    });

sendButton.addEventListener("click", async (e) => {
    if (stopButton.style.display === "flex") return;
    const message = textarea.value;
    textarea.value = "";
    sendButton.disabled = true;
    const searchEnabled = localStorage.getItem("searchEnabled") === "true"
    if (window.location.pathname === "/") {
        const chatName = message.trim().slice(0, 36);
        const chatId = await chatCreateDB(chatName, message);
        history.replaceState(null, "", `/chat/${chatId}`);
        await renderChat(chatId);
        await sidebarChatsContainer();
        controller = new AbortController();
        insertAssistantMessage(chatId, searchEnabled);
        return;
    }
    const chatId = window.location.pathname.split("/")[2];
    await insertUserMessageDB(chatId, message);
    controller = new AbortController();
    insertAssistantMessage(chatId, searchEnabled);
});

stopButton.addEventListener("click", () => {
    if (controller) controller.abort();
});

let searchEnabled = localStorage.getItem("searchEnabled");
function checkSearch() {
    const searchSVG = document.getElementById("search-svg");
    if (searchEnabled === "true") {
        searchSVG.style.stroke = "#83b0f4";
        searchEnabled = "true";
    } else if (searchEnabled === "false") {
        searchSVG.style.stroke = "white";
        searchEnabled = "false";
    } else {
        localStorage.setItem("searchEnabled", "false");
    }
}

const searchButton = document.getElementById("search-button");
searchButton.addEventListener("click", () => {
    const searchSVG = document.getElementById("search-svg");
    searchButton.blur();
    if (searchEnabled === "true") {
        searchEnabled = "false";
        searchSVG.style.stroke = "white";
        localStorage.setItem("searchEnabled", "false");
    } else {
        searchEnabled = "true";
        searchSVG.style.stroke = "#83b0f4";
        localStorage.setItem("searchEnabled", "true");
    };
});

checkSearch();

async function getChatsDB() {
    const response = await fetch("/api/get_chats", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });
    return await response.json().catch(() => {});
}

async function getModelsDB() {
    const response = await fetch("/api/get_models", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });
    return await response.json().catch(() => {});
}

async function chatCreateDB(chatName, message) {
    const response = await fetch("/api/create_chat", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({name: chatName, message: message})
    });
    return await response.json().catch(() => {});
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

async function insertAssistantMessage(chatId, searchEnabled) {
    sendButton.style.display = "none";
    stopButton.style.display = "flex";
    
    const container = document.createElement("div");
    container.className = "chat-assistant-message-container";
    const assistant_div = document.createElement("div");
    assistant_div.className = "chat-message chat-assistant-message";
    assistant_div.style.whiteSpace = "pre-wrap";
    const buttons = document.createElement("div");
    buttons.className = "chat-message-buttons-container";
    container.appendChild(assistant_div);
    container.appendChild(buttons);
    chatContainer.appendChild(container);

    const loader = document.createElement("div");
    loader.className = "loader";
    assistant_div.appendChild(loader);
    smoothScrollToBottom();

    try {
        await new Promise(res => setTimeout(res, 300));
        let model = localStorage.getItem("selectedModel");
        if (model === null) {
            model = "Unknown";
        }
        const response = await fetch(`/api/assistant_typing`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({id: chatId, model: model, search: searchEnabled}),
            signal: controller?.signal
        });
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        
        let chatHeight = chatContainer.scrollHeight
        let load = false
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (!load) {
                if (value) {
                    assistant_div.innerHTML = "";
                    load = true;
                };
            };
            assistant_div.textContent += decoder.decode(value, { stream: true });
            if (chatHeight !== chatContainer.scrollHeight) {
                const isAtBottom = chatWrapper.scrollTop + chatWrapper.clientHeight >= chatWrapper.scrollHeight - 36;
                if (isAtBottom) {
                    chatWrapper.scrollTo({
                        top: chatContainer.scrollHeight,
                        behavior: 'instant'
                    });
                };
                chatHeight = chatContainer.scrollHeight;
            };
        };
    } catch (err) {
        if (err?.name !== "AbortError") console.error(err);
    } finally {
        loader.remove();
        sendButton.style.display = "flex";
        stopButton.style.display = "none";
        buttons.innerHTML = `
            <button class="chat-copy-message" data-tooltip="Copy">
                ${copyMessageSVG}
            </button>
        `;
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
    const container = document.createElement("div");
    container.className = "chat-user-message-container";

    const user_div = document.createElement("div");
    user_div.className = "chat-message chat-user-message";
    user_div.style.whiteSpace = "pre-wrap";
    user_div.textContent = message;

    const buttons = document.createElement("div");
    buttons.className = "chat-message-buttons-container";
    buttons.style.justifyContent = "end";
    buttons.innerHTML = `
        <button class="chat-copy-message" data-tooltip="Copy">
            ${copyMessageSVG}
        </button>
    `;

    container.appendChild(user_div);
    container.appendChild(buttons);
    chatContainer.appendChild(container);

    smoothScrollToBottom();
    return await response.json().catch(() => {});
}



chatContainer.addEventListener("click", async (e) => {
    if (e.target.classList.contains("chat-copy-message")) {
        const text = e.target.parentElement.parentElement.querySelector(".chat-message").textContent
        navigator.clipboard.writeText(text).then(() => {
            const svgCopied = `
                <svg width="16" height="16" viewBox="0 0 512 512" fill="white">
                    <path d="m 485.5,79.6 c -6.7,0 -13.6,2.6 -18.7,7.8 L 185.7,368.4 45.2,228 c -10.3,-10.3 -27,-10.3 -37.4,0.1 -10.4,10.4 -10.4,27.1 -0.1,37.4 L 166.9,424.7 c 5.8,5.8 13.7,8.4 21.3,7.7 5.9,-0.6 11.7,-3.2 16.2,-7.7 L 504.2,124.9 c 10.4,-10.4 10.4,-27.1 0,-37.5 -5.2,-5.2 -12,-7.8 -18.7,-7.8 z"/>
                </svg>
            `
            e.target.innerHTML = svgCopied
            setTimeout(() => {
                e.target.innerHTML = copyMessageSVG
            }, 1500);
        })
    }
})

async function renderChat(chatId) {
    const newChatWrapper = document.getElementById("new-chat-wrapper");
    const chatTextareaHide = document.getElementById("chat-textarea-hide");
    const newChatContainer = document.getElementById("new-chat-container");
    const corexCentered = document.querySelector(".centered-text");
    newChatWrapper.style.display = "inline";
    chatContainer.innerHTML = "";

    if (chatId !== "/") {
        chatContainer.style.display = "flex"
        chatTextareaHide.style.display = "inline";
        newChatWrapper.className = "chat-textarea-wrapper";
        newChatContainer.className = "chat-textarea-container";
        corexCentered.style.display = "none";
        const chatHistory = await getChatHistoryDB(chatId);
        document.title = await getChatTitleDB(chatId);

        chatHistory.forEach(message => {
            const div = document.createElement("div");
            const isUser = message.role === "user";
            const isUserMessage = isUser ? "chat-user-message" : "chat-assistant-message";
            const copyButtonPosition = isUser ? "justify-content: end;" : "justify-content: start;";

            div.className = isUser ? "chat-user-message-container" : "chat-assistant-message-container";

            const messageDiv = document.createElement("div");
            messageDiv.className = `chat-message ${isUserMessage}`;
            messageDiv.textContent = message.content;

            const buttonsContainer = document.createElement("div");
            buttonsContainer.className = "chat-message-buttons-container";
            buttonsContainer.style = copyButtonPosition;

            const copyButton = document.createElement("button");
            copyButton.className = "chat-copy-message";
            copyButton.setAttribute("data-tooltip", "Copy");
            copyButton.innerHTML = copyMessageSVG;

            buttonsContainer.appendChild(copyButton);
            div.appendChild(messageDiv);
            div.appendChild(buttonsContainer);

            div.style.whiteSpace = "pre-wrap";
            chatContainer.appendChild(div);
        });
        chatWrapper.scrollTo({
            top: chatContainer.scrollHeight,
            behavior: 'instant'
        });
    } else {
        chatContainer.style.display = "none"
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


let modelSelectorOpen = false;
const modelSelectorButton = document.getElementById("model-selector-button");
const modelSelectorContainer = document.getElementById("model-selector-container");

async function renderModels() {
    const models = await getModelsDB();
    modelSelectorContainer.innerHTML = "";

    if (!models || models.length === 0 || typeof(models) === "string") {
        const message = document.createElement("div");
        if (typeof(models) === "string") {
            message.textContent = models;
        } else {
            message.textContent = "You don't have any models";
        };
        message.style.padding = "5px 10px";
        modelSelectorContainer.appendChild(message);
        return;
    }

    const savedModel = localStorage.getItem("selectedModel") || "Unknown";

    models.forEach(model => {
        const btn = document.createElement("button");
        btn.className = "button" + (model === savedModel ? " active" : "");
        const span = document.createElement("span");
        span.className = "model-name";
        span.textContent = model;
        btn.appendChild(span);
        btn.addEventListener("click", () => {
            modelSelectorButton.querySelector(".model-name").textContent = model;
            modelSelectorContainer.querySelectorAll(".button").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            localStorage.setItem("selectedModel", model);
            modelSelectorContainer.style.display = "none";
            modelSelectorOpen = false;
        });
        modelSelectorContainer.appendChild(btn);
    });

    modelSelectorButton.querySelector(".model-name").textContent = savedModel;
}

modelSelectorButton.addEventListener("click", () => {
    modelSelectorOpen = !modelSelectorOpen;
    modelSelectorContainer.style.display = modelSelectorOpen ? "flex" : "none";
    if (modelSelectorOpen) renderModels();
});

document.addEventListener("click", e => {
    if (!modelSelectorContainer.contains(e.target) && !modelSelectorButton.contains(e.target)) {
        modelSelectorContainer.style.display = "none";
        modelSelectorOpen = false;
    }
});

renderModels();