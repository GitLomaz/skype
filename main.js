import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  limit
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let username = "";
let unreadCount = 0;
let replyToMessage = null;
let pendingImages = [];
let renderedMessageIds = new Set();
const originalTitle = document.title;

function getUsernameFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get("username") || "Kyle K";
}

function getConversationIdFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get("conversation") || "default-chat";
}

function safeName(name) {
  const s = String(name || "").trim();
  return s ? s.slice(0, 40) : "Anonymous";
}

function getMessagesCollection() {
  const conversationId = getConversationIdFromQuery();
  return collection(db, `conversations/${conversationId}/messages`);
}

async function emitChatMessage({ message, replyTo, images }) {
  const cleanMessage = String(message || "").trim();

  if (!cleanMessage && (!images || images.length === 0)) return;

  await addDoc(getMessagesCollection(), {
    username,
    message: cleanMessage,
    replyTo: replyTo || null,
    images: images || [],
    timestamp: serverTimestamp()
  });
}

function subscribeToChat() {
  const q = query(
    getMessagesCollection(),
    orderBy("timestamp", "asc"),
    limit(200)
  );

  onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type !== "added") return;

      const doc = change.doc;
      if (renderedMessageIds.has(doc.id)) return;
      renderedMessageIds.add(doc.id);

      const data = doc.data();
      displayMessage(doc.id, data.username, {
        message: data.message || "",
        replyTo: data.replyTo || null,
        images: data.images || []
      }, data.timestamp);
    });
  }, (error) => {
    console.error("Firestore listener error:", error);
    displaySystemMessage("⚠️ Firestore error: " + error.message);
  });
}

function initChat(autoUsername) {
  username = safeName(autoUsername);
  setupUI();
  subscribeToChat();
}

function setupUI() {
  setupImageModal();

  const messageInput = document.getElementById("messageInput");
  const form = document.getElementById("messageForm");

  function autoResize() {
    messageInput.style.height = "auto";
    messageInput.style.height = messageInput.scrollHeight + "px";
  }

  async function submitCurrentMessage() {
    const message = messageInput.value.trim();

    if (message !== "" || pendingImages.length > 0) {
      try {
        await emitChatMessage({
          message,
          replyTo: replyToMessage ? serializeReplyMessage(replyToMessage) : null,
          images: pendingImages.length > 0 ? [...pendingImages] : []
        });

        messageInput.value = "";
        messageInput.style.height = "46px";
        clearReplyBanner();
        clearPendingImages();
      } catch (error) {
        console.error("Send failed:", error);
        displaySystemMessage("⚠️ Send failed: " + error.message);
      }
    }
  }

  messageInput.addEventListener("input", autoResize);

  messageInput.addEventListener("keydown", async (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      await submitCurrentMessage();
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    await submitCurrentMessage();
  });

  autoResize();
}

function serializeReplyMessage(messageObj) {
  if (typeof messageObj === "string") return messageObj;

  if (messageObj && messageObj.images && messageObj.images.length > 0) {
    return {
      message: messageObj.message || "[Image]",
      images: messageObj.images
    };
  }

  return (messageObj && messageObj.message) || "";
}

function setupImageModal() {
  const modal = document.getElementById("imageModal");
  const imageBtn = document.getElementById("imageBtn");
  const closeModal = document.getElementById("closeModal");
  const cancelImageBtn = document.getElementById("cancelImageBtn");
  const sendImageBtn = document.getElementById("sendImageBtn");
  const dropZone = document.getElementById("imageDropZone");

  const handleModalPaste = (e) => {
    if (modal.style.display === "flex") {
      e.preventDefault();
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          handleImageFile(items[i].getAsFile());
        }
      }
    }
  };

  const handleGlobalPaste = (e) => {
    if (modal.style.display !== "flex") {
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          e.preventDefault();
          modal.style.display = "flex";
          dropZone.focus();
          handleImageFile(items[i].getAsFile());
          break;
        }
      }
    }
  };

  document.addEventListener("paste", handleGlobalPaste);

  imageBtn.addEventListener("click", (e) => {
    e.preventDefault();
    modal.style.display = "flex";
    dropZone.focus();

    document.removeEventListener("paste", handleModalPaste);
    document.addEventListener("paste", handleModalPaste);
  });

  function close() {
    modal.style.display = "none";
    clearImageModal();
    document.removeEventListener("paste", handleModalPaste);
  }

  closeModal.addEventListener("click", close);
  cancelImageBtn.addEventListener("click", close);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });

  sendImageBtn.addEventListener("click", async () => {
    if (pendingImages.length > 0) {
      const messageInput = document.getElementById("messageInput");
      const message = messageInput.value.trim();

      try {
        await emitChatMessage({
          message: message || "",
          replyTo: replyToMessage ? serializeReplyMessage(replyToMessage) : null,
          images: [...pendingImages]
        });

        messageInput.value = "";
        messageInput.style.height = "46px";
        clearReplyBanner();
        close();
      } catch (error) {
        console.error("Image send failed:", error);
        displaySystemMessage("⚠️ Image send failed: " + error.message);
      }
    }
  });

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add("drag-over");
  });

  dropZone.addEventListener("dragleave", (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove("drag-over");
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove("drag-over");
    const files = e.dataTransfer.files;
    for (let i = 0; i < files.length; i++) {
      if (files[i].type.indexOf("image") !== -1) {
        handleImageFile(files[i]);
        break;
      }
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && modal.style.display === "flex" && pendingImages.length > 0) {
      e.preventDefault();
      sendImageBtn.click();
    }
  });
}

function handleImageFile(blob) {
  const maxSize = 700 * 1024;
  if (blob.size > maxSize) {
    alert(
      `Image is too large (${(blob.size / 1024 / 1024).toFixed(1)}MB). Keep it under about 0.7MB for Firestore.`
    );
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const base64 = e.target.result;
    const base64Data = base64.split(",")[1];
    const mimeType = blob.type || "image/png";

    pendingImages.push({
      data: base64Data,
      mimeType: mimeType
    });

    const previewDiv = document.getElementById("imagePreview");
    const img = document.createElement("img");
    img.src = base64;
    previewDiv.appendChild(img);

    document.getElementById("sendImageBtn").disabled = false;
  };
  reader.onerror = (e) => {
    alert("Error reading file: " + e.target.error);
  };
  reader.readAsDataURL(blob);
}

function clearImageModal() {
  const dropZone = document.getElementById("imageDropZone");
  const previewDiv = document.getElementById("imagePreview");
  const sendImageBtn = document.getElementById("sendImageBtn");

  dropZone.classList.remove("drag-over");
  previewDiv.innerHTML = "";
  pendingImages = [];
  sendImageBtn.disabled = true;
}

function clearPendingImages() {
  pendingImages = [];
  document.getElementById("imagePreview").innerHTML = "";
  document.getElementById("sendImageBtn").disabled = true;
}

function showReplyBanner(messageObj) {
  const banner = document.getElementById("replyBanner");

  let content = "";

  if (messageObj.images && messageObj.images.length > 0) {
    const img = messageObj.images[0];
    const imgSrc = `data:${img.mimeType};base64,${img.data}`;
    const textLabel = messageObj.message ? messageObj.message.slice(0, 40) : "Image";
    content = `
      <span style="display: flex; align-items: center; gap: 8px;">
        Replying to:
        <img src="${imgSrc}" alt="Image reply" style="max-width: 40px; max-height: 40px; border-radius: 4px; border: 1px solid #666;">
        <span style="font-size: 0.9em; color: #aaa;">${escapeHTML(textLabel)}</span>
      </span>
    `;
  } else {
    const text = typeof messageObj === "string" ? messageObj : (messageObj.message || "");
    content = `<span>Replying to: "${escapeHTML(text.slice(0, 80))}${text.length > 80 ? "..." : ""}"</span>`;
  }

  banner.innerHTML = `
    ${content}
    <button id="cancelReplyBtn" type="button" style="
      margin-left: 10px;
      background: transparent;
      border: none;
      color: #ccc;
      font-size: 1em;
      cursor: pointer;
    " title="Cancel reply">✕</button>
  `;

  banner.style.display = "flex";

  requestAnimationFrame(() => {
    const cancelBtn = document.getElementById("cancelReplyBtn");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        clearReplyBanner();
      });
    }
  });
}

function clearReplyBanner() {
  replyToMessage = null;
  const banner = document.getElementById("replyBanner");
  banner.style.display = "none";
  banner.innerHTML = "";
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function parseMarkdown(str) {
  const escaped = escapeHTML(str);
  const withNewlines = escaped.replace(/\n/g, "<br>");
  const withBold = withNewlines.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  const withItalic = withBold.replace(/\*(.*?)\*/g, "<em>$1</em>");
  return withItalic;
}

function linkify(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
}

function displayMessage(id, sender, message, timestamp) {
  const messagesDiv = document.getElementById("messages");
  const messageElement = document.createElement("div");
  messageElement.className = "message";
  messageElement.dataset.id = id;

  if (sender === username) {
    messageElement.classList.add("self");
  } else {
    const sound = document.getElementById("message-sound");
    if (sound) {
      sound.play().catch(() => {});
    }
  }

  const timeStr = timestamp?.toDate ? timestamp.toDate().toLocaleTimeString() : "";

  let replyHtml = "";
  if (typeof message === "object" && message.replyTo) {
    const replyData = message.replyTo;

    if (typeof replyData === "object" && replyData.images && replyData.images.length > 0) {
      const img = replyData.images[0];
      const imgSrc = `data:${img.mimeType};base64,${img.data}`;
      const textLabel = replyData.message ? replyData.message.slice(0, 30) : "Image";
      replyHtml = `
        <div class="reply-preview">
          ↳ <img src="${imgSrc}" alt="Replied Image" style="max-width: 60px; max-height: 60px; border-radius: 6px; vertical-align: middle; margin-right: 6px;">
          <span style="font-size: 0.85em; color: #999;">${escapeHTML(textLabel)}</span>
        </div>
      `;
    } else {
      const replyText = typeof replyData === "string" ? replyData : replyData.message || "";
      const isReplyImageUrl =
        /\.(png|jpe?g|gif|webp|svg)$/i.test(replyText.trim()) || replyText.trim().startsWith("data:image/");

      if (isReplyImageUrl) {
        replyHtml = `
          <div class="reply-preview">
            ↳ <img src="${replyText}" alt="Replied Image" style="max-width: 60px; max-height: 60px; border-radius: 6px; vertical-align: middle;">
          </div>
        `;
      } else {
        replyHtml = `<div class="reply-preview">↳ ${escapeHTML(replyText.slice(0, 80))}</div>`;
      }
    }
  }

  const messageText = typeof message === "object" ? (message.message || "") : message;
  const images = typeof message === "object" && message.images ? message.images : [];

  const isImageUrl =
    messageText &&
    messageText.trim() !== "" &&
    (/\.(png|jpe?g|gif|webp|svg)$/i.test(messageText.trim()) || messageText.trim().startsWith("data:image/"));

  let messageBody = "";
  if (replyHtml) messageBody += replyHtml;

  if (messageText && messageText.trim() !== "" && !isImageUrl) {
    messageBody += linkify(parseMarkdown(messageText));
  }

  if (images && images.length > 0) {
    images.forEach((img) => {
      const imgSrc = `data:${img.mimeType};base64,${img.data}`;
      messageBody += `<img src="${imgSrc}" alt="Sent Image" style="max-width:100%; border-radius:10px; margin-top:5px; cursor:pointer;">`;
    });
  } else if (isImageUrl) {
    messageBody += `<img src="${messageText}" alt="Image" style="max-width:100%; border-radius:10px; margin-top:5px; cursor:pointer;">`;
  }

  messageElement.innerHTML = `
    <span class="username">
      ${escapeHTML(sender)}
      <small style="font-weight: normal; font-size: 0.8em; color: #666;">${timeStr}</small>
    </span>
    ${messageBody}
    <button class="reply-btn" title="Reply">↩</button>
  `;

  messageElement.style.position = "relative";
  messagesDiv.appendChild(messageElement);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  if (document.hidden && sender !== username) {
    unreadCount++;
    document.title = `(${unreadCount}) ${originalTitle}`;
  }

  const replyBtn = messageElement.querySelector(".reply-btn");
  if (replyBtn) {
    replyBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const messageObj = typeof message === "object" ? message : { message };
      replyToMessage = messageObj;
      showReplyBanner(messageObj);

      requestAnimationFrame(() => {
        const input = document.getElementById("messageInput");
        if (input) input.focus();
      });
    });
  }
}

function displaySystemMessage(message) {
  const messagesDiv = document.getElementById("messages");
  const messageElement = document.createElement("div");
  messageElement.className = "message system";
  messageElement.textContent = message;
  messagesDiv.appendChild(messageElement);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    unreadCount = 0;
    document.title = originalTitle;
  }
});

document.addEventListener("click", (e) => {
  const target = e.target;
  if (target.tagName === "IMG" && target.closest(".message")) {
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightbox-img");
    lightboxImg.src = target.src;
    lightbox.style.display = "flex";
  } else if (e.target.id === "lightbox" || e.target.id === "lightbox-img") {
    document.getElementById("lightbox").style.display = "none";
    document.getElementById("lightbox-img").src = "";
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const lightbox = document.getElementById("lightbox");
    if (lightbox.style.display === "flex") {
      lightbox.style.display = "none";
      document.getElementById("lightbox-img").src = "";
    }
  }
});

initChat(getUsernameFromQuery());