globalThis.clear?.();
(() => {
    const qsa = (ele, sel) => [...ele.querySelectorAll(sel)];
    const rf2 = (ls) =>
        ls.slice(ls.length / 2).map((_, i) => [ls[2 * i], ls[2 * i + 1]]);
    const 文本获取 = (e) => e?.innerText || e?.textContent || "";
    const 表键文本获取 = (e) =>
        e?.querySelector("a,span[onclick]")
            ? e?.childNodes?.[0]?.textContent
            : 文本获取(e);
    const 链接串化 = (e) => "[" + 文本获取(e) + "](" + e?.href + ")";
    const 文本与链接获取 = (e) =>
        [文本获取(e), ...qsa(e, ":scope a[href]").map(链接串化)].join("\n");
    const 一般表格表列获取 = (t) => {
        const thtd = qsa(t, ":scope>thead>tr>*").map(表键文本获取);
        const trs = qsa(t, ":scope>tbody>tr");
        const 格解析 = (td, i) => [thtd[i], 文本与链接获取(td)];
        const 行解析 = (tr) =>
            Object.fromEntries(qsa(tr, ":scope>td").map(格解析));
        return trs.map(行解析);
    };
    const 单元格对解析 = ([ktd, vtd]) => [
        表键文本获取(ktd),
        文本与链接获取(vtd),
    ];
    const 对键表格表列获取 = (t) => [
        Object.fromEntries(rf2(qsa(t, ":scope>tbody>tr>td")).map(单元格对解析)),
    ];
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
            Object.fromEntries(Object.entries(表).flatMap(键值对对链接解析));
        return 表列?.map?.(表处理);
    };
    const 表格表列获取 = (t) => {
        if (t.classList.contains("-striped-col")) {
            return 对键表格表列获取(t);
        } else if (t.classList.contains("-first-col")) {
            // 历史xxx
            return null;
        } else if (t.querySelector(":scope>thead")) {
            return 一般表格表列获取(t);
        } else {
            throw new Error("no matched table format");
        }
    };
    const 表格解析 = (t) => ({
        表列: 表列人员解析(表格表列获取(t)),
        ...表名与数量获取(t),
    });
    const 橙字链接清理 = () =>
        [...document.querySelectorAll("span[onclick]")].map((e) => e.remove());
    const 表名与数量串化 = ({ 表名, 数量 }) => 表名 + ":" + 数量;

    橙字链接清理();
    const 表格列 = [...document.querySelectorAll("table.table")];
    const 表列对列 = 表格列
        .map(表格解析)
        .filter(({ 表名 }) => 表名 && !表名.match("："))
        .filter(({ 表列 }) => 表列)
        .map(({ 表名, 数量, 表列 }) => [表名, 表列]);
    const 数量对列 = [...document.querySelectorAll(".data-title")]
        .map(表名与数量获取)
        .filter((e) => e)
        .map(({ 表名, 数量 }) => [表名 + "_数量", 数量]);
    const 以键名排序 = ([ka], [kb]) => ka.localeCompare(kb);
    const 汇总返回表列表 = Object.fromEntries(
        [...表列对列, ...数量对列].sort(以键名排序)
    );
    const 表打印 = ([表名, 值]) => {
        if (typeof 值 === "number")
            console.log(表名与数量串化({ 表名, 数量: 值 }));
        else console.table(值);
    };
    // 打印
    Object.entries(汇总返回表列表).map(表打印);
    return 汇总返回表列表;
})();
