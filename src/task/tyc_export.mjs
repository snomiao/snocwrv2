import { exec } from "child_process";
import esm from "es-main";
import fs from "fs";
import { promisify } from "util";
const main = esm(import.meta);
import { 天眼查公司数据 } from "./tyc.mjs";
import yaml from "yaml";
import path from "path";
export async function reportJsonExport(doc) {
    const { 标题 } = doc;
    const fn = `report/company_${标题}.yaml`; // json会触发nodemon restart故用yaml
    await fs.promises.mkdir(path.dirname(fn), { recursive: true });
    await fs.promises.writeFile(fn, yaml.stringify(doc));
    await promisify(exec)(`code.cmd ${fn}`);
}
if (main) {
    const $match = {
        解析于: { $ne: null },
        标题: { $in: ["成都市世森科技投资有限公司"] },
        // //     {
        // 标题: /四川成洪磷化工有限责任公司|四川省国壕电器设备有限公司|四川省国壕电器设备有限公司双流分公司|成都市世森科技投资有限公司|无锡市南太房地产开发有限公司/,
        // //     },
    };
    await 天眼查公司数据.并行聚合更新([{ $match }], reportJsonExport);
    console.log("done");
}
