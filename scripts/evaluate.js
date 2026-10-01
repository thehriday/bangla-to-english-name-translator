// Measures accuracy on data the learned dictionary was NOT built from:
//   1. held-out Bangladeshi/Bengali people from Wikidata (full names)
//   2. everyday names: the dataset's own test file (realistic: common names repeat), and
//      20% of distinct words removed from training entirely (names never seen before)
//
// Usage: node scripts/evaluate.js [--errors N] [--everyday-errors N]
const { loadPeople, loadEveryday, isTestPerson, isTestWord, looseKey: loose } = require('./dataset');
const { buildDictionary } = require('./build-dictionary');
const path = require('path');

// Translators built around a given learned dictionary (the shipped one is built from all data,
// so evaluating it would leak the test set).
const SRC = process.env.SRC_DIR || path.join(__dirname, '..', 'src');
const { createTranslator } = require(`${SRC}/translator`);
const translators = new WeakMap();
const NO_DICTIONARY = {};
function banglaNameToEnglish(name, options) {
  const dict = options.useLearnedDictionary === false ? NO_DICTIONARY : options.learnedDictionary;
  if (!translators.has(dict)) translators.set(dict, createTranslator(dict));
  return translators.get(dict)(name);
}

const people = loadPeople();
const train = people.filter((p) => !isTestPerson(p));
const test = people.filter(isTestPerson);
const everyday = loadEveryday('train');
const everydayTestFile = loadEveryday('test');
// Never-seen words: drop 20% of distinct words from training and test only on those.
const everydayTrain = {};
const unseenTest = {};
for (const [bn, s] of Object.entries(everyday)) if (!isTestWord(bn)) everydayTrain[bn] = s;
for (const [bn, s] of Object.entries(everydayTestFile)) if (isTestWord(bn)) unseenTest[bn] = s;

const pct = (a, b) => `${((100 * a) / b).toFixed(1)}%`;

function scorePeople(options, group = test) {
  let words = 0, exact = 0, close = 0, names = 0, namesExact = 0;
  const errors = new Map();
  for (const p of group) {
    const out = banglaNameToEnglish(p.bn, options).split(' ');
    if (out.length !== p.enWords.length) continue;
    names++;
    let allExact = true;
    p.enWords.forEach((en, i) => {
      words++;
      const isExact = out[i].toLowerCase() === en.toLowerCase();
      exact += isExact;
      close += isExact || loose(out[i]) === loose(en);
      if (!isExact) {
        allExact = false;
        const k = `${p.bnWords[i]}\t${out[i]}\t${en}`;
        errors.set(k, (errors.get(k) || 0) + 1);
      }
    });
    namesExact += allExact;
  }
  return {
    summary: `exact words ${pct(exact, words)} | close ${pct(close, words)} | exact full names ${pct(namesExact, names)}`,
    errors,
  };
}

function scoreEveryday(words, options) {
  let total = 0, exact = 0, close = 0, ceiling = 0;
  const errors = [];
  for (const [bn, spellings] of Object.entries(words)) {
    const out = banglaNameToEnglish(bn, options).toLowerCase().replace(/[^a-z]/g, '');
    const counts = Object.values(spellings);
    const n = counts.reduce((a, c) => a + c, 0);
    total += n;
    ceiling += Math.max(...counts);
    const hit = spellings[out] || 0;
    exact += hit;
    for (const [en, k] of Object.entries(spellings)) if (loose(en) === loose(out)) close += k;
    if (hit < n / 2) errors.push([n, bn, out, Object.entries(spellings).sort((a, b) => b[1] - a[1])[0][0]]);
  }
  return { summary: `exact ${pct(exact, total)} | close ${pct(close, total)} | ceiling ${pct(ceiling, total)}`, errors };
}

const withoutEveryday = buildDictionary(train);
const withEveryday = buildDictionary(train, {}, everydayTrain);
const withAllEveryday = buildDictionary(train, {}, everyday);

console.log(`Wikidata: ${test.length} held-out Bangladeshi/Bengali people`);
console.log('  rules + curated               ', scorePeople({ useLearnedDictionary: false }).summary);
console.log(`  + learned (Wikidata, ${Object.keys(withoutEveryday).length} words)`.padEnd(33), scorePeople({ learnedDictionary: withoutEveryday }).summary);
const full = scorePeople({ learnedDictionary: withEveryday });
console.log(`  + learned (all, ${Object.keys(withEveryday).length} words)`.padEnd(33), full.summary);
const bdTest = test.filter((p) => p.source === 'bangladesh');
const bd = scorePeople({ learnedDictionary: withEveryday }, bdTest);
console.log(`  Bangladesh only (${bdTest.length} people)`.padEnd(33), bd.summary);

if (Object.keys(everydayTestFile).length) {
  const n = (w) => Object.values(w).reduce((a, s) => a + Object.values(s).reduce((x, y) => x + y, 0), 0);
  console.log(`\nEveryday names, realistic (separate test file, ${n(everydayTestFile)} name words)`);
  console.log('  rules + curated               ', scoreEveryday(everydayTestFile, { useLearnedDictionary: false }).summary);
  console.log('  + learned (Wikidata)          ', scoreEveryday(everydayTestFile, { learnedDictionary: withoutEveryday }).summary);
  const ev = scoreEveryday(everydayTestFile, { learnedDictionary: withAllEveryday });
  console.log('  + learned (all)               ', ev.summary);
  console.log(`\nEveryday names never seen in training (${n(unseenTest)} name words)`);
  console.log('  rules + curated               ', scoreEveryday(unseenTest, { useLearnedDictionary: false }).summary);
  console.log('  + learned (all)               ', scoreEveryday(unseenTest, { learnedDictionary: withEveryday }).summary);
  const k = process.argv.indexOf('--everyday-errors');
  if (k > 0) ev.errors.sort((a, b) => b[0] - a[0]).slice(0, Number(process.argv[k + 1]) || 50).forEach((r) => console.log(r.join('\t')));
}

const i = process.argv.indexOf('--errors');
if (i > 0) {
  console.log('\nmost frequent remaining errors for Bangladeshi people (bangla, got, expected):');
  [...bd.errors.entries()].sort((a, b) => b[1] - a[1]).slice(0, Number(process.argv[i + 1]) || 50)
    .forEach(([key, c]) => console.log(`${c}\t${key}`));
}
