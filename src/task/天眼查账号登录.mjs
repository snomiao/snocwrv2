import esm from "es-main";
const main = esm(import.meta);
import { page, pageInject } from "../browser.mjs";
import { cookieSet } from "./tyc_company.mjs";
import { 天眼查账号池, urlGoto, 用户名获取 } from "./tyc.mjs";
if(main){
    await 天眼查账号登录();

}
export async function 天眼查账号登录() {
    const 可用账号 = await 天眼查账号池.findOne({ 错误: null });
    const { _id, 账号, 密码, cookie: cookie_raw } = 可用账号;
    if (cookie_raw)
        await cookieSet(cookie_raw, "www.tianyancha.com");
    await urlGoto("https://www.tianyancha.com/");
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
        if (cookie_raw)
            console.log("登录失效");
        await urlGoto("https://www.tianyancha.com/login");
        const 注入串 = `globalThis.injectInput = { phone: "${账号}", password: "${密码}" }`;
        账号 && (await page.evaluate(注入串));
        await pageInject(page, "tyc-login");
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
