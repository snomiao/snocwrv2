
import puppeteer from "puppeteer";
export const browser = await puppeteer.launch({
    args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
    ],
    dumpio: false,
    headless: false,
});
export const page = await browser.newPage();
// 反反爬
// webdriver
await page.evaluateOnNewDocument(() => {
    const newProto = navigator.__proto__;
    delete newProto.webdriver; //删除 navigator.webdriver字段
    navigator.__proto__ = newProto;
});
// 添加 window.chrome字段，向内部填充一些值
await page.evaluateOnNewDocument(() => {
    window.chrome = {};
    window.chrome.app = {
        InstallState: "hehe",
        RunningState: "haha",
        getDetails: "xixi",
        getIsInstalled: "ohno",
    };
    window.chrome.csi = function () {};
    window.chrome.loadTimes = function () {};
    window.chrome.runtime = function () {};
});
// userAgent设置
await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "userAgent", {
        //userAgent在无头模式下有headless字样，所以需覆盖
        get: () =>
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.113 Safari/537.36",
    });
});
// # plugins
// plugins设置
await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "plugins", {
        //伪装真实的插件信息
        get: () => [
            {
                0: {
                    type: "application/x-google-chrome-pdf",
                    suffixes: "pdf",
                    description: "Portable Document Format",
                    enabledPlugin: Plugin,
                },
                description: "Portable Document Format",
                filename: "internal-pdf-viewer",
                length: 1,
                name: "Chrome PDF Plugin",
            },
            {
                0: {
                    type: "application/pdf",
                    suffixes: "pdf",
                    description: "",
                    enabledPlugin: Plugin,
                },
                description: "",
                filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai",
                length: 1,
                name: "Chrome PDF Viewer",
            },
            {
                0: {
                    type: "application/x-nacl",
                    suffixes: "",
                    description: "Native Client Executable",
                    enabledPlugin: Plugin,
                },
                1: {
                    type: "application/x-pnacl",
                    suffixes: "",
                    description: "Portable Native Client Executable",
                    enabledPlugin: Plugin,
                },
                description: "",
                filename: "internal-nacl-plugin",
                length: 2,
                name: "Native Client",
            },
        ],
    });
});
// # languages
// languages设置
await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "languages", {
        //添加语言
        get: () => ["zh-CN", "zh", "en"],
    });
});
// # permissions
// permissions设置
await page.evaluateOnNewDocument(() => {
    const originalQuery = window.navigator.permissions.query; //notification伪装
    window.navigator.permissions.query = (parameters) =>
        parameters.name === "notifications"
            ? Promise.resolve({ state: Notification.permission })
            : originalQuery(parameters);
});
// # WebGL
// WebGL设置
await page.evaluateOnNewDocument(() => {
    const getParameter = WebGLRenderingContext.getParameter;
    WebGLRenderingContext.prototype.getParameter = function (parameter) {
        // UNMASKED_VENDOR_WEBGL
        if (parameter === 37445) {
            return "Intel Inc.";
        }
        // UNMASKED_RENDERER_WEBGL
        if (parameter === 37446) {
            return "Intel(R) Iris(TM) Graphics 6100";
        }
        return getParameter(parameter);
    };
});
export default browser;

export async function pageGotoWait(url) {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await 睡(1000+500*Math.random());
}

import fs from "fs";
export async function pageInject(injectorName) {
    const path = "injector/" + injectorName + ".mjs";
    const s = await fs.promises.readFile(path, "utf8");
    const result = await page.evaluate(s);
    return result;
}

// 单元测试
import esm from "es-main";
import { 睡 } from "sno-utils";
const main = esm(import.meta);

if (main) {
    await pageGotoWait("https://example.com");
    // await browser.close();
}
