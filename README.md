SignalRChat
===

First experimental ASP.NET Core repository. Try to use SignalR Websocket, CORS, Logging. Develop with VSCode.

- Docker: 対応!
- .NET: 10!
- Linter: dotnet format + .NET analyzers!
- Test: xUnit + Microsoft.AspNetCore.Mvc.Testing!
- ASP.NET Core SignalR: 10! (クライアントは @microsoft/signalr 10)

## パッと実行してみたい

```bash
docker compose up --build
# http://localhost:8080 を複数タブで開く
# User と Message を入力して Send Message を押す
```

## 開発

テストと lint は Docker の .NET SDK コンテナで実行。

```bash
# テスト
docker compose run --rm sdk dotnet test --solution SignalRChat.slnx

# lint (整形差分があれば失敗)
docker compose run --rm sdk dotnet format SignalRChat.slnx --verify-no-changes

# 整形を適用
docker compose run --rm sdk dotnet format SignalRChat.slnx
```

ローカルに .NET 10 SDK があれば `dotnet run` でも起動できる。
アクセス先は http://localhost:5000 。

## 構成

- `Program.cs`: Razor Pages 、 SignalR 、 CORS 、 WebSocket の設定
- `Hubs/ChatHub.cs`: 受け取ったメッセージを全クライアントへ配信する Hub (User は 50 文字、 Message は 500 文字まで)
- `wwwroot/lib`, `wwwroot/js/signalr`: libman.json で管理しているクライアントライブラリ (Bootstrap 5 、 @microsoft/signalr)
- `wwwroot/js/chat.js`: ブラウザ側の SignalR クライアント
- `tests/SignalRChat.Tests`: xUnit テスト

## 設定

| キー | 内容 |
| --- | --- |
| `WebBaseUrl` | CORS と WebSocket で許可する外部フロントエンドのオリジン (同一オリジンは常に許可) |
| `EnvName` | ログに出す環境名 |

- 環境ごとの値は `appsettings.{Environment}.json`。
- `docker compose` の環境は `Development`。許可オリジンは `http://localhost:8080`。

## CI/CD

- `.github/workflows/ci.yml`: push と pull request で lint 、テスト、 Docker build を実行。
- `.github/workflows/main_day-care-pick-up-support-stg.yml`: Azure Web App へのデプロイ。実験用なので手動実行 (workflow_dispatch) のみ。
