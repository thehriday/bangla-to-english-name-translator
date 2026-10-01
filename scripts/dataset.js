// Shared helpers for building and evaluating the learned dictionary from data/wikidata-names.json.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SRC = process.env.SRC_DIR || path.join(__dirname, '..', 'src');
const DATA_FILE = path.join(__dirname, '..', 'data', 'wikidata-names.json');

// How much a spelling from each source counts. Bangladeshi and Bengali-Indian people are the
// target audience; other sources fill gaps without outvoting Bengali spelling conventions.
const SOURCE_WEIGHT = { bangladesh: 3, bengali_india: 3, british_india: 1, india: 0.5, pakistan: 0.5 };
const EVAL_SOURCES = new Set(['bangladesh', 'bengali_india']);

const BN_NAME = /^[ঀ-৿ .:ঃ-]+$/;
const EN_NAME = /^[A-Za-z .'-]+$/;

function cleanLabel(s) {
  return s.replace(/\s*\(.*?\)\s*/g, ' ').replace(/,.*$/, '').replace(/\s+/g, ' ').trim();
}

// People whose Bangla and English labels have the same number of words, so words line up.
function loadPeople() {
  const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const people = [];
  for (const r of raw) {
    const bn = cleanLabel(r.bn).normalize('NFC');
    const en = cleanLabel(r.en);
    if (!BN_NAME.test(bn) || !EN_NAME.test(en)) continue;
    // Split compounds the same way the library does (প্রবোধচন্দ্র -> প্রবোধ চন্দ্র) so words line up.
    const { splitCompound } = require(`${SRC}/translator`);
    const bnWords = bn.split(' ').flatMap((w) => splitCompound(w) || [w]);
    const enWords = en.split(' ');
    if (bnWords.length !== enWords.length) continue;
    people.push({ ...r, bn, en, bnWords, enWords });
  }
  return people;
}

// Sound-alike key that ignores common spelling variation (Haque/Hoque, Zaman/Jaman, Mohammad/Mohammed).
function looseKey(s) {
  return s.toLowerCase().replace(/[^a-z]/g, '')
    .replace(/q/g, 'k').replace(/z/g, 'j').replace(/ph/g, 'f').replace(/w/g, 'b').replace(/v/g, 'b')
    .replace(/bh/g, 'b').replace(/ee/g, 'i').replace(/oo/g, 'u').replace(/y/g, 'i')
    .replace(/[aoeiu]+/g, (m) => (m[0] === 'o' || m[0] === 'a' ? 'a' : m[0]))
    .replace(/sh/g, 's').replace(/th/g, 't').replace(/dh/g, 'd').replace(/kh/g, 'k').replace(/gh/g, 'g').replace(/ch/g, 'c')
    .replace(/h/g, '').replace(/(.)\1+/g, '$1');
}

// 1 = same sound-alike key, 0 = nothing in common.
function similarity(a, b) {
  const x = looseKey(a), y = looseKey(b);
  const d = Array.from({ length: x.length + 1 }, (_, i) => [i, ...Array(y.length).fill(0)]);
  for (let j = 1; j <= y.length; j++) d[0][j] = j;
  for (let i = 1; i <= x.length; i++) {
    for (let j = 1; j <= y.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1));
    }
  }
  return 1 - d[x.length][y.length] / Math.max(x.length, y.length, 1);
}

// Everyday name words { bangla: { english: count } } (see fetch-everyday-names.js), or {} if not downloaded.
// split: 'train' (the dataset's training file) or 'test' (its separate test file).
function loadEveryday(split = 'train') {
  const file = path.join(__dirname, '..', 'data', split === 'test' ? 'everyday-names-test.json' : 'everyday-names.json');
  if (!fs.existsSync(file)) return {};
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  const { modernize } = require(`${SRC}/transliterate`);
  const out = {};
  for (const [bn, spellings] of Object.entries(raw)) {
    const key = modernize(bn);
    out[key] = out[key] || {};
    for (const [en, c] of Object.entries(spellings)) out[key][en] = (out[key][en] || 0) + c;
  }
  return out;
}

// Stable 20% of distinct everyday words held out for evaluation.
function isTestWord(bn) {
  return crypto.createHash('md5').update(bn).digest()[0] % 5 === 0;
}

// Stable 20% test split, only among the target-audience sources.
function isTestPerson(p) {
  if (!EVAL_SOURCES.has(p.source)) return false;
  return crypto.createHash('md5').update(p.id).digest()[0] % 5 === 0;
}

module.exports = { loadPeople, loadEveryday, isTestPerson, isTestWord, looseKey, similarity, SOURCE_WEIGHT };
