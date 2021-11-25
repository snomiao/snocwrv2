// https://www.tianyancha.com/search?key=
(() => {
    globalThis.clear?.();
    const qsa = (ele, sel) => [...ele?.querySelectorAll(sel)];
    const 文本获取 = e => e?.innerText || e?.textContent || "";
    const 标题获取 = e => 文本获取(e);
    const 标题链接获取 = e => e?.href;
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
            标题: 文本获取(a),
            标题链接: 标题链接获取(a),
            搜索结果序号: 1 + i,
        }));
    return 搜索结果表列;
})();
