// Measures accuracy on held-out people: the learned dictionary is built WITHOUT them,
// so the numbers reflect names the library has never seen.
//
// Usage: node scripts/evaluate.js [--errors N]
const { loadPeople, isTestPerson, looseKey: loose } = require('./dataset');
const { buildDictionary } = require('./build-dictionary');
const { banglaNameToEnglish } = require(process.env.SRC_DIR || '../src');

const people = loadPeople();
const train = people.filter((p) => !isTestPerson(p));
const test = people.filter(isTestPerson);
const learned = buildDictionary(train);


function score(options) {
  let words = 0, exact = 0, close = 0, names = 0, namesExact = 0;
  const errors = new Map();
  for (const p of test) {
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
  const pct = (a, b) => `${((100 * a) / b).toFixed(1)}%`;
  return {
    summary: `exact words ${pct(exact, words)} | close words ${pct(close, words)} | exact full names ${pct(namesExact, names)}  (${names} names, ${words} words)`,
    errors,
  };
}

// Ceiling: always answering with the most common real spelling of each Bangla word, chosen by
// peeking at the test set itself. No system can beat this, because people spell the same name differently.
{
  const counts = new Map();
  for (const p of test) p.bnWords.forEach((bn, i) => {
    const m = counts.get(bn) || new Map();
    const en = p.enWords[i].toLowerCase();
    m.set(en, (m.get(en) || 0) + 1);
    counts.set(bn, m);
  });
  let best = 0, all = 0;
  for (const m of counts.values()) { const v = [...m.values()]; best += Math.max(...v); all += v.reduce((a, b) => a + b); }
  console.log(`ceiling (best possible exact-word score on this test set): ${((100 * best) / all).toFixed(1)}%`);
}

console.log(`train: ${train.length} people, test: ${test.length} held-out Bangladeshi/Bengali people`);
console.log(`learned dictionary (from train only): ${Object.keys(learned).length} words\n`);
console.log('rules + curated only      ', score({ useLearnedDictionary: false }).summary);
const full = score({ learnedDictionary: learned });
console.log('rules + curated + learned ', full.summary);

const n = Number(process.argv[process.argv.indexOf('--errors') + 1]) || 0;
if (process.argv.includes('--errors')) {
  console.log('\nmost frequent remaining errors (bangla, got, expected):');
  [...full.errors.entries()].sort((a, b) => b[1] - a[1]).slice(0, n || 50)
    .forEach(([k, c]) => console.log(`${c}\t${k}`));
}
