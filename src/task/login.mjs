import esm from "es-main";
const main = esm(import.meta);
import { 睡 } from "sno-utils";
import { cookieSet, page, pageGotoWait, pageInject } from "../browser.mjs";
import { csv串 as csv表列串, _idSet, 天眼查账号池 } from "./tyc.mjs";

if (main) {
    console.clear();
    await 天眼查账号表补();
    await 天眼查账号登录();

    console.log("done");
}

export async function 天眼查账号表补() {
    const 账号表列 = csv表列串`
账号,密码,错误
13281387732,zzzz8888,密码错误
15821483509,zzzz8888,暂停密码登录，风险提示：系统检测账号。。。
18721188454,zzzz8888,暂停密码登录，风险提示：系统检测账号 18721188454 近期被多个设备登录，可能密码已泄露，为确保账号安全，近期已为您暂停密码登录方式，请使用其他登录方式。
13105697635,zzzz8888,自动登录失效，
15697089347,chen555666,vip过期
15670715501,ch444555,vip过期+登录失效
13038407839,ch444555,被反爬，出验证码
18224405702,ch444555,登上没有VIP
17609134581,ch444555,自动登录失效
17110940406,Aa123456,暂停密码登录（估计异地登录容易暂停
16746843056,Aa123456
`;

    // [上海云进信息技术有限公司_电话_工商信息_风险信息- 天眼查]( https://www.tianyancha.com/company/2943892770 )
    await 天眼查账号池.多补(_idSet(账号表列, "账号"));
    await 天眼查账号池.多改({ 错误: "" }, { $set: { 错误: null } });
}

export default async function 天眼查账号登录() {
    const 可用账号 = await 天眼查账号池.findOne({ 错误: null });
    const { _id, 账号, 密码, cookie: cookie_raw } = 可用账号;
    if (cookie_raw) await cookieSet(cookie_raw, "www.tianyancha.com");
    await pageGotoWait("https://www.tianyancha.com/");
    const got用户名 = await 用户名获取();
    if (got用户名) {
        console.log("登录状态有效");
        const 补表 = {
            _id,
            用户名: got用户名,
            检查于: new Date(),
        };
        console.table(补表);
        await 天眼查账号池.单补(补表);
    }
    if (!got用户名) {
        if (cookie_raw) console.log("登录失效");
        await pageGotoWait("https://www.tianyancha.com/login");
        const 注入串 = `globalThis.injectInput = { phone: "${账号}", password: "${密码}" }`;
        账号 && (await page.evaluate(注入串));
        await pageInject("tyc-login");
        await page.waitForNavigation();
        const got用户名 = await 用户名获取();
        const got_cookie_raw = await page.evaluate("document.cookie");
        const 补表 = {
            _id,
            用户名: got用户名,
            cookie: got_cookie_raw,
            登录于: new Date(),
            检查于: new Date(),
        };
        console.table(补表);
        await 天眼查账号池.单补(补表);
    }
}

export async function 用户名获取() {
    const 用户名获取代码 =
        'document.querySelector(".nav-user-name")?.textContent';
    let got用户名 = await page.evaluate(用户名获取代码);
    let k = 6;
    while (!got用户名 && k-- > 0) {
        await 睡(1000);
        got用户名 = await page.evaluate(用户名获取代码);
    }
    console.log("got用户名", got用户名);
    return got用户名;
}
