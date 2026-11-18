import { findChatElements, startChat } from "./chat.ts";

// signalR は Pages/Index.cshtml で先に読み込む signalr.min.js が定義するグローバル変数です。
const connection = new signalR.HubConnectionBuilder()
    .withUrl("/chatHub")
    .withAutomaticReconnect()
    .build();

void startChat(connection, findChatElements(document), {
    alert: (message) => {
        window.alert(message);
    },
    logError: (message) => {
        console.error(message);
    },
});
