/**
 * То же, что fetch_islod_vpo_universities.py: выгрузка ВПО с ISLOD → islodVpoUniversities.js
 * Если API недоступен, собирает запасной список из локальных данных репозитория.
 *
 * Запуск из umirhak2026_front:
 *   node scripts/fetch_islod_vpo_universities.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_JS = path.join(ROOT, "src", "data", "islodVpoUniversities.js");

const API = "https://islod.obrnadzor.gov.ru/rlic/api/search";

function writeModule(names, sourceComment) {
  const unique = [...new Set(names.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "ru"),
  );
  const lines = unique.map((n) => `  ${JSON.stringify(n)}`).join(",\n");
  const js = `/**
 * Организации ВПО для подсказки «Название вуза» (блок «Поиск диплома»).
 * ${sourceComment}
 */
export const ISLOD_VPO_UNIVERSITY_NAMES = [
${lines}
];
`;
  fs.writeFileSync(OUT_JS, js, "utf8");
  console.log(`Записано ${unique.length} наименований → ${OUT_JS}`);
}

async function fetchFromIslod() {
  const all = [];
  let page = 0;
  const pageSize = 100;
  for (;;) {
    const res = await fetch(API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        "User-Agent": "Mozilla/5.0",
      },
      body: JSON.stringify({
        page,
        size: pageSize,
        sort: { sorted: false, unsorted: true, empty: true },
        query: { region: null, orgName: "", orgType: "VPO" },
      }),
    });
    if (!res.ok) {
      throw new Error(`ISLOD HTTP ${res.status}`);
    }
    const data = await res.json();
    const content = data.content ?? [];
    if (!content.length) break;
    for (const item of content) {
      const name = item.fullName;
      if (name) all.push(name);
    }
    console.log(`Страница ${page}, всего: ${all.length}`);
    page += 1;
    await new Promise((r) => setTimeout(r, 500));
  }
  return all;
}

async function loadFallback() {
  const { RUSSIAN_UNIVERSITIES } = await import("../src/data/russianUniversities.js");
  const { VUZ_LIST_NAMES } = await import("../src/data/vuzList.js");
  const wikiPath = path.join(ROOT, "tmp_wiki_vuz.json");
  let wiki = [];
  try {
    wiki = JSON.parse(fs.readFileSync(wikiPath, "utf8"));
  } catch {
    /* optional */
  }
  return [...RUSSIAN_UNIVERSITIES, ...VUZ_LIST_NAMES, ...wiki];
}

try {
  const fromApi = await fetchFromIslod();
  writeModule(
    fromApi,
    "Источник: API https://islod.obrnadzor.gov.ru/rlic/api/search (orgType=VPO). Пересборка: node scripts/fetch_islod_vpo_universities.mjs",
  );
} catch (e) {
  console.warn("ISLOD недоступен, используется локальный запасной список:", e.message);
  const fb = await loadFallback();
  writeModule(
    fb,
    "Запасной список из src/data (russianUniversities, vuzList, tmp_wiki_vuz). Для полного реестра: python scripts/fetch_islod_vpo_universities.py",
  );
}
