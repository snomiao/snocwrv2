// https://www.tianyancha.com/search?key=
(() => {
    globalThis.clear?.();
    const qsa = (ele, sel) => [...ele?.querySelectorAll(sel)];
    const 文本获取 = (e) => e?.innerText || e?.textContent || "";
    const 标题获取 = (e) => 文本获取(e);
    const 标题链接获取 = (e) => e?.href;

    // search
    const cs = qsa(document, ".result-list .sv-search-company");
    return cs
        ?.map((e) => e?.querySelector("a[href]"))
        ?.map((a, i) => ({
            标题: 文本获取(a),
            标题链接: 标题链接获取(a),
            搜索结果序号: 1 + i,
        }));
})();
