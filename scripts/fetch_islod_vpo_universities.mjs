/**
 * Выгрузка ВПО с ISLOD → src/data/islodVpoUniversities.js
 * Если API недоступен, собирает запасной список из локальных данных и текстовых файлов.
 *
 * Запуск из umirhak2026_front:
 *   node scripts/fetch_islod_vpo_universities.mjs
 *
 * Дополнительно можно положить рядом с проектом или в корень front файлы
 * universities_ru.txt / universities.txt (по строке на вуз) — они попадут в запасной список.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DGTU_SFU_BRANCH_NAMES } from "../src/data/dgtuSfuBranches.js";
import { MGU_BRANCH_NAMES } from "../src/data/mguBranches.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_JS = path.join(ROOT, "src", "data", "islodVpoUniversities.js");

const API = "https://islod.obrnadzor.gov.ru/rlic/api/search";
/** Крупнее страница — меньше запросов при полной выгрузке. */
const PAGE_SIZE = 200;

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
  for (;;) {
    const res = await fetch(API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        "User-Agent": "Mozilla/5.0",
      },
      body: JSON.stringify({
        page,
        size: PAGE_SIZE,
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
    console.log(`Страница ${page}, на странице: ${content.length}, всего: ${all.length}`);

    const totalPages = typeof data.totalPages === "number" ? data.totalPages : null;
    const last =
      data.last === true ||
      (totalPages !== null && page + 1 >= totalPages) ||
      content.length < PAGE_SIZE;

    page += 1;
    if (last) break;

    await new Promise((r) => setTimeout(r, 500));
  }
  return all;
}

function readTextListFile(absPath) {
  try {
    const t = fs.readFileSync(absPath, "utf8");
    return t
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

async function loadFallback() {
  const merged = [];
  const { RUSSIAN_UNIVERSITIES } = await import("../src/data/russianUniversities.js");
  const { VUZ_LIST_NAMES } = await import("../src/data/vuzList.js");
  merged.push(...RUSSIAN_UNIVERSITIES, ...VUZ_LIST_NAMES);

  const wikiPath = path.join(ROOT, "tmp_wiki_vuz.json");
  try {
    const wiki = JSON.parse(fs.readFileSync(wikiPath, "utf8"));
    if (Array.isArray(wiki)) merged.push(...wiki);
  } catch {
    /* optional */
  }

  const extraTxtPaths = [
    path.join(ROOT, "universities_ru.txt"),
    path.join(ROOT, "universities.txt"),
    path.join(ROOT, "..", "universities_ru.txt"),
    path.join(ROOT, "..", "universities.txt"),
  ];
  for (const p of extraTxtPaths) {
    const lines = readTextListFile(p);
    if (lines.length) {
      console.log(`+ ${lines.length} строк из ${p}`);
      merged.push(...lines);
    }
  }

  return merged;
}

try {
  const fromApi = await fetchFromIslod();
  writeModule(
    [...fromApi, ...DGTU_SFU_BRANCH_NAMES, ...MGU_BRANCH_NAMES],
    "Источник: API https://islod.obrnadzor.gov.ru/rlic/api/search (orgType=VPO) + филиалы ДГТУ/ЮФУ (dgtuSfuBranches.js) + МГУ (mguBranches.js). Пересборка: node scripts/fetch_islod_vpo_universities.mjs",
  );
} catch (e) {
  console.warn("ISLOD недоступен, используется локальный запасной список:", e.message);
  const fb = await loadFallback();
  writeModule(
    [...fb, ...DGTU_SFU_BRANCH_NAMES, ...MGU_BRANCH_NAMES],
    "Запасной список: russianUniversities, vuzList, tmp_wiki_vuz, txt-файлы + филиалы ДГТУ/ЮФУ (dgtuSfuBranches.js) + МГУ (mguBranches.js). Полная выгрузка: node scripts/fetch_islod_vpo_universities.mjs (когда API доступен).",
  );
}
