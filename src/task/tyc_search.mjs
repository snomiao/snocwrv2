import { page, 页面打开等待, 页面文件注入 } from "../env/browser.mjs";
import _ from "lodash";
import { 睡 } from "sno-utils";
// import { HttpsProxyAgent } from "https-proxy-agent";
import { 公司数据, 搜索任务 } from "../env/db.mjs";
const main = await import("es-main").then(e => e.default(import.meta));
if (main) {
    // await fetch('https://www.tianyancha.com/search?key=金德管业集团有限公司', {agent}).then(e=>e.text())
    // await 天眼查搜索任务.updateMany(
    //     { 搜索结果: { $size: 0 } },
    //     { $unset: { 搜索于: 1 } }
    // );
    await 全量补搜索结果();
    // await 搜索爬取();
    // console.log("done");
}

async function 全量补搜索结果() {
    const 补任务列 = await 搜索任务.多查列({ 搜索于: { $ne: null } });
    const 补搜索结果 = 补任务列
        .map(e => {
            console.log(e);
            return e.搜索结果.map((e, i) => ({ ...e, 搜索结果序号: i + 1 }));
        })
        .flat()
        .sort((a, b) => a.搜索结果序号 - b.搜索结果序号)
        .reverse();
    console.log("补搜索结果");
    console.table(补搜索结果);
    await Promise.all(补搜索结果.map(导入到公司数据));
}

export default async function 搜索爬取() {
    const 任务列 = await 搜索任务.多查列({ 搜索于: null });
    for await (let doc of 任务列) {
        await search(doc);
    }
    async function search(doc) {
        const urlSearch = `https://www.tianyancha.com/search?key=${doc._id}`;
        await 页面打开等待(urlSearch);
        const 搜索结果 = await 页面文件注入("tyc-search");
        const 搜索于 = new Date();
        const { _id } = doc;
        const 补表 = { _id, 搜索结果, 搜索于 };
        console.table(搜索结果);
        console.log(doc._id, JSON.stringify(补表));
        await 搜索任务.单补(补表);
        await Promise.all(搜索结果.map(导入到公司数据));
        await 睡(5e3);
    }
}

async function 导入到公司数据({ 标题链接, 标题, 搜索结果序号 }) {
    return await 公司数据.单补({ _id: 标题链接, 标题, 标题链接, 搜索结果序号 });
}
