SignalRChat
===

First experimental ASP.NET Core repository. Try to use SignalR Websocket, CORS, Logging.

- Docker: 対応!
- .NET: 10 (LTS)!
- Node.js: 26 (LTS) 、 npm 11 (ClientApp のビルドだけで使用)
- TypeScript: 6!
- Linter: dotnet format + .NET analyzers 、 ESLint + typescript-eslint!
- Test: xUnit + Microsoft.AspNetCore.Mvc.Testing 、 node:test + jsdom 、 Playwright (E2E)!
- ASP.NET Core SignalR: 10! (クライアントは @microsoft/signalr 10)

## 必要なもの

Docker Engine と Docker Compose v2 だけです。ホストに Node.js 、 npm 、 .NET SDK は不要です。

## 起動と停止

```bash
# ビルドして起動 (ヘルスチェックが通るまで待ちます)
docker compose up --build --wait app

# 停止してコンテナとネットワークを削除
docker compose down
```

- http://localhost:8080 を 2 つ以上のブラウザ (またはタブ) で開きます。
- User と Message を入力して Enter キーか Send Message を押すと、開いているすべての画面にメッセージが表示されます。
- 8080 番が使用中なら `SIGNALRCHAT_HTTP_PORT=18080 docker compose up --build --wait app` のようにホスト側のポートを変えます。
- ポートは `127.0.0.1` にだけ公開します。

## テスト

```bash
# ClientApp の lint 、型検査、単体テスト、 .NET の lint 、テストを実行
docker build --target test .

# アプリを起動して、ブラウザ 2 つで SignalR の送受信を確認する E2E テストを実行
docker compose --profile test run --rm --build e2e
docker compose --profile test down
```

E2E テストは compose ネットワーク内の `http://signalrchat:8080` (`app` サービスの別名) だけにアクセスします。外部サービスは使いません。

## 開発

```bash
# .NET の整形を適用
docker compose run --rm sdk dotnet format SignalRChat.slnx

# ClientApp の依存パッケージを追加・更新 (package-lock.json を更新)
docker run --rm -v "$PWD":/src -w /src/ClientApp node:26.13.1-trixie-slim npm install <package>@<version>
```

ローカルに Node.js 26 と .NET 10 SDK があれば、次の手順でも起動できます。アクセス先は http://localhost:5000 です。

```bash
(cd ClientApp && npm ci && npm run build)
dotnet run
```

## 構成

- `Program.cs`: Razor Pages 、 SignalR 、 CORS 、 WebSocket 、ヘルスチェック (`/healthz`) の設定
- `Hubs/ChatHub.cs`: 受け取ったメッセージを全クライアントへ配信する Hub (User は 50 文字、 Message は 500 文字まで)
- `ClientApp/src`: ブラウザ側の SignalR クライアント (TypeScript)
- `ClientApp/tests`: ブラウザ側の単体テスト
- `ClientApp/e2e`: Docker で起動したアプリに対する E2E テスト
- `ClientApp/scripts/build.ts`: `npm run build` の本体です。型検査の後に次のファイルを `wwwroot` へ出力します
    - `wwwroot/js/chat.js`: `ClientApp/src` を esbuild でまとめたもの
    - `wwwroot/js/signalr/dist/browser`: npm パッケージ @microsoft/signalr のブラウザ用ファイル
    - `wwwroot/lib/bootstrap`: npm パッケージ bootstrap の CSS と JS
- `wwwroot/js` と `wwwroot/lib` は生成物なので Git で管理しません
- `tests/SignalRChat.Tests`: xUnit テスト
- `Dockerfile`: ClientApp のビルド、 .NET の publish 、テスト、 E2E 用イメージ、実行用イメージのマルチステージビルド
- `compose.yaml`: `app` (アプリ) 、 `e2e` (profile `test`) 、 `sdk` (profile `tools`)

実行用イメージには publish 結果だけを入れます。 `.dockerignore` は許可したファイルだけをビルドコンテキストに含め、 `appsettings.Development.json` や `.env` などのローカル設定は含めません。

## 設定

| キー | 内容 |
| --- | --- |
| `WebBaseUrl` | CORS と WebSocket で許可する外部フロントエンドのオリジン (同一オリジンは常に許可) |
| `EnvName` | ログに出す環境名 |

- 環境ごとの値は `appsettings.{Environment}.json` にあります。
- 環境変数で上書きできます (例: `WebBaseUrl`) 。 `docker compose` では `compose.yaml` の `environment` に書きます。
- `docker compose` の環境は `Development` 、許可オリジンは `http://localhost:8080` です。
- 秘密情報はイメージや `appsettings*.json` に入れず、実行時に環境変数で渡します。

## トラブルシューティング

- `port is already allocated`: `SIGNALRCHAT_HTTP_PORT` で別のポートを指定します。
- `docker compose up --wait` が `unhealthy` で終わる: `docker compose logs app` で起動ログを確認します。
- 画面は表示されるが送信ボタンが押せない: SignalR の接続に失敗しています。ブラウザの開発者ツールのコンソールと `docker compose logs app` を確認します。別オリジンの画面から接続する場合は、そのオリジンを `WebBaseUrl` に設定します。
- コードを変更したのに反映されない: `--build` を付けて起動し直します。

## CI/CD

- `.github/workflows/ci.yml`: push と pull request で次を実行します。
    - ClientApp: `npm ci` 、 lint 、型検査、単体テスト、ビルド
    - .NET: lint 、テスト
    - Docker: `docker build --target test .` 、 `docker compose up --build --wait app` 、 E2E テスト
- `.github/workflows/main_day-care-pick-up-support-stg.yml`: Azure Web App へのデプロイです。実験用なので手動実行 (workflow_dispatch) だけで動きます。
