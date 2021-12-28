{
    const { default: html2canvas } = await import("https://cdn.jsdelivr.net/npm/html2canvas@1.3.3/dist/html2canvas.esm.js");

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
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    const bytes = 4;

    const idRgbaByOffsetGet = (id, offset) => id.slice(offset * bytes, (offset + 1) * bytes);
    const idRgbaByOffsetSet = (id, offset, Rgba) => id.set(Rgba, offset * bytes);
    const idRgbaByPosGet = (id, x, y) => idRgbaByOffsetGet(id, x + y * w);
    const idRgbaByPosSet = (id, x, y, Rgba) => idRgbaByOffsetSet(id, x + y * w, Rgba);
    const idGrayByOffsetGet = (id, offset) => id.slice(offset * bytes, (offset + 1) * bytes);
    const idGrayByOffsetSet = (id, offset, gray) => id.set(gray, offset * bytes);
    const idGrayByPosGet = (id, x, y) => idRgbaByOffsetGet(id, x + y * w);
    const idGrayByPosSet = (id, x, y, gray) => idRgbaByOffsetSet(id, x + y * w, gray);
    const rgba2gray = ([r, g, b, a]) => 0.299 * r + 0.587 * g + 0.114 * b;
    const gray2rgba = gray => new Uint8Array([gray, gray, gray, 255]);
    const idrgba2gray = (id, w, h) => new Uint8Array(w * h).map((_, i) => rgba2gray(idRgbaByOffsetGet(id, i)));
    const idgray2rgba = (id, w, h) => new Uint8Array(w * h * bytes).map((_, i) => gray2rgba(id[(i / bytes) | 0])[i % bytes]);

    const gray2binary = (gray, tru = 128) => (gray > tru ? 255 : 0);
    const idRgba2binary = (id, w, h) => new Uint8Array(w * h).map((_, i) => gray2binary(rgba2gray(idRgbaByOffsetGet(id, i))));
    const idBinary2rgba = (id, w, h) => new Uint8Array(w * h * bytes).map((_, i) => gray2rgba(id[(i / bytes) | 0])[i % bytes]);
    
    const idConv = (id, w, h, kernal) => new Uint8Array(w*h).map()
    const id2 = idBinary2rgba(idRgba2binary(imageData.data, w, h), w, h);
    imageData.data.set(id2);
    ctx.putImageData(imageData, 0, 0);
    document.body.appendChild(canvas);
}
