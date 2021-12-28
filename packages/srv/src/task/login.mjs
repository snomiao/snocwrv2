import { 睡 } from "sno-utils";
import {
    cookie设置,
    page,
    页面打开等待,
    页面文件注入,
} from "../env/browser.mjs";
import { _idSet, 账号池 } from "./tyc.mjs";
import useProxy from "puppeteer-page-proxy";
import {
    IP配置错误处理,
    页面IP获取,
    页面代理IP配置,
    页面代理IP错误标记,
} from "../env/page-proxy.mjs";


const main = await import("es-main").then(e => e.default(import.meta));
if (main) {
    console.clear();
    await 天眼查账号表补();
    // await 账号登录();

    console.log("done");
}
import { csv表列串 } from "../utils/csv表列串.mjs";

const 账号表列 = csv表列串`
账号,密码,错误
`;
// 验证码
/*
店铺记录
    danni           zzzz8888              1.96 
    weiwei200       ch444555              1.3             (20211202) 下架
    双冠家园         Aa123456              1.59            
    天眼查企查查服务  ttyy1234              1.28    到当天2300 (20211202) 1.58
    muyidaibaobei    zzzz8888              0.98
*/
export async function 天眼查账号表补() {
    // [上海云进信息技术有限公司_电话_工商信息_风险信息- 天眼查]( https://www.tianyancha.com/company/2943892770 )
    await 账号池.多补(账号表列, { 账号: 1 });
    await 账号池.多改({ 错误: "" }, { $set: { 错误: null } });
}

export default async function 账号登录() {
    const 可用账号 = await 账号池.findOne({ 错误: null });
    const {
        _id,
        用户名,
        账号,
        密码,
        cookie: cookie_raw,
        IP: 账号IP,
    } = 可用账号;
    if (用户名) {
        console.log(`正在检查登录状态${用户名}`);
    }
    if (账号IP && (await 账号池.findOne({ IP: 账号IP, _id: { $ne: _id } }))) {
        throw new Error("错误：该账号正在使用重复IP");
    }
    // 为账号获取 IP
    const IP = await 页面账号IP配置(账号, 账号IP);
    // 已经登录的账号主页登录情况确认
    if (cookie_raw) await cookie设置(cookie_raw, "www.tianyancha.com");

    const got用户名 =
        cookie_raw && (await 主页登录情况确认(账号).catch(IP配置错误处理(IP)));
    // 登录
    if (!got用户名) {
        // if (cookie_raw) {
        //     console.log("登录失效");
        //     await 账号池.单补(
        //         {
        //             账号,
        //             错误: "该账号登录失效",
        //             检查于: new Date(),
        //         },
        //         { 账号: 1 }
        //     );
        //     throw new Error("该账号登录失效");
        // }
        await 账号池.单补({ 账号, 使用于: new Date() }, { 账号: 1 });
        await 页面打开等待("https://www.tianyancha.com/login").catch(
            IP配置错误处理(IP)
        );
        console.log("loaded");
        const 注入串 = `globalThis.injectInput = { phone: "${账号}", password: "${密码}" }`;
        await page.evaluate(注入串);
        const re = await 页面文件注入("tyc-login");
        console.log("zxcv", re);
        await page.waitForNavigation({ timeout: 60e3 });
        const got用户名 = await 用户名获取();
        if (!got用户名) throw new Error("未登录成功");
        const got_cookie_raw = await page.evaluate("document.cookie");
        const 补表 = {
            账号,
            用户名: got用户名,
            cookie: got_cookie_raw,
            登录于: new Date(),
            使用于: new Date(),
        };
        console.table(补表);
        await 账号池.单补(补表, { 账号: 1 });
    }
}

export async function 页面账号IP配置(账号, IP) {
    // // disable
    // return IP

    console.log(`正在为 ${账号} 账号配置IP`);
    const 配置IP = await 页面代理IP配置(IP);
    console.table({ IP, 配置IP });
    if (配置IP !== IP) {
        console.warn(`账号${账号}更换了新IP${配置IP}`);
    }
    if (!配置IP) {
        throw new Error(
            "代理IP配置异常请检查，如IP过期，可通过删除账号期望IP来解决此错误"
        );
    }
    if (配置IP && (await 账号池.findOne({ IP: 配置IP, 账号: { $ne: 账号 } }))) {
        throw new Error("错误：该账号尝试使用与其它账号重复的IP");
    }
    await 账号池.单补({ 账号, IP: 配置IP }, { 账号: 1 });
    return 配置IP;
}

async function 主页登录情况确认(账号) {
    await 页面打开等待("https://www.tianyancha.com/").catch(e => {
        if (e.message.match("net::ERR_FAILED")) {
            console.log("配置IP错误", "net:ERR_FAILED");
        }
        throw e;
    });
    const got用户名 = await 用户名获取();
    if (got用户名) {
        console.log("登录状态有效");
        const 补表 = {
            账号,
            用户名: got用户名,
            检查于: new Date(),
            使用于: new Date(),
        };
        console.table(补表);
        await 账号池.单补(补表, { 账号: 1 });
    }
    return got用户名;
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
