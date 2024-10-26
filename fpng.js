"use strict";
import { UPNG } from 'upng-js'
import { adler32_buf } from 'adler-32'
import { crc32_buf } from 'crc-32'
import { Zstd } from "@hpcc-js/wasm-zstd"
import { Pxxl } from 'pxxl'
const f_sites = 2;
const f_tracks = 80;
const f_sectors = 18;
const f_bytes = 512;
console.log(
  `1.44 MB Floppy Disk Size=${f_sites * f_tracks * f_sectors * f_bytes}`,
);
function arr_to_hex(u8arr) {
  return `${
    Array.from(u8arr, (i) => i.toString(16).padStart(2, "0")).join("")
  }`;
}
async function logo(cl_obj) {
  const black = [0, 0, 0, 255];
  const width = 120;
  const factor = .06;
  const start = width * 272;
  var arr2 = new Uint8Array(width * 4 * width).fill(255);
  function fc(c, i, j) {
    let dc = [128, 128, 128, 255];
    dc[Math.floor(Math.random() * (3))] = 255;
    let colors = [
      [255, 255, 255, 255],
      dc,
      [0, 153, 136, 255],
      [187, 187, 187, 255],
    ];
    for (let k = 0; k < 4; k++) {
      arr2[i * 4 + width * 4 * j + k] = colors[c][k];
    }
  }
  for (let i = 0; i < width; i++) {
    for (let j = 0; j < width; j++) {
      if (i < 17 * width * factor) fc(2, i, j);
      if (
        4 * width * factor < i && i < 13 * width * factor && 0 <= j &&
        j < 6 * width * factor
      ) fc(3, i, j);
      if (
        3 * width * factor < i && i < 14 * width * factor &&
        7 * width * factor < j && j < 16 * width * factor
      ) fc(1, i, j);
      if (
        i < 11 * width * factor && i > 9 * width * factor &&
        j < 5 * width * factor && j > 8
      ) fc(2, i, j);
      if (
        5.2 * width * factor < i && i < 12.2 * width * factor &&
        9.2 * width * factor < j && j < 13.8 * width * factor
      ) fc(0, i, j);
    }
  }
  let lines = ["     FLOPPY", "      PNG"];
  let pf = Pxxl.Font.ParseBDF(cl_obj["8x16.bdf"]);
  for (let line in lines) {
    const offset = line == 0 ? 0 : 16;
    let pixels = pf.getPixels(lines[line]);
    for (let pixel of pixels) {
      for (let i = 0; i < 4; i++) {
        arr2[
          offset + start - 4 + width * 4 * 16 * line +
          (pixel.x + pixel.y * width) * 4 + i
        ] = black[i];
      }
    }
  }
  return arr2;
}
async function read(img) {
  const zstd = await Zstd.load()
  const img_filt = new Uint8Array(
    await new Response(
      new Blob([img.slice(41, -16)], {
        type: "application/zlib",
      })
        .stream().pipeThrough(new DecompressionStream("deflate")),
    ).arrayBuffer(),
  );
  const customer_states_a32_hex = arr_to_hex(img.slice(-20, -16));
  const customer_states_crc = Number("0x" + arr_to_hex(img.slice(-16, -12)));
  const customer_states_a32 = Number("0x" + arr_to_hex(img.slice(-20, -16)));
  let m = JSON.parse(new TextDecoder().decode(img_filt.slice(1, 2881)).trim());
  const img_ufilt = [];
  let filt = 0;
  let ufilt = 0;
  do {
    if ((filt - ufilt) % 2880 != 0 || filt == 0) {
      filt++;
    } else {
      ufilt++;
      filt += 2;
    }
    img_ufilt.push(img_filt[filt]);
  } while (filt < img_filt.length);
  const sig = new Uint8Array(img_ufilt).slice(m.s, m.s + 256);
  const dat_zstd = new Uint8Array(img_ufilt).slice(m.z, m.z + m.zl);
  const dat = zstd.decompress(dat_zstd);
  const d = JSON.parse(new TextDecoder().decode(dat));
  return customer_states_crc == crc32_buf(img.slice(37, -16)) >>> 0 &&
      customer_states_a32 == adler32_buf(img_filt) >>> 0
    ? {
      "img": img,
      "dat": dat,
      "m": m,
      "crc": customer_states_crc >>> 0,
      "a32h": customer_states_a32_hex,
      "a32": customer_states_a32 >>> 0,
      "sig": sig,
      "d": d,
    }
    : {
      d: {
        f: {
          "c.js":
            `document.getElementById('p').innerHTML="The data is corrupt.  Refusing to load.See <a href='https://floppypng.com' title='Floppy PNG'>https://floppypng.com</a> for more information on this error."`,
        },
      },
    };
}
async function write(domain, dat_obj, bootstrap, fzstd, cl_obj) {
  const zstd = await Zstd.load()
  const dt = new Date();
  const tss = dt.toISOString().replaceAll(":", "").replaceAll("-", "")
    .replaceAll(".", "");
  const lines = [
    `${
      " ".repeat((36 - domain.length) / 2)
    }${domain.toUpperCase()} ${tss} sig|programs|data`,
    "Includes embedded bootstrap/tools/data to create this image and website,",
    "with a PNG conforming CRC32, Adler32, as well as an RSA-PSS signature.",
    "-> If possible, verify the image at floppypng.com before bootstrapping. <-",
    "Metadata needed to decode the image and the bootstrap are on lines 1 and 2.",
    `Run Deno.writeFileSync("u.z",Deno.readFileSync("z.png").slice(41,-16)) `,
    "with deno and then extract with pigz to pull the metadata and bootstrap.",
  ];

  const dat = new TextEncoder().encode(JSON.stringify(dat_obj, null, 2));
  const num_lines = 7;
  const width = 2880;
  const png_raw_width = 2881;
  const font_height = 16;
  const line_below = 1;
  const meta_line = 1;
  const bootstrap_line = 1;
  const sig_line = 1;
  const top_padding = 6;
  const bottom_padding = 5;
  const sig_length = 256;
  const head_length = width *
    (num_lines * (font_height + line_below) + top_padding + bottom_padding);
  const fzstd_rows = fzstd.length % width == 0
    ? fzstd.length / width
    : Math.floor(fzstd.length / width) + 1;
  const bootstrap_fill = new Uint8Array(2880 - bootstrap.length).fill(32);
  const fzstd_fill = new Uint8Array(fzstd_rows * width - fzstd.length).fill(32);
  const dat_zst = zstd.compress(dat, 22);
  const priv = Deno.readTextFileSync(Deno.env.get("CL_PRIV")).replace(
    /.*KEY-----(.+?)-----END.*/smg,
    "$1",
  );
  const b_der_str = globalThis.atob(priv);
  const b_der =
    Uint8Array.from([...b_der_str].map((c) => c.charCodeAt())).buffer;
  const prv = await globalThis.crypto.subtle.importKey(
    "pkcs8",
    b_der,
    {
      name: "RSA-PSS",
      hash: "SHA-256",
    },
    true,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    {
      name: "RSA-PSS",
      hash: "SHA-256",
      saltLength: 32,
    },
    prv,
    dat,
  );
  const u8sig = new Uint8Array(sig);
  const u8sig_fill = new Uint8Array(width - sig_length).fill(32);
  const head = new Uint8Array(head_length).fill(255);
  const dat_zst_rows = (dat_zst.length) % width == 0
    ? (dat_zst.length) / width
    : Math.floor(dat_zst.length / width) + 1;
  const dat_fill = new Uint8Array(dat_zst_rows * width - dat_zst.length).fill(
    32,
  );
  const metadata = new TextEncoder().encode(JSON.stringify({
    "rows": meta_line + bootstrap_line + fzstd_rows + top_padding +
      bottom_padding + sig_line + (font_height + line_below) * num_lines +
      dat_zst_rows,
    "tss": tss,
    "d": domain,
    "b": png_raw_width,
    "bl": bootstrap.length,
    "f": width * 2,
    "fl": fzstd.length,
    "s": width *
      (meta_line + bootstrap_line + fzstd_rows + top_padding + bottom_padding +
        (font_height + line_below) * num_lines),
    "z": width *
      (meta_line + bootstrap_line + fzstd_rows + top_padding + bottom_padding +
        sig_line + (font_height + line_below) * num_lines),
    "zl": dat_zst.length,
    "all": png_raw_width *
      (meta_line + bootstrap_line + fzstd_rows + top_padding + bottom_padding +
        sig_line + (font_height + line_below) * num_lines + dat_zst_rows),
  }));
  const metadata_fill = new Uint8Array(width - metadata.length).fill(32);
  const flp_dat_arr = new Uint8Array([
    ...metadata,
    ...metadata_fill,
    ...bootstrap,
    ...bootstrap_fill,
    ...fzstd,
    ...fzstd_fill,
    ...head,
    ...u8sig,
    ...u8sig_fill,
    ...dat_zst,
    ...dat_fill,
  ]);
  const start = width * (top_padding + meta_line + fzstd_rows);
  const b = [0, 0, 0, 255];
  const tl = [0, 153, 136, 255];
  const cy = [51, 187, 238, 255];
  const or = [238, 119, 51, 255];
  const mg = [238, 51, 119, 255];
  const rd = [255, 0, 0, 255];
  const shift = 496;
  let pf = Pxxl.Font.ParseBDF(cl_obj["8x16.bdf"]);
  for (let line in lines) {
    const c = line == 0 ? or : line > 0 && line < 3 ? tl : line == 3 ? mg : cy;
    let pixels = pf.getPixels(lines[line]);
    for (let pixel of pixels) {
      for (let i = 0; i < 4; i++) {
        flp_dat_arr[
          start + shift + line * (font_height + line_below) * width +
          (pixel.x + pixel.y * width / 4) * 4 + i
        ] = c[i];
      }
    }
  }
  let logo_img = await logo(cl_obj);
  let ptr = 0;
  let y = 0;
  for (let x = start; x < start + 2880 * 119; x++) {
    if (x % 2880 == 0) {
      ptr = 0;
      y++;
    }
    if (ptr < 120 * 4) flp_dat_arr[x] = logo_img[y * 120 * 4 + ptr];
    ptr++;
  }
  let img = new Uint8Array(
    UPNG.encode(
      [flp_dat_arr],
      width / 4,
      dat_zst_rows + meta_line + bootstrap_line + fzstd_rows + top_padding +
        bottom_padding + sig_line + (font_height + line_below) * num_lines,
      0,
    ),
  );
  let a32h = arr_to_hex(img.slice(-20, -16));
  console.log(`Generated FloppyPNG Size=${img.length}`);
  return {
    "tss": tss,
    "id": a32h,
    "img": img,
  };
}
async function verify(pem, u8png) {
  const s = pem.split("-----")[2].trim().replace(/\s/gsm, "");
  const der =
    Uint8Array.from([...globalThis.atob(s)].map((c) => c.charCodeAt())).buffer;
  const crypto_key = await crypto.subtle.importKey(
    "spki",
    der,
    {
      name: "RSA-PSS",
      hash: "SHA-256",
    },
    true,
    ["verify"],
  );
  const fr = await read(u8png);
  const ver = await globalThis.crypto.subtle.verify(
    {
      name: "RSA-PSS",
      hash: "SHA-256",
      saltLength: 32,
    },
    crypto_key,
    fr.sig,
    fr.dat,
  );
  return {
    "ver": ver,
    "fr": fr,
  };
}
var fpng={"logo":logo,"read":read,"verify":verify,"write":write}
export { fpng };
