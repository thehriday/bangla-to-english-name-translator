'use strict';

/**
 * Bangla person name -> English name.
 *
 * Each word is resolved by the first of these that knows it:
 *   1. the caller's own `dictionary` option
 *   2. the curated dictionary (hand-picked conventional spellings)
 *   3. the learned dictionary (most common real-world spelling)
 *   4. abbreviation / initials handling (মোঃ -> Md., এ কে এম -> A K M)
 *   5. phonetic transliteration rules
 *
 * Every step is linear in the input length, so long or hostile input cannot stall the caller.
 */

const { CURATED_DICTIONARY, ABBREVIATIONS, BARE_ABBREVIATIONS, INITIALS } = require('./dictionary');
const { transliterateWord, modernize } = require('./transliterate');

const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

// Prototype-free copy with keys in the same normalized form as the input.
function normalizeKeys(dict) {
  const out = Object.create(null);
  for (const [k, v] of Object.entries(dict)) out[modernize(k)] = v;
  return out;
}

const CURATED = normalizeKeys(CURATED_DICTIONARY);
const HAS_BANGLA = /[ঀ-৿]/;

// Compound name parts that English almost always writes as a separate word (measured on ~20,000
// Bengali people on Wikidata: চন্দ্র split 475 vs joined 52, কুমার 191 vs 42). Others such as নাথ
// (Rabindranath) or উদ্দিন (Salahuddin) are usually written joined, so they are left alone.
const SPLIT_SUFFIXES = ['চন্দ্র', 'কুমার'];

// "প্রবোধচন্দ্র" -> ["প্রবোধ", "চন্দ্র"]; returns null when the word is not such a compound.
function splitCompound(word) {
  for (const suffix of SPLIT_SUFFIXES) {
    const head = word.slice(0, -suffix.length);
    if (word.endsWith(suffix) && [...head].length >= 2 && !head.endsWith('্')) return [head, suffix];
  }
  return null;
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function validateOptions(options) {
  if (options === undefined || options === null) return {};
  if (typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError(`options must be an object, got ${Array.isArray(options) ? 'array' : typeof options}`);
  }
  const { dictionary, useLearnedDictionary } = options;
  if (dictionary !== undefined && dictionary !== null) {
    if (typeof dictionary !== 'object' || Array.isArray(dictionary)) {
      throw new TypeError(`options.dictionary must be an object, got ${Array.isArray(dictionary) ? 'array' : typeof dictionary}`);
    }
    for (const [k, v] of Object.entries(dictionary)) {
      if (typeof v !== 'string') {
        throw new TypeError(`options.dictionary["${k}"] must be a string, got ${typeof v}`);
      }
    }
  }
  if (useLearnedDictionary !== undefined && typeof useLearnedDictionary !== 'boolean') {
    throw new TypeError(`options.useLearnedDictionary must be a boolean, got ${typeof useLearnedDictionary}`);
  }
  return options;
}

/**
 * Builds a translator around a learned dictionary. The package entry point uses the shipped
 * dictionary; the evaluation scripts pass one built without their test data.
 */
function createTranslator(learnedDictionary) {
  const LEARNED = normalizeKeys(learnedDictionary);

  return function banglaNameToEnglish(banglaName, options) {
    if (typeof banglaName !== 'string') {
      throw new TypeError(`Expected the name to be a string, got ${banglaName === null ? 'null' : typeof banglaName}`);
    }
    const opts = validateOptions(options);
    const custom = opts.dictionary ? normalizeKeys(opts.dictionary) : Object.create(null);
    const learned = opts.useLearnedDictionary === false ? Object.create(null) : LEARNED;
    const lookup = (w) => custom[w] || CURATED[w] || learned[w];

    // Invisible joiners (ZWNJ/ZWJ/ZWSP/BOM) are common in typed Bangla but carry no sound.
    const cleaned = modernize(banglaName).replace(/[​-‍﻿]/g, '')
      .replace(/([।॥,;])(?=\S)/g, '$1 '); // "শুভ।দাশ" -> "শুভ। দাশ"
    const tokens = splitWords(cleaned).map(splitPunctuation);
    const words = tokens.map((t) => t.core);
    const isInitial = (w) => has(INITIALS, w.replace(/\.$/, ''));

    const convert = (word, i, allowCompound = true) => {
      if (!HAS_BANGLA.test(word)) return word; // English words, numbers, etc. pass through untouched
      if (word.includes('-')) {
        // উর-রহমান -> Ur-Rahman: each part on its own.
        return word.split('-').map((part) => (part ? convert(part, -1) : part)).join('-');
      }
      const bare = word.replace(/[ঃ:.]$/, '');
      const known = lookup(word) || lookup(bare);
      if (known) return known;
      if (has(ABBREVIATIONS, bare) && (bare !== word || BARE_ABBREVIATIONS.has(word))) return ABBREVIATIONS[bare];

      // Initials: "এ.কে.এম." or a run of initials like "এস এম" (a lone "এম" could be part of a name).
      const dotted = word.split('.').filter(Boolean);
      if (word.includes('.') && dotted.every((p) => has(INITIALS, p))) {
        return dotted.map((p) => INITIALS[p] + '.').join('');
      }
      // A lone initial before other words is also an initial: "এম সাইফুর রহমান" -> "M Saifur Rahman".
      if (i >= 0 && isInitial(word) && (word.endsWith('.') || isInitial(words[i - 1] || '') || i < words.length - 1)) {
        return INITIALS[bare] + (word.endsWith('.') ? '.' : '');
      }

      const glued = splitGluedInitials(bare);
      if (glued) return glued.map((p) => INITIALS[p]).join('');

      const compound = allowCompound && splitCompound(bare);
      if (compound) return compound.map((part) => convert(part, -1, false)).join(' ');

      return capitalize(transliterateWord(bare));
    };

    return tokens
      .map(({ before, core, after }, i) => before + convert(core, i) + after.replace(/[।॥]/g, '.'))
      .filter(Boolean)
      .join(' ');
  };
}

const isWordChar = (ch) => /[ঀ-৿A-Za-z0-9]/.test(ch);

// Separates punctuation around a word so it does not affect the name: "(দাশ)," -> "(", "দাশ", "),"
// A trailing "." / ":" / "ঃ" stays with the word because it marks abbreviations (মোঃ, ডা.).
function splitPunctuation(word) {
  let start = 0;
  while (start < word.length && !isWordChar(word[start])) start++;
  let end = word.length;
  while (end > start && !isWordChar(word[end - 1]) && word[end - 1] !== '.' && word[end - 1] !== ':') end--;
  return { before: word.slice(0, start), core: word.slice(start, end), after: word.slice(end) };
}

// Longest run of glued initials worth parsing: names have a handful, never dozens.
const MAX_GLUED_LENGTH = 30;

// "একেএম" -> ['এ', 'কে', 'এম'] when the whole word is 3+ initials run together, else null.
function splitGluedInitials(word) {
  if (word.length > MAX_GLUED_LENGTH) return null;
  const memo = new Map();
  const parse = (pos) => {
    if (pos === word.length) return [];
    if (memo.has(pos)) return memo.get(pos);
    let result = null;
    for (const len of [6, 5, 4, 3, 2, 1]) {
      const head = word.slice(pos, pos + len);
      if (head.length === len && has(INITIALS, head)) {
        const tail = parse(pos + len);
        if (tail) {
          result = [head, ...tail];
          break;
        }
      }
    }
    memo.set(pos, result);
    return result;
  };
  const parts = parse(0);
  return parts && parts.length >= 3 ? parts : null;
}

// Split on spaces, and also after an abbreviation glued to the next word ("মোঃশাকিল" -> "মোঃ", "শাকিল").
function splitWords(name) {
  const words = [];
  for (const word of name.trim().split(/\s+/)) {
    if (!word) continue;
    const mark = word.search(/[ঃ:.]/);
    if (mark > 0 && mark < word.length - 1 && has(ABBREVIATIONS, word.slice(0, mark))) {
      words.push(word.slice(0, mark + 1), word.slice(mark + 1));
    } else {
      words.push(word);
    }
  }
  return words;
}

module.exports = { createTranslator, splitCompound };
