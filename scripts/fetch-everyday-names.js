// Downloads ~2.6 million everyday Bengali name words with English spellings from
// github.com/p3jitnath/Transliteration-Model (MIT License, Copyright (c) 2019 Pritthijit Nath and Tommy Tracey)
// and aggregates them to data/everyday-names.json and data/everyday-names-test.json (the authors'
// own train/test split), each { banglaWord: { english: count } }.
// Usage: node scripts/fetch-everyday-names.js
const fs = require('fs');
const path = require('path');

const BASE = 'https://raw.githubusercontent.com/p3jitnath/Transliteration-Model/master/data';

async function lines(file) {
  const res = await fetch(`${BASE}/${file}`);
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
  return (await res.text()).split('\n');
}

(async () => {
  const files = [
    ['neural_bengali.txt', 'neural_english.txt', 'everyday-names.json'],
    ['neural_test_bengali.txt', 'neural_test_english.txt', 'everyday-names-test.json'],
  ];
  for (const [bnFile, enFile, outFile] of files) {
    const counts = {};
    let used = 0;
    const [bn, en] = await Promise.all([lines(bnFile), lines(enFile)]);
    for (let i = 0; i < bn.length; i++) {
      // Files hold one word per line with letters separated by spaces: "গ ু প ্ ত া" / "G U P T A".
      const b = bn[i].replace(/ /g, '').normalize('NFC');
      const e = (en[i] || '').replace(/ /g, '').toLowerCase();
      if (!/^[ঀ-৿]+$/.test(b) || !/^[a-z]{2,}$/.test(e)) continue;
      counts[b] = counts[b] || {};
      counts[b][e] = (counts[b][e] || 0) + 1;
      used++;
    }
    const out = path.join(__dirname, '..', 'data', outFile);
    fs.writeFileSync(out, JSON.stringify(counts));
    console.log(`${used} name words, ${Object.keys(counts).length} distinct -> ${out}`);
  }
})();
