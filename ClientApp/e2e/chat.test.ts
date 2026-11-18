// 起動したアプリに HTTP とブラウザでアクセスして、主要画面と SignalR の送受信を確認します。
// compose.yaml の e2e サービスから実行します。
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { chromium, type Browser, type Page } from "playwright-core";

const baseUrl = process.env["BASE_URL"] ?? "http://localhost:8080";

let browser: Browser;

before(async () => {
    browser = await chromium.launch();
});

after(async () => {
    await browser.close();
});

// 独立したブラウザコンテキストでチャット画面を開き、接続の確立を待ちます。
async function openChat(): Promise<Page> {
    const context = await browser.newContext();
    const page = await context.newPage();
    const pageErrors: Error[] = [];
    page.on("pageerror", (error) => pageErrors.push(error));
    const [webSocket, response] = await Promise.all([
        page.waitForEvent("websocket", (ws) => new URL(ws.url()).pathname === "/chatHub"),
        page.goto(baseUrl),
    ]);
    assert.equal(response?.status(), 200);
    await webSocket.waitForEvent("framereceived");
    await page.locator("#sendButton:enabled").waitFor();
    assert.deepEqual(pageErrors, []);
    return page;
}

async function messages(page: Page): Promise<string[]> {
    return page.locator("#messagesList li").allTextContents();
}

test("/healthz は Healthy を返します", async () => {
    const response = await fetch(new URL("/healthz", baseUrl));
    assert.equal(response.status, 200);
    assert.equal(await response.text(), "Healthy");
});

test("主要画面に直接アクセスできます", async () => {
    for (const [path, text] of [["/", "id=\"chatForm\""], ["/Index", "id=\"chatForm\""], ["/Privacy", "Privacy Policy"]] as const) {
        const response = await fetch(new URL(path, baseUrl));
        assert.equal(response.status, 200, path);
        assert.match(await response.text(), new RegExp(text), path);
    }
    assert.equal((await fetch(new URL("/missing-page", baseUrl))).status, 404);
});

test("画面が参照する静的ファイルを配信します", async () => {
    const html = await (await fetch(baseUrl)).text();
    const assets = [...html.matchAll(/(?:src|href)="(\/(?:lib|js|css)\/[^"]+)"/g)].map((match) => match[1] ?? "");
    assert.deepEqual(assets.map((asset) => asset.split("?")[0]), [
        "/lib/bootstrap/dist/css/bootstrap.min.css",
        "/css/site.css",
        "/js/signalr/dist/browser/signalr.min.js",
        "/js/chat.js",
        "/lib/bootstrap/dist/js/bootstrap.bundle.min.js",
    ]);
    for (const asset of [...assets, "/js/signalr/dist/browser/signalr.js", "/favicon.ico"]) {
        const response = await fetch(new URL(asset, baseUrl));
        assert.equal(response.status, 200, asset);
    }
});

test("2 つのブラウザで双方向にメッセージを送受信できます", async () => {
    const alice = await openChat();
    const bob = await openChat();
    const stamp = Date.now().toString();

    // alice は Enter キーで送信します。
    await alice.fill("#userInput", "alice");
    await alice.fill("#messageInput", `hello from alice ${stamp}`);
    await alice.press("#messageInput", "Enter");
    const fromAlice = `alice says hello from alice ${stamp}`;
    await bob.locator("#messagesList li", { hasText: fromAlice }).waitFor();
    await alice.locator("#messagesList li", { hasText: fromAlice }).waitFor();
    assert.equal(await alice.inputValue("#messageInput"), "");

    // bob は送信ボタンで送信します。
    await bob.fill("#userInput", "bob");
    await bob.fill("#messageInput", `<b>hi</b> from bob ${stamp}`);
    await bob.click("#sendButton");
    const fromBob = `bob says <b>hi</b> from bob ${stamp}`;
    await alice.locator("#messagesList li", { hasText: fromBob }).waitFor();
    await bob.locator("#messagesList li", { hasText: fromBob }).waitFor();
    assert.equal(await alice.locator("#messagesList b").count(), 0);

    assert.deepEqual(await messages(alice), await messages(bob));

    await alice.context().close();
    await bob.context().close();
});

test("空の Message はサーバで拒否され、エラーを表示します", async () => {
    const alice = await openChat();
    const bob = await openChat();
    const before = await messages(bob);

    const dialog = alice.waitForEvent("dialog");
    await alice.fill("#userInput", "alice");
    await alice.fill("#messageInput", " ");
    await alice.click("#sendButton");
    const shown = await dialog;
    assert.match(shown.message(), /Message は 1 から 500 文字で入力してください。/);
    await shown.dismiss();

    assert.equal(await alice.inputValue("#messageInput"), " ");
    assert.deepEqual(await messages(bob), before);

    await alice.context().close();
    await bob.context().close();
});
