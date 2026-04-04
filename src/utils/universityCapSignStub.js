/**
 * Демо: подпись записи о дипломе «КЭП» через Web Crypto (RSA-PSS, SHA-256).
 * Приватный ключ зашит только для прототипа; в проде — токен/облачная КЭП, ключ не в репозитории.
 */

/** @type {JsonWebKey} */
export const STUB_CAP_PRIVATE_JWK = {
  kty: "RSA",
  n: "vNO70OVOW8oAxTH7y7u4olxR-ixGjjWskPHHaf7pdq5ovVDH1uirpYXlzHnSNBtrNHwLv5CBF7BsAw3wBXDThOlXuGfcSCvtl8jhoIYPDK9oMJZ4I4fN8jLb8AuGNJxhze3oiYtm4DGf9Cb0sQJWHgESvCRw7EDUYaFp4PbQSb1QY_uOAP71M9TMQbsWybBNxbDptwmr4fzEAk5XeS1Z5g2yn_P9u354OQtQpRX87Qy8rntO4qeyZwY_o5Pqhq4hdN-tV3JKFfLL-htbtG8qNl1OI8E4727td5Vx755llfG_vkRlPI5q-BRzqgWHPjQbAomPv0My61Fh7nI7TPJYpQ",
  e: "AQAB",
  d: "GKnPLknFIlgQIbGVodazFwHX80U1Mf3wvD3YPg_9jnLZW2DhuUBKqyQCD-MZgZTTO9e38R1-vwlcEkoPv6Ys-n8_5eYq74JNVjX2wnDAJngCs9XzezCRxcC-2Wun69dBLxST-uMqXL4ellVAQJ59gQ3C1LAtz63oD5h1q9yQ-BB4YcXRFaXTrSow1d7QJ6mQEWnehYIiFOpi38Rxou3CiNr4JpFJb6g7jHZDXGGHUW77iJdxtlWgoqMy5ayKxaIX46we10RazCXZdWH63gNX2ipyzfc9cks1UuvazEDLR15i21LTjfxp93U5JQbDFlLT8YVF6ldahIq8oV-CVRTPQQ",
  p: "88hyrx40qQE_xX0CSlZcej-bcGnwu3EhE1RpnrHpMZIlQoTvfZTofSHwyRN49TEuIuT7zswcUusL_zqWkQ3XiFRRSF2alrF2lwwwyTMqz4MArhQspegM1Faoe2IoMbmH2saLPfqjEikTTCGtTyt2LvSMz8lmsz6hEpE0-3KOg-c",
  q: "xko-I3KdChMQilr7m-2ItYc44pc-_htPu9wW7DyEl58bm5p-_2ec0sFlqPwseJKHmoSBGzCkhnl4aUvRUFC81T8Pg_o5u4MXExkePknQYXlk2bVSMwrz0HOr9GVmL8nxAWM3gxspUI7ou5AA43cNC_wByn_AmaL2IvrIYisLLZM",
  dp: "QBhwxsgrUlAowzTl-EOSlvXIWZsRF0dcSefEyVu_ky_4qe-nxB31rojQ9R0wjU778WLBLhMOU2LHSbjOw56fD5ITuPIbZgmMw5QJ86yHUf4AnMRjJM_JJ78NFzusk75TENto2sfePjUchMTJ-2nS7e-QYkVywifyU55oDsCE5fs",
  dq: "DGF-V8BERejC06CyrR27t3nl91_yMvOJmvU3CTEOJlls495Vp6TUieRBcLeuHyknBmLXnNcArtTOy-RMAXPJFpeFZHwvNqIMwsiCtujs9ekafu1vYHiCmLVgOzZJlxpIzglf4fPENJ93sJ5hL9KzIdhuVDJ92BnwvGZkNJzzabk",
  qi: "YUspv4vsXIAepIwSFBEgZ6_Qv55Ad41ao_YETN90s5tvofflkUh0CzgBqn12yG78rdvo55nVDkVmgcimIPdLFHocPcUtszuP9Xt4VfVzSTyU8fMKoOeSMOgBJrZSNdt_NkhD4BcHwqGPn_8tZUNh9E5jgQ_wWtRSSzgpeg50XJQ",
  ext: true,
  key_ops: ["sign"],
};

const ALGO = { name: "RSA-PSS", hash: "SHA-256" };

/** @type {CryptoKey | null} */
let cachedPrivateKey = null;

function bufToB64(buf) {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 1) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function hexPreview(buf, head = 10) {
  const a = Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${a.slice(0, head)}…${a.slice(-6)}`;
}

async function getStubCapPrivateKey() {
  if (cachedPrivateKey) return cachedPrivateKey;
  cachedPrivateKey = await crypto.subtle.importKey("jwk", STUB_CAP_PRIVATE_JWK, ALGO, false, ["sign"]);
  return cachedPrivateKey;
}

/**
 * Отпечаток открытой части ключа (SHA-256 от n|e), для отображения в UI.
 */
export async function getStubCapPublicThumbprintHex() {
  const enc = new TextEncoder();
  const raw = enc.encode(`${STUB_CAP_PRIVATE_JWK.n}|${STUB_CAP_PRIVATE_JWK.e}`);
  const digest = await crypto.subtle.digest("SHA-256", raw);
  return hexPreview(digest, 12);
}

/**
 * Каноническое тело для подписи (стабильный порядок полей).
 * @param {{ fullName: string, year: number, specialty: string, diplomaNumber: string }} draft
 */
export function buildDiplomaSigningPayload(draft) {
  const body = {
    diplomaNumber: String(draft.diplomaNumber).trim(),
    fullName: String(draft.fullName).trim(),
    specialty: String(draft.specialty).trim(),
    year: Number(draft.year),
  };
  return new TextEncoder().encode(JSON.stringify(body));
}

/**
 * @param {{ fullName: string, year: number, specialty: string, diplomaNumber: string }} draft
 * @returns {Promise<{ signatureBase64: string, capAlgorithm: string, signingKeyThumbprint: string, signedAt: string }>}
 */
export async function signDiplomaDraftWithStubKey(draft) {
  const key = await getStubCapPrivateKey();
  const payload = buildDiplomaSigningPayload(draft);
  const sig = await crypto.subtle.sign({ name: "RSA-PSS", saltLength: 32 }, key, payload);
  const signingKeyThumbprint = await getStubCapPublicThumbprintHex();
  return {
    signatureBase64: bufToB64(sig),
    capAlgorithm: "RSA-PSS-SHA-256",
    signingKeyThumbprint,
    signedAt: new Date().toISOString(),
  };
}
