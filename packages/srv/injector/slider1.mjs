import { gray } from "color-name";

const 睡 = (毫秒) => new Promise((resolve) => setTimeout(resolve, 毫秒));
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
const 元素拖动 = async (元素, 相对位置 = [0, 0]) => {
  const { x, y, width: w, height: h } = 元素.getClientRects()[0];
  const [cx, cy] = [x + w / 2, y + h / 2];
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
    元素.dispatchEvent(new MouseEvent("mouseover", optMake(nx, ny)));
    元素.dispatchEvent(new MouseEvent("mousedown", optMake(nx, ny)));
    await 睡(64);
  }
  console.log(cx, cy, tx, ty);
  await 睡(100);
  元素.dispatchEvent(new MouseEvent("mouseover", optMake(tx, ty)));
  元素.dispatchEvent(new MouseEvent("mouseup", optMake(tx, ty)));
};
const 过验证码 = async () => {
  const { default: html2canvas } = await import(
    "https://cdn.jsdelivr.net/npm/html2canvas@1.3.3/dist/html2canvas.esm.js"
  );

  let canvas = document.createElement("canvas"); // for language suggests
  canvas = await html2canvas(document.querySelector(".gt_cut_bg"), {
    useCORS: true,
  });
  canvas.style.position = "fixed";
  canvas.style.left = "0";
  canvas.style.top = "0";
  canvas.style.zIndex = "999999";
  const [w, h] = [canvas.width, canvas.height];
  const ctx = canvas.getContext("2d");
  const chars = [];
  for (let y = 0; y < w; y++) {
    chars[y] = [];
    for (let x = 0; x < w; x++) {
      chars[y][x] = "";
      gray = 0.299 * r + 0.587 * g + 0.114 * b;
      if (gray > 150) {
        chars[0];
      }
    }
  }
  document.body.appendChild(canvas);

  //   let lastWhite = -1;
  //   for (let x = w / 2; x < w; x++) {
  //     const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
  //     const grey = (r * 299 + g * 587 + b * 114) / 1000;
  //     // 以150为阈值，大于该值的认定为白色
  //     if (grey > 150) {
  //       if (lastWhite === -1 || x - lastWhite !== 88) {
  //         lastWhite = x;
  //       } else {
  //         lastWhite /= 2; // 图片缩小了2倍
  //         lastWhite -= 37; // 滑块left(26) + 方块自身偏移值(23 / 2)
  //         lastWhite >>= 0; // 移动的像素必须为整数
  //         return lastWhite;
  //       }
  //     }
  //   }

  // const knob = document.querySelector(".gt_slider_knob");
  // await 元素拖动(knob, [200, 0]);
};
await 过验证码();
