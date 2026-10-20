"use strict";

// 接続を作成して開始します。
const connection = new signalR.HubConnectionBuilder()
    .withUrl("/chatHub")
    .withAutomaticReconnect()
    .build();

const sendButton = document.getElementById("sendButton");

// 接続が確立するまで送信ボタンを無効にします。
sendButton.disabled = true;

// ハブからメッセージを受信したときのイベントです。
// メッセージをリストに追加します。
connection.on("ReceiveMessage", (user, message) => {
    const li = document.createElement("li");
    // textContent はマークアップとして解釈されないため、ユーザ入力をそのまま代入できます。
    li.textContent = `${user} says ${message}`;
    document.getElementById("messagesList").appendChild(li);
});

connection.onreconnecting(() => {
    sendButton.disabled = true;
});

connection.onreconnected(() => {
    sendButton.disabled = false;
});

connection.start().then(() => {
    sendButton.disabled = false;
}).catch((err) => console.error(err.toString()));

// ハンドラーをフォームの送信 (送信ボタンまたは Enter キー) に追加します。
// このハンドラーはハブにメッセージを送信します。
document.getElementById("chatForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const user = document.getElementById("userInput").value;
    const messageInput = document.getElementById("messageInput");
    connection.invoke("SendMessage", user, messageInput.value).then(() => {
        messageInput.value = "";
    }).catch((err) => {
        console.error(err.toString());
        alert(err.message);
    });
});
