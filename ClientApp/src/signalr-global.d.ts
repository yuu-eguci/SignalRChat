import type * as SignalR from "@microsoft/signalr";

declare global {
    // signalr.min.js が window に公開する signalR の型です。
    const signalR: typeof SignalR;
}
