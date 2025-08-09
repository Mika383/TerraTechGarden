import { embed } from "./embeddings";

const TERRARIUM_SCOPE_V1 = `
Terrarium, bố cục terrarium, cây trồng terrarium (rêu, dương xỉ, fittonia...), nền/đất, ẩm độ, ánh sáng, tưới nước, vệ sinh hộp kính,
hardscape (đá, lũa), layout, bảo dưỡng, xử lý nấm mốc, đèn, thông gió, CO2 (nếu có), sản phẩm TerraTechgarden, CSKH liên quan đơn hàng terrarium.
`;

const LS_KEY = "terrariumVec.v1";
const LS_KEY_TS = "terrariumVec.v1.ts";
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

let terrariumVec: number[] | null = null;

export async function getTerrariumVector() {
  if (terrariumVec) return terrariumVec;
  try {
    const ts = Number(localStorage.getItem(LS_KEY_TS) || "0");
    const cached = localStorage.getItem(LS_KEY);
    if (cached && ts && (Date.now() - ts) < TTL_MS) {
      terrariumVec = JSON.parse(cached);
      if (Array.isArray(terrariumVec)) return terrariumVec;
    }
  } catch {}

  terrariumVec = await embed(TERRARIUM_SCOPE_V1);
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(terrariumVec));
    localStorage.setItem(LS_KEY_TS, String(Date.now()));
  } catch {}
  return terrariumVec;
}
