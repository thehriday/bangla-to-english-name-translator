'use strict';

// Public entry point: exactly the API documented in index.d.ts.
const { createTranslator } = require('./translator');
const { transliterateWord: transliterate } = require('./transliterate');
const LEARNED_DICTIONARY = require('./learned-dictionary.json');

/**
 * Convert a Bangla person name to English.
 * @param {string} banglaName  e.g. "শাহারিয়ার হৃদয়"
 * @param {{ dictionary?: Record<string, string>, useLearnedDictionary?: boolean } | null} [options]
 * @returns {string} e.g. "Shahariar Hridoy"
 * @throws {TypeError} when the name is not a string or an option has the wrong type
 */
const banglaNameToEnglish = createTranslator(LEARNED_DICTIONARY);

/**
 * Phonetic transliteration of a single Bangla word (rules only, lowercase).
 * @param {string} word
 * @returns {string}
 */
function transliterateWord(word) {
  if (typeof word !== 'string') {
    throw new TypeError(`Expected the word to be a string, got ${word === null ? 'null' : typeof word}`);
  }
  return transliterate(word);
}

module.exports = { banglaNameToEnglish, transliterateWord };
