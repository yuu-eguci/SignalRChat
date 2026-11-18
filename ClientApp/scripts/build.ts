// ブラウザ用の成果物を ../wwwroot に出力します。
import { cp } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const clientAppDir = new URL("../", import.meta.url);
const wwwrootDir = new URL("../wwwroot/", clientAppDir);
const nodeModulesDir = new URL("node_modules/", clientAppDir);

await build({
    entryPoints: [fileURLToPath(new URL("src/main.ts", clientAppDir))],
    outfile: fileURLToPath(new URL("js/chat.js", wwwrootDir)),
    bundle: true,
    format: "iife",
    target: "es2022",
    charset: "utf8",
    logLevel: "info",
});

// Pages が読み込むクライアントライブラリを、 package-lock.json で固定した npm パッケージから配置します。
const libraryFiles: Record<string, string> = {
    "@microsoft/signalr/dist/browser/signalr.js": "js/signalr/dist/browser/signalr.js",
    "@microsoft/signalr/dist/browser/signalr.min.js": "js/signalr/dist/browser/signalr.min.js",
    "bootstrap/LICENSE": "lib/bootstrap/LICENSE",
    "bootstrap/dist/css/bootstrap.min.css": "lib/bootstrap/dist/css/bootstrap.min.css",
    "bootstrap/dist/css/bootstrap.min.css.map": "lib/bootstrap/dist/css/bootstrap.min.css.map",
    "bootstrap/dist/js/bootstrap.bundle.min.js": "lib/bootstrap/dist/js/bootstrap.bundle.min.js",
    "bootstrap/dist/js/bootstrap.bundle.min.js.map": "lib/bootstrap/dist/js/bootstrap.bundle.min.js.map",
};
for (const [source, destination] of Object.entries(libraryFiles)) {
    await cp(new URL(source, nodeModulesDir), new URL(destination, wwwrootDir));
}
