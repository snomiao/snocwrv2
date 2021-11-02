import dotenv from "dotenv";
import snoMongoKu from "sno-mongo-ku";
dotenv.config(); //sync
process.stdout.write(new Date().toISOString() + " 数据库连接...");
const db = await snoMongoKu(process.env.MONGO_URI);
process.stdout.write("成功\n");
export default db;

import esm from "es-main";
const main = esm(import.meta);
if (main) {
    const cs = await db.collections();
    console.table(cs.map((e) => e.collectionName));
}
