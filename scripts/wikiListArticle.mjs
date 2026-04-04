import https from "https";

const titles = [
  "Список университетов России",
  "Университеты России",
  "Высшие учебные заведения России",
];

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "DiasoftDemo/1.0 (wikipedia; example@invalid)" } }, (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => resolve(body));
      })
      .on("error", reject);
  });
}

for (const t of titles) {
  const u =
    "https://ru.wikipedia.org/w/api.php?action=query&titles=" +
    encodeURIComponent(t) +
    "&prop=revisions&rvprop=content&format=json&formatversion=2";
  const body = await get(u);
  const j = JSON.parse(body);
  const pages = j.query?.pages;
  const page = Array.isArray(pages) ? pages[0] : pages && Object.values(pages)[0];
  if (!page || page.missing) {
    console.log("missing", t, page);
    continue;
  }
  const w = page.revisions?.[0]?.body;
  if (!w) {
    console.log("no body", t, Object.keys(page));
    continue;
  }
  const links = [...w.matchAll(/\[\[([^|\]#]+)/g)].map((m) => m[1].trim());
  const uniq = [...new Set(links)].filter(
    (s) =>
      /университет|институт|академи|академия|школа|колледж|консерватори|институт/i.test(s) &&
      !s.startsWith("Категория:") &&
      !s.startsWith("Файл:"),
  );
  console.log(t, "links", uniq.length);
  console.log(uniq.slice(0, 15).join("\n"));
}
