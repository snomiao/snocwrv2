import { page, 页面注入, 页面打开等待, 页面文件注入 } from "./browser.mjs";
import useProxy from "puppeteer-page-proxy";
import fetch from "node-fetch";
import db from "./db.mjs";

const main = await import("es-main").then(e => e.default(import.meta));
if (main) {
    // await 代理IP提取();
    console.table(await 代理IP提取入库());
    const ip = await 页面代理IP配置();
    await 页面IP测试(ip);
    console.log("done");
}
export async function 页面代理IP错误标记(ip, 错误) {
    await db.代理池.单补({ ip, 错误 }, { ip: 1 });
}
export async function 页面代理IP配置(期望IP = undefined) {
    const $match = { 错误: null, 过期于: { $gte: new Date() } };
    const $match期望 = {
        ...(期望IP && { ip: 期望IP }),
        ...$match,
    };
    const { ip, port, 过期于 } =
        (await db.代理池.findOne($match期望)) ??
        (await db.代理池.findOne($match));
    const proxyURL = `http://${ip}:${port}`;
    await useProxy(page, proxyURL);
    return ip;
}

export async function 页面IP测试(ip) {
    const 测得ip = await 页面IP获取();
    if (ip !== 测得ip)
        throw new Error(`IP测试失败，测得${测得ip}不符合期望ip${ip}`);
    console.log(ip, 测得ip);
    return 测得ip;
}

export async function 页面IP获取() {
    await 页面打开等待("https://api.ipify.org/?format=json", 0);
    const ip = await 页面注入(() => JSON.parse(document.body.textContent).ip);
    return ip;
}

export async function 代理IP提取入库() {
    const proxySample = {
        code: 0,
        data: [
            {
                ip: "139.201.151.33",
                port: 4226,
                expire_time: "2021-11-24 18:56:35",
                city: "四川省资阳市",
                isp: "电信",
            },
        ],
        msg: "0",
        success: true,
    };

    const IP提取地址 =
        "http://webapi.http.zhimacangku.com/getip?num=1&type=2&pro=0&city=0&yys=0&port=1&time=2&ts=1&ys=1&cs=1&lb=1&sb=0&pb=45&mr=1&regions=";
    // ("https://wapi.http.linkudp.com/index/index/get_my_balance?neek=572272&appkey=9e1e1a8de87c946c694c159d7a3272e2");
    // const pr = proxySample;
    const pr = await fetch(IP提取地址).then(e => e.json());
    if (pr.code !== 0) throw new Error(pr.msg);
    const 代理池导入数据 = pr.data.map(e => ({
        ...e,
        来源: "芝麻代理",
        更新于: new Date(),
        过期于: new Date(e.expire_time + " GMT+8"),
    }));
    await db.代理池.多补(代理池导入数据, { ip: 1, port: 1 });
    return 代理池导入数据;
}
