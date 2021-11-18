import esm from "es-main";
const main = esm(import.meta);

import { page, pageGotoWait, pageInject } from "../browser.mjs";
import _ from "lodash";
import { 天眼查公司数据, 天眼查搜索任务 } from "./tyc.mjs";

if (main) {
    // await 补搜索结果();
    await tyc_search();
}
async function 临时补搜索结果() {
    const 补任务列 = await 天眼查搜索任务.多查列({ 搜索于: { $ne: null } });
    const 补搜索结果 = 补任务列.flatMap((e) => e.搜索结果);
    console.log("补搜索结果");
    console.table(补搜索结果);
    await Promise.all(补搜索结果.map(导入到公司数据));
}

export default async function tyc_search() {
    const 任务列 = await 天眼查搜索任务.多查列({ 搜索于: null });
    for await (let doc of 任务列) {
        await search(doc);
    }
    async function search(doc) {
        const urlSearch = `https://www.tianyancha.com/search?key=${doc._id}`;
        await pageGotoWait(urlSearch);
        const 搜索结果 = await pageInject("tyc-search");
        const 搜索于 = new Date();
        const { _id } = doc;
        const 补表 = { _id, 搜索结果, 搜索于 };
        console.table(搜索结果);
        console.log(doc._id, JSON.stringify(补表));
        await 天眼查搜索任务.单补(补表);
        await Promise.all(搜索结果.map(导入到公司数据));
    }
}

async function 导入到公司数据({ 标题链接, 标题 }) {
    return await 天眼查公司数据.单补({ _id: 标题链接, 标题, 标题链接 });
}
