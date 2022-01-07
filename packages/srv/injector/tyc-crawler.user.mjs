// ==UserScript==
// @name         tyc-crawler
// @namespace    snomiao@gmail.com
// @version      0.1.1
// @description  rt
// @author       snomiao@gmail.com
// @match        https://www.tianyancha.com/
// @match        https://www.tianyancha.com/company/*
// @match        https://www.tianyancha.com/search*
// @match        https://www.tianyancha.com/login*
// @match        https://antirobot.tianyancha.com/captcha/verify?*
// @match        https://www.tianyancha.com/usercenter/personalcenter*
// @require      https://dev.xxwl.snomiao.com:8443/api/tyc/injector.user.mjs
// @grant        GM.getValue
// @grant        GM.setValue
// @run-at       document-end
// ==/UserScript==

// @require      file:///C:/Users/snomi/snocwrv2/packages/srv/injector/tyc-crawler.user.mjs

// 页面分析TODO
// {董监高信息_数量: {$gt: 20}}
// https://www.tianyancha.com/company/2286525?rnd=

//
// https://www.tianyancha.com/company/419978836#snocrawler

(async () => {
    globalThis.clear?.();
    console.log("天眼查爬虫加载中...");
    // capt....
    // request.transaction('分页表列表').
    const 异步错误稳定重现提取 = (fn, 次数) => fn;
    // TODO indexedDB
    const db = await new Promise((resolve, reject) => {
        const req = indexedDB.open("缓存");
        req.onsuccess = event => resolve(req.result);
        req.onerror = event => reject(req.error);

        // req.result.transaction('缓存'). .commit()
        // const db = req.result
        // req.result.createObjectStore;
    });
    // const store = db.createObjectStore("store");
    console.log(db);
    // db.
    const urlMatched = url => location.href.indexOf(url) + 1;
    const 首页内 = location.href === "https://www.tianyancha.com/";
    const 用户页面内 = urlMatched("https://www.tianyancha.com/usercenter/personalcenter");
    const 验证页面内 = urlMatched("https://antirobot.tianyancha.com/captcha/verify?");
    const 登录页面内 = urlMatched("https://www.tianyancha.com/login?");
    const 搜索页面内 = urlMatched("https://www.tianyancha.com/search");
    const 公司页面内 = urlMatched("https://www.tianyancha.com/company/");

    // TODO: 董监高信息需要对 tab 再分解
    const 标签大类 = ["董监高信息"];
    const 表名大类 = [...标签大类, "公司公示", "抽查检查", "经营异常", "历史经营异常", "抖音/快手", "询价评估", "严重违法", "股权质押"];
    const 未能爬取表名列 = (e => e.trim().split(/\s+/))(`
        历史股东镜像 历史高管镜像 历史经营异常 历史网站备案 历史被执行人 // 特殊格式
        主要人员 股东信息 // 未知...
        供应商 //特殊2
        新闻舆情 //特殊3
        双随机抽查 资质资格 //多列
        `); // 格式需要适配
    const 需要红钻表名列 = ["涉诉关系"];
    const 翻页不正常表名列 = ["分支机构", "司法拍卖", "资质证书", "法院公告", "历史股东", "竞品信息" /* 页面显示为空 */]; // 容易在第2页出错
    const 空表表列 = ["网站备案"]; // 返回空表

    const 地址从验证码返回 = !!location.search.match(/rnd=/);
    const 登录或验证标记 = 登录页面内 || 验证页面内;
    const 爬虫标记串 = "snocrawler";
    const 地址爬虫标记 = location.hash === `#${爬虫标记串}`;
    const DEBUG标记 = globalThis.debug_flag || location.hash.match("DEBUG");
    const 爬取标记 = DEBUG标记 || 地址从验证码返回 || 地址爬虫标记 || 登录或验证标记;

    let 开始爬取等待毫秒 = 2e3; // 确保加载完成
    let 翻页等待毫秒 = 1e3;

    const softAlert = (...msg) => {
        document.title = new Date().toISOString().slice(11) + msg.join("");
        console.log(...msg);
    };
    const 睡 = ms => new Promise(resolve => setTimeout(resolve, ms));
    const qsa = (ele, sel = "*") => [...ele?.querySelectorAll(sel)];
    const 元素搜索 = (pattern, ele = document) =>
        qsa(ele)
            .reverse()
            .find(e => e?.textContent?.match?.(pattern));

    const 整数范围列 = (min, max) => [...Array(max - min + 1).keys()].map(e => e + min);
    const 文本获取 = e => e?.innerText || e?.textContent || "";
    const 标题获取 = e => 文本获取(e);
    const 标题链接获取 = e => e?.href;
    const 账号信息获取 = () => {
        const cookie = Object.fromEntries(document.cookie.split(/; ?/).map(e => e.split("=")));
        const { state, vipManager, mobile, ...other } = JSON.parse(decodeURIComponent(cookie["tyc-user-info"]));
        return { state, vipManager, mobile, ...other };
    };
    const 需要登录 = async () => !!元素搜索(/登录\/注册/);

    const amap = async (a, f) => {
        const r = [];
        for await (const i of a) {
            r.push(await f(i));
        }
        return r;
    };
    const pmap = async (a, f) => {
        return await Promise.all(a.map(f));
    };
    // api
    const apiBase = "https://dev.xxwl.snomiao.com:8443/api";
    const jsonpParse = e => {
        const _ = json => json;
        return eval(e);
    };
    const corsOptions = {
        mode: "cors",
        credentials: "include",
    };
    // init jwt
    const scTokenGet = async () => {
        globalThis.snocrawler_token ||= localStorage.getItem("snocrawler-token"); // localstorage 站点存储
        globalThis.snocrawler_token ||= await globalThis?.GM?.getValue("snocrawler-token", "snocrawler-client-gm"); // gm setting 跨站点存储
        globalThis.snocrawler_token ||= "snocrawler-client";
        return globalThis.snocrawler_token;
    };
    const scTokenSet = async value => {
        await globalThis?.GM?.setValue("snocrawler-token", value);
        localStorage.setItem("snocrawler-token", value);
        globalThis.snocrawler_token = value;
    };
    await scTokenSet(await scTokenGet());
    const authHeaders = {
        Authorization: "Basic " + globalThis.snocrawler_token,
    };
    const apiFetch = async (path, body = null) => {
        console.log("apiFetching", apiBase + path);
        return await fetch(apiBase + path, {
            ...corsOptions,
            headers: { ...authHeaders },
            ...(body && {
                method: "post",
                headers: { "content-type": "application/json", ...authHeaders },
                body: JSON.stringify(body),
            }),
        })
            .then(e => e.text())
            .then(jsonpParse);
    };
    const apiGet = async (api, search = {}) => await apiFetch(!search ? api : `${api}?${new URLSearchParams(search).toString()}`);
    const apiPost = async (api, body = null) => await apiFetch(api, body);
    //
    const 报错 = async err => {
        console.error(err);
        softAlert(JSON.stringify(err, null, 4));
    };

    const 搜索任务获取 = async () => {
        const task = await apiGet("/search/task");
        // TODO (20211216.031123) 修一下这个时间附近的几个无效搜索，搜索词为id，列表大概是空的
        const nextUrl = `https://www.tianyancha.com/search?key=${task?.主体名称 ?? task?.搜索词 ?? task?._id}`;
        if (!nextUrl) {
            softAlert("未能抓取下一页任务");
            debugger;
            if (!solved) throw new Error({ code: 1, msg: "未能抓取下一页任务" });
        }

        return `${nextUrl}#${爬虫标记串}`;
    };
    const 公司爬取任务获取 = async function () {
        const task = await apiGet("/company/task");
        const nextUrl = task?.标题链接;
        if (!nextUrl) {
            softAlert("未能抓取下一页任务");
            let solved = 0;
            debugger;
            if (!solved) throw new Error({ code: 1, msg: "未能抓取下一页任务" });
        }
        return `${nextUrl}#${爬虫标记串}`;
    };

    const 公司爬取任务爬取 = async () => !DEBUG标记 && (location = await 公司爬取任务获取());
    const 搜索任务爬取 = async () => !DEBUG标记 && (location = await 搜索任务获取());
    const 新公司爬取任务爬取 = async () => window.open(await 公司爬取任务获取(), "_blank");
    const 新搜索任务爬取 = async () => window.open(await 搜索任务获取(), "_blank");

    // ui
    const 标题更新 = msg =>
        (globalThis.document.title = `${msg}${new Date().toISOString().slice(-11 - 2, -2)}${document.body.querySelector("h1").textContent}`);
    const uiShow = async () => {
        // import from cdn.jsdeliver/@fluentui/react
        const ui = Object.assign(document.createElement("div"), {
            innerHTML: `
                <div 
                    id='tycrui'
                    style='
                        position: fixed;
                        left: 0vw; top:30vh;
                        width: 20vw; height: 20vh;
                        background: #88AAAAAA;
                        color: white;
                        z-index: 99999999;
                    '
                >
                    <button>view-in-db</button>
                    <button>next-company</button>
                    <button>next-search</button>
                    <button>debug-mode-set</button>
                    <span>${await scTokenGet()}</span>
                    <div class='uiLogs'></div>
                </div>
            `,
        });
        元素搜索("next-company", ui).addEventListener("click", 新公司爬取任务爬取, false);
        元素搜索("next-search", ui).addEventListener("click", 新搜索任务爬取, false);
        元素搜索("debug-mode-set", ui).addEventListener("click", () => (globalThis.debug_flag = 1), false);
        元素搜索("view-in-db", ui).addEventListener("click", () => window.open(apiBase + "/url/" + location.href, "_BLANK"), false);
        document?.querySelector("#tycrui")?.parentElement?.remove();
        document.body.appendChild(ui);
        return ui;
        // 'https://dev.xxwl.snomiao.com:8443/api'
    };
    const ui = await uiShow();
    const uiLogs = [];
    const uiLog = (...params) => {
        document.title = params[0].toString() + (document.body.querySelector("h1")?.textContent || "");
        console.log(...params);
        uiLogs.push(params);
        if (ui)
            ui.querySelector(".uiLogs").textContent = uiLogs
                .map(e => e.join("\t"))
                .reverse()
                .join("\n");
    };
    //
    const 用户名获取 = async () => {
        let got用户名 = "";
        let trytimes = 30;
        while (!got用户名 && trytimes-- > 0) {
            got用户名 = document.querySelector(".nav-user-name")?.textContent;
            await 睡(1e3); // 用户名间隔ms
        }
        if (!got用户名) {
            const errmsg = "未能获取到用户名，请检查登录状态";
            uiLogs(errmsg);
            await 睡(2e3);
            location.reload(); // 也许重载时会跳转到登录页面
            // if (需要登录()) {
            //     location = "/login?";
            // throw new Error(errmsg);
            // }
            let solved = 0;
            debugger;
            if (!solved) throw new Error(errmsg);
        }
        return got用户名;
    };

    uiLog("加载完成");

    if (用户页面内) {
        // 会员:无
        const 用户名 = await 用户名获取();
        const VIP到期时间串 = 元素搜索("到期时间：")?.textContent?.match(/到期时间：(.*)/)?.[1];
        const VIP到期时间 = VIP到期时间串 ? new Date(VIP到期时间串 + " 00:00:00.000 GMT+8") : null;
        const VIP过期 = !!元素搜索(/开通VIP，立享/);
        const 账号 = 账号信息获取().mobile;
        const 补表 = { 账号, 用户名, ...(VIP到期时间 && { VIP到期时间 }), ...(VIP过期 && { 错误: "VIP过期", 错误于: new Date() }) };
        console.table(补表);
        const 用户状态上报结果 = await apiPost("/put", { 任务v2_天眼查_账号池: { 索引: { 账号: 1 }, 表列: [补表] } });
        console.table(用户状态上报结果);
        // logout

        if (VIP过期) {
            // 跳到登录页面
            location = "https://www.tianyancha.com/login?";
            // 元素搜索("退出登录").click();
        }
        // debugger
        // document.cookie.split(";").forEach(function(c) { document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); });
        // debugger;
        // location.reload();
        // throw new Error("reloading");
    }
    if (!爬取标记) {
        uiLog("未使用爬虫标记，退出");
        // return null;
        throw new Error("未使用爬虫标记，退出");
    }
    if (验证页面内) {
        document.title = `验${document.title}`;
        const captchaClick = async pos => {
            await 睡(2000);
            const vecAdd = (a, b) => a.map((_, i) => a[i] + b[i]);
            const ipElement = document.querySelector("div.ip");
            const [A图, B图] = [...ipElement.parentElement.querySelectorAll("img")];
            // const [A源, B源] = [A图, B图].map(e => e.getAttribute("src"));
            const offset = (({ x, y }) => [x, y])(B图.getClientRects()[0]);
            uiLog(offset);
            const [x, y] = vecAdd(offset, pos);
            const ropt = {
                isTrusted: true,
                bubbles: true,
                button: 0,
                buttons: 1,
                cancelBubble: false,
                cancelable: true,
                clientX: x,
                clientY: y,
                movementX: 0,
                movementY: 0,
                x: x,
                y: y,
            };
            B图.dispatchEvent(new MouseEvent("mouseover", ropt));
            B图.dispatchEvent(new MouseEvent("mousedown", ropt));
            B图.dispatchEvent(new MouseEvent("click", ropt));
            B图.dispatchEvent(new MouseEvent("mouseup", ropt));
            B图.dispatchEvent(new MouseEvent("mouseover", ropt));
        };
        const captchaProcess = async (loading = 0) => {
            // load merge-images module
            // if (!globalThis.mergeImages) {
            //     console.log("loading mergeImages");
            //     if (loading === 0)
            //         document.head.append(
            //             Object.assign(document.createElement("script"), {
            //                 id: "script-mergeImages",
            //                 src: "https://unpkg.com/merge-images",
            //             })
            //         );
            //     if (loading >= 10) {
            //         throw new Error("load mergeImages fail");
            //     }
            //     setTimeout(() => captchaProcess(loading + 1), 1000);
            //     return;
            //     // let k = 10;
            //     // while (!globalThis.mergeImages && k-- > 0) await 睡(1000); // wait for merge images loading
            // }
            // if (!globalThis.mergeImages) {
            //     throw new Error("load mergeImages fail");
            // }
            await 睡(3000); // wait for captcha
            const ipElement = document.querySelector("div.ip");
            const [A图, B图] = [...ipElement.parentElement.querySelectorAll("img")];
            // const [A源, B源] = [A图, B图].map(e => e.getAttribute("src"));
            const info = Object.fromEntries(
                ipElement.textContent
                    .trim()
                    .split(/\s\s+/)
                    .map(e => e.split("："))
            );
            const canvas = Object.assign(document.createElement("canvas"), {
                width: 320,
                height: 130,
            });
            const ctx = canvas.getContext("2d");
            ctx.drawImage(A图, 0, 0);
            ctx.drawImage(B图, 0, 30);
            const 验证码源 = canvas.toDataURL("image/png");
            // preview

            document.body.appendChild(
                Object.assign(document.createElement("img"), {
                    src: 验证码源,
                    style: { position: "fixed", left: 0, top: 0 },
                })
            );
            // merge images into one
            // A图：320 x 30
            // B图：320 x 100
            // const 验证码源 = await globalThis.mergeImages([
            //     A源,
            //     { src: B源, y: 30 },
            // ]);
            const 验证码数据 = { 验证码源, ...info };
            const 请求数据 = { ...验证码数据 };
            const 请求路径 = "/captcha";
            const 验证码请求结果 = await apiPost(请求路径, 请求数据);

            if (验证码请求结果.code !== 0) {
                if (验证码请求结果?.message?.match?.(/工人不足/)) location.reload();
                // debugger;
                softAlert(验证码请求结果.message);
                if (!globalThis.errorSolved) throw new Error(验证码请求结果.message);
            }
            console.log(验证码请求结果);

            const 点击坐标列 = 验证码请求结果.data.result
                .split("|")
                .map(e => e.split(",").map(e => Number(e)))
                .map(([x, y]) => [x, y - 30]);
            // click
            await amap(点击坐标列, captchaClick);
            await 睡(1000);
            // dont submit
            // submit
            document.querySelector("#submitie").click();
            // will refresh....
            await 睡(5000);
            // console.log(验证码请求结果);
        };
        await captchaProcess();
    }
    if (登录页面内) {
        console.log("正在登录");
        const 可用账号 = await apiGet("/tyc/account/get");
        // if (!可用账号) {
        //     throw new Error("未能获取可用账号");
        // }
        const docqs = sel => document.querySelector(sel);
        const qsa = (ele, sel) => [...ele?.querySelectorAll(sel)];
        const 文本获取 = e => e?.innerText || e?.textContent || "";
        const 睡 = 毫秒 => new Promise(resolve => setTimeout(resolve, 毫秒));

        await 睡(1000);
        const 密码登录标签 = docqs('[tyc-event-ch="Login.PasswordLogin"]');
        if (!密码登录标签) throw new Error("未找到密码登录选项");
        密码登录标签.click();
        await 睡(1000);

        const 手机号输入框 = docqs("#mobile");
        const 密码输入框 = docqs("#password");
        if (!手机号输入框) throw new Error("未找到手机号输入框");
        if (!密码输入框) throw new Error("未找到密码输入框");

        if (!可用账号) {
            手机号输入框?.click?.();
            softAlert("未能获取可用账号");
            throw new Error("未能获取可用账号");
        }

        手机号输入框.value = 可用账号.账号;
        密码输入框.value = 可用账号.密码;
        await 睡(1000);
        const 密码登录按钮 = docqs('[tyc-event-ch="Login.PasswordLogin.Login"]');
        密码登录按钮.click();
        await 睡(2000);
        // TODO
        // 1. 加载html2canvas模块
        // 2. 截图给 api
        // 3. 滑
        const 需要验证 = 元素搜索("请先完成下方验证");
        const optMake = (x, y) => ({
            isTrusted: true,
            bubbles: true,
            button: 0,
            buttons: 1,
            cancelBubble: false,
            cancelable: true,
            clientX: x,
            clientY: y,
            movementX: 0,
            movementY: 0,
            x: x,
            y: y,
        });
        const centerGet = (元素)=>{
            const { x, y, width: w, height: h } = 元素.getClientRects()[0];
            return [x + w / 2, y + h / 2]
        }
        const 元素拖动 = async (元素, 相对位置 = [0, 0]) => {
            const [cx, cy] = centerGet(元素);
            const [tx, ty] = [相对位置[0] + cx, 相对位置[1] + cy];
            元素.dispatchEvent(new MouseEvent("mouseover", optMake(cx, cy)));
            元素.dispatchEvent(new MouseEvent("mousedown", optMake(cx, cy)));
            const start = +new Date();
            const t1 = 2000 + Math.random() * 500;
            while (1) {
                const dt = +new Date() - start;
                const percent = dt / t1;
                if (percent > 1) break;
                const p = Math.sqrt(Math.sqrt(percent));
                const q = 1 - p;
                const [nx, ny] = [cx * q + tx * p, cy * q + ty * p];
                console.log(nx, ny);
                元素.dispatchEvent(new MouseEvent("mousemove", optMake(nx, ny)));
                元素.dispatchEvent(new MouseEvent("mousedown", optMake(nx, ny)));
                await 睡(64);
            }
            console.log(cx, cy, tx, ty);
            await 睡(100);
            元素.dispatchEvent(new MouseEvent("mousemove", optMake(tx, ty)));
            元素.dispatchEvent(new MouseEvent("mouseup", optMake(tx, ty)));
        };
        const 过验证码 = async () => {
            const { default: html2canvas } = await import("https://cdn.jsdelivr.net/npm/html2canvas@1.3.3/dist/html2canvas.esm.js");
            const canvas = await html2canvas(document.querySelector(".gt_widget"));
            const img = canvas.toDataURL();
            const knob = document.querySelector(".gt_slider_knob");
            await 元素拖动(knob, [200, 0]);
        };
        globalThis.catt = () => 过验证码();
        if (需要验证) {
            await 过验证码();
            softAlert("滑块验证TODO");

            // if (!globalThis.errorSolved) throw new Error("滑块验证TODO");
        }
        await 睡(1000);
        const tid = setInterval(async () => {
            console.log("账号错误收集上报监控中");
            const 暂停密码登录模式 = /系统检测账号 (\d+) 近期被多个设备登录，可能密码已泄露，为确保账号安全，近期已为您暂停密码登录方式，请使用其他登录方式。/;
            const 暂停密码登录模式2 = /系统检测账号 (\d+) 近期被多个设备登录，/;
            const 错误消息元素 = 元素搜索(暂停密码登录模式) || 元素搜索(暂停密码登录模式2);
            if (错误消息元素) {
                const 错误 = 错误消息元素.textContent;
                const [_, 错误账号] = 错误消息元素.textContent.match(/账号 (\d+)/) || [];
                const 账号 = 错误账号 || 账号信息获取().mobile;
                if (!账号) throw new Error("未能识别错误账号");
                const 错误上报补表 = { 账号, 错误, 错误于: new Date() };
                const 错误上报返回 = await apiPost("/put", { 任务v2_天眼查_账号池: { 索引: { 账号: 1 }, 表列: [错误上报补表] } });
                console.table(错误上报补表);
                console.table(错误上报返回);
                await 睡(10e3);
                clearInterval(tid);
                location.reload();
            }
        }, 1000);
    }
    if (搜索页面内) {
        globalThis.document.title = `爬取中: ${globalThis.document.title}`;
        const 搜索页面等待毫秒 = 3e3 + 1e3 * Math.random();
        await 睡(搜索页面等待毫秒);

        // search
        if (qsa(document, '*[tyc-event-ch="Login.PasswordLogin"]').length) {
            throw new Error("错误：需要登录");
        }
        const rl = qsa(document, ".result-list")?.[0];
        if (!rl) throw new Error("错误：未找到搜索结果列表");
        const cs = qsa(rl, ".sv-search-company");
        const 搜索结果表列 = cs
            ?.map(e => e?.querySelector("a[href]"))
            ?.map((a, i) => ({
                标题: 标题获取(a),
                标题链接: 标题链接获取(a),
                搜索结果序号: 1 + i,
                搜索于: new Date(),
            }));

        const 搜索词 = document.querySelector("[type='search']").value;
        const 标题链接 = location.origin + location.pathname;
        const 数据库录入结果 = await apiPost("/put", {
            任务v2_天眼查_公司搜索任务: {
                索引: { 搜索词: 1 },
                表列: [
                    {
                        // _id: 搜索词,
                        搜索词,
                        搜索结果: 搜索结果表列,
                        标题链接,
                        搜索于: new Date(),
                    },
                ],
            },
            任务v2_天眼查_公司信息原始数据: { 索引: { 标题链接: 1 }, 表列: [...搜索结果表列] },
        });

        if (数据库录入结果?.code === 0) {
            await 搜索任务爬取();
        } else {
            console.log(数据库录入结果);
            softAlert(JSON.stringify(数据库录入结果, null, 4));
        }
        // return 搜索结果表列;
    }
    if (公司页面内) {
        const ofe = Object.fromEntries;
        const qsa = (ele, sel) => [...ele.querySelectorAll(sel)];
        const rf2 = ls => ls.slice(ls.length / 2).map((_, i) => [ls[2 * i], ls[2 * i + 1]]);
        const 文本获取 = e => e?.innerText || e?.textContent || "";

        const 页面内容账号需求标识获取 = async () => ({
            红钻需求: !!元素搜索(/风险红钻·VIP尊享/),
            VIP需求: !!元素搜索(/开通VIP · 查看.*/),
            登录需求: !!元素搜索(/登录后查看更多信息/),
        });
        const td宽高跨度解析 = row =>
            row.map(td =>
                Object.assign(td, {
                    rowspan: Number(td.getAttribute("rowspan") || 1),
                    colspan: Number(td.getAttribute("colspan") || 1),
                })
            );
        const td横向跨度填充 = row => row.flatMap((td, x) => Array(td.colspan).fill(td));
        const td纵向跨度填充 = (t, row, y) => [
            ...t,
            row.reduce((r, td, x) => {
                const ltd = t[t.length - 1]?.[r.length];
                return ltd?.rowspan > 1
                    ? [
                          ...r,
                          Object.assign(ltd, {
                              rowspan: ltd.rowspan - 1,
                          }),
                          td,
                      ]
                    : [...r, td];
            }, []),
        ];
        const 合并单元格表体向格列列解析 = tbody =>
            [...tbody.querySelectorAll("tr")]
                .map((tr, y) => [...tr.querySelectorAll("td")])
                .map(td宽高跨度解析)
                .map(td横向跨度填充)
                .reduce(td纵向跨度填充, []);
        // console.table(
        //     .map(e=>e.map(文本获取))
        //     )
        // [...document.querySelectorAll('.link-click').map(e=>e.style.background = 'red')
        const 键文本获取 = e => {
            qsa(e, "span.link-click").map(e => e.remove());
            const t = 文本获取(e);
            if (!t) {
                console.error("未能获取键文本于", e);
                console.log(e);
                throw new Error("未能获取键文本");
            }
            return t;
        };
        const 值文本获取 = e => {
            qsa(e, "a.link-vip-more").map(e => e.remove());
            // 橙字链接清理(e);
            return 文本获取(e);
        };
        const 链接串化 = e => "[" + 文本获取(e) + "](" + e?.href + ")";
        const 文本与链接获取 = e =>
            [
                值文本获取(e),
                ...qsa(e, ":scope a[href]")
                    .filter(e => e.href.match(/^http/)) // ignore javascript
                    .map(链接串化),
            ].join("\n");
        const 单元格对解析 = ([ktd, vtd]) => [键文本获取(ktd), 文本与链接获取(vtd)];
        const 元素向父级查找 = (元素, sel) => {
            while ((元素 = 元素?.parentElement)) {
                const r = 元素.querySelector(sel);
                if (r) return r;
            }
        };
        const 表名与数量获取 = 元素 => {
            // data-header
            // console.log([...document.body.querySelectorAll('.block-data')].map(e=>[e,...[ ...e.querySelectorAll('.data-title')].map(e=>e.textContent).filter(e=>e)]))
            const 入口元素 = 元素;
            while (1) {
                if (元素.classList.contains("block-data-group")) {
                    // debugger;
                    // throw new Error("表名元素超界，请修改此处代码");
                    // 可能没有表名。。。返回空
                    return {};
                }
                const 标题sel = ":scope>.data-title,:scope>.data-header>.data-title";
                const 数量sel = ":scope>.data-count,:scope>.data-header>.data-count";
                const 标题元素 = 元素?.querySelector(标题sel);
                const 入口元素是表格 = 入口元素.classList.contains("table");
                const 入口元素是标题 = 标题元素 === 入口元素;
                // ensure counts real, avoid bare data-title without counts
                const 标题元素文本节点文本 = 元素?.querySelector(":scope>.data-header")?.firstChild?.textContent;
                const 图标标题元素 = 元素?.querySelector(":scope>.data-title>i.tic");
                const 图标类名转换表 = {
                    "tic-hezuofengxianfenxi": "合作风险分析",
                    "tic-shendufengxianfenxi": "深度风险分析",
                    "tic-jingzhengfengxian": "竞争风险",
                };
                const 图标标题元素文本 = Object.entries(图标类名转换表).find(([类名, _含义]) => 图标标题元素?.classList.contains(类名))?.[1];
                const 表名 = 文本获取(标题元素) || 标题元素文本节点文本 || 图标标题元素文本;
                if (!(入口元素是标题 || 入口元素是表格) && !表名) {
                    元素 = 元素?.parentElement;
                    continue;
                }
                const 数量串 = 文本获取(元素?.querySelector(数量sel));
                // const 工商信息数量修复 = 表名 === "工商信息" ? 1 : 0;
                const 数量 = 数量串 && Number(数量串);
                if (表名) return { 表名, 数量 };
                元素 = 元素?.parentElement;
                continue;
            }
            return null;
        };
        const 表列人员解析 = 表列 => {
            const 式 = /\[(.*?)\]\(\s*?(https?\:\/\/www.tianyancha.com\/human\/\S*?)\s*?\)/;
            const 键值对对链接解析 = ([k, v]) => {
                // 注意此处v可能不是string，故match可能不存在
                const m = v?.match?.(式);
                if (!m) return [[k, v]];
                return [
                    [k, v],
                    [k + "_名字", m[1]],
                    [k + "_链接", m[2]],
                ];
            };
            const 表处理 = 表 => ofe(Object.entries(表).flatMap(键值对对链接解析));
            return 表列?.map?.(表处理);
        };
        const 一般表格表列获取尝试 = t => {
            if (!t.querySelector(":scope>thead")) return null;
            const thtd = qsa(t, ":scope>thead>tr>*").map(键文本获取);
            const trs = qsa(t, ":scope>tbody>tr");
            const 格解析 = (td, i) => [thtd[i], 文本与链接获取(td)];
            const 行解析 = tr => ofe(qsa(tr, ":scope>td").map(格解析));
            return trs.map(行解析);
        };
        const chart表格表列获取尝试 = t => {
            if (t.classList.contains("chart-scroll-fix")) return []; // 作为参考空表 TODO
            // throw new Error("TODO");
            if (!t.classList.contains("chart-table")) return null;
            if (t.classList.contains("-chart")) {
                // TODO 抓取 chart-scroll-fix 的头

                return [];
            }
            if (t.classList.contains("-fix")) return [];
            // console.log(t);
            const years = qsa(t, ":scope>thead>tr>*").slice(1).map(键文本获取);
            const trs = qsa(t, ":scope>tbody>tr[data-chart]");
            // console.log(years, trs);
            const 格解析 = (td, i) => [years[i], 文本与链接获取(td)];
            const 行解析 = tr => {
                const tds = qsa(tr, ":scope>td");
                const head = tds[0];
                return [键文本获取(head), ofe(tds.slice(1).map(格解析))];
            };
            const chart = [ofe(trs.map(行解析))];
            return chart;
        };
        const 对键表格表列获取尝试 = t => {
            if (!t.classList.contains("-striped-col")) return null;
            return [ofe(rf2(qsa(t, ":scope>tbody>tr>td")).map(单元格对解析))];
        };
        const 历史表格表列获取尝试 = t => {
            if (!t.classList.contains("-first-col")) return null;
            const 格列列 = 合并单元格表体向格列列解析(t);
            const re = 格列列.map(row => {
                const [指标, 日期, 内容, ...空] = row.map(文本获取);
                if (空.length) {
                    console.log("未知格式的历史表格", t);
                    throw new Error("未知格式的历史表格");
                }
                return { 指标, 日期, 内容 };
            });
            return re;
        };
        // TODO: 另一种格式的表格css： .holderMirror-fixed-table
        const 各种表格表列获取尝试 = tt => chart表格表列获取尝试(tt) || 对键表格表列获取尝试(tt) || 历史表格表列获取尝试(tt) || 一般表格表列获取尝试(tt);

        const 表格表列翻页获取 = async (blockData, { 表名, 数量, 页数限制 = +Infinity }) => {
            // const 表选择器 = `.${表元素引用.className.trim().split(/ +/).join(".")}`;
            // const block_data = 向父级查找(表元素引用, ".data-content").parentElement;
            // if (!block_data) throw new Error(".data-content not found");

            blockData.scrollIntoView({ block: "center" });
            // page detect
            const bdSel = (s = "") => blockData.querySelector(s);
            const pagerSel = (s = "") => bdSel(`.pagination ${s}`.trim());

            // 缓存
            // const 分页表列表缓存名称 = `${location.pathname}#${表名}_分页表列表`;
            // const 缓存分页表列表 = await (async e => e && JSON.parse(e))(localStorage.getItem(分页表列表缓存名称)).catch();
            // 缓存分页表列表 && console.log(`${分页表列表缓存名称} 缓存读取到长度为 ${Object.values(缓存分页表列表).flat().length}`);

            const 分页表列表 = {};
            // const 分页表列表缓存尝试 = async () => {
            //     try {
            //         return localStorage.setItem(分页表列表缓存名称, JSON.stringify(分页表列表));
            //     } catch (e) {
            //         return null;
            //     }
            // };
            // if (表名 === "相关公告") debugger;
            while (1) {
                // 分页处理
                const 所在分页 = Number(pagerSel("a.-current")?.textContent || "1");
                // 表格元素获取
                const 表格 = bdSel("table.table");
                if (!表格) {
                    if (DEBUG标记) debugger;
                    throw new Error("表格元素丢失");
                }
                // 表格内容爬取
                const 表格表列 = 各种表格表列获取尝试(表格);
                if (!表格表列) {
                    console.log(表格);
                    softAlert("未知的表格表列形式");
                    if (DEBUG标记) debugger;
                    throw new Error("未知的表格表列形式");
                }
                // 保存
                const 所在分页表列 = 表格表列.map(e => ({ ...e, ...(所在分页 && { 所在分页 }) }));
                分页表列表[所在分页] = 所在分页表列;
                // await 分页表列表缓存尝试().catch();

                // 翻页处理
                const pagerbar = bdSel(`.pagination`);
                if (!pagerbar) break;
                const 稀疏可点击页面列 = [...pagerbar.querySelectorAll("a.num")]
                    .map(a => ({ a, 页码: Number(a.textContent.replace(/\D/g, "")) }))
                    .filter(e => e.页码);
                const [最小页, 最大页] = [稀疏可点击页面列[0], [...稀疏可点击页面列].reverse()[0]];
                const 已爬页码 = Object.keys(分页表列表).map(e => Number(e));
                const 剩余页码 = 整数范围列(最小页.页码, 最大页.页码).filter(页码 => !已爬页码.includes(页码));
                if (!剩余页码.length) break; // 爬取完成
                const [剩余页码最前, 剩余页码最后] = [剩余页码[0], [...剩余页码].reverse()[0]];
                const 剩余页码距离 = 页码 => Math.min(Math.abs(页码 - 剩余页码最前), Math.abs(页码 - 剩余页码最后));
                // const 剩余页码距离 = 页码 => Math.abs(页码 - 剩余页码最前);
                const 函续 =
                    (...函列) =>
                    值 =>
                        函列.reduce((值, 函) => 函(值), 值);
                const 按什么相减 = 函数 => (a, b) => 函数(a) - 函数(b);
                const 最近可点击页面 = 稀疏可点击页面列.sort(按什么相减(函续(a => a.页码, 剩余页码距离)))[0];
                const 下一页按钮 = 最近可点击页面.页码 <= 页数限制 && 最近可点击页面?.a;
                if (!下一页按钮) break;
                下一页按钮.click();
                let k = 0;
                let timeout = 0;
                while (1) {
                    const 当前页面 = Number(pagerSel("a.-current")?.textContent);
                    if (当前页面 === 最近可点击页面.页码) break;
                    console.log(`${表名}等待第${最近可点击页面.页码}页加载中，当前页面${当前页面}, ${(k && k + "次") || ""}...`);
                    blockData.scrollIntoView({ block: "center" });
                    await 睡(翻页等待毫秒);
                    if (k++ >= 30) {
                        console.log(表名, "翻页出错，分裂新任务");
                        softAlert(`翻页出错于${表名}`);
                        // await 新公司爬取任务爬取();
                        // location.reload()
                        if (翻页不正常表名列.includes(表名)) {
                            // ignore error of these ...
                            timeout = 0;
                        } else {
                            timeout = 1;
                        }
                        break;
                    }
                    标题更新("公司爬取");
                    if (bdSel(".data-content").clientHeight === 0) {
                        break; // 爬完了相当于
                    }
                    if (bdSel(".data-content").textContent === "") {
                        break; // 爬完了相当于
                    }
                }
                if (数量 && 数量 < (最大页.页码 - 1) * 10) {
                    // 明显的页码标记错误，最大页没有内容，此时认为已经爬完
                    break;
                }
                if (bdSel(".data-content").clientHeight === 0) {
                    break; // 爬完了相当于
                }
                if (bdSel(".data-content").textContent === "") {
                    break; // 加载后无内容，相当于爬完
                }
                if (timeout) {
                    debugger;
                    if (!solved) throw new Error("翻页出错，分裂新任务");
                }
            }
            return Object.values(分页表列表).flat();
        };

        const 比率误差修复尝试 = (实, 测, 比率 = 0.05) => (Math.abs(实 - 测) / 实 < 比率 ? 实 : 测);
        const 个数误差修复尝试 = (实, 测, 个数 = 10) => (Math.abs(实 - 测) < 个数 ? 实 : 测);
        const 数量容差曲线 = 规模 => Math.log(Math.max(0, 规模 || 0) + 1);
        const 对数误差修复尝试 = (实, 测, 乘数 = 2) => (Math.abs(实 - 测) < 数量容差曲线(测) * 乘数 ? 实 : 测);
        // const 误差修复尝试 = (实, 测, 比率 = undefined, 个数 = undefined) => 个数误差修复尝试(实, 比率误差修复尝试(实, 测, 比率), 个数);
        const 比率个数误差修复尝试 = (实, 测, 比率 = undefined, 个数 = undefined) => 个数误差修复尝试(实, 比率误差修复尝试(实, 测, 比率), 个数);
        const 误差修复尝试 = (实, 测) => 对数误差修复尝试(实, 测);

        // TODO 改成先查所有data-content再处理table
        const 表格容器块表列表解析 = async (blockData, 数量正常表) => {
            if (blockData.classList.contains("tab-inner")) blockData = blockData.parentElement;
            const dataContent = blockData.querySelector(".data-content");
            if (!dataContent) return {};
            const t = dataContent.querySelector("table.table");
            if (!t) return {};
            // const block_data = 向父级查找(表元素引用, ".data-content").parentElement;
            const { 表名: 块级表名, 数量: 块级数量 } = 表名与数量获取(blockData);
            const 标签信息获取 = tabItem => {
                const [标签名, 标签内数量串] = tabItem.textContent?.match(/^(.*?)(?:\s*?(\d+))?$/)?.slice(1) || [];
                const 标签内数量 = 标签内数量串 && Number(标签内数量串);
                return { 标签名, 标签内数量 };
            };
            const contentTab = blockData.querySelector(".content-tab");
            const hasTabs = blockData.querySelector(".tab-item");
            // tab-inner block-data -active
            const tabs = hasTabs && [...blockData.querySelectorAll(".tab-item")].map(标签信息获取);
            const noTabs = [{}];
            const 各标签表列表列 = await amap(tabs || noTabs, async ({ 标签名, 标签内数量 }) => {
                // 注意tab会在新标签加载之后之后被remove，所以这里检测active需要从blockData开始
                // if tab exists  then wait for the active

                const activeTabBlockDataGet = () =>
                    [...blockData.querySelectorAll(".block-data")].filter(tabBlockData => {
                        const activeTab = tabBlockData.querySelector(".tab-item.-active");
                        if (!activeTab) return null;
                        const activeTabInfo = 标签信息获取(activeTab);
                        return JSON.stringify(activeTabInfo) === JSON.stringify({ 标签名, 标签内数量 });
                    })[0] || blockData;

                if (标签名) {
                    let k = 0;
                    while (1) {
                        // wait for active tab
                        const activeTab = activeTabBlockDataGet().querySelector(".tab-item.-active");
                        const activeTabInfo = 标签信息获取(activeTab);
                        if (JSON.stringify(activeTabInfo) === JSON.stringify({ 标签名, 标签内数量 })) break;
                        // wait for active tab blockdata

                        [...activeTabBlockDataGet().querySelectorAll(".tab-item")]
                            .filter(tabItem => 标签信息获取(tabItem).标签名 === 标签名)
                            .map(e => e.click());
                        await 睡(1000);
                        if (k++ > 5) {
                            debugger;
                            if (!solved) throw new Error("wait for tab timeout");
                        }
                    }
                }

                const 表名 = (块级表名 || "") + ((标签名 && `_${标签名}`) || "");
                if (表名 === "undefined") {
                    debugger;
                }
                if (!表名) {
                    console.log(activeTabBlockDataGet());
                    debugger;
                    throw new Error("表名获取异常, debug please");
                }
                if (表名 && 数量正常表[表名]) {
                    blockData.scrollIntoView({ block: "center" });
                    uiLog(`${表名}数量${数量正常表[表名].标示数量}正常，跳过`);
                    return {}; //
                }
                const 数量 = 标签内数量 || 块级数量;
                // {表名,数量, activeTabBlockData}
                const 关键表 = /工商信息|主要人员|股东信息|对外投资|最终受益人|变更记录|开庭公告|法律诉讼/;
                const 异常表 = /资质资格|双随机抽查/;
                const 跳过否 = !!表名?.match?.(异常表); // 暂时禁用
                if (跳过否) {
                    const 错误 = "解析未实现，跳过";
                    return { [表名]: "解析未实现，跳过", [`${表名}_数量`]: 数量, ...(错误 && { [`${表名}_错误`]: 错误 }) };
                }
                const 翻页否 = !!表名?.match?.(关键表); // 暂时禁用
                const 原始表列 = await 表格表列翻页获取(activeTabBlockDataGet(), { 表名, 数量, 页数限制: +Infinity });
                //注意翻页行为会让t被remove,所以必须先搞定表名与数量
                const 解析表列 = 表列人员解析(原始表列);
                const 表列按函数去重 = (表列, 相等函数) => 表列.filter((a, index) => index === 表列.findIndex(b => 相等函数(a, b)));
                const 表列针对序号去重 = 表列 => (表列?.[0]?.序号 ? 表列按函数去重(表列, (a, b) => a.序号 === b.序号) : 表列);

                // 由于网络延迟问题可能某页会重复爬取，于是对表列去重尝试解决
                const 去重表列 = 表列针对序号去重(解析表列);
                // 爬取的比天眼查统计到的多1个，可能是天眼查数量统计更新不及时，这里尝试修正一下
                const 修补数量 = 误差修复尝试(去重表列.length, 数量 || 解析表列.length);
                let 错误 = null;
                if (去重表列.length < 修补数量) {
                    // console.log(表名, 元素搜索(表名))
                    元素搜索(表名.replace(/_.*/, "")).scrollIntoView({ block: "center" });
                    错误 = 表名 + "数据可能未解析完整" + location.href.replace(/#.*/, "");
                    softAlert(错误);
                    uiLog(表名, 去重表列, 去重表列.length, 数量);
                    const 忽略表 = 翻页不正常表名列.includes(表名);
                    const 超大表 = 去重表列.length >= 5000;
                    const 小空表 = 去重表列.length == 0 && 数量 < 2;
                    if (!忽略表 && !超大表 && !小空表) {
                        // 新公司爬取任务爬取();
                        // debugger;
                        // if (!solved) throw new Error("未解析完整");
                    }
                }
                if (去重表列.length > 修补数量) {
                    // blockData.scrollIntoView()
                    错误 = "数量获取异常，请检查页面 " + location.href.replace(/#.*/, "");
                    debugger;
                    if (!solved) throw new Error("数量获取异常");
                }
                if (表名) return { [表名]: 去重表列, [`${表名}_数量`]: 修补数量, ...(错误 && { [`${表名}_错误`]: 错误 }) };
            });
            const 表列表 = 各标签表列表列.reduce((a, b) => ({ ...a, ...b }));
            return 表列表;
        };
        // 数量验证 TODO
        const 数量表获取 = 数验doc =>
            Object.fromEntries(
                Object.entries(数验doc)
                    .filter(([k, v]) => k.endsWith("_数量"))
                    .map(([k, v]) => [k.slice(0, -3), v])
            );
        const 数量比对表获取 = doc => {
            const 数量表 = 数量表获取(doc);
            return Object.fromEntries(Object.entries(数量表).map(([表名, 标示数量]) => [表名, { 表名, 标示数量, 表列数量: doc[表名]?.length }]));
        };
        const 数量异常表获取 = async (数验doc, 忽略已知错误表) => {
            const 数量异常忽略列 = [...表名大类, ...未能爬取表名列, ...需要红钻表名列, ...空表表列];
            const 数量异常表列 = Object.entries(数量比对表获取(数验doc))
                .filter(([表名, { 标示数量, 表列数量 }]) => 标示数量 !== 表列数量)
                .filter(([表名]) => !表名.startsWith("历史")) //历史xxx格式都挺奇怪的……
                .filter(([表名]) => (忽略已知错误表 ? !数量异常忽略列.includes(表名) : 1))
                .map(([表名, { 标示数量, 表列数量 }]) => {
                    if (表列数量 && 标示数量) {
                        uiLog("数量异常表");
                        console.table({ 表名, 表列数量, 标示数量 });
                        console.table(数验doc[表名]);
                    }
                    const 修复数量 = 误差修复尝试(表列数量, 标示数量);
                    if (修复数量 === 表列数量) return null; // 忽略可能由网络同步延迟导致的偏差
                    if (标示数量 == 0 && 表列数量 > 0) {
                        // 数量修复，例如工商信息和私募基金等
                        数验doc[表名 + "_数量"] = 表列数量;
                        return null;
                    }
                    if (!表列数量 && !标示数量) {
                        // 暂未能爬取的特殊格式，忽略
                        return null;
                    }
                    return { 表名, 表列数量, 标示数量 };
                })
                .filter(e => e);
            const 数量异常表 = Object.fromEntries(数量异常表列.map(({ 表名, 表列数量, 标示数量 }) => [表名, { 表名, 表列数量, 标示数量 }]));
            return 数量异常表;
        };

        // run
        const 当前页面数据库查询 = async () => await apiPost("/url/", { url: location.href.replace(/#.*/, "") });

        const 公司数据爬取 = async () => {
            标题更新("公司爬取");
            await 睡(开始爬取等待毫秒); // wait is important
            const 用户名 = await 用户名获取();
            // 获取标题数量，
            const 库中已有内容表 = await 当前页面数据库查询();
            const 标题数量表 = Object.fromEntries(
                qsa(document, ".data-title")
                    .map(表名与数量获取)
                    .filter(e => e)
                    .map(({ 表名, 数量 }) => [表名 + "_数量", 数量])
            );
            const 数量正常表 = Object.fromEntries(
                Object.entries(数量比对表获取({ ...库中已有内容表, ...标题数量表 })).filter(([, { 标示数量, 表列数量 }]) => 标示数量 === 表列数量)
            );
            console.table(数量正常表);
            // throw new Error("check");
            const 子级表格容器块列 = qsa(document, ".block-data .block-data");
            const 最高级表格容器块列 = qsa(document, ".block-data").filter(e => !子级表格容器块列.includes(e));
            // .filter(e=>!e.querySelector('.data-title').textContent));

            const 表列数据表 = (await (DEBUG标记 ? amap : pmap)(最高级表格容器块列, async e => await 表格容器块表列表解析(e, 数量正常表))).reduce((a, b) => ({
                ...a,
                ...b,
            }));
            // .filter(({ 表名 }) => 表名 && !表名.match("："))
            // .filter(({ 表列 }) => 表列)
            // .flatMap(({ 表名, 数量, 表列, 错误 }) =>
            //     [[表名, 表列], [`${表名}_数量`, 数量], 错误 && [`${表名}_错误`, 错误]].filter(e => e)

            const 以键名排序 = ([ka], [kb]) => ka.localeCompare(kb);
            const 无序汇总返回表 = { ...标题数量表, ...表列数据表 };
            const 汇总返回表列表 = ofe(Object.entries(无序汇总返回表).sort(以键名排序));
            const 表打印 = ([键, 值]) => {
                if (typeof 值 === "object") return console.table(值);
                return uiLog(`${键}:${值}`);
            };
            // 打印
            const 标签描述表 = ofe(
                qsa(document, ".-company-box .tag-common")
                    .map(e => e.innerText.split(/\r?\n/g))
                    .map(([k, ...v]) => [k, v.join("\n")])
            );
            const 标签列 = Object.keys(标签描述表);
            const 标签信息表 = ofe(
                Object.entries(标签描述表)
                    .join("\n")
                    .match(/(.*?)：(.*)/g)
                    ?.map(e => e.match(/(.*?)：(.*)/).slice(1)) || []
            );
            const 公司基本信息表 = ofe(
                [...document.querySelectorAll(".-company-box .detail .in-block .label")].map(e => [
                    e.textContent.slice(0, -1),
                    e.nextElementSibling.textContent.replace(/任职\d*家企业/g, "").replace(/\s*\.\.\.\s+更多\s*/g, ""),
                ])
            );
            const 风险表 = ofe(
                qsa(document, ".risk-item")
                    .map(文本获取)
                    .map(e => e.split("\n"))
            );
            const 数量异常表 = await 数量异常表获取(汇总返回表列表);
            const 账号需求 = await 页面内容账号需求标识获取();
            if (账号需求.登录需求) location = "https://www.tianyancha.com/login?";
            if (账号需求.VIP需求) location = "https://www.tianyancha.com/usercenter/personalcenter"; // 去查看VIP过期信息
            const 账号 = 账号信息获取().mobile;
            const 公司情况表 = {
                ...公司基本信息表,
                标签列,
                标签描述表,
                ...标签信息表,
                风险表,
                ...汇总返回表列表,
                ...(数量异常表?.length && { 数量异常表 }),
                账号信息: { 账号, 用户名 },
                账号需求,
            };
            Object.entries(公司情况表).map(表打印);
            globalThis.debugResult = 公司情况表;
            globalThis.debugResultStr = JSON.stringify(公司情况表);
            return 公司情况表;
        };

        const 数据上报 = async 公司情况表 => {
            const 上传JSON = {
                公司数据表列: [
                    {
                        标题链接: location.origin + location.pathname,
                        解析于: new Date(),
                        ...公司情况表,
                    },
                ],
            };
            uiLog("正在上报录入数据库", 上传JSON);
            const 数据库录入结果 = await apiPost("/tyc/put", 上传JSON);
            uiLog("数据库录入结果", 数据库录入结果);
            // const 当页缓存清除 = () => [...Object.keys(localStorage)].filter(e => e.startsWith(location.pathname)).map(e => localStorage.removeItem(e));
            // 当页缓存清除();

            if (数据库录入结果?.code !== 0) {
                uiLog(数据库录入结果);
                softAlert(JSON.stringify(数据库录入结果, null, 4));
                debugger;
                throw new Error("数据库未录入完成");
            }
        };
        const 公司情况表 = await 公司数据爬取();
        await 数据上报(公司情况表);

        // 调试
        const 数量异常表 = 公司情况表?.数量异常表;
        if (数量异常表 && Object.keys(数量异常表).length) {
            // uiLog(数据库录入结果);
            console.table(数量异常表);
            // 继续
            await 新公司爬取任务爬取();
            softAlert("数量检查异常，please check");
            // for debug
            // window.open(location.pathname, "_blank");
            let solved = 0;
            debugger;
            if (!solved) throw new Error("未解析完整");
        }
        // 爬下一个任务
        await 公司爬取任务爬取();
    }
})();
