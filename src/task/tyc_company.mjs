import esm from "es-main";
const main = esm(import.meta);

import { page, pageInject, pageGotoWait } from "../browser.mjs";
import _ from "lodash";
import cookie from "cookie";
import { 天眼查公司数据, 天眼查账号池, 用户名获取 } from "./tyc.mjs";
import { 睡 } from "sno-utils";

if (main) {
    await tyc_company();
}

export function 表列人员解析(表列) {
    const 式 = /\[(.*?)\]\(\s*?https?\:\/\/www.tianyancha.com\/human\/\S*?\)/;
    const 键值对对链接解析 = ([k, v]) => {
        const m = v.match(式);
        if (!m) return [[k, v]];
        return [
            [k, v],
            [k + "_名字", m[1]],
            [k + "_链接", m[2]],
        ];
    };
    const 表处理 = (表) => _.fromPairs(_.entries(表).flatMap(键值对对链接解析));
    return 表列.map(表处理);
}
export default async function tyc_company() {
    // get account 
    const 可用账号 = await 天眼查账号池.findOne({ 错误: null });
    const { _id, 账号, 用户名, cookie: cookie_raw } = 可用账号;
    await cookieSet(cookie_raw, "www.tianyancha.com");
    
    const 解析更新 = async ({ 标题, 标题链接 }) => {
        console.log("正在处理" + 标题 + ":" + 标题链接);
        await pageGotoWait(标题链接);

        const got用户名 = await 用户名获取();
        if (got用户名) {
            console.log("登录状态有效");
            await 天眼查账号池.单补({
                _id,
                用户名: got用户名,
                检查于: new Date(),
            });
        }else{
            console.log('err');
            await 睡(10e6)
        }

        const 返回 = await pageInject("tyc-company");
        const 补表 = {
            ...返回,
            解析于: new Date(),
            解析账号: { _id, 账号, 用户名 },
        };
        return { $set: 补表 };
    };
    const $match = { 解析于: null };
    console.log('天眼查公司数据检索任务数：', await 天眼查公司数据.countDocuments($match));
    await 天眼查公司数据.并行聚合更新([{ $match }], 解析更新);
}
export async function cookieSet(cookie_raw, domain) {
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
