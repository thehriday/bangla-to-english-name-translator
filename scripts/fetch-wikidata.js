// Downloads Bangla/English name pairs of real people from Wikidata (CC0 licensed).
// Output: data/wikidata-names.json  [{ id, bn, en, source }]
// Usage: node scripts/fetch-wikidata.js
const fs = require('fs');
const path = require('path');

const ENDPOINT = 'https://query.wikidata.org/sparql';

// Most specific source first: a person found by several queries keeps the first source.
const SOURCES = {
  bangladesh: 'wdt:P27 wd:Q902',
  bengali_india: `wdt:P27 wd:Q668. { ?p wdt:P1412 wd:Q9610 } UNION { ?p wdt:P103 wd:Q9610 }
    UNION { ?p wdt:P172 wd:Q1990 } UNION { ?p wdt:P19/wdt:P131* wd:Q1356 }`,
  british_india: 'wdt:P27 wd:Q129286',
  india: 'wdt:P27 wd:Q668',
  pakistan: 'wdt:P27 wd:Q843',
};

async function query(where) {
  const sparql = `SELECT DISTINCT ?p ?bn ?en WHERE { ?p wdt:P31 wd:Q5; ${where} .
    ?p rdfs:label ?bn. FILTER(LANG(?bn) = "bn") ?p rdfs:label ?en. FILTER(LANG(?en) = "en") }`;
  const res = await fetch(`${ENDPOINT}?query=${encodeURIComponent(sparql)}`, {
    headers: { Accept: 'application/sparql-results+json', 'User-Agent': 'bangla-to-english-name-translator/1.0' },
  });
  if (!res.ok) throw new Error(`Wikidata returned ${res.status}`);
  const json = await res.json();
  return json.results.bindings.map((b) => ({
    id: b.p.value.split('/').pop(), bn: b.bn.value, en: b.en.value,
  }));
}

(async () => {
  const seen = new Map();
  for (const [source, where] of Object.entries(SOURCES)) {
    const rows = await query(where);
    let added = 0;
    for (const row of rows) {
      if (!seen.has(row.id)) { seen.set(row.id, { ...row, source }); added++; }
    }
    console.log(`${source}: ${rows.length} rows, ${added} new`);
  }
  const out = path.join(__dirname, '..', 'data', 'wikidata-names.json');
  fs.writeFileSync(out, JSON.stringify([...seen.values()], null, 0));
  console.log(`wrote ${seen.size} people to ${out}`);
})();
