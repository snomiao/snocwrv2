import puppeteer from "puppeteer";
import cookie from "cookie";
import { 文本文件读取, 睡 } from "sno-utils";

const {
    width = (1024 + Math.random() * 20) | 0,
    height = (768 + Math.random() * 20) | 0,
} = {};
export const browser = await puppeteer.launch({
    defaultViewport: { width, height, deviceScaleFactor: 0.5 },
    args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
        `--window-size=${width},${height}`,
        "--start-maximized",
    ],
    dumpio: false,
    headless: false,
});

export const page = await browser.newPage();

// 开启请求拦截
await page.setRequestInterception(true);
page.on("request", async request => {
    const url = request.url();
    const allow = url.match(
        /static.geetest.com|qbox.me|sensorapi.tianyancha.com|clkst.tianyancha.com/
    );
    if (allow) {
        request.continue();
        return;
    }
    // 如果文件类型为image,则中断加载
    if (request.resourceType() === "image") {
        console.log(`blocked load: ${request.url()}`);
        request.abort();
        return;
    }
    // 正常加载其他类型的文件
    request.continue();
});

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
        InstallState: "" + Math.random(),
        RunningState: "" + Math.random(),
        getDetails: "" + Math.random(),
        getIsInstalled: "" + Math.random(),
    };
    window.chrome.csi = function () {};
    window.chrome.loadTimes = function () {};
    window.chrome.runtime = function () {};
});
// userAgent设置

await page.evaluateOnNewDocument(() => {
    // const ua =
    //     "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.113 Safari/537.36";
    const ua =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36";
    Object.defineProperty(navigator, "userAgent", {
        //userAgent在无头模式下有headless字样，所以需覆盖
        get: () => ua,
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
    window.navigator.permissions.query = parameters =>
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

export async function 页面打开等待(url, 等毫秒 = 1000 + 500 * Math.random()) {
    console.log(`正在打开${url}`);
    await page.goto(url, { waitUntil: "networkidle2" });
    await 睡(等毫秒);
}

export async function 页面文件注入(injectorName) {
    const path = "injector/" + injectorName + ".mjs";
    const js = await 文本文件读取(path);
    return await 页面注入(js);
}
export async function 页面注入(s) {
    return await page.evaluate(s).catch(async e => {
        console.error(e);
        await 睡(10e6);
        throw e;
    });
}
export async function cookie设置(cookie_raw, domain) {
    const cookie_obj = cookie.parse(cookie_raw);
    const cookie_ent = Object.entries(cookie_obj);
    const cookieSetMake = (cookie_ent, domain) =>
        cookie_ent.map(([name, value]) => ({
            name,
            value,
            domain,
        }));
    const cookie_set = cookieSetMake(cookie_ent, domain);
    await page.setCookie(...cookie_set);
}

// 单元测试
const main = await import("es-main").then(e => e.default(import.meta));
if (main) {
    await 页面打开等待("https://example.com");
    // await browser.close();
}
