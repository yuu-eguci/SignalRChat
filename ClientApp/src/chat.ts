import type { HubConnection } from "@microsoft/signalr";

// startChat が使う HubConnection の操作です。テストでは偽の接続を渡します。
export type ChatConnection = Pick<HubConnection, "on" | "onreconnecting" | "onreconnected" | "start" | "invoke">;

export interface ChatElements {
    form: HTMLFormElement;
    userInput: HTMLInputElement;
    messageInput: HTMLInputElement;
    sendButton: HTMLInputElement;
    messagesList: HTMLUListElement;
}

export interface ChatDependencies {
    alert: (message: string) => void;
    logError: (message: string) => void;
}

function getElement<T extends HTMLElement>(doc: Document, id: string, type: new () => T): T {
    const element = doc.getElementById(id);
    if (!(element instanceof type)) {
        throw new Error(`#${id} が見つからないか、想定した要素ではありません。`);
    }
    return element;
}

// Pages/Index.cshtml のチャット用要素を取得します。
export function findChatElements(doc: Document): ChatElements {
    const view = doc.defaultView;
    if (view === null) {
        throw new Error("document が window に属していません。");
    }
    return {
        form: getElement(doc, "chatForm", view.HTMLFormElement),
        userInput: getElement(doc, "userInput", view.HTMLInputElement),
        messageInput: getElement(doc, "messageInput", view.HTMLInputElement),
        sendButton: getElement(doc, "sendButton", view.HTMLInputElement),
        messagesList: getElement(doc, "messagesList", view.HTMLUListElement),
    };
}

function describeError(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

// 接続を開始し、ハブとフォームを結び付けます。
export function startChat(connection: ChatConnection, elements: ChatElements, dependencies: ChatDependencies): Promise<void> {
    const { form, userInput, messageInput, sendButton, messagesList } = elements;

    // 接続が確立するまで送信ボタンを無効にします。
    sendButton.disabled = true;

    // ハブからメッセージを受信したときのイベントです。
    // メッセージをリストに追加します。
    connection.on("ReceiveMessage", (user: string, message: string) => {
        const li = messagesList.ownerDocument.createElement("li");
        // textContent はマークアップとして解釈されないため、ユーザ入力をそのまま代入できます。
        li.textContent = `${user} says ${message}`;
        messagesList.appendChild(li);
    });

    connection.onreconnecting(() => {
        sendButton.disabled = true;
    });

    connection.onreconnected(() => {
        sendButton.disabled = false;
    });

    // ハンドラーをフォームの送信 (送信ボタンまたは Enter キー) に追加します。
    // このハンドラーはハブにメッセージを送信します。
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        connection.invoke("SendMessage", userInput.value, messageInput.value).then(() => {
            messageInput.value = "";
        }).catch((error: unknown) => {
            dependencies.logError(String(error));
            dependencies.alert(describeError(error));
        });
    });

    return connection.start().then(() => {
        sendButton.disabled = false;
    }).catch((error: unknown) => {
        dependencies.logError(String(error));
    });
}
