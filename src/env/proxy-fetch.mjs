const { HttpsProxyAgent } = (await import("https-proxy-agent")).default;
const fetch = await import("node-fetch").then(e => e.default);
const agent = new HttpsProxyAgent("http://wnas.:7890");
const content = await fetch("https://google.com", { agent }).then(e =>
    e.text()
);
console.log(content);
