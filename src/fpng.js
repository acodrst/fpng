import { UPNG } from 'UPNG'
import { Zstd } from "@hpcc-js/wasm-zstd";
import * as px from "pxxl";
const zstd = await Zstd.load();
const pf = px.Pxxl.Font.ParseBDF(Deno.readTextFileSync("assets/5x7.bdf"));
function fpng(label,text) {
  const f_sides = 2;
  const f_tracks = 80;
  const f_sectors = 18;
  const f_bytes = 512;
  const dat = zstd.compress(new TextEncoder().encode(text),9);
  const width = 1024;
  const font_height = 7;
  console.log(
    `1.44 MB Floppy Disk Size=${f_sides * f_tracks * f_sectors * f_bytes}`,
  );
  const head = new Uint8Array(width * font_height).fill(255);
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
  const pixels = pf.getPixels(label);
  for (const pixel of pixels) {
    for (let i = 0; i < 4; i++) {
      flp_dat_arr[
        (pixel.x + pixel.y * width / 4) * 4 + i
      ] = [0, 0, 0, 255][i];
    }
  }
  const img=new Uint8Array(
    UPNG.encodeLL(
      [flp_dat_arr],
      width / 4,
      dat_rows + font_height,
      3,
      1,
      8
    ),
  );
  console.log(
    `Floppy PNG Size=${img.length}`,
  );
  return {"im":img,"ln":dat.length}
}
export { fpng };
