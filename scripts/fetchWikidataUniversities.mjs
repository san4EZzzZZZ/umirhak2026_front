import https from "https";
import fs from "fs";

const query = `
SELECT DISTINCT ?name WHERE {
  ?univ wdt:P17 wd:159 .
  { ?univ wdt:P31 wd:Q3918 . }
  UNION
  { ?univ wdt:P31 wd:Q23002054 . }
  UNION
  { ?univ wdt:P31 wd:Q7893458 . }
  ?univ rdfs:label ?name .
  FILTER(LANG(?name) = "ru")
}
LIMIT 8000
`.trim();

const url = "https://query.wikidata.org/sparql?format=json&query=" + encodeURIComponent(query);

function get(u) {
  return new Promise((resolve, reject) => {
    https
      .get(
        u,
        {
          headers: {
            "User-Agent": "DiasoftDiplomaDemo/1.0 (https://github.com/example; Wikidata SPARQL for education registry UI)",
            Accept: "application/sparql-results+json",
          },
        },
        (res) => {
          let body = "";
          res.on("data", (c) => (body += c));
          res.on("end", () => {
            if (res.statusCode !== 200) {
              reject(new Error(`HTTP ${res.statusCode}: ${body.slice(0, 200)}`));
              return;
            }
            if (body.trim().startsWith("<!")) {
              reject(new Error(body.slice(0, 300)));
              return;
            }
            resolve(JSON.parse(body));
          });
        },
      )
      .on("error", reject);
  });
}

const j = await get(url);
const rows = j.results?.bindings?.map((b) => b.name?.value).filter(Boolean) ?? [];
const uniq = [...new Set(rows)].sort((a, b) => a.localeCompare(b, "ru"));
const preset = "Демо-университет";
const list = uniq.includes(preset) ? uniq : [preset, ...uniq];

const out = `/** Вузы РФ: Wikidata (Россия + тип: университет / высшее учебное заведение / национальный исследовательский университет). ${list.length} записей. Скрипт: node scripts/fetchWikidataUniversities.mjs */\nexport const RUSSIAN_UNIVERSITIES = ${JSON.stringify(list)};\n`;

fs.mkdirSync(new URL("../src/data/", import.meta.url), { recursive: true });
const outPath = new URL("../src/data/russianUniversities.js", import.meta.url);
fs.writeFileSync(outPath, out, "utf8");
console.log("Wrote", list.length, "to", outPath.pathname);
