import esm from "es-main";
import fs from "fs";
const main = esm(import.meta);
import { 天眼查公司数据 } from "./tyc.mjs";
if (main) {
    const $match = { 解析于: { $ne: null } };
    const ja = await 天眼查公司数据.聚合([{ $match }]);
    for await (const doc of ja) {
        const { 标题 } = doc;
        const fn = `report/export-${标题}.json`;
        await fs.promises.readFile(fn, "utf8").catch(async () => {
            await fs.promises.writeFile(fn, JSON.stringify(doc, null, 4));
        });
    }
    console.log('done');
}
