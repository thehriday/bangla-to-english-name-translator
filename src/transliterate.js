'use strict';

// Phonetic (sound-based) romanization of a single Bangla word, tuned for personal names.

const INDEPENDENT_VOWELS = {
  'অ': 'a', 'আ': 'a', 'ই': 'i', 'ঈ': 'i', 'উ': 'u', 'ঊ': 'u', 'ঋ': 'ri',
  'এ': 'e', 'ঐ': 'oi', 'ও': 'o', 'ঔ': 'ou',
};

const VOWEL_SIGNS = {
  'া': 'a', 'ি': 'i', 'ী': 'i', 'ু': 'u', 'ূ': 'u', 'ৃ': 'ri',
  'ে': 'e', 'ৈ': 'ai', 'ো': 'o', 'ৌ': 'ou',
};

const CONSONANTS = {
  'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'ng',
  'চ': 'ch', 'ছ': 'ch', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'n',
  'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n',
  'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
  'প': 'p', 'ফ': 'f', 'ব': 'b', 'ভ': 'v', 'ম': 'm',
  'য': 'z', 'র': 'r', 'ল': 'l', 'শ': 'sh', 'ষ': 'sh', 'স': 's', 'হ': 'h',
  'ড়': 'r', 'ঢ়': 'rh', 'য়': 'y', 'ৎ': 't',
};

// Consonants before which ঙ/ং sound like a plain "n".
const VELARS = new Set(['ক', 'খ', 'গ', 'ঘ']);

const MODIFIERS = { 'ং': 'ng', 'ঃ': 'h', 'ঁ': 'n' }; // ঁ: খাঁ -> Khan, চাঁদ -> Chand

const HASANTA = '্';
const NUKTA = '়';

// Split a word into units: consonants (with optional nukta), vowels, signs, etc.
function tokenize(word) {
  // Normalize decomposed forms (ড + ় -> ড়) so lookups work consistently.
  const chars = [...word.normalize('NFC')];
  const tokens = [];
  for (let i = 0; i < chars.length; i++) {
    if (chars[i + 1] === NUKTA) {
      tokens.push(chars[i] + NUKTA);
      i++;
    } else {
      tokens.push(chars[i]);
    }
  }
  return tokens;
}

const isPlainConsonant = (x) => CONSONANTS[x] !== undefined && x !== 'য়' && x !== 'ৎ';

// Bangla drops the inherent vowel of a mid-word consonant in two patterns:
//   V-C-CV   তানভীর -> Tanvir, নুসরাত -> Nusrat, সরকার -> Sarkar (not Tanavir, Nusarat)
//   V-C-C-C# আকবর -> Akbar, আজমল -> Ajmal, বরকত -> Barkat (not Akabar, Ajamal)
function dropsInherentVowel(tokens, i) {
  const prev = tokens[i - 1];
  if (i === 0 || prev === HASANTA) return false;
  // A leading অ keeps the next vowel: অনামিকা -> Anamika, অপরাজিতা -> Aparajita.
  if (i === 1 && tokens[0] === 'অ') return false;

  const next = tokens[i + 1];
  if (!isPlainConsonant(next)) return false;
  if (VOWEL_SIGNS[tokens[i + 2]] !== undefined) {
    // …but not before the name endings -তী/-নী/-লী/-লা: স্বাগতা -> Swagata, শ্যামলী -> Shyamali.
    const endsName = i + 3 === tokens.length && ['ী', 'া'].includes(tokens[i + 2]) && ['ত', 'ন', 'ণ', 'ল'].includes(next);
    return !endsName;
  }
  return isPlainConsonant(tokens[i + 2]) && i + 3 === tokens.length;
}

function transliterateWord(word) {
  const tokens = tokenize(word);
  let out = '';

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const prev = tokens[i - 1];
    const next = tokens[i + 1];

    if ((t === 'অ' || t === 'এ') && next === HASANTA && tokens[i + 2] === 'য') {
      out += 'a'; // অ্যা / এ্যা is the English "a" sound (অ্যানি -> Ani)
      i += tokens[i + 3] === 'া' ? 3 : 2;
    } else if ((t === 'ও' || t === 'উ') && next === 'য়' && VOWEL_SIGNS[tokens[i + 2]] !== undefined) {
      out += 'w'; // ওয়া/উয়া -> wa (ওয়াজেদ -> Wazed, আউয়াল -> Awal)
      i++;
    } else if (t === 'ও' && i > 0 && CONSONANTS[next] !== undefined) {
      out += 'w'; // ও between sounds is "w": রওশন -> Rowshan, হাওলাদার -> Hawladar
    } else if (t === 'ো' && next === 'য়' && VOWEL_SIGNS[tokens[i + 2]] !== undefined) {
      // -োয়া-: আনোয়ার -> Anwar, দেলোয়ার -> Delwar; but first syllable মোয়াজ্জেম -> Moazzem
      out += i === 1 ? 'o' : 'w';
      i++;
    } else if (t === 'য়' && prev === 'া' && CONSONANTS[next] !== undefined && i + 2 < tokens.length) {
      out += 'i'; // -ায়- before a consonant: রায়হান -> Raihan, হায়দার -> Haidar
    } else if (t === 'ই' && i === 0 && next === 'য়' && VOWEL_SIGNS[tokens[i + 2]] !== undefined) {
      out += 'y'; // ইয়া at the start -> ya (ইয়াসমিন -> Yasmin)
      i++;
    } else if (t === 'ই' && i === 0 && (next === 'উ' || next === 'ঊ')) {
      out += 'y'; // ইউ at the start -> yu (ইউনূস -> Yunus, ইউসুফ -> Yusuf)
    } else if (INDEPENDENT_VOWELS[t] !== undefined) {
      out += INDEPENDENT_VOWELS[t];
    } else if (VOWEL_SIGNS[t] !== undefined) {
      out += VOWEL_SIGNS[t];
    } else if (t === 'ং' && VELARS.has(next)) {
      out += 'n'; // প্রিয়াংকা -> Priyanka, not Priyangka
    } else if (MODIFIERS[t] !== undefined) {
      out += MODIFIERS[t];
    } else if (t === HASANTA) {
      // Suppresses the inherent vowel; handled by the consonant branch below.
    } else if (CONSONANTS[t] !== undefined) {
      if (prev === HASANTA && i >= 2 && t === 'ব') {
        // ব-phala: doubles after ব/ম (সাব্বির -> Sabbir), otherwise "w" (স্বপন -> Swapan).
        const before = tokens[i - 2];
        if (['ব', 'ম', 'র', 'গ'].includes(before)) out += 'b'; // র্ব: সর্বজিৎ -> Sarbajit, গ্ব: দিগ্বিজয় -> Digbijoy
        else if (before === 'শ') out = out.slice(0, -1) + 'w'; // শ্ব -> sw (বিশ্বাস -> Biswas)
        else out += 'w';
      } else if (prev === HASANTA && i >= 2 && t === 'য') {
        out += 'y'; // য-phala (আদিত্য -> Aditya)
      } else if (t === 'ঙ' && next === HASANTA && VELARS.has(tokens[i + 2])) {
        out += 'n'; // মঙ্গল -> Mangal, not Manggal
      } else if (t === 'জ' && next === HASANTA && tokens.slice(i + 2, i + 5).join('') === 'জাম') {
        out += 'z'; // -উজ্জামান -> -uzzaman (আসাদুজ্জামান -> Asaduzzaman)
      } else if (t === 'জ' && prev === HASANTA && tokens[i - 2] === 'জ' && tokens[i + 1] === 'া' && tokens[i + 2] === 'ম') {
        out += 'z';
      } else if (t === 'জ' && next === HASANTA && tokens[i + 2] === 'ঞ') {
        out += 'gy'; // জ্ঞ -> gy (জ্ঞানেন্দ্র -> Gyanendra, প্রজ্ঞা -> Pragya)
        i += 2;
      } else if (t === 'ভ' && (i === 0 || prev === HASANTA)) {
        out += 'bh'; // ভাস্কর -> Bhaskar, শম্ভু -> Shambhu; elsewhere "v" (তানভীর -> Tanvir)
      } else {
        out += CONSONANTS[t];
      }

      // ৎ never carries a vowel (উৎপল -> Utpal).
      if (t === 'ৎ') continue;

      // Inherent vowel: added unless a vowel sign or hasanta follows.
      const followedBySign = next !== undefined && (VOWEL_SIGNS[next] !== undefined || next === HASANTA);
      if (followedBySign) continue;
      if (next === 'ও' && i === 0) {
        out += 'o'; // রওশন -> Rowshan, শওকত -> Showkat
        continue;
      }

      // A vowel letter mid-word starts a new name part, so no vowel in between:
      // সালাহউদ্দিন -> Salahuddin, আমানউল্লাহ -> Amanullah (not Salahauddin).
      if (i > 0 && INDEPENDENT_VOWELS[next] !== undefined) continue;

      const isLast = i === tokens.length - 1 ||
        tokens.slice(i + 1).every((x) => MODIFIERS[x] !== undefined);
      if (isLast) {
        if (prev === HASANTA && tokens[i - 2] === 'ন' && t === 'ত') {
          out += 'o'; // -ন্ত names end in "-nto": শান্ত -> Shanto, অনন্ত -> Ananto
        } else if (t === 'ত' && prev === 'র' && tokens[i - 2] === HASANTA && tokens[i - 3] === 'ব') {
          out += 'a'; // after a র-phala syllable: সুব্রত -> Subrata, দেবব্রত -> Debabrata
        } else if (prev === HASANTA) {
          out += 'a'; // other final conjuncts: চন্দ্র -> Chandra, আদিত্য -> Aditya, গুপ্ত -> Gupta
        } else if (t === 'ভ' && i === 2 && VOWEL_SIGNS[prev] !== undefined) {
          out += 'o'; // short CV-ভ names keep the "o": শুভ -> Shuvo (but অমিতাভ -> Amitabh)
        }
      } else if (next === 'য়' && (i + 2 === tokens.length || CONSONANTS[tokens[i + 2]] !== undefined)) {
        // অয় is spelled "oy": হৃদয় -> Hridoy, জয় -> Joy, জয়নাল -> Joynal.
        out += 'o';
      } else if (t === 'য়') {
        if (i + 2 === tokens.length && isPlainConsonant(next)) out += 'o'; // নয়ন -> Noyon
      } else if (!dropsInherentVowel(tokens, i)) {
        out += 'a';
      }
    } else if (/[০-৯]/.test(t)) {
      out += String(t.charCodeAt(0) - '০'.charCodeAt(0));
    } else {
      out += t; // punctuation, Latin letters, etc.
    }
  }
  return out;
}

module.exports = { transliterateWord, tokenize };
