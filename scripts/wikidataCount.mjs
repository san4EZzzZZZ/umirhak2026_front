import https from "https";

const queries = [
  `SELECT (COUNT(*) AS ?c) WHERE { ?univ wdt:P17 wd:159 . ?univ wdt:P31/wdt:P279* wd:Q3918 . }`,
  `SELECT ?name WHERE { ?univ wdt:P17 wd:159 . ?univ wdt:P31/wdt:P279* wd:Q3918 . ?univ rdfs:label ?name . FILTER(LANG(?name)="ru") } LIMIT 5`,
];

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            "User-Agent": "DiasoftDemo/1.0 (wikidata debug; example@invalid)",
            Accept: "application/sparql-results+json",
          },
        },
        (res) => {
          let body = "";
          res.on("data", (c) => (body += c));
          res.on("end", () => resolve({ status: res.statusCode, body }));
        },
      )
      .on("error", reject);
  });
}

for (const q of queries) {
  const url = "https://query.wikidata.org/sparql?format=json&query=" + encodeURIComponent(q);
  const { status, body } = await get(url);
  console.log("status", status);
  console.log(body.slice(0, 800));
}
