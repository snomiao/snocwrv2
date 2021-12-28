(async () => {
    globalThis.clear?.();
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
        // injectInput = { phone: "15821483509", password: "zzzz8888" };
        手机号输入框?.click?.();
        alert("inject obj not found");
        return;
    }
    手机号输入框.value = injectInput.phone;
    密码输入框.value = injectInput.password;
    await 睡(1000);
    const 密码登录按钮 = docqs('[tyc-event-ch="Login.PasswordLogin.Login"]');
    密码登录按钮.click();
    await 睡(1000);
    return true;
})();
