import esm from "es-main";
const main = esm(import.meta);
import { 表键列 } from "sno-utils";
import { 天眼查公司数据, 天眼查详情表 } from "./tyc.mjs";

if (main) {
    const 数据表聚合更新 = async (公司数据表) => {
        // TODO 自动合并字段相同的表，名字用长的。
         const { 标题, 标题链接 } = 公司数据表;
        const 表列对详情多补 = async ([表列名, 表列]) => {
            const 表主键添加 = (表) => ({
                ...表,
                _id: `${标题链接}#${表列名}#${序号}`,
            });
            if (表列[0]) {
                // 地址 + 序号;
                表键列(表列[0]);
                await 天眼查详情表(表列名).多补(表列.map(表主键添加));
            }
        };
        console.log('todo清洗');
        const re = await Promise.all(
            Object.entries(表列表)
                .filter(([k, v]) => k && typeof v.map === "function")
                .map(表列对详情多补)
        );
        console.log(re);
        // return { $set: { 聚合于: new Date() } };
    };
    await 天眼查公司数据.并行聚合更新(
        [{ $match: { 解析于: { $ne: null }, 聚合于: null } }],
        数据表聚合更新
    );
}
