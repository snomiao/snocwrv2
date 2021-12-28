// import
import express from "express";
import md5 from "md5";
import saltHash from "password-salt-and-hash";
import jwt from "jwt-promisify";
import db, { 公司数据, 搜索任务, 账号池 } from "./db.mjs";
import { 不晚于, 早于, 晚于 } from "sno-mongo-ku";
import "sno-utils";
import { csv表列串 } from "../utils/csv表列串.mjs";
import { 对列表, 表对列, 表键筛 } from "sno-utils";
import yaml from "yaml";
const apiBase = "https://dev.xxwl.snomiao.com:8443/api";

const 计时 = async 名义函数表 =>
    await Promise.all(
        Object.entries(名义函数表).map(async ([名义, 函数]) => {
            console.time(名义), await 函数(), console.timeEnd(名义);
        })
    );
const amap = async (a, f) => {
    const r = [];
    for await (const i of a) {
        r.push(await f(i));
    }
    return r;
};
await 账号池.deleteMany({ 账号: "" });
const 公司数据长度统计 = async () =>
    await 公司数据.扫描更新({ 解析于: { $ne: null }, JSON串长度: null }, doc => {
        const JSON串长度 = JSON.stringify(doc).length;
        const 标题链接 = doc.标题链接;
        console.log({ 标题, 标题链接, JSON串长度 });
        return { $set: { JSON串长度 } };
    });
const 搜索任务扫描补充 = async () => {
    return await 搜索任务.扫描更新(
        { 搜索结果使用于: { $lt: new Date("2021-12-19 00:43:47 GMT+8") } },
        async ({ 搜索结果, 搜索词, 搜索于 }) => {
            const 可用结果 = 搜索结果?.filter(e => e.标题.match(搜索词));
            const 补表列 = 可用结果.map(({ 标题, 标题链接, 搜索结果序号 }) => ({
                标题,
                标题链接,
                搜索词,
                搜索结果序号,
                搜索于,
                搜索匹配: true,
            }));
            补表列.length && (await 公司数据.多补(补表列, { 标题链接: 1 }));
            return { $set: { 搜索结果使用于: new Date() } };
        }
    );
    // 任务数
};
计时({ 公司数据长度统计 }).then();

const 最新版本时间 = new Date("2021-12-14 01:36:33 GMT+8");
const 数据缺失异常修复 = async () => {
    console.time("数据缺失异常修复");
    let 完整数 = 0;
    await 公司数据.扫描更新({ $match: { 解析于: { $lt: 最新版本时间 }, 修复标记于: null } }, async (doc, i, count) => {
        const percent = `${i}/${count} ` + (((i / count) * 100) | 0) + "%";
        console.log(`扫描中 ${percent} ${doc.标题链接}#${doc.标题}`);
        // doc.工商信息_数量 = 1;

        // 数量验证
        const 数量表 = 对列表(
            表对列(doc)
                .filter(([k, v]) => k.endsWith("_数量"))
                .map(([k, v]) => [k.slice(0, -3), v])
        );
        const 数量异常表 = 对列表(
            表对列(数量表)
                .filter(([k, v]) => (doc[k]?.length ?? 0) !== v)
                .map(([k, v]) => [k, [doc[k]?.length, v]])
        );
        const 数量异常 = Object.keys(数量异常表).length;
        if (!数量异常) {
            完整数++;
            console.log(完整数, i);
            return { $set: { 工商信息_数量: 1, 解析于: new Date() } };
        } else {
            console.log(完整数, i);
            console.table(数量异常表);
            return { $set: { 修复标记于: new Date() } };
        }

        // console.table(数量表);
    });
    console.timeEnd("数据缺失异常修复");
};

// 数据缺失异常修复().then();
console.log("done");

// 验证码
/*
店铺记录
danni           zzzz8888              1.96 
weiwei200       ch444555              1.3             (20211202) 下架
wangshunjia                         1   no vip
双冠家园         Aa123456              1.59  1
天眼查企查查服务  ttyy1234              1.28    到当天2300 (20211202) 1.58
muyidaibaobei    zzzz8888              0.98
*/
// clean
// await 公司数据.updateMany({}, { $unset: { 上传于: 1 } });
// await 公司数据.createIndex({ 解析于: 1 });

// 搜索任务
// init

const jsonDateReviver = (_key, value) => {
    if (typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)) {
        return new Date(value);
    }
    return value;
};
const jsonp = json => `_(${JSON.stringify(json, null, 4)})`;
await import("dotenv").then(e => e.config());
const { JWT_SECRET = "TEST_JWT_SECRET" } = process.env;

const 密码加密 = 密码 => saltHash.generateSaltHash(密码);
const 密码验证 = (密钥, 密码) => saltHash.verifySaltHash(密钥.salt, 密钥.password, 密码);

const API_用户 = await API用户初始化();
async function API用户初始化() {
    const API_用户 = db.API_用户;
    await API_用户.createIndex({ 用户名: 1 }, { unique: true });
    await API_用户.单补(
        {
            用户名: "天眼查数据增补",
            密钥: 密码加密("glwc-tyc-api-p@ssw0rd"),
            权限: ["天眼查.写"],
        },
        { 用户名: 1 }
    );
    await API_用户.单补(
        {
            用户名: "天眼查",
            密钥: 密码加密("glwc-tyc-api-p@ssw0rd"),
            权限: ["天眼查.写", "天眼查.读"],
        },
        { 用户名: 1 }
    );
    return API_用户;
}
export async function 接口登录({ 用户名, 密码 }) {
    // 用户验证
    const 用户 = await API_用户.findOne({ 用户名 });
    if (!用户) return { code: 1, 错误: "请检查用户名或重新注册" };
    if (!密码验证(用户.密钥, 密码)) return { code: 1, 错误: "密码错误" };
    const expiresIn = 15 * 86400; /* 秒 */
    return await jwt.sign({ 用户名 }, JWT_SECRET, {
        expiresIn,
    });
}
/**
 * @deprecated
 */
export async function 数据增补(body) {
    if (typeof body === "string") throw new Error("JSON输入字串未解析");
    let { 公司数据表列, 搜索任务表列 } = body;
    公司数据表列 = 公司数据表列?.filter(e => e.标题链接);
    搜索任务表列 = 搜索任务表列?.filter(e => e._id);
    if (!(公司数据表列.length || 搜索任务表列.length)) return await res.send(jsonp({ msg: "有效数据表列为空", body }));
    公司数据表列?.length && (await 公司数据.多补(公司数据表列, { 标题链接: 1 }));
    搜索任务表列?.length && (await 搜索任务.多补(搜索任务表列, { _id: 1 }));
    const 数据增补结果 = {
        code: 0,
        搜索任务表列: 搜索任务表列?.map(({ 搜索词 }) => ({ 搜索词 })),
        公司数据表列: 公司数据表列?.map(({ 标题链接, 标题 }) => ({ 标题链接, 标题 })),
    };
    console.log(new Date().toISOString(), JSON.stringify(数据增补结果).slice(0, 80));
    return 数据增补结果;
    // return res.send({ 错误: "权限无效，请联系系统管理员" });
}

export async function 通用数据增补(数据表列表) {
    const 可用表名列 = ["任务v2_天眼查_公司搜索任务", "任务v2_天眼查_公司信息原始数据", "任务v2_天眼查_公司信息", "任务v2_天眼查_账号池"];
    if (typeof body === "string") throw new Error("JSON输入字串未解析");
    const results = 对列表(
        await Promise.all(
            表对列(数据表列表).map(async ([合集名, { 索引, 表列 }]) => {
                console.log(合集名, JSON.stringify(索引));
                console.table(表列);
                if (!可用表名列.includes(合集名)) throw new Error("数据表名异常");
                if (!表列) throw new Error("表列未定义");
                if (!表列.length) return [合集名, "增补表列长度为0"];
                // // 尝试建立索引
                // await db[合集名].索引(索引)
                return [合集名, await db[合集名].多补(表列, 索引)];
            })
        )
    );
    return { code: 0, results: results };
}
export async function 通用数据查询(查询表表) {
    const 可用表名列 = ["任务v2_天眼查_公司搜索任务", "任务v2_天眼查_公司信息原始数据", "任务v2_天眼查_公司信息", "任务v2_天眼查_账号池"];
    if (typeof body === "string") throw new Error("JSON输入字串未解析");
    const results = await Promise.all(
        表对列(查询表表).map(async ([合集名, { 查询 }]) => {
            console.table(合集名);
            console.table(查询);
            if (!可用表名列.includes(合集名)) throw new Error("数据表名异常");
            if (!表列) throw new Error("表列为空");
            return await db[合集名].多查列(查询);
        })
    );
    return { code: 0, results: results };
}

const allowCross = (req, res, next) => {
    //判断路径
    if (req.path !== "/" && !req.path.includes(".")) {
        res.set({
            "Access-Control-Allow-Credentials": true,
            "Access-Control-Allow-Origin": req.headers.origin || "*",
            "Access-Control-Allow-Headers": "X-Requested-With,Content-Type,Authorization",
            "Access-Control-Allow-Methods": "PUT,POST,GET,DELETE,OPTIONS",
            "Content-Type": "application/json; charset=utf-8", //默认与允许的文本格式json和编码格式
        });
    }
    req.method === "OPTIONS" ? res.status(204).end() : next();
};

// run

const 验证码处理 = async ({ 验证码源, ...info }) => {
    // const [A图, B图] = [...document.querySelector('div.ip').parentElement.querySelectorAll('img')]
    // const [A源, B源] = [A图, A图].map(e=>e.getAttribute('src'))
    // const info = Object.fromEntries(document.querySelector('div.ip').textContent.trim().split(/\s\s+/).map(e=>e.split('：')))

    // 验证码入库
    await db.天眼查验证码.单补(
        {
            md5: md5(验证码源),
            验证码源,
            ...info,
        },
        { md5: 1 }
    );

    // [图片识别-打码平台-打码网站-识别验证码-图鉴网络科技有限公司]( http://www.ttshitu.com/docs/index.html?spm=null )
    const image = 验证码源.replace(/^data:image\/....?;base64,/, "");
    const username = process.env.TTSHITU_USERNAME;
    const password = process.env.TTSHITU_PASSWORD;
    const typeid = 27; // 点选1 ~ 4个坐标
    const body = { username, password, typeid, image };

    const fetch = await (await import("node-fetch")).default;
    const balanceResult = await fetch(`http://api.ttshitu.com/queryAccountInfo.json?username=${username}&password=${password}`).then(e =>
        e.json()
    );
    if (balanceResult.code === "0") {
        const balance = balanceResult?.data?.balance;
        await db.爬虫资源.单补({
            _id: "图鉴",
            余额: balance,
            使用于: new Date(),
        });
    } else {
        await db.爬虫资源.单补({
            _id: "图鉴",
            余额: null,
            错误: balanceResult,
            错误于: new Date(),
        });
    }
    if (balanceResult?.data?.balance) {
        console.log(`图片识别余额${balanceResult?.data?.balance}`);
    } else {
        throw new Error(`图片识别余额获取错误${JSON.stringify(balanceResult, null, 4)}`);
    }

    console.log("正在识别验证码", body);
    const 识别结果 = await fetch("http://api.ttshitu.com/predict", {
        method: "post",
        body: JSON.stringify(body),
    })
        .then(e => e.json())
        .then(({ success, code, message, data }) => ({
            success,
            code: Number(code),
            message,
            data,
        }));
    console.log(识别结果);

    // 备用，用来训练
    await db.天眼查验证码.单补(
        {
            md5: md5(验证码源),
            识别结果,
        },
        { md5: 1 }
    );

    if (识别结果.code === 0) {
        return 识别结果;
    } else {
        return 识别结果;
    }

    // return { code: 0, msg: "put succ", ...验证码数据, ...识别结果 };
};
/* 验证码标本上传 */
const 搜索进度查询 = async () => {
    return {
        时间: new Date() /* .toISOString(), */,
        任务数: await 搜索任务.find().count(),
        已搜索任务: await 搜索任务
            .find({
                搜索于: { $ne: null },
            })
            .count(),
        未搜索任务: await 搜索任务
            .find({
                搜索于: null,
            })
            .count(),
        访问数量: {
            分钟: await 搜索任务
                .find({
                    访问于: 晚于(60).秒前,
                })
                .count(),
            小时: await 搜索任务
                .find({
                    访问于: 晚于(3600).秒前,
                })
                .count(),
            天: await 搜索任务
                .find({
                    访问于: 晚于(86400).秒前,
                })
                .count(),
        },
        搜索数量: {
            分钟: await 搜索任务
                .find({
                    搜索于: 晚于(60).秒前,
                })
                .count(),
            小时: await 搜索任务
                .find({
                    搜索于: 晚于(3600).秒前,
                })
                .count(),
            天: await 搜索任务
                .find({
                    搜索于: 晚于(86400).秒前,
                })
                .count(),
        },
    };
};
const 爬取进度查询 = async () => {
    return {
        时间: new Date() /* .toISOString(), */,
        任务数: await 公司数据.find({ 搜索匹配: true }).count(),
        已解析任务: await 公司数据.find({ 搜索匹配: true, 解析于: { $ne: null } }).count(),
        未解析任务: await 公司数据.find({ 搜索匹配: true, 解析于: null }).count(),
        未修复任务: await 公司数据.find({ 搜索匹配: true, 解析于: { $lt: 最新版本时间 }, 修复标记于: { $ne: null } }).count(),
        访问数量: {
            分钟: await 公司数据.find({ 访问于: 晚于(60).秒前 }).count(),
            小时: await 公司数据.find({ 访问于: 晚于(3600).秒前 }).count(),
            天: await 公司数据.find({ 访问于: 晚于(86400).秒前 }).count(),
        },
        解析数量: {
            分钟: await 公司数据.find({ 解析于: 晚于(60).秒前 }).count(),
            小时: await 公司数据.find({ 解析于: 晚于(3600).秒前 }).count(),
            天: await 公司数据.find({ 解析于: 晚于(86400).秒前 }).count(),
        },
    };
};

const 最近解析公司获取 = () =>
    公司数据
        .find({ 解析于: { $ne: null } })
        .sort({ 解析于: -1 })
        .limit(1)
        .toArray();

const 搜索任务查询 = async (q = {}) => await 搜索任务.多查列(q, { projection: { 搜索结果: 0 } });
const 爬虫资源查询 = async () => await db.爬虫资源.多查列();
const 公司数据任务提取 = async () => {
    const 返回公司 =
        (await 公司数据.findOne(
            {
                // 修复旧数据
                解析于: { $lt: 最新版本时间 },
                搜索匹配: true,
                访问于: 不晚于(60).分钟前, // 防止重复提取
            },
            { projection: { 标题链接: 1, 标题: 1, 解析于: 1 } }
        )) ||
        (await 公司数据.findOne(
            {
                解析于: null,
                搜索匹配: true,
                访问于: 不晚于(60).分钟前, // 防止重复提取
            },
            { projection: { 标题链接: 1, 标题: 1, 解析于: 1 } }
        ));
    if (!返回公司) return null;
    const { 标题链接 } = 返回公司;
    await 公司数据.单补({ 标题链接, 访问于: new Date() }, { 标题链接: 1 });
    return 返回公司;
};
const 公司数据样本 = async () => await 公司数据.aggregate([{ $match: { 解析于: { $ne: null } } }, { $sample: { size: 1 } }]).toArray();
/**
 * @name: get one task obj
 */
const 公司搜索任务提取 = async () => {
    const 返回搜索任务 = await 搜索任务.findOne({
        搜索于: null,
        访问于: 不晚于(60).分钟前, // 防止重复提取
    });
    const { _id } = 返回搜索任务;
    await 搜索任务.单补({ _id, 访问于: new Date() }, { _id: 1 });
    return 返回搜索任务;
};

// await 搜索任务.deleteMany({ _id: null });k
// await 搜索任务.并行聚合更新([{ $match: {} }], doc => ({
//     $set: { 搜索词: doc._id },
// }));
/**
 * @name: get one task obj
 */

const 账号表列查询 = async () =>
    await 账号池.多查列({}, { projection: { _id: 0, 账号: 1, 密码: 1, 错误: 1, 使用于: 1, 备注: 1 }, sort: { 使用于: -1 } });
const 搜索任务表列查询 = async () =>
    await 搜索任务.多查列(
        {},
        {
            projection: {
                _id: 0,
                搜索词: 1,
                搜索于: 1,
                标题链接: 1,
                搜索结果数: { $cond: { if: { $isArray: "$搜索结果" }, then: { $size: "$搜索结果" }, else: "NA" } },
            },
            sort: { 搜索于: 1 },
        }
    );
const 可用账号提取 = async () => {
    const 可用账号 = await 账号池.findOne({
        错误: null,
        // 访问于: 不晚于(60).分钟前, // 防止重复提取
    });
    const { _id } = 可用账号;
    await 账号池.单补({ _id, 访问于: new Date() });
    return 可用账号;
};

const snoauth = async (req, res, next) => {
    // req.headers //Authorization.
    console.log(req.url, req.headers.authorization);
    await next();
};
// run
const app = express();
// ajax cors cross origin support
const useJsonP = fn => async (req, res) => await res.send(jsonp(await fn(req.body)));
const useYaml = fn => async (req, res) => await res.send(yaml.stringify(await fn(req.body)));
app.use(allowCross); //
app.use(express.json({ limit: "50mb", reviver: jsonDateReviver })); // large post process
app.use(snoauth);
app.apiGet = (url, fn) => app.get(url, useJsonP(fn));
app.apiGetYaml = (url, fn) => app.get(url, useYaml(fn));
app.apiPost = (url, fn) => app.post(url, useJsonP(fn));
app.apiPost("/api/login", 接口登录);
app.apiPost("/api/put", 通用数据增补);
app.apiPost("/api/tyc/put", 数据增补);
app.apiPost("/api/captcha", 验证码处理);
app.apiGet("/api/company/progress", 爬取进度查询);
app.apiGet("/api/search/progress", 搜索进度查询);
app.apiGet("/api/company/latest/parse", 最近解析公司获取);
app.apiGet("/api/search", 搜索任务查询);
app.apiGet("/api/company/task", 公司数据任务提取);
app.apiGet("/api/search/task", 公司搜索任务提取);
app.apiGetYaml("/api/tyc/company/sample", 公司数据样本);
app.apiGet("/api/balance", 爬虫资源查询);
app.apiGet("/api/tyc/account/get", 可用账号提取);
app.apiGet("/api/tyc/account/list", 账号表列查询);
app.apiGet("/api/tyc/search/list", 搜索任务表列查询);
app.listen(65534);

const main = await import("es-main").then(e => e.default(import.meta));
if (main) {
    console.table(await API_用户.多查列({}));
    const [用户名, 密码] = "天眼查数据增补 glwc-tyc-api-p@ssw0rd".split(/\s+/);
    const 令牌 = await 接口登录({ 用户名, 密码 });
    console.log("登录令牌:", 令牌);
    console.log(await jwt.verify(令牌, JWT_SECRET));
    console.log("done");
    // 数据增补API
}
