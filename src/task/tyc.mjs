import esm from "es-main";
const main = esm(import.meta);
import _ from "lodash";
import db from "../env/db.mjs";
import 公司爬取 from "./tyc_company.mjs";
import 搜索爬取 from "./tyc_search.mjs";
import 账号登录, { 天眼查账号表补 } from "./login.mjs";
import { csv表列串 } from "../utils/csv表列串.mjs";

export {搜索任务} from db
export {公司数据} from db
export {公司信息} from db
export {账号池} from db
export {详情表} from db

// import { page } from "../browser.mjs";

export const _idSet = (表列, field) =>
    表列.map(e => ({ _id: e[field] + "", ...e }));
if (main) {
    console.clear();
    await 天眼查账号表补();
    await 账号登录();
    await 天眼查数据表补();
    await 搜索爬取();
    await 天眼查公司爬取();

    console.log("done");
}
async function 天眼查数据表补() {
    const 公司搜索任务表列 = csv表列串`
公司名
成都市世森科技投资有限公司
成都市凯发房屋开发有限责任公司
四川省国壕电器设备有限公司
# (20211102)
上海南台投资开发公司
北京金海林房地产开发有限公司
湖南省华隆进出口光兆有限公司
吉林省天泰药业股份有限公司
上海同湛新能源科技有限公司
`;
    await 搜索任务.多补(_idSet(公司搜索任务表列, "公司名"));
    console.table(await 账号池.多查列({ 错误: "" }));
}
