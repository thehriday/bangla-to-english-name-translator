# bangla-to-english-name-translator

Convert Bangla (Bengali) person names to English.

```js
banglaNameToEnglish('শাহারিয়ার হৃদয়');        // 'Shahariar Hridoy'
banglaNameToEnglish('মোঃ শাকিল আহমেদ');         // 'Md. Shakil Ahmed'
banglaNameToEnglish('কাজী নজরুল ইসলাম');        // 'Kazi Nazrul Islam'
banglaNameToEnglish('অ্যাডভোকেট হোসনে আরা শিউলী'); // 'Advocate Hosne Ara Shiuli'
```

- Zero dependencies, works offline, ~35 kB.
- Gives the **spelling people actually use** for common names (Nazrul, Mizanur, Chowdhury, Haque), learned from about 61,000 real people on Wikidata.
- Falls back to phonetic rules tuned for Bangla names. The rules handle conjuncts (যুক্তবর্ণ), vowel dropping, য-ফলা/ব-ফলা, রেফ, ঁ, ৎ, and more.
- Understands `মোঃ / মো. / মো` → `Md.`, `মোসাঃ` → `Mst.`, `ডাঃ` → `Dr.`, and initials (`এ কে এম`, `এ.কে.এম.`, `একেএম` → `A K M` / `A.K.M.` / `AKM`).

## Install

```sh
npm install bangla-to-english-name-translator
```

## Usage

```js
const { banglaNameToEnglish } = require('bangla-to-english-name-translator');
// or: import { banglaNameToEnglish } from 'bangla-to-english-name-translator';

banglaNameToEnglish('শুভ দাশ'); // 'Shuvo Das'
```

### Your own spellings

If you know how a person spells their name, pass it in. Your entries win over everything else:

```js
banglaNameToEnglish('শাহারিয়ার হৃদয়', { dictionary: { 'হৃদয়': 'Hriday' } });
// 'Shahariar Hriday'
```

### Options

| Option | Default | Description |
|---|---|---|
| `dictionary` | `{}` | Your own `{ banglaWord: 'English' }` mappings. They take the highest priority. |
| `useLearnedDictionary` | `true` | Set to `false` to use only the curated word list and phonetic rules. |

### Command line

```sh
npx bangla-to-english-name-translator "শাহারিয়ার হৃদয়"
cat names.txt | npx bangla-to-english-name-translator   # one name per line
```

## How it works

Each word is resolved by the first step that knows it:

1. Your `dictionary` option
2. A curated list of conventional spellings (titles, very common names and surnames)
3. A learned dictionary (~3,000 words) with the most common real-world spelling of each word. It only includes words where the rules would give a different spelling.
4. Abbreviation and initials handling
5. Phonetic transliteration rules

## Accuracy

Measured on **2,050 Bangladeshi and Bengali people held out from training** (the dictionary never saw them), against the English spelling on their Wikidata entry:

| | Exact word | Close word¹ | Exact full name |
|---|---|---|---|
| Rules + curated list | 68.0% | 86.7% | 42.6% |
| **With learned dictionary (default)** | **75.2%** | **87.9%** | **53.8%** |
| Best possible² | 88.7% | – | – |

¹ Same name, different but common spelling (Haque/Hoque, Mohammad/Mohammed).
² People spell the same Bangla name differently (হক is Haque, Haq, Huq or Hoque), so no system can match every person's own spelling. This ceiling is what you would get by always picking the most common spelling of each word, chosen after looking at the answers.

These numbers are for names the library has never seen. Names that appear in the learned dictionary score higher.

Run the evaluation yourself with `npm run evaluate` (after `npm run fetch:data`).

## Limitations

- **Spelling is a choice.** The output is the most common spelling, which may not be the one a particular person uses. For official documents (passports, certificates), let people confirm their spelling, or pass it through `dictionary`.
- **Some sounds are ambiguous in writing.** Examples are `জ` as j or z (Jasim / Nazrul), the inherent vowel as a or o (Rani / Roni), and `ছ` read as "s" in some regional spellings (ছাত্তার → Sattar). The learned dictionary covers common names; rare names fall back to the rules.
- **Long Hindu compound names** (সতীশচন্দ্র, কমলাকান্ত) may get an extra or missing vowel.

## Development

```sh
npm test                    # 300+ test cases
npm run fetch:data          # download names from Wikidata into data/
npm run build:dictionary    # regenerate src/learned-dictionary.json
npm run evaluate            # held-out accuracy report (add -- --errors 50 to list errors)
```

## Data

The learned dictionary is built from person labels on [Wikidata](https://www.wikidata.org/), which are available under [CC0](https://creativecommons.org/publicdomain/zero/1.0/).

## License

MIT
