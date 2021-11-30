import {
    page,
    页面文件注入,
    页面打开等待,
    cookie设置,
} from "../env/browser.mjs";
import _ from "lodash";
import { 公司数据, 账号池 } from "./tyc.mjs";
import { 睡 } from "sno-utils";
import { 用户名获取, 页面账号IP配置 } from "./login.mjs";
import { reportJsonExport } from "./tyc_export.mjs";
import { IP配置错误处理 } from "../env/page-proxy.mjs";
const main = await import("es-main").then(e => e.default(import.meta));
if (main) {
    // 重爬标记
    // await 天眼查公司数据.updateMany({},{$set: { 解析于:null}})
    await 公司爬取();
    console.log("done");
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
    const 表处理 = 表 => _.fromPairs(_.entries(表).flatMap(键值对对链接解析));
    return 表列.map(表处理);
}
export default async function 公司爬取() {
    const 解析更新 = async ({ 标题, 标题链接 }) => {
        // get account
        const 可用账号 = await 账号池.findOne({ 错误: null });
        const { _id, 账号, 用户名, cookie: cookie_raw, IP } = 可用账号;
        await cookie设置(cookie_raw, "www.tianyancha.com");

        console.log("正在处理" + 标题 + ":" + 标题链接);
        await 账号池.单补({ 账号, 使用于: new Date() }, { 账号: 1 });
        await 页面账号IP配置(账号, IP);
        await 页面打开等待(标题链接).catch(IP配置错误处理(IP));
        const got用户名 = await 用户名获取();
        if (got用户名) {
            console.log("登录状态有效");
            await 账号池.单补({
                _id,
                用户名: got用户名,
                检查于: new Date(),
            });
        } else {
            console.log("err");
            await 睡(10e6);
            throw new Error("登录状态无效，请重新登录");
        }
        await 账号池.单补({ 账号, 使用于: new Date() }, { 账号: 1 });
        const 返回 = await 页面文件注入("tyc-company");
        const 补表 = {
            标题,
            标题链接,
            ...返回,
            解析于: new Date(),
            解析账号: { _id, 账号, 用户名 },
        };
        // await reportJsonExport(补表);
        await 睡(20e3); // 降低频率
        return { $set: 补表 };
    };
    const $match = {
        解析于: null,
        搜索结果序号: { $lte: 1 },
    };
    console.log(
        "天眼查公司数据检索任务数：",
        await 公司数据.countDocuments($match)
    );
    await 公司数据.并行聚合更新(
        [{ $match }, { $sort: { 搜索结果序号: 1 } }],
        解析更新
    );
}
