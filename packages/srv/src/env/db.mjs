import dotenv from "dotenv";
import snoMongoKu from "sno-mongo-ku";
dotenv.config(); //sync
console.time('数据库连接')
const db = await snoMongoKu(process.env.MONGO_URI);
console.timeEnd('数据库连接')
// process.stdout.write("数据库连接成功\n");
export default db;

const main = await import("es-main").then(e => e.default(import.meta));
if (main) {
    const cs = await db.collections();
    console.table(cs.map((e) => e.collectionName));
}

export const 搜索任务 = db.任务v2_天眼查_公司搜索任务;
export const 公司数据 = db.任务v2_天眼查_公司信息原始数据;
export const 公司信息 = db.任务v2_天眼查_公司信息;
export const 账号池 = db.任务v2_天眼查_账号池;
export const 详情表 = 名义 => db["任务v2_天眼查_公司_" + 名义];

