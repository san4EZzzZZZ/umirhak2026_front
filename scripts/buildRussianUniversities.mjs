/**
 * Собирает названия страниц (вузы) из дерева категорий ru.wikipedia.
 * Запуск: node scripts/buildRussianUniversities.mjs
 */
import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "../src/data/russianUniversities.js");

const UA = "DiasoftDiplomaRegistryDemo/1.0 (local build; wikimedia API)";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": UA } }, (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => {
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}`));
            return;
          }
          if (body.trim().startsWith("<!")) {
            reject(new Error("HTML not JSON"));
            return;
          }
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
  });
}

async function categoryMembers(title, cmtype) {
  const all = [];
  let cmcontinue = "";
  for (let i = 0; i < 500; i++) {
    let url =
      "https://ru.wikipedia.org/w/api.php?action=query&list=categorymembers&format=json" +
      "&cmtitle=" +
      encodeURIComponent(title) +
      "&cmtype=" +
      cmtype +
      "&cmlimit=500";
    if (cmcontinue) url += "&cmcontinue=" + encodeURIComponent(cmcontinue);
    let j;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        await sleep(280);
        j = await fetchJson(url);
        break;
      } catch {
        await sleep(1200 * (attempt + 1));
      }
    }
    if (!j) throw new Error("fetch failed");
    const m = j.query?.categorymembers ?? [];
    all.push(...m);
    cmcontinue = j.continue?.cmcontinue ?? "";
    if (!cmcontinue) break;
  }
  return all;
}

const ROOT_CATEGORIES = [
  "Категория:Университеты России",
  "Категория:Высшие учебные заведения России",
  "Категория:Институты России",
  "Категория:Академии России (вузы)",
];

async function main() {
  const queue = [...ROOT_CATEGORIES];
  const seenCat = new Set();
  const titles = new Set();

  while (queue.length) {
    const cat = queue.shift();
    if (seenCat.has(cat)) continue;
    seenCat.add(cat);

    const subs = await categoryMembers(cat, "subcat");
    const pages = await categoryMembers(cat, "page");

    for (const s of subs) {
      if (s.title.startsWith("Категория:")) queue.push(s.title);
    }
    for (const p of pages) {
      if (p.ns === 0) titles.add(p.title);
    }
  }

  const skip = (t) =>
    t.startsWith("Список ") ||
    t.includes("Шаблон:") ||
    t.includes("Категория:") ||
    t.includes("Проект:");

  const arr = [...titles]
    .filter((t) => !skip(t))
    .sort((a, b) => a.localeCompare(b, "ru"));

  const preset = "Демо-университет";
  const withDemo = arr.includes(preset) ? arr : [preset, ...arr];

  const unique = [...new Set(withDemo)];

  const header = `/** Автогенерация: node scripts/buildRussianUniversities.mjs — ${unique.length} записей (ru.wikipedia). */\n`;
  const body = `export const RUSSIAN_UNIVERSITIES = ${JSON.stringify(unique, null, 0)};\n`;
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, header + body, "utf8");
  console.log("Wrote", unique.length, "names to", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
