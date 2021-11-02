globalThis.clear?.();
(() => {
    const qsa = (ele, sel) => [...ele?.querySelectorAll(sel)];
    const 文本获取 = (e) => e?.innerText || e?.textContent || "";
    document?.querySelector('[tyc-event-ch="Login.PasswordLogin"]')?.click?.();

    if ("undefined" === typeof injectInput) {
        // injectInput = { phone: "15821483509", password: "zzzz8888" };
        document.querySelector("#mobile")?.click?.();
        return;
    }
    document.querySelector("#mobile").value = injectInput.phone;
    document.querySelector("#password").value = injectInput.password;
    document
        ?.querySelector('[tyc-event-ch="Login.PasswordLogin.Login"]')
        ?.click?.();

    // search
    // const cs = qsa(document, ".result-list .sv-search-company");
    // const re = cs?.[0];
    // const 标题 = re?.querySelector("a")?.textContent;
    // const 标题链接 = re?.querySelector("a")?.href;
    // return { 标题, 标题链接 };
})();
