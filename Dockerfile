# syntax=docker/dockerfile:1

# ClientApp/.node-version と同じ Node.js を使います。
ARG NODE_IMAGE=node:26.13.1-trixie-slim
ARG DOTNET_SDK_IMAGE=mcr.microsoft.com/dotnet/sdk:10.0
ARG DOTNET_RUNTIME_IMAGE=mcr.microsoft.com/dotnet/aspnet:10.0

# ClientApp の依存パッケージを package-lock.json どおりにインストールします。
FROM ${NODE_IMAGE} AS client-deps
WORKDIR /src/ClientApp
COPY ClientApp/package.json ClientApp/package-lock.json ClientApp/.npmrc ./
RUN npm ci

# 型検査をしてから wwwroot/js と wwwroot/lib を生成します。
FROM client-deps AS client-build
COPY ClientApp/ ./
RUN npm run build

# ClientApp の lint と単体テストです。 test ステージから実行します。
FROM client-build AS client-test
RUN npm run lint && npm test

# E2E テストを実行するイメージです。 compose.yaml の e2e サービスが使います。
FROM client-deps AS e2e
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN npx playwright-core install --with-deps --only-shell chromium \
    && rm -rf /var/lib/apt/lists/*
COPY ClientApp/ ./
USER node
CMD ["npm", "run", "e2e"]

FROM ${DOTNET_SDK_IMAGE} AS backend-build
WORKDIR /src
COPY global.json SignalRChat.csproj ./
RUN dotnet restore SignalRChat.csproj
COPY . ./
COPY --from=client-build /src/wwwroot/js wwwroot/js
COPY --from=client-build /src/wwwroot/lib wwwroot/lib
RUN dotnet publish SignalRChat.csproj -c Release -o /app --no-restore

# lint とテストをすべて実行します。 docker build --target test . で使います。
FROM backend-build AS test
COPY --from=client-test /src/wwwroot/js wwwroot/js
RUN dotnet format SignalRChat.slnx --verify-no-changes \
    && dotnet test --solution SignalRChat.slnx

FROM ${DOTNET_RUNTIME_IMAGE} AS final
WORKDIR /app
COPY --from=backend-build /app ./
USER $APP_UID
EXPOSE 8080
ENTRYPOINT ["dotnet", "SignalRChat.dll"]
