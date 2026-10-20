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

// ハンドラーを送信ボタンに追加します。
// このハンドラーはハブにメッセージを送信します。
sendButton.addEventListener("click", (event) => {
    const user = document.getElementById("userInput").value;
    const message = document.getElementById("messageInput").value;
    connection.invoke("SendMessage", user, message).catch((err) => {
        console.error(err.toString());
        alert(err.message);
    });
    event.preventDefault();
});
