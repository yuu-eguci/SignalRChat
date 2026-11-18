import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { findChatElements, startChat, type ChatConnection, type ChatElements } from "../src/chat.ts";

const markup = `
<form id="chatForm">
    <input type="text" id="userInput" />
    <input type="text" id="messageInput" />
    <input type="submit" id="sendButton" value="Send Message" />
</form>
<ul id="messagesList"></ul>`;

type Handler = (...args: unknown[]) => void;

// HubConnection の代わりに、呼び出しを記録して結果を制御できる接続です。
class FakeConnection implements ChatConnection {
    readonly handlers = new Map<string, Handler>();
    readonly invocations: unknown[][] = [];
    reconnecting: (error?: Error) => void = () => undefined;
    reconnected: (connectionId?: string) => void = () => undefined;
    startResult: Promise<void> = Promise.resolve();
    invokeResult: Promise<unknown> = Promise.resolve();

    on(methodName: string, newMethod: Handler): void {
        this.handlers.set(methodName, newMethod);
    }

    onreconnecting(callback: (error?: Error) => void): void {
        this.reconnecting = callback;
    }

    onreconnected(callback: (connectionId?: string) => void): void {
        this.reconnected = callback;
    }

    start(): Promise<void> {
        return this.startResult;
    }

    invoke<T>(methodName: string, ...args: unknown[]): Promise<T> {
        this.invocations.push([methodName, ...args]);
        return this.invokeResult as Promise<T>;
    }
}

interface Setup {
    connection: FakeConnection;
    elements: ChatElements;
    alerts: string[];
    errors: string[];
    started: Promise<void>;
    submit: () => Promise<Event>;
}

function setup(configure: (connection: FakeConnection) => void = () => undefined): Setup {
    const dom = new JSDOM(markup);
    const connection = new FakeConnection();
    configure(connection);
    const elements = findChatElements(dom.window.document);
    const alerts: string[] = [];
    const errors: string[] = [];
    const started = startChat(connection, elements, {
        alert: (message) => alerts.push(message),
        logError: (message) => errors.push(message),
    });
    const submit = async (): Promise<Event> => {
        const event = new dom.window.Event("submit", { cancelable: true });
        elements.form.dispatchEvent(event);
        // invoke の then / catch が実行されるまで待ちます。
        await new Promise((resolve) => setImmediate(resolve));
        return event;
    };
    return { connection, elements, alerts, errors, started, submit };
}

test("findChatElements は必要な要素がないと例外を投げます", () => {
    const dom = new JSDOM("<form id=\"chatForm\"></form>");
    assert.throws(() => findChatElements(dom.window.document), /#userInput/);
});

test("接続が確立するまで送信ボタンを無効にします", async () => {
    let resolveStart: () => void = () => undefined;
    const { elements, started } = setup((connection) => {
        connection.startResult = new Promise((resolve) => {
            resolveStart = resolve;
        });
    });

    assert.equal(elements.sendButton.disabled, true);
    resolveStart();
    await started;
    assert.equal(elements.sendButton.disabled, false);
});

test("接続に失敗したら送信ボタンを無効のままにしてエラーを記録します", async () => {
    const { elements, errors, started } = setup((connection) => {
        connection.startResult = Promise.reject(new Error("connection failed"));
    });

    await started;
    assert.equal(elements.sendButton.disabled, true);
    assert.deepEqual(errors, ["Error: connection failed"]);
});

test("ReceiveMessage を受信したらテキストとしてリストに追加します", async () => {
    const { connection, elements, started } = setup();
    await started;

    const receive = connection.handlers.get("ReceiveMessage");
    assert.ok(receive);
    receive("alice", "<b>hello</b>");

    const items = [...elements.messagesList.querySelectorAll("li")].map((li) => li.textContent);
    assert.deepEqual(items, ["alice says <b>hello</b>"]);
    assert.equal(elements.messagesList.querySelector("b"), null);
});

test("再接続中は送信ボタンを無効にし、再接続したら有効にします", async () => {
    const { connection, elements, started } = setup();
    await started;

    connection.reconnecting();
    assert.equal(elements.sendButton.disabled, true);
    connection.reconnected();
    assert.equal(elements.sendButton.disabled, false);
});

test("フォーム送信で SendMessage を呼び出し、成功したら Message 欄を空にします", async () => {
    const { connection, elements, started, submit } = setup();
    await started;
    elements.userInput.value = "alice";
    elements.messageInput.value = "hello";

    const event = await submit();

    assert.equal(event.defaultPrevented, true);
    assert.deepEqual(connection.invocations, [["SendMessage", "alice", "hello"]]);
    assert.equal(elements.userInput.value, "alice");
    assert.equal(elements.messageInput.value, "");
});

test("送信に失敗したら Message 欄を残してエラーを通知します", async () => {
    const { connection, elements, alerts, errors, started, submit } = setup();
    await started;
    connection.invokeResult = Promise.reject(new Error("Message は 1 から 500 文字で入力してください。"));
    elements.userInput.value = "alice";
    elements.messageInput.value = " ";

    await submit();

    assert.equal(elements.messageInput.value, " ");
    assert.deepEqual(alerts, ["Message は 1 から 500 文字で入力してください。"]);
    assert.deepEqual(errors, ["Error: Message は 1 から 500 文字で入力してください。"]);
});
