'use strict';

// Initialize HTML Collection documents
let usernamePage = document.getElementById("username-page");
let chatPage = document.getElementById("chat-page");
let usernameForm = document.getElementById("usernameForm");
let messageForm = document.getElementById("messageForm");
let messageInput = document.getElementById("message");
let messageArea = document.getElementById("messageArea");
let connectingElement = document.querySelector(".connecting");

let stompClient = null;
let username = null;

let colours = [
    '#1e95f3', '#30c987', '#01b7ce', '#fd5551',
    '#fdc007', '#fd84ae', '#fc9702', '#3ab4aa',
];

function connect(event) {
    username = document.getElementById("name").value.trim();
    if (username) {
        usernamePage.classList.add("hidden");
        chatPage.classList.remove("hidden");

        let socket = new SockJS("/ws")
        stompClient = Stomp.over(socket);

        stompClient.connect({}, onConnect, onError);
    }
    event.preventDefault();
}

function onConnect() {
    // Subscribe to the public topic
    stompClient.subscribe("/topic/public", onMessageReceived);

    // Tell the server what the username is
    stompClient.send("/app/chat.addUser",
        {},
        JSON.stringify({ sender: username, type: "JOIN" })
    );
    connectingElement.classList.add("hidden");
}

function onError() {
    connectingElement.textContent = "Could not connect to WebSocket server. Please refresh and try again.";
    connectingElement.style.color = "red";
}

function onMessageReceived(payload) {
    let message = JSON.parse(payload.body);

    let messageHTML = document.createElement("li");

    if (message.type === "JOIN") {
        messageHTML.classList.add("event-message");
        message.content = message.sender + " joined!";
    } else if (message.type === "LEAVER") {
        messageHTML.classList.add("event-message");
        message.content = message.sender + " left!";
    } else {
        messageHTML.classList.add("chat-message");

        let avatarHTML = document.createElement("i");
        let avatarText = document.createTextNode(message.sender[0]);
        avatarHTML.appendChild(avatarText);
        avatarHTML.style["background-color"] = getAvatarColor(message.sender);

        messageHTML.appendChild(avatarHTML);

        let usernameHTML = document.createElement("span");
        let usernameText = document.createTextNode(message.sender);
        usernameHTML.appendChild(usernameText);
        messageHTML.appendChild(usernameHTML);
    }

    let textHTML = document.createElement("p");
    let messageText = document.createTextNode(message.content);
    textHTML.append(messageText);

    messageHTML.appendChild(textHTML);

    messageArea.appendChild(messageHTML);
    messageArea.scrollTop = messageArea.scrollHeight;
}

function sendMessage(event) {
    //
    let messageContent = messageInput.value.trim();

    if (messageContent && stompClient) {
        let chatMessage = {
            sender: username,
            content: messageContent,
            type: "CHAT"
        };
        stompClient.send(
            "/app/chat.sendMessage",
            {},
            JSON.stringify(chatMessage)
        );
        messageInput.value = "";
    }
    event.preventDefault();
}

function getAvatarColor(messageSender) {
    let hash = 0;
    for (let i = 0; i < messageSender.length; i++) {
        hash = 31 * hash + messageSender.charCodeAt(i);
    }
    let index = Math.abs(hash % colours.length);
    return colours[index];
}

// When a user submits a new username
usernameForm.addEventListener("submit", connect, true);
messageForm.addEventListener("submit", sendMessage, true);

