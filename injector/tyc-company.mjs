globalThis.clear?.();
(() => {
    const ofe = Object.fromEntries;
    const qsa = (ele, sel) => [...ele.querySelectorAll(sel)];
    const rf2 = (ls) =>
        ls.slice(ls.length / 2).map((_, i) => [ls[2 * i], ls[2 * i + 1]]);
    const 文本获取 = (e) => e?.innerText || e?.textContent || "";
    // [...document.querySelectorAll('.link-click').map(e=>e.style.background = 'red')
    const 键文本获取 = (e) => {
        qsa(e, "span.link-click").map((e) => e.remove());
        const t = 文本获取(e);
        if (!t) {
            console.error("未能获取键文本于", e);
            console.log(e);
            throw new Error("未能获取键文本");
        }
        return t;
    };
    const 值文本获取 = (e) => {
        qsa(e, "a.link-vip-more").map((e) => e.remove());
        // 橙字链接清理(e);
        return 文本获取(e);
    };
    const 链接串化 = (e) => "[" + 文本获取(e) + "](" + e?.href + ")";
    const 文本与链接获取 = (e) =>
        [值文本获取(e), ...qsa(e, ":scope a[href]").map(链接串化)].join("\n");
    const 单元格对解析 = ([ktd, vtd]) => [键文本获取(ktd), 文本与链接获取(vtd)];
    const 表名与数量获取 = (元素) => {
        while ((元素 = 元素?.parentElement)) {
            const 标题sel = ":scope>.data-title,.data-header>.data-title";
            const 数量sel = ":scope>.data-count,.data-header>.data-count";
            const 表名 = 文本获取(元素?.querySelector(标题sel));
            const 数量串 = 文本获取(元素?.querySelector(数量sel));
            if (表名) return { 表名, 数量: Number(数量串) || 0 };
        }
        return null;
    };
    const 表列人员解析 = (表列) => {
        const 式 =
            /\[(.*?)\]\(\s*?(https?\:\/\/www.tianyancha.com\/human\/\S*?)\s*?\)/;
        const 键值对对链接解析 = ([k, v]) => {
            const m = v.match(式);
            if (!m) return [[k, v]];
            return [
                [k, v],
                [k + "_名字", m[1]],
                [k + "_链接", m[2]],
            ];
        };
        const 表处理 = (表) =>
            ofe(Object.entries(表).flatMap(键值对对链接解析));
        return 表列?.map?.(表处理);
    };
    const 一般表格表列获取尝试 = (t) => {
        if (!t.querySelector(":scope>thead")) return null;
        const thtd = qsa(t, ":scope>thead>tr>*").map(键文本获取);
        const trs = qsa(t, ":scope>tbody>tr");
        const 格解析 = (td, i) => [thtd[i], 文本与链接获取(td)];
        const 行解析 = (tr) => ofe(qsa(tr, ":scope>td").map(格解析));
        return trs.map(行解析);
    };
    const chart表格表列获取尝试 = (t) => {
        if (!t.classList.contains("chart-table")) return null;
        if (t.classList.contains("-fix")) return [];
        console.log(t);
        const years = qsa(t, ":scope>thead>tr>*").slice(1).map(键文本获取);
        const trs = qsa(t, ":scope>tbody>tr[data-chart]");
        // console.log(years, trs);
        const 格解析 = (td, i) => [years[i], 文本与链接获取(td)];
        const 行解析 = (tr) => {
            const tds = qsa(tr, ":scope>td");
            const head = tds[0];
            return [键文本获取(head), ofe(tds.slice(1).map(格解析))];
        };
        const chart = [ofe(trs.map(行解析))];
        return chart;
    };
    const 对键表格表列获取尝试 = (t) => {
        if (!t.classList.contains("-striped-col")) return null;
        return [ofe(rf2(qsa(t, ":scope>tbody>tr>td")).map(单元格对解析))];
    };
    const 历史表格表列获取尝试 = (t) => {
        if (!t.classList.contains("-first-col")) return null;
        const re = qsa(t, "tr").map((tr) => {
            const [指标, 日期, 内容, ...空] = qsa(tr, "td").map(td=>{
                td.getAttru
            }).map(文本获取);

            if (空.length) {
                console.log("未知格式的历史表格", t);
                throw new Error("未知格式的历史表格");
            }
            return { 指标, 日期, 内容 };
        });
        if (re.length > 1) {
            return null
            console.log(re);
            throw new Error("TODO CHECK");
        }
        return re;
    };
    const 表格表列获取 = (t) => {
        const r =
            chart表格表列获取尝试(t) ||
            对键表格表列获取尝试(t) ||
            历史表格表列获取尝试(t) ||
            一般表格表列获取尝试(t);
        if (!r) {
            throw new Error("no matched table format");
        }
        return r;
    };
    const 表格解析 = (t) => ({
        表列: 表列人员解析(表格表列获取(t)),
        ...表名与数量获取(t),
    });
    // const 橙字链接清理 = (e) =>
    //     qsa(e,"span[onclick]").map((e) => e.remove());
    const 键值串化 = ({ 表名, 数量 }) => 表名 + ":" + 数量;
    // 橙字链接清理();
    const 表格列 = qsa(document, "table.table");
    const 表列对列 = 表格列
        .map(表格解析)
        .filter(({ 表名 }) => 表名 && !表名.match("："))
        .filter(({ 表列 }) => 表列)
        .map(({ 表名, 数量, 表列 }) => [表名, 表列]);
    const 数量对列 = qsa(document, ".data-title")
        .map(表名与数量获取)
        .filter((e) => e)
        .map(({ 表名, 数量 }) => [表名 + "_数量", 数量]);
    const 以键名排序 = ([ka], [kb]) => ka.localeCompare(kb);
    const 汇总返回表列表 = ofe([...表列对列, ...数量对列].sort(以键名排序));
    const 表打印 = ([键, 值]) => {
        if (typeof 值 === "object") return console.table(值);
        return console.log(`${键}:${值}`);
    };
    // 打印
    const 标签描述表 = ofe(
        qsa(document, ".-company-box .tag-common")
            .map((e) => e.innerText.split(/\r?\n/g))
            .map(([k, ...v]) => [k, v.join("\n")])
    );
    const 标签列 = Object.keys(标签描述表);
    const 标签信息表 = ofe(
        Object.entries(标签描述表)
            .join("\n")
            .match(/(.*?)：(.*)/g)
            .map((e) => e.match(/(.*?)：(.*)/).slice(1))
    );
    const 公司基本信息表 = ofe(
        [
            ...document.querySelectorAll(
                ".-company-box .detail .in-block .label"
            ),
        ].map((e) => [
            e.textContent.slice(0, -1),
            e.nextElementSibling.textContent
                .replace(/任职\d*家企业/g, "")
                .replace(/\s*\.\.\.\s+更多\s*/g, ""),
        ])
    );
    const 风险表 = ofe(
        qsa(document, ".risk-item")
            .map(文本获取)
            .map((e) => e.split("\n"))
    );

    const 公司情况表 = {
        ...公司基本信息表,
        标签列,
        标签描述表,
        ...标签信息表,
        风险表,
        ...汇总返回表列表,
    };

    Object.entries(公司情况表).map(表打印);
    return 公司情况表;
})();
