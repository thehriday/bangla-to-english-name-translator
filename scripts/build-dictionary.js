// Learns the most common real-world English spelling of each Bangla name word from Wikidata,
// keeping only words where the phonetic rules would give a different spelling.
//
// Usage:
//   node scripts/build-dictionary.js            -> src/learned-dictionary.json (all data)
//   node scripts/build-dictionary.js --holdout  -> prints stats; used by evaluate.js via buildDictionary()
const fs = require('fs');
const path = require('path');
const { loadPeople, loadEveryday, isTestPerson, similarity, looseKey, SOURCE_WEIGHT } = require('./dataset');
const SRC = process.env.SRC_DIR || require('path').join(__dirname, '..', 'src');
const { transliterateWord } = require(`${SRC}/transliterate`);
const { ABBREVIATIONS, INITIALS } = require(`${SRC}/dictionary`);
const { splitCompound } = require(`${SRC}/translator`);

// English spelling of the parts the library splits off (see SPLIT_SUFFIXES in src/index.js).
const SUFFIX_EN = { 'চন্দ্র': 'chandra', 'কুমার': 'kumar' };

const DEFAULTS = { minWeight: 3, minPeople: 1, minShare: 0.5, minSimilarity: 0.5, trustedPeople: 3, singleSimilarity: 0.8, minTargetPeople: 3, bangladeshStyle: true };

// Words the library already handles itself (abbreviations, initials) or that are not names.
const SKIP_EN = /^(of|the|and|de|von|van|al|el|bin|ibn)$/i;

const TARGET_SOURCES = new Set((process.env.TARGET_SOURCES || 'bangladesh').split(','));

// True when `spelling` uses an Indian spelling habit that the rule's Bangladeshi-style output
// avoids: ee/oo for i/u (Zeenat vs Zinat), bh or v for ভ/ব (Abhi vs Ovi, Vivek vs Bibek),
// s for শ (Sisir vs Shishir), -ay for -অয় (Bijay vs Bijoy).
function indianStyle(rule, spelling) {
  const r = rule.toLowerCase();
  const c = spelling.toLowerCase();
  const count = (str, sub) => str.split(sub).length - 1;
  return (count(c, 'ee') > count(r, 'ee')) || (count(c, 'oo') > count(r, 'oo'))
    || (r.includes('v') && !c.includes('v') && c.slice(1).includes('bh'))
    || (c.includes('v') && !r.includes('v'))
    || (count(c, 'sh') < count(r, 'sh'))
    || (r.endsWith('oy') && c.endsWith('ay'));
}

// Per Bangla word, the weighted votes for each English spelling: `all` sources together, and the
// target audience (Bangladeshi/Bengali people on Wikidata) separately.
function tally(people, everyday = {}) {
  const words = new Map();
  // `n` people (or name occurrences) voting with weight `w` each.
  const add = (bucket, key, w, n = 1) => {
    bucket.total += w * n;
    bucket.people += n;
    bucket.spellings.set(key, (bucket.spellings.get(key) || 0) + w * n);
    bucket.peoplePerSpelling.set(key, (bucket.peoplePerSpelling.get(key) || 0) + n);
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
  for (const [bn, spellings] of Object.entries(everyday)) {
    if (/[.:ঃ]/.test(bn) || INITIALS[bn] || ABBREVIATIONS[bn]) continue; // handled by the library itself
    // Compounds the library splits (জগদীশচন্দ্র) teach their first part instead (জগদীশ -> Jagadish).
    const compound = splitCompound(bn);
    const word = compound ? compound[0] : bn;
    for (const [en, count] of Object.entries(spellings)) {
      let head = en;
      if (compound) {
        const suffix = SUFFIX_EN[compound[1]];
        if (!en.endsWith(suffix) || en.length <= suffix.length + 1) continue;
        head = en.slice(0, -suffix.length);
      }
      if (!words.has(word)) words.set(word, { all: empty(), target: empty() });
      add(words.get(word).all, head.charAt(0).toUpperCase() + head.slice(1), 1, count);
    }
  }
  return words;
}

function buildDictionary(people, opts = {}, everyday = {}) {
  const o = { ...DEFAULTS, ...opts };
  const { minWeight, minPeople, minShare, minSimilarity, trustedPeople, singleSimilarity, minTargetPeople } = o;

  // The winning spelling of a vote, or null when no spelling clearly leads.
  // `rule` set: votes for Indian-style spellings are ignored (Bangladeshi pattern).
  const winner = (entry, rule) => {
    if (entry.total < minWeight || entry.people < minPeople) return null;
    let ranked = [...entry.spellings.entries()].sort((a, b) => b[1] - a[1]);
    if (rule) ranked = ranked.filter(([spelling]) => !indianStyle(rule, spelling));
    if (!ranked.length) return null;
    const [best, weight] = ranked[0];
    const runnerUp = ranked[1] ? ranked[1][1] : 0;
    const share = weight / ranked.reduce((sum, [, w]) => sum + w, 0);
    // A majority, or a clear leader (Laxmi 47% vs Lakhi 23% vs Lakshmi 18%).
    return share >= minShare || (share >= 0.35 && weight >= 1.5 * runnerUp) ? best : null;
  };

  const dict = {};
  for (const [bn, { all, target }] of tally(people, everyday)) {
    // Bangladeshi/Bengali people decide when there are enough of them and they agree; otherwise all
    // sources vote (মন্ডল: Wikidata Mondal 14 vs Mandal 11 is a tie, everyday records say Mondal).
    const rule = transliterateWord(bn);
    // Other sources (mostly West Bengal records) may not bring in Indian spelling habits.
    const fromAll = winner(all, o.bangladeshStyle ? rule : null);
    let fromTarget = target.people >= minTargetPeople ? winner(target) : null;
    // Even one or two Bangladeshi people decide when the difference is only spelling style
    // (শান্ত: Bangladesh "Shanto" vs West Bengal "Shanta"; মণি: "Moni" vs "Mani").
    if (!fromTarget && o.bangladeshStyle && target.people > 0) {
      const bd = winner(target);
      if (bd && !indianStyle(rule, bd) && (!fromAll || looseKey(bd) === looseKey(fromAll))) fromTarget = bd;
    }
    const best = fromTarget || fromAll;
    if (!best) continue;
    const entry = fromTarget ? target : all;
    if (rule.toLowerCase() === best.toLowerCase()) continue; // rules already get it right
    // A spelling that sounds nothing like the Bangla word is usually a mislabeled record
    // (পার্বতী -> "Mousumi"); accept it only when several people back it up (মুখোপাধ্যায় -> Mukherjee).
    if (similarity(rule, best) < minSimilarity && entry.peoplePerSpelling.get(best) < trustedPeople) continue;
    // One person's spelling may be a typo (মর্তুজা -> "Matruza"), so it must sound very close to the rule.
    if (entry.peoplePerSpelling.get(best) === 1 && similarity(rule, best) < singleSimilarity) continue;
    dict[bn] = best;
  }
  return dict;
}

module.exports = { buildDictionary };

if (require.main === module) {
  const people = loadPeople();
  const holdout = process.argv.includes('--holdout');
  const train = holdout ? people.filter((p) => !isTestPerson(p)) : people;
  // The shipped dictionary uses both everyday files; --holdout leaves out the test file.
  const everydayTrain = loadEveryday('train');
  if (!holdout) {
    for (const [bn, s] of Object.entries(loadEveryday('test'))) {
      everydayTrain[bn] = everydayTrain[bn] || {};
      for (const [en, c] of Object.entries(s)) everydayTrain[bn][en] = (everydayTrain[bn][en] || 0) + c;
    }
  }
  const dict = buildDictionary(train, {}, everydayTrain);
  const sorted = Object.fromEntries(Object.entries(dict).sort(([a], [b]) => a.localeCompare(b, 'bn')));
  console.log(`${people.length} usable people, ${train.length} used, ${Object.keys(dict).length} dictionary words`);
  if (!holdout) {
    const out = path.join(__dirname, '..', 'src', 'learned-dictionary.json');
    fs.writeFileSync(out, JSON.stringify(sorted, null, 0) + '\n');
    console.log(`wrote ${out}`);
  }
}
