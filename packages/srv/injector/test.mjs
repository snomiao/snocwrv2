import { page, pageGotoWait } from "../src/browser.mjs";

await pageGotoWait('https://example.com')
const fn = `
globalThis.clear?.();
 (async () => {
    const color = await new Promise((resolve, reject) => {
      resolve('blue');
    })
    document.body.style.background = color;
    return color
  } ) ()`
const re = await page.evaluate(fn);
console.log(re);
// await page.screenshot({path: 'screenshot.png', fullPage: true});
