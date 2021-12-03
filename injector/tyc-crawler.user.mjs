// ==UserScript==
// @name         tyc-crawler
// @namespace    snomiao@gmail.com
// @version      0.1.0
// @description  rt
// @author       snomiao@gmail.com
// @match        https://www.tianyancha.com/company/*
// @match        https://www.tianyancha.com/search*
// @match        https://www.tianyancha.com/login*
// @match        https://antirobot.tianyancha.com/captcha/verify?*
// @grant        noneu
// ==/UserScript==

(async () => {
    globalThis.clear?.();

    // capt....
    const after_captcha_Q = location.search.match(/rnd=/);
    const crawler_mark = "snocrawler";
    const crawler_mark_Q = location.hash === `#${crawler_mark}`;
    if (!(after_captcha_Q || crawler_mark_Q)) {
        return null;
    }

    const 睡 = ms => new Promise(resolve => setTimeout(resolve, ms));
    const qsa = (ele, sel) => [...ele?.querySelectorAll(sel)];
    const 文本获取 = e => e?.innerText || e?.textContent || "";
    const 标题获取 = e => 文本获取(e);
    const 标题链接获取 = e => e?.href;

    const amap = async (a, f) => {
        const r = [];
        for await (const i of a) {
            r.push(await f(i));
        }
        return r;
    };
    const apiGet = async (url, search = {}) =>
        await fetch("https://dev.xxwl.snomiao.com:8443/api/tyc/account/get", {
            mode: "cors",
            credentials: "include",
        })
            .then(e => e.text())
            .then(e => {
                const _ = json => json;
                return eval(e);
            });
    if (location.href.indexOf("https://www.tianyancha.com/login") + 1) {
        const 可用账号 = await apiGet(
            "https://dev.xxwl.snomiao.com:8443/api/tyc/account/get"
        );
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
            // injectInput = { phone: "15821483509", password: "zzzz8888" };
            手机号输入框?.click?.();
            alert("inject obj not found");
            throw new Error("未能获取可用账号");
        }

        手机号输入框.value = 可用账号.账号;
        密码输入框.value = 可用账号.密码;
        await 睡(1000);
        const 密码登录按钮 = docqs(
            '[tyc-event-ch="Login.PasswordLogin.Login"]'
        );
        密码登录按钮.click();
        await 睡(5000);
        const 需要验证 = [...document.querySelectorAll("*")]
            .reverse()
            .find(e => e.textContent.match("请先完成下方验证"));
        if (需要验证) {
            alert("滑块验证TODO");
            throw new Error("滑块验证TODO");
        }
    }

    if (
        location.href.indexOf(
            "https://antirobot.tianyancha.com/captcha/verify?return_url="
        ) + 1
    ) {
        document.title = `验证码识别中： ${document.title}`;
        const captchaClick = async pos => {
            await 睡(2000);
            const vecAdd = (a, b) => a.map((_, i) => a[i] + b[i]);
            const ipElement = document.querySelector("div.ip");
            const [A图, B图] = [
                ...ipElement.parentElement.querySelectorAll("img"),
            ];
            // const [A源, B源] = [A图, B图].map(e => e.getAttribute("src"));
            const offset = (({ x, y }) => [x, y])(B图.getClientRects()[0]);
            console.log(offset);
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
            const [A图, B图] = [
                ...ipElement.parentElement.querySelectorAll("img"),
            ];
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
            const 验证码请求结果 = await fetch(
                "https://dev.xxwl.snomiao.com:8443/api/captcha",
                {
                    method: "post",
                    headers: { "content-type": "application/json" },
                    mode: "cors",
                    credentials: "include",
                    body: JSON.stringify({ ...验证码数据 }),
                }
            )
                .then(e => e.text())
                .then(e => {
                    const _ = json => json;
                    return eval(e);
                });
            if (验证码请求结果.code !== 0)
                throw new Error(验证码请求结果.message);
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

    if (location.href.indexOf("https://www.tianyancha.com/login") + 1) {
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
        if ("undefined" === typeof injectInput) {
            // injectInput = { phone:"15821483509", password: "zzzz8888" };
            手机号输入框?.click?.();
            alert("inject obj not found");
            return;
        }
        手机号输入框.value = injectInput.phone;
        密码输入框.value = injectInput.password;
        await 睡(1000);
        const 密码登录按钮 = docqs(
            '[tyc-event-ch="Login.PasswordLogin.Login"]'
        );
        密码登录按钮.click();
        await 睡(1000);
        return true;
    }
    if (location.href.indexOf("https://www.tianyancha.com/search") + 1) {
        globalThis.document.title = `爬取中: ${globalThis.document.title}`;
        await 睡(5e3 + 10e3 * Math.random());

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
        const 数据库录入结果 = await fetch(
            "https://dev.xxwl.snomiao.com:8443/api/tyc/put",
            {
                method: "post",
                headers: { "content-type": "application/json" },
                // headers: { "content-type": "text/plain" },
                mode: "cors",
                credentials: "include",
                body: JSON.stringify({
                    搜索任务表列: [
                        {
                            _id: 搜索词,
                            标题链接,
                            搜索于: new Date(),
                        },
                    ],
                    公司数据表列: [...搜索结果表列],
                }),
            }
        )
            .then(e => e.text())
            .then(e => {
                const _ = json => json;
                return eval(e);
            });

        if (数据库录入结果?.code === 0) {
            // 爬下一个
            await nextSearchGo();
        } else {
            console.log(数据库录入结果);
            alert(JSON.stringify(数据库录入结果, null, 4));
        }

        return 搜索结果表列;

        async function nextSearchGo() {
            const task = await fetch(
                "https://dev.xxwl.snomiao.com:8443/api/search/task",
                { mode: "cors", credentials: "include" }
            )
                .then(e => e.text())
                .then(e => {
                    const _ = json => json;
                    return eval(e);
                });
            const nextUrl = `https://www.tianyancha.com/search?key=${task?._id}`;
            if (!nextUrl) {
                const err = {
                    code: 1,
                    msg: "未能抓取下一页搜索任务，请检查API服务器",
                };
                console.error(err);
                alert(JSON.stringify(err, null, 4));
            }
            location = `${nextUrl}#${crawler_mark}`;
        }
    }
    // company
    if (location.href.indexOf("https://www.tianyancha.com/company/") + 1) {
        const 开始爬取等待毫秒 = 10e3; // 确保加载完成
        const 用户名获取间隔毫秒 = 1e3;
        const 上翻页间隔毫秒 = 3e3;
        const 下翻页间隔毫秒 = 3e3;
        const 睡 = ms => new Promise(resolve => setTimeout(resolve, ms)); // 用户名间隔ms
        const ofe = Object.fromEntries;
        const qsa = (ele, sel) => [...ele.querySelectorAll(sel)];
        const rf2 = ls =>
            ls.slice(ls.length / 2).map((_, i) => [ls[2 * i], ls[2 * i + 1]]);
        const 文本获取 = e => e?.innerText || e?.textContent || "";
        const 用户名获取 = async () => {
            let got用户名 = "";
            let trytimes = 10;
            while (!got用户名 && trytimes-- > 0) {
                got用户名 =
                    document.querySelector(".nav-user-name")?.textContent;
                await 睡(用户名获取间隔毫秒); // 用户名间隔ms
            }
            if (!got用户名) {
                const errmsg = "未能获取到用户名，请检查登录状态";
                alert(errmsg);
                throw new Error(errmsg);
            }
            return got用户名;
        };
        const 页面内容账号需求标识获取 = async () => ({
            红钻需求: !!qsa(document, "*")
                .reverse()
                .find(e => e.textContent.match(/风险红钻·VIP尊享/)),
            VIP需求: !!qsa(document, "*")
                .reverse()
                .find(e => e.textContent.match(/开通VIP · 查看.*/)),
            登录需求: !!qsa(document, "*")
                .reverse()
                .find(e => e.textContent.match(/登录后查看更多信息/)),
        });
        const 复杂表体向格列列解析 = tbody =>
            [...tbody.querySelectorAll("tr")]
                .map((tr, y) => [...tr.querySelectorAll("td")])
                .map(row =>
                    row.map(td =>
                        Object.assign(td, {
                            rowspan: Number(td.getAttribute("rowspan") || 1),
                            colspan: Number(td.getAttribute("colspan") || 1),
                        })
                    )
                )
                .map(row => row.flatMap((td, x) => Array(td.colspan).fill(td)))
                .reduce(
                    (t, row, y) => [
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
                    ],
                    []
                );
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
        const 单元格对解析 = ([ktd, vtd]) => [
            键文本获取(ktd),
            文本与链接获取(vtd),
        ];
        const 向父级查找 = (元素, sel) => {
            while ((元素 = 元素?.parentElement)) {
                const r = 元素.querySelector(sel);
                if (r) return r;
            }
        };
        const 表名与数量获取 = 元素 => {
            while ((元素 = 元素?.parentElement)) {
                const 标题sel = ":scope>.data-title,.data-header>.data-title";
                const 数量sel = ":scope>.data-count,.data-header>.data-count";
                const 表名 = 文本获取(元素?.querySelector(标题sel));
                const 数量串 = 文本获取(元素?.querySelector(数量sel));
                if (表名) return { 表名, 数量: Number(数量串) || 0 };
            }
            return null;
        };
        const 表列人员解析 = 表列 => {
            const 式 =
                /\[(.*?)\]\(\s*?(https?\:\/\/www.tianyancha.com\/human\/\S*?)\s*?\)/;
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
            const 表处理 = 表 =>
                ofe(Object.entries(表).flatMap(键值对对链接解析));
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
            const 格列列 = 复杂表体向格列列解析(t);
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
        const 表格表列翻页获取 = async (t_byRef, 翻页否 = true) => {
            const tSel = `.${t_byRef.className.trim().split(/ +/).join(".")}`;
            const dc = 向父级查找(t_byRef, ".data-content").parentElement;
            if (!dc) throw new Error(".data-content not found");
            dc.scrollIntoView();
            // page detect
            const dcSel = (s = "") => dc.querySelector(s);
            const pagerSel = (s = "") => dcSel(`.company_pager ${s}`);
            const pagerExists = !!pagerSel();
            // try go back to first page
            while (pagerExists) {
                const prevBtn = pagerSel("a.-prev");
                if (!prevBtn) break;
                prevBtn.click();
                await 睡(上翻页间隔毫秒); // 用户名间隔ms
            }
            const r = [];
            while (1) {
                const 所在分页 = pagerSel("a.-current")?.textContent;
                const tt = dcSel(tSel);
                if (!tt) debugger;
                const rp =
                    chart表格表列获取尝试(tt) ||
                    对键表格表列获取尝试(tt) ||
                    历史表格表列获取尝试(tt) ||
                    一般表格表列获取尝试(tt);
                if (!rp) {
                    console.log(tt);
                    throw new Error("no matched table format");
                }
                r.push(
                    ...rp.map(e => ({ ...e, ...(所在分页 && { 所在分页 }) }))
                );
                const nextBtn = pagerSel("a.-next");
                if (nextBtn && 翻页否) {
                    nextBtn.click();
                    await 睡(下翻页间隔毫秒); //等10秒翻页
                } else {
                    break; // end...
                }
            }
            // if (pagerExists) debugger;
            return r;
        };
        // TODO 改成先查所有data-content再处理table
        const 表格解析 = async t => {
            const { 表名, 数量 } = 表名与数量获取(t);
            const 关键表 =
                /工商信息|主要人员|股东信息|对外投资|最终受益人|变更记录|开庭公告|法律诉讼/;
            const 翻页否 = !!表名?.match?.(关键表);

            //注意翻页行为会让t被remove,所以必须先搞定表名与数量
            const 表列 = 表列人员解析(await 表格表列翻页获取(t, 翻页否));
            return {
                表名,
                数量,
                表列,
            };
        };

        // run
        globalThis.document.title = `爬取中: ${globalThis.document.title}`;

        await 睡(开始爬取等待毫秒); // wait is important
        const 用户名 = await 用户名获取();

        const 表格列 = qsa(document, ".data-content table.table");
        const 表列对列 = (await amap(表格列, 表格解析))
            .filter(({ 表名 }) => 表名 && !表名.match("："))
            .filter(({ 表列 }) => 表列)
            .map(({ 表名, 数量, 表列 }) => [表名, 表列]);
        const 数量对列 = qsa(document, ".data-title")
            .map(表名与数量获取)
            .filter(e => e)
            .map(({ 表名, 数量 }) => [表名 + "_数量", 数量]);
        const 以键名排序 = ([ka], [kb]) => ka.localeCompare(kb);
        const 汇总返回表列表 = ofe([...表列对列, ...数量对列].sort(以键名排序));
        const 表打印 = ([键, 值]) => {
            if (typeof 值 === "object") {
                return console.table(值);
            }
            return console.log(`${键}:${值}`);
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
            [
                ...document.querySelectorAll(
                    ".-company-box .detail .in-block .label"
                ),
            ].map(e => [
                e.textContent.slice(0, -1),
                e.nextElementSibling.textContent
                    .replace(/任职\d*家企业/g, "")
                    .replace(/\s*\.\.\.\s+更多\s*/g, ""),
            ])
        );
        const 风险表 = ofe(
            qsa(document, ".risk-item")
                .map(文本获取)
                .map(e => e.split("\n"))
        );

        const 公司情况表 = {
            ...公司基本信息表,
            标签列,
            标签描述表,
            ...标签信息表,
            风险表,
            ...汇总返回表列表,
            账号信息: { 用户名 },
            账号需求: { ...页面内容账号需求标识获取() },
        };
        Object.entries(公司情况表).map(表打印);
        globalThis.debugResult = 公司情况表;
        globalThis.debugResultStr = JSON.stringify(公司情况表);
        // localStorage.setItem('company-')
        // throw new Error("check");
        // 上报录入数据库
        const 数据库录入结果 = await fetch(
            "https://dev.xxwl.snomiao.com:8443/api/tyc/put",
            {
                method: "post",
                headers: { "content-type": "application/json" },
                // headers: { "content-type": "text/plain" },
                mode: "cors",
                credentials: "include",
                body: JSON.stringify({
                    公司数据表列: [
                        {
                            标题链接: location.origin + location.pathname,
                            解析于: new Date(),
                            ...globalThis.debugResult,
                            // ...公司情况表,
                        },
                    ],
                }),
            }
        )
            .then(e => e.text())
            .then(e => {
                const _ = json => json;
                return eval(e);
            });

        if (数据库录入结果?.code === 0) {
            // 爬下一个
            await nextCompanyGo();
        } else {
            console.log(数据库录入结果);
            alert(JSON.stringify(数据库录入结果, null, 4));
        }
        return 公司情况表;

        async function nextCompanyGo() {
            const task = await fetch(
                "https://dev.xxwl.snomiao.com:8443/api/company/task",
                { mode: "cors", credentials: "include" }
            )
                .then(e => e.text())
                .then(e => {
                    const _ = json => json;
                    return eval(e);
                });
            const nextUrl = task?.标题链接;
            if (!nextUrl) {
                const err = { code: 1, msg: "未能抓取下一页任务" };
                console.error(err);
                alert(JSON.stringify(err, null, 4));
            }
            location = `${nextUrl}#${crawler_mark}`;
        }
    }
})();
