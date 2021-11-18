import esm from "es-main";
import dotenv from "dotenv";
dotenv.config();
const main = esm(import.meta);
import express from "express";
import saltHash from "password-salt-and-hash";
import jwt from "jwt-promisify";
import db from "./db.mjs";
import { 天眼查搜索任务 } from "./task/tyc.mjs";
const { JWT_SECRET = "TEST_JWT_SECRET" } = process.env;

/**
 * @return {password, salt}
 */
const 密码加密 = 密码 => saltHash.generateSaltHash(密码);
const 密码验证 = (密钥, 密码) =>
    saltHash.verifySaltHash(密钥.salt, 密钥.password, 密码);

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
export async function 登录API({ body }, res) {
    // 用户验证
    const { 用户名, 密码 } = body;
    const 用户 = await API_用户.findOne({ 用户名 });
    if (!用户) return res.send({ 错误: "请检查用户名或重新注册" });
    if (!密码验证(用户.密钥, 密码)) return res.send({ 错误: "密码错误" });
    const expiresIn = 15 * 86400; /* 秒 */
    return await jwt.sign({ 用户名 }, JWT_SECRET, {
        expiresIn,
    });
}
export async function 数据增补API({ body }, res) {
    const { 用户名 } = await jwt.verify(body.令牌, JWT_SECRET);
    if (!(await API_用户.findOne({ 用户名, 权限: "天眼查.写" })))
        return res.send({ 错误: "权限无效，请联系系统管理员" });
    const { 数据表列 } = body;
    await 天眼查公司数据.多补(数据表列);
    return res.send({ 错误: "权限无效，请联系系统管理员" });
}
const app = express();
// const _APIGET = (url, db) => e;
const useJsonP = fn => async (req, res) => await res.send(`_(${JSON.stringify(await fn(req.body))})`);
app.use(express.json());
app.post("/api/login", 登录API);
app.post("/api/tyc/put", 数据增补API);
app.get(
    "/api/search",
    useJsonP(async (q={}) => await 天眼查搜索任务.多查列(q))
);
// app.post(
//     "/api/search/:id",
//     async (req, res) => await res.send(await 天眼查搜索任务.多查列({}))
// );
app.listen(65534);
// client
// localStorage.setItem(
//     "snocwrv2-user",
//     await fetch("https://dev.xxwl.snomiao.com:8443/api/login", {
//         method: "post",
//         body: JSON.stringify(""),
//     }).then((e) => e.json())
// );

if (main) {
    console.table(await API_用户.多查列({}));
    const 令牌 = await 登录API({
        body: { 用户名: "天眼查数据增补", 密码: "glwc-tyc-api-p@ssw0rd" },
    });
    console.log(令牌);
    console.log(await jwt.verify(令牌, JWT_SECRET));
    console.log("done");
    // 数据增补API
}
