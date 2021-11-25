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
