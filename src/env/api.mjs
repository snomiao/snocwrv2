// import
import express from "express";
import md5 from "md5";
import saltHash from "password-salt-and-hash";
import jwt from "jwt-promisify";
import db, { 公司数据, 搜索任务, 账号池 } from "./db.mjs";
import { 不晚于, 晚于 } from "sno-mongo-ku";
import "sno-utils";
import { csv表列串 } from "../utils/csv表列串.mjs";

const 账号表列 = csv表列串`
账号,密码,错误
13281387732,zzzz8888,密码错误
15821483509,zzzz8888,暂停密码登录，风险提示：系统检测账号。。。
18721188454,zzzz8888,暂停密码登录，风险提示：系统检测账号 18721188454 近期被多个设备登录，可能密码已泄露，为确保账号安全，近期已为您暂停密码登录方式，请使用其他登录方式。
13105697635,zzzz8888,自动登录失效，
15697089347,chen555666,vip过期#NOVIP
15670715501,ch444555,vip过期+登录失效
13038407839,ch444555,被反爬，出验证码
18224405702,ch444555,登上没有VIP#NOVIP
17609134581,ch444555,VIP过期
17110940406,Aa123456,暂停密码登录（估计异地登录容易暂停
16746843056,Aa123456,暂停密码登录
16740448303,Aa123456,自动登录失效
16220312235,Aa123456,暂停密码登录
16623448631,zzzz8888,系统检测账号 16623448631 近期被多个设备登录，可能密码已泄露，为确保账号安全，近期已为您暂停密码登录方式，请使用其他登录方式。
13969562599,ch444555,验证码反爬
16740448251,Aa123456,VIP过期
15696157581,ttyy1234,VIP过期
18523517562,ttyy1234,VIP过期
18128523145,ch444555,填验证码过快，禁止访问（长期VIP）
18691323950,ttyy1234,系统检测账号 18691323950 近期被多个设备登录，可能密码已泄露，为确保账号安全，近期已为您暂停密码登录方式，请使用其他登录方式。
17208819561,zzzz8888
`;
// 验证码
/*
店铺记录
    danni           zzzz8888              1.96 
    weiwei200       ch444555              1.3             (20211202) 下架
    双冠家园         Aa123456              1.59            
    天眼查企查查服务  ttyy1234              1.28    到当天2300 (20211202) 1.58
    muyidaibaobei    zzzz8888              0.98
*/
await 天眼查账号表补();

async function 天眼查账号表补() {
    // [上海云进信息技术有限公司_电话_工商信息_风险信息- 天眼查]( https://www.tianyancha.com/company/2943892770 )
    await 账号池.多补(账号表列, { 账号: 1 });
    await 账号池.updateMany({ 错误: "" }, { $set: { 错误: null } });
}

// clean
await 公司数据.updateMany({}, { $unset: { 上传于: 1 } });
await 公司数据.createIndex({ 解析于: 1 });

// 搜索任务
// init

const jsonDateReviver = (_key, value) => {
    if (
        typeof value === "string" &&
        value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)
    ) {
        return new Date(value);
    }
    return value;
};
const jsonp = json => `_(${JSON.stringify(json, null, 4)})`;
await import("dotenv").then(e => e.config());
const { JWT_SECRET = "TEST_JWT_SECRET" } = process.env;

const 密码加密 = 密码 => saltHash.generateSaltHash(密码);
const 密码验证 = (密钥, 密码) =>
    saltHash.verifySaltHash(密钥.salt, 密钥.password, 密码);

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
export async function 登录({ 用户名, 密码 }) {
    // 用户验证
    const 用户 = await API_用户.findOne({ 用户名 });
    if (!用户) return { code: 1, 错误: "请检查用户名或重新注册" };
    if (!密码验证(用户.密钥, 密码)) return { code: 1, 错误: "密码错误" };
    const expiresIn = 15 * 86400; /* 秒 */
    return await jwt.sign({ 用户名 }, JWT_SECRET, {
        expiresIn,
    });
}
export async function 数据增补(body) {
    if (typeof body === "string") throw new Error("JSON输入字串未解析");
    let { 公司数据表列, 搜索任务表列 } = body;
    公司数据表列 = 公司数据表列?.filter(e => e.标题链接);
    搜索任务表列 = 搜索任务表列?.filter(e => e._id);
    if (!(公司数据表列.length || 搜索任务表列.length))
        return await res.send(jsonp({ msg: "有效数据表列为空", body }));
    公司数据表列?.length &&
        (await 公司数据.多补(公司数据表列, { 标题链接: 1 }));
    搜索任务表列?.length && (await 搜索任务.多补(搜索任务表列, { _id: 1 }));
    const 数据增补结果 = {
        code: 0,
        搜索任务表列: 搜索任务表列?.map(e => e._id),
        公司数据表列: 公司数据表列?.map(e => e.标题链接),
    };
    console.log(
        new Date().toISOString(),
        JSON.stringify(数据增补结果).slice(0, 80)
    );
    return 数据增补结果;
    // return res.send({ 错误: "权限无效，请联系系统管理员" });
}

const allowCross = (req, res, next) => {
    //判断路径
    if (req.path !== "/" && !req.path.includes(".")) {
        res.set({
            "Access-Control-Allow-Credentials": true,
            "Access-Control-Allow-Origin": req.headers.origin || "*",
            "Access-Control-Allow-Headers": "X-Requested-With,Content-Type",
            "Access-Control-Allow-Methods": "PUT,POST,GET,DELETE,OPTIONS",
            "Content-Type": "application/json; charset=utf-8", //默认与允许的文本格式json和编码格式
        });
    }
    req.method === "OPTIONS" ? res.status(204).end() : next();
};
const useJsonP = fn => async (req, res) => {
    const json = await fn(req.body);
    return await res.send(jsonp(json));
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
    const balanceResult = await fetch(
        `http://api.ttshitu.com/queryAccountInfo.json?username=${username}&password=${password}`
    ).then(e => e.json());
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
        throw new Error(
            `图片识别余额获取错误${JSON.stringify(balanceResult, null, 4)}`
        );
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
        // 条目数: await 搜索任务.find({}).count(),
        // 任务数: await 搜索任务.find({ 搜索结果序号: 1 }).count(),
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
        条目数: await 公司数据.find({}).count(),
        任务数: await 公司数据.find({ 搜索结果序号: 1 }).count(),
        上传异常数: await 公司数据
            .find({ 上传于: { $ne: null }, 标签列: null })
            .count(),
        已解析任务: await 公司数据
            .find({
                搜索结果序号: 1,
                解析于: { $ne: null },
            })
            .count(),
        未解析任务: await 公司数据
            .find({
                搜索结果序号: 1,
                解析于: null,
            })
            .count(),
        访问数量: {
            分钟: await 公司数据
                .find({
                    访问于: 晚于(60).秒前,
                })
                .count(),
            小时: await 公司数据
                .find({
                    访问于: 晚于(3600).秒前,
                })
                .count(),
            天: await 公司数据
                .find({
                    访问于: 晚于(86400).秒前,
                })
                .count(),
        },
        解析数量: {
            分钟: await 公司数据
                .find({
                    解析于: 晚于(60).秒前,
                })
                .count(),
            小时: await 公司数据
                .find({
                    解析于: 晚于(3600).秒前,
                })
                .count(),
            天: await 公司数据
                .find({
                    解析于: 晚于(86400).秒前,
                })
                .count(),
        },
    };
};

const 最近解析公司获取 = () =>
    公司数据
        .find({ 解析于: { $ne: null } })
        .sort({ 解析于: -1 })
        .limit(1)
        .toArray();

const 搜索任务查询 = async (q = {}) =>
    await 搜索任务.多查列(q, { projection: { 搜索结果: 0 } });
const 爬虫资源查询 = async () => await db.爬虫资源.多查列();
const 公司数据任务提取 = async () => {
    const 返回公司 = await 公司数据.findOne({
        解析于: null,
        标签列: null,
        搜索结果序号: 1,
        访问于: 不晚于(60).分钟前, // 防止重复提取
    });
    if (!返回公司) return null;
    const { 标题链接 } = 返回公司;
    await 公司数据.单补({ 标题链接, 访问于: new Date() }, { 标题链接: 1 });
    return 返回公司;
};
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

const 可用账号提取 = async () => {
    const 可用账号 = await 账号池.findOne({
        错误: null,
        访问于: 不晚于(60).分钟前, // 防止重复提取
    });
    const { _id } = 可用账号;
    await 账号池.单补({ _id, 访问于: new Date() });
    return 可用账号;
};

// run
const app = express();
// ajax cors cross origin support
app.use(allowCross); //
app.use(express.json({ limit: "50mb", reviver: jsonDateReviver })); // large post process
app.apiGet = (url, fn) => app.get(url, useJsonP(fn));
app.apiPost = (url, fn) => app.post(url, useJsonP(fn));
app.apiPost("/api/login", 登录);
app.apiPost("/api/tyc/put", 数据增补);
app.apiPost("/api/captcha", 验证码处理);
app.apiGet("/api/company/progress", 爬取进度查询);
app.apiGet("/api/search/progress", 搜索进度查询);
app.apiGet("/api/company/latest/parse", 最近解析公司获取);
app.apiGet("/api/search", 搜索任务查询);
app.apiGet("/api/company/task", 公司数据任务提取);
app.apiGet("/api/search/task", 公司搜索任务提取);
app.apiGet("/api/balance", 爬虫资源查询);
app.apiGet("/api/tyc/account/get", 可用账号提取);
app.listen(65534);
// client
// localStorage.setItem(
//     "snocwrv2-user",
//     await fetch("https://dev.xxwl.snomiao.com:8443/api/login", {
//         method: "post",
//         body: JSON.stringify(""),
//     }).then((e) => e.json())
// );

const main = await import("es-main").then(e => e.default(import.meta));
if (main) {
    console.table(await API_用户.多查列({}));
    const 令牌 = await 登录({
        body: { 用户名: "天眼查数据增补", 密码: "glwc-tyc-api-p@ssw0rd" },
    });
    console.log(令牌);
    console.log(await jwt.verify(令牌, JWT_SECRET));
    console.log("done");
    // 数据增补API
}
