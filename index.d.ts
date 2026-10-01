export interface TranslateOptions {
  /** Your own word mappings; they win over everything else. Example: `{ 'হৃদয়': 'Hriday' }` */
  dictionary?: Record<string, string>;
  /** Set to `false` to use only the curated word list and phonetic rules. Default `true`. */
  useLearnedDictionary?: boolean;
}

/**
 * Convert a Bangla person name to English.
 * @example banglaNameToEnglish('শাহারিয়ার হৃদয়') // 'Shahariar Hridoy'
 */
export function banglaNameToEnglish(banglaName: string, options?: TranslateOptions): string;

/** Phonetic transliteration of a single Bangla word, without dictionaries or capitalization. */
export function transliterateWord(word: string): string;
