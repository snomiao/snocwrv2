import puppeteer from "puppeteer";
import fs from "fs";
import cookie from "cookie";
// search company
const cookie_raw =
    "csrfToken=keuvIRkRZqyliO6zG9wuji76; TYCID=8f34332033db11ec8fc5e96753bb64e6; ssuid=4819945484; sajssdk_2015_cross_new_user=1; bannerFlag=true; Hm_lvt_e92c8d65d92d534b0fc290df538b4758=1634977865; creditGuide=1; RTYCID=d69820f202c04242ae70d9c944a02e0e; CT_TYCID=99018b3ad31141588f05848beff5d0ac; sensorsdata2015jssdkcross=%7B%22distinct_id%22%3A%2213281387732%22%2C%22first_id%22%3A%2217cac4659fd11c-0d64a6ca6b9cdb-57b193e-2073600-17cac4659fe912%22%2C%22props%22%3A%7B%22%24latest_traffic_source_type%22%3A%22%E7%9B%B4%E6%8E%A5%E6%B5%81%E9%87%8F%22%2C%22%24latest_search_keyword%22%3A%22%E6%9C%AA%E5%8F%96%E5%88%B0%E5%80%BC_%E7%9B%B4%E6%8E%A5%E6%89%93%E5%BC%80%22%2C%22%24latest_referrer%22%3A%22%22%7D%2C%22%24device_id%22%3A%2217cac4659fd11c-0d64a6ca6b9cdb-57b193e-2073600-17cac4659fe912%22%7D; tyc-user-info={%22isExpired%22:%220%22%2C%22mobile%22:%2213281387732%22%2C%22state%22:%223%22%2C%22vipManager%22:%220%22}; tyc-user-info-save-time=1634977876799; auth_token=eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIxMzI4MTM4NzczMiIsImlhdCI6MTYzNDk3Nzg3OSwiZXhwIjoxNjY2NTEzODc5fQ.EB4EoYp5wAYOWqnHsH6F_hK5R1Vh0dnWML5Lpc4ua3npRvauhk-4IfkY4YQCdOhaOH22miDI1ZGVdXQTDQRfrQ; tyc-user-phone=%255B%252213281387732%2522%255D; Hm_lpvt_e92c8d65d92d534b0fc290df538b4758=1634977882; cloud_token=b8ba8cf279f54b09bac6764f0b41dd9d; cloud_utm=ec9e07d5e46946808da29f2a92ecb3b7";
const cookie_obj = cookie.parse(cookie_raw);
const cookie_ent = Object.entries(cookie_obj);
const domain = "www.tianyancha.com";
const cookieSetMake = (cookie_ent, domain) =>
    cookie_ent.map(([name, value]) => ({
        name,
        value,
        domain,
    }));
const cookie_set = cookieSetMake(cookie_ent, domain);
// console.log(cookie_set);
const browser = await puppeteer.launch({ headless: false });

const page = await browser.newPage();
await page.setCookie(...cookie_set);
// const local =
//   "file:///C:/Users/snomi/tyc-crawler/%E4%B8%8A%E6%B5%B7%E9%94%A6%E6%9C%A8%E4%BF%A1%E6%81%AF%E6%8A%80%E6%9C%AF%E6%9C%89%E9%99%90%E5%85%AC%E5%8F%B8_%E7%94%B5%E8%AF%9D_%E5%B7%A5%E5%95%86%E4%BF%A1%E6%81%AF_%E9%A3%8E%E9%99%A9%E4%BF%A1%E6%81%AF-%20%E5%A4%A9%E7%9C%BC%E6%9F%A5.html";
// const
await page.goto(local, { waitUntil: "domcontentloaded" });
// await page.waitForNetworkIdle2();
const injector = await fs.promises.readFile("src/injector.mjs", "utf8");
console.log(await page.evaluate(injector));

await browser.close();
