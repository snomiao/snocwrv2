import esm from "es-main";
const main = esm(import.meta);
import { page } from "../browser.mjs";
import _ from "lodash";
import db from "../db.mjs";
import TSV from "TSV";
import tyc_company from "./tyc_company.mjs";
import tyc_search from "./tyc_search.mjs";
import { 天眼查账号登录 } from "./天眼查账号登录.mjs";
import { 睡 } from "sno-utils";

export const 天眼查搜索任务 = db.任务v2_天眼查_公司搜索任务;
export const 天眼查公司数据 = db.任务v2_天眼查_公司信息原始数据;
export const 天眼查公司信息 = db.任务v2_天眼查_公司信息;
export const 天眼查账号池 = db.任务v2_天眼查_账号池;
export const 天眼查详情表 = (名义) => db["任务v2_天眼查_公司_" + 名义];

const csv串 = (s) =>
    TSV.CSV.parse(
        s
            .join("")
            .replace(/^#.*\n?$\n?/g, "")
            .trim()
    );

// import { page } from "../browser.mjs";

const _idSet = (表列, field) => 表列.map((e) => ({ _id: e[field] + "", ...e }));
if (main) {
    console.clear();
    await 天眼查数据初始化();
    await 天眼查账号登录();
    await tyc_search();
    await tyc_company();
}
async function 天眼查数据初始化() {
    const 账号表列 = csv串`
账号,密码,错误
13281387732,zzzz8888,密码错误
15821483509,zzzz8888,暂停
18721188454,zzzz8888,风险提示：系统检测账号 18721188454 近期被多个设备登录，可能密码已泄露，为确保账号安全，近期已为您暂停密码登录方式，请使用其他登录方式。
13105697635,zzzz8888,登录失效
15697089347,chen555666`;
    const 公司搜索任务表列 = csv串`
公司名
成都市世森科技投资有限公司
成都市凯发房屋开发有限责任公司
四川省国壕电器设备有限公司
# (20211102)
上海南台投资开发公司
北京金海林房地产开发有限公司
湖南省华隆进出口光兆有限公司
吉林省天泰药业股份有限公司
上海同湛新能源科技有限公司
`;
    await 天眼查账号池.多补(_idSet(账号表列, "账号"));
    await 天眼查账号池.多改({ 错误: "" }, { $set: { 错误: null } });
    await 天眼查搜索任务.多补(_idSet(公司搜索任务表列, "公司名"));
    console.table(await 天眼查账号池.多查列({ 错误: "" }));
}

export async function 用户名获取() {
    const 用户名获取代码 =
        'document.querySelector(".nav-user-name")?.textContent';
    let got用户名 = await page.evaluate(用户名获取代码);
    let k = 6
    while(!got用户名 && k-->0){
        await 睡(1000)
        got用户名 = await page.evaluate(用户名获取代码);
    }
    console.log("got用户名", got用户名);
    return got用户名;
}

export async function urlGoto(loginURL) {
    await page.goto(loginURL, {
        waitUntil: "networkidle2",
    });
}
