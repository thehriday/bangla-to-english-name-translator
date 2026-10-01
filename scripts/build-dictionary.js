// Learns the most common real-world English spelling of each Bangla name word from Wikidata,
// keeping only words where the phonetic rules would give a different spelling.
//
// Usage:
//   node scripts/build-dictionary.js            -> src/learned-dictionary.json (all data)
//   node scripts/build-dictionary.js --holdout  -> prints stats; used by evaluate.js via buildDictionary()
const fs = require('fs');
const path = require('path');
const { loadPeople, isTestPerson, similarity, SOURCE_WEIGHT } = require('./dataset');
const SRC = process.env.SRC_DIR || require('path').join(__dirname, '..', 'src');
const { transliterateWord } = require(`${SRC}/transliterate`);
const { ABBREVIATIONS, INITIALS } = require(`${SRC}/dictionary`);

const DEFAULTS = { minWeight: 3, minPeople: 1, minShare: 0.5, minSimilarity: 0.5, trustedPeople: 3 };

// Words the library already handles itself (abbreviations, initials) or that are not names.
const SKIP_EN = /^(of|the|and|de|von|van|al|el|bin|ibn)$/i;

const TARGET_SOURCES = new Set(['bangladesh', 'bengali_india']);

// Per Bangla word, the weighted votes for each English spelling. Kept separately for the target
// audience (Bangladeshi/Bengali people) so their spellings win whenever they exist.
function tally(people) {
  const words = new Map();
  const add = (bucket, key, w) => {
    bucket.total += w;
    bucket.people++;
    bucket.spellings.set(key, (bucket.spellings.get(key) || 0) + w);
    bucket.peoplePerSpelling.set(key, (bucket.peoplePerSpelling.get(key) || 0) + 1);
  };
  const empty = () => ({ total: 0, people: 0, spellings: new Map(), peoplePerSpelling: new Map() });
  for (const p of people) {
    const w = SOURCE_WEIGHT[p.source] || 0.5;
    p.bnWords.forEach((bn, i) => {
      const en = p.enWords[i];
      if (/[.:ঃ]/.test(bn) || en.includes('.') || en.length < 2 || SKIP_EN.test(en)) return;
      if (en.length <= 4 && en === en.toUpperCase()) return; // acronyms like "AKM
      if (INITIALS[bn] || ABBREVIATIONS[bn]) return; // handled by the library itself
      if (!words.has(bn)) words.set(bn, { all: empty(), target: empty() });
      // Title Case so "HAQUE" and "Haque" count together.
      const key = en.charAt(0).toUpperCase() + en.slice(1).toLowerCase();
      add(words.get(bn).all, key, w);
      if (TARGET_SOURCES.has(p.source)) add(words.get(bn).target, key, w);
    });
  }
  const result = new Map();
  for (const [bn, { all, target }] of words) result.set(bn, target.total > 0 ? target : all);
  return result;
}

function buildDictionary(people, opts = {}) {
  const { minWeight, minPeople, minShare, minSimilarity, trustedPeople } = { ...DEFAULTS, ...opts };
  const dict = {};
  for (const [bn, entry] of tally(people)) {
    if (entry.total < minWeight || entry.people < minPeople) continue;
    const [best, weight] = [...entry.spellings.entries()].sort((a, b) => b[1] - a[1])[0];
    if (weight / entry.total < minShare) continue;
    const rule = transliterateWord(bn);
    if (rule.toLowerCase() === best.toLowerCase()) continue; // rules already get it right
    // A spelling that sounds nothing like the Bangla word is usually a mislabeled record
    // (পার্বতী -> "Mousumi"); accept it only when several people back it up (মুখোপাধ্যায় -> Mukherjee).
    if (similarity(rule, best) < minSimilarity && entry.peoplePerSpelling.get(best) < trustedPeople) continue;
    dict[bn] = best;
  }
  return dict;
}

module.exports = { buildDictionary };

if (require.main === module) {
  const people = loadPeople();
  const holdout = process.argv.includes('--holdout');
  const train = holdout ? people.filter((p) => !isTestPerson(p)) : people;
  const dict = buildDictionary(train);
  const sorted = Object.fromEntries(Object.entries(dict).sort(([a], [b]) => a.localeCompare(b, 'bn')));
  console.log(`${people.length} usable people, ${train.length} used, ${Object.keys(dict).length} dictionary words`);
  if (!holdout) {
    const out = path.join(__dirname, '..', 'src', 'learned-dictionary.json');
    fs.writeFileSync(out, JSON.stringify(sorted, null, 0) + '\n');
    console.log(`wrote ${out}`);
  }
}
