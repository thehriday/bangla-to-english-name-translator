/**
 * Convert Bangla (Bengali) person names to English, in Bangladeshi spelling style.
 *
 * @example
 * import { banglaNameToEnglish } from 'bangla-to-english-name-translator';
 *
 * banglaNameToEnglish('শাহারিয়ার হৃদয়'); // 'Shahariar Hridoy'
 * banglaNameToEnglish('মোঃ শাকিল আহমেদ'); // 'Md. Shakil Ahmed'
 *
 * @packageDocumentation
 */

/**
 * Word mappings from a Bangla word to the English spelling to use for it.
 *
 * @example
 * const myNames: NameDictionary = { 'হৃদয়': 'Hriday', 'হক': 'Huq' };
 */
export type NameDictionary = Readonly<Record<string, string>>;

/** Options for {@link banglaNameToEnglish}. */
export interface TranslateOptions {
  /**
   * Your own word mappings. They win over everything else, so use them for names whose
   * owners spell them a particular way.
   *
   * @example
   * banglaNameToEnglish('শাহারিয়ার হৃদয়', { dictionary: { 'হৃদয়': 'Hriday' } });
   * // 'Shahariar Hriday'
   */
  readonly dictionary?: NameDictionary;

  /**
   * Use the dictionary of real-world spellings learned from Wikidata and everyday name records
   * (for example `নজরুল` → `Nazrul` instead of the phonetic `Najrul`).
   *
   * Set to `false` to use only the curated word list and the phonetic rules.
   *
   * @defaultValue `true`
   */
  readonly useLearnedDictionary?: boolean;
}

/**
 * Convert a Bangla person name to English.
 *
 * - Common names get the spelling people actually use (`কাজী নজরুল ইসলাম` → `Kazi Nazrul Islam`).
 * - Abbreviations and initials are expanded (`মোঃ` → `Md.`, `ডাঃ` → `Dr.`, `এ কে এম` → `A K M`).
 * - Compound names are split the way English writes them (`জগদীশচন্দ্র` → `Jagadish Chandra`).
 * - Punctuation, English words and numbers in the input are kept (`শুভ (দাশ),` → `Shuvo (Das),`).
 *
 * @param banglaName - The name in Bangla script, e.g. `'শাহারিয়ার হৃদয়'`.
 * @param options - Optional settings, see {@link TranslateOptions}.
 * @returns The name in English, e.g. `'Shahariar Hridoy'`. An empty or blank input returns `''`.
 * @throws {TypeError} If `banglaName` is not a string, or an option has the wrong type
 * (`options` not an object, a `dictionary` value that is not a string, `useLearnedDictionary` not a boolean).
 *
 * @example
 * banglaNameToEnglish('শুভ দাশ');                    // 'Shuvo Das'
 * banglaNameToEnglish('ডাঃ মোঃ শফিকুল ইসলাম চৌধুরী'); // 'Dr. Md. Shafiqul Islam Chowdhury'
 */
export function banglaNameToEnglish(banglaName: string, options?: TranslateOptions | null): string;

/**
 * Phonetic transliteration of a single Bangla word using only the sound rules: no dictionaries,
 * no abbreviation handling and no capitalization.
 *
 * Most apps should use {@link banglaNameToEnglish}; this is useful to see what the rules alone produce.
 *
 * @param word - One Bangla word, e.g. `'নজরুল'`.
 * @returns The lowercase romanization, e.g. `'najrul'`.
 * @throws {TypeError} If `word` is not a string.
 *
 * @example
 * transliterateWord('তানভীর'); // 'tanvir'
 */
export function transliterateWord(word: string): string;
