'use strict';

/**
 * Bangla person name -> English name.
 *
 * Each word is resolved by the first of these that knows it:
 *   1. the caller's own `dictionary` option
 *   2. the curated dictionary (hand-picked conventional spellings)
 *   3. the learned dictionary (most common real-world spelling, learned from Wikidata)
 *   4. abbreviation / initials handling (মোঃ -> Md., এ কে এম -> A K M)
 *   5. phonetic transliteration rules
 */

const { CURATED_DICTIONARY, ABBREVIATIONS, BARE_ABBREVIATIONS, INITIALS } = require('./dictionary');
const { transliterateWord } = require('./transliterate');

let LEARNED_DICTIONARY = {};
try {
  LEARNED_DICTIONARY = require('./learned-dictionary.json');
} catch {
  // Not generated yet (run `npm run build:dictionary`); rules still work without it.
}

const normalizeKeys = (dict) => {
  const out = {};
  for (const [k, v] of Object.entries(dict)) out[k.normalize('NFC')] = v;
  return out;
};

const CURATED = normalizeKeys(CURATED_DICTIONARY);
const LEARNED = normalizeKeys(LEARNED_DICTIONARY);

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Convert a Bangla name to English.
 * @param {string} banglaName  e.g. "শাহারিয়ার হৃদয়"
 * @param {object} [options]
 * @param {object} [options.dictionary]  your own word mappings, which win over everything, e.g. { 'হৃদয়': 'Hriday' }
 * @param {boolean} [options.useLearnedDictionary=true]  set false to use only the curated list and rules
 * @returns {string} e.g. "Shahariar Hridoy"
 */
function banglaNameToEnglish(banglaName, options = {}) {
  if (typeof banglaName !== 'string') {
    throw new TypeError(`Expected a string, got ${typeof banglaName}`);
  }
  const custom = options.dictionary ? normalizeKeys(options.dictionary) : {};
  const learned = options.learnedDictionary || (options.useLearnedDictionary === false ? {} : LEARNED);
  const lookup = (w) => custom[w] || CURATED[w] || learned[w];

  const words = splitWords(banglaName.normalize('NFC'));
  const isInitial = (w) => INITIALS[w.replace(/\.$/, '')] !== undefined;

  return words
    .map((word, i) => {
      const bare = word.replace(/[ঃ:.]$/, '');
      const known = lookup(word) || lookup(bare);
      if (known) return known;
      if (ABBREVIATIONS[bare] && (bare !== word || BARE_ABBREVIATIONS.has(word))) return ABBREVIATIONS[bare];

      // Initials: "এ.কে.এম." or a run of initials like "এস এম" (a lone "এম" could be part of a name).
      const dotted = word.split('.').filter(Boolean);
      if (word.includes('.') && dotted.every((p) => INITIALS[p])) {
        return dotted.map((p) => INITIALS[p] + '.').join('');
      }
      // A lone initial before other words is also an initial: "এম সাইফুর রহমান" -> "M Saifur Rahman".
      if (isInitial(word) && (word.endsWith('.') || isInitial(words[i - 1] || '') || i < words.length - 1)) {
        return INITIALS[bare] + (word.endsWith('.') ? '.' : '');
      }

      const glued = splitGluedInitials(bare);
      if (glued) return glued.map((p) => INITIALS[p]).join('');

      return capitalize(transliterateWord(bare));
    })
    .join(' ');
}

// "একেএম" -> ['এ', 'কে', 'এম'] when the whole word is 3+ initials run together, else null.
function splitGluedInitials(word) {
  const parse = (rest) => {
    if (rest === '') return [];
    for (const len of [5, 4, 3, 2, 1]) {
      const head = rest.slice(0, len);
      if (INITIALS[head]) {
        const tail = parse(rest.slice(len));
        if (tail) return [head, ...tail];
      }
    }
    return null;
  };
  const parts = parse(word);
  return parts && parts.length >= 3 ? parts : null;
}

// Split on spaces, and also after an abbreviation glued to the next word ("মোঃশাকিল" -> "মোঃ", "শাকিল").
function splitWords(name) {
  const words = [];
  for (const word of name.trim().split(/\s+/).filter(Boolean)) {
    const m = word.match(/^(.+?[ঃ:.])(.+)$/);
    if (m && ABBREVIATIONS[m[1].slice(0, -1)]) words.push(m[1], m[2]);
    else words.push(word);
  }
  return words;
}

module.exports = { banglaNameToEnglish, transliterateWord };
