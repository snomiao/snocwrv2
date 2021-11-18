import fs from "fs";
import xlsx from "xlsx";
import TSV from "tsv";
import { 列映 } from "sno-utils";
import { 天眼查搜索任务 } from "./task/tyc.mjs";
const CSV = TSV.CSV;

const BOM头删除 = e => e.replace(/^\ufeff/, "");
const BOM头追加 = e => "\ufeff" + e;
const CR于CRLF删除 = e => e.replace(/\r\n/g, "\n");
const 文本文件读取 = async filename =>
    await fs.promises
        .readFile(filename, "utf8")
        .then(BOM头删除)
        .then(CR于CRLF删除);
const 数据文件名列 = await fs.promises.readdir("data");
const csv文件名列 = 数据文件名列.filter(e => e.match(/^.*\.csv$/));
const csv路径列 = csv文件名列.map(e => "data/" + e);
const 公司名称主体格式转换器 = 列映(({ 主体名称, 主体ID }) => ({
    _id: 主体名称,
    主体ID,
}));
const csv公司搜索数据文件导入 = async 公司搜索数据 =>
    await 文本文件读取(公司搜索数据)
        .then(e => CSV.parse(e))
        .then(公司名称主体格式转换器)
        .then(表列 => 天眼查搜索任务.多补(表列));

console.log(await Promise.all(csv路径列.map(csv公司搜索数据文件导入)));
