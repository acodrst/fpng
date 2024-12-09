import { UPNG } from "upng-js";
import * as px from "pxxl";
function fc(c, i, j) {
  const dc = [128, 128, 128, 255];
  dc[Math.floor(Math.random() * (3))] = 255;
  const colors = [
    [255, 255, 255, 255],
    dc,
    [0, 153, 136, 255],
    [187, 187, 187, 255],
  ];
  for (let k = 0; k < 4; k++) {
    logo[i * 4 + lwidth * 4 * j + k] = colors[c][k];
  }
}
const lwidth = 120;
const factor = .06;
const lstart = lwidth * 272;
const logo = new Uint8Array(lwidth * 4 * lwidth).fill(255);
const llines = ["     FLOPPY", "      PNG"];
const bl = [0, 0, 0, 255];
const tl = [0, 153, 136, 255];
const cy = [51, 187, 238, 255];
const or = [238, 119, 51, 255];
const mg = [238, 51, 119, 255];

const pf = px.Pxxl.Font.ParseBDF(Deno.readTextFileSync("assets/8x16.bdf"));
for (let i = 0; i < lwidth; i++) {
  for (let j = 0; j < lwidth; j++) {
    if (i < 17 * lwidth * factor) fc(2, i, j);
    if (
      4 * lwidth * factor < i && i < 13 * lwidth * factor && 0 <= j &&
      j < 6 * lwidth * factor
    ) fc(3, i, j);
    if (
      3 * lwidth * factor < i && i < 14 * lwidth * factor &&
      7 * lwidth * factor < j && j < 16 * lwidth * factor
    ) fc(1, i, j);
    if (
      i < 11 * lwidth * factor && i > 9 * lwidth * factor &&
      j < 5 * lwidth * factor && j > 8
    ) fc(2, i, j);
    if (
      5.2 * lwidth * factor < i && i < 12.2 * lwidth * factor &&
      9.2 * lwidth * factor < j && j < 13.8 * lwidth * factor
    ) fc(0, i, j);
  }
}
for (const line in llines) {
  const offset = line == 0 ? 0 : 16;
  const pixels = pf.getPixels(llines[line]);
  for (const pixel of pixels) {
    for (let i = 0; i < 4; i++) {
      logo[
        offset + lstart - 4 + lwidth * 4 * 16 * line +
        (pixel.x + pixel.y * lwidth) * 4 + i
      ] = bl[i];
    }
  }
}
function fpng(text, domain, tss) {
  const lines = [
    `${" ".repeat((120 - domain.length) / 2)}${domain.toUpperCase()} ${tss}`,
    "This image includes website knowledge as triples. Normally, this file is named with <UTC timestamp>-<Adler32>.png. Use OpenSSL to verify the RSA-PSS sig-",
    "nature using the same name with a .txt extension. The Adler32 checksum is 20 bytes in from the end of the PNG, and can be verified with a binary editor.",
    " ".repeat(37) +
    "-> If possible, verify the image at floppypng.com before loading. <-",
    `The triples and code to render can be extracted using Deno. Run: Deno.writeFileSync("u.z",Deno.readFileSync("<UTC timestamp>-<Adler32>.png").slice(41,-16))`,
    `Extract with pigz. The extracted data, u, has a null (0x00) at the beginning of each line of 5465 characters. These can be removed automatically with this:`,
    `let i,n=5465,x='',b=Deno.readFileSync("u");for(i=n*130;i<b.length;i+=n){x+=new TextDecoder().decode(b.slice(i+1,i+n))};Deno.writeTextFile("u.js",x.trim())`,
  ];
  const f_sites = 2;
  const f_tracks = 80;
  const f_sectors = 18;
  const f_bytes = 512;
  const shift = 496;
  const dat = new TextEncoder().encode(text);
  const num_lines = 7;
  const width = 5464;
  const font_height = 16;
  const line_below = 1;
  const top_padding = 6;
  const bottom_padding = 5;
  const head_length = width *
    (num_lines * (font_height + line_below) + top_padding + bottom_padding);
  console.log(
    `1.44 MB Floppy Disk Size=${f_sites * f_tracks * f_sectors * f_bytes}`,
  );

  const head = new Uint8Array(head_length).fill(255);
  const dat_rows = (dat.length) % width == 0
    ? (dat.length) / width
    : Math.floor(dat.length / width) + 1;
  const dat_fill = new Uint8Array(dat_rows * width - dat.length).fill(
    32,
  );
  const flp_dat_arr = new Uint8Array([
    ...head,
    ...dat,
    ...dat_fill,
  ]);
  const start = width * top_padding;
  for (const line in lines) {
    const c = line == 0 ? or : line > 0 && line < 3 ? tl : line == 3 ? mg : cy;
    const pixels = pf.getPixels(lines[line]);
    for (const pixel of pixels) {
      for (let i = 0; i < 4; i++) {
        flp_dat_arr[
          start + shift + line * (font_height + line_below) * width +
          (pixel.x + pixel.y * width / 4) * 4 + i
        ] = c[i];
      }
    }
  }
  let ptr = 0;
  let y = 0;
  for (let x = start; x < start + width * 119; x++) {
    if (x % width == 0) {
      ptr = 0;
      y++;
    }
    if (ptr < 120 * 4) flp_dat_arr[x] = logo[y * 120 * 4 + ptr];
    ptr++;
  }
  console.log(
    (top_padding + bottom_padding +
      (font_height + line_below) * num_lines) *
      (width + 1),
  );
  return new Uint8Array(
    UPNG.encode(
      [flp_dat_arr],
      width / 4,
      dat_rows + top_padding + bottom_padding +
        (font_height + line_below) * num_lines,
      0,
    ),
  );
}
export { fpng };