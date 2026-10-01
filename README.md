# bangla-to-english-name-translator

Convert Bangla (Bengali) person names to English.

```js
banglaNameToEnglish('শাহারিয়ার হৃদয়');        // 'Shahariar Hridoy'
banglaNameToEnglish('মোঃ শাকিল আহমেদ');         // 'Md. Shakil Ahmed'
banglaNameToEnglish('কাজী নজরুল ইসলাম');        // 'Kazi Nazrul Islam'
banglaNameToEnglish('অ্যাডভোকেট হোসনে আরা শিউলী'); // 'Advocate Hosne Ara Shiuli'
```

- Zero dependencies, works offline, ~120 kB, ~100,000 names per second.
- Gives the **spelling people actually use** for common names (Nazrul, Mizanur, Chowdhury, Haque, Mondal). It learned these from about 61,000 real people on Wikidata and 2.6 million everyday name records.
- Falls back to phonetic rules tuned for Bangla names. The rules handle conjuncts (যুক্তবর্ণ), vowel dropping, য-ফলা/ব-ফলা, রেফ, ঁ, ৎ, and more.
- Understands `মোঃ / মো. / মো / মহঃ` → `Md.`, `মোসাঃ` → `Mst.`, `ডাঃ` → `Dr.`, and initials (`এ কে এম`, `এ.কে.এম.`, `একেএম` → `A K M` / `A.K.M.` / `AKM`).
- Uses **Bangladeshi spelling style** by default: `মুহাম্মদ অভি` → `Muhammad Ovi`, `শান্ত` → `Shanto`, `সঞ্জয়` → `Sanjoy`, `জিনাত` → `Zinat` (not the West Bengal style Abhi, Shanta, Sanjay, Zeenat).
- Splits compound names the way English writes them: `জগদীশচন্দ্র বসু` → `Jagadish Chandra Basu`, `দিলীপকুমার` → `Dilip Kumar`.
- Handles messy real-world input:
  - punctuation (`শুভ (দাশ),` → `Shuvo (Das),`)
  - invisible zero-width characters
  - old spellings (`মুখার্জ্জী` → `Mukherjee`)
  - English words mixed in (`Md. শাকিল` → `Md. Shakil`)
  - hyphenated parts (`উর-রহমান` → `Ur-Rahman`)

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

### TypeScript

Type definitions are included; nothing extra to install. They work with `require`, `import`, and every TypeScript `moduleResolution` setting (`node10`, `node16`, `nodenext`, `bundler`).

```ts
import { banglaNameToEnglish, type TranslateOptions, type NameDictionary } from 'bangla-to-english-name-translator';

const myNames: NameDictionary = { 'হৃদয়': 'Hriday' };
const options: TranslateOptions = { dictionary: myNames };

const name: string = banglaNameToEnglish('শাহারিয়ার হৃদয়', options); // 'Shahariar Hriday'
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

### Errors

The library never prints anything. Invalid input throws a `TypeError` that your app can catch:

```js
try {
  banglaNameToEnglish(userInput);
} catch (err) {
  // err is a TypeError, e.g. "Expected the name to be a string, got number"
}
```

It throws when the name is not a string, `options` is not an object, a `dictionary` value is not a string, or `useLearnedDictionary` is not a boolean. Empty input returns `''`. Every step runs in linear time, so very long or hostile input cannot stall your server.

### Compatibility

- Node.js 14 or newer, with both `require` and `import`.
- Browsers through any bundler (Vite, webpack, Next.js, esbuild). It uses no Node APIs, and the size is ~110 kB gzipped, most of it the name dictionary.
- No dependencies.

### Command line

```sh
npx bangla-to-english-name-translator "শাহারিয়ার হৃদয়"
cat names.txt | npx bangla-to-english-name-translator   # one name per line
```

## How it works

Each word is resolved by the first step that knows it:

1. Your `dictionary` option
2. A curated list of conventional spellings (titles, very common names and surnames)
3. A learned dictionary (~14,500 words) with the most common real-world spelling of each word. It only includes words where the rules would give a different spelling. The vote follows the **Bangladeshi spelling pattern**:
   - When at least 3 Bangladeshi people with the word agree on a spelling, theirs wins.
   - When even 1–2 Bangladeshi people differ from the rest only in spelling style (Shanto vs Shanta, Moni vs Mani), their spelling also wins.
   - Otherwise all sources vote, but spellings with Indian habits are ignored: ee/oo (Zeenat → Zinat), bh/v (Abhi, Vivek → Bibek), s for শ (Sisir → Shishir), and -ay (Bijay → Bijoy).
4. Abbreviation and initials handling
5. Phonetic transliteration rules

## Accuracy

Measured only on data the learned dictionary was **not** built from:

| Test set | Exact | Close¹ | Best possible² |
|---|---|---|---|
| **1,399 Bangladeshi people** (Wikidata, held out), per word | **78.0%** | **89.6%** | ~89% |
| Same people, whole name exactly right | **57.0%** | – | – |
| 99,867 everyday name words, mostly West Bengal (separate test file) | 73.3% | **90.3%** | 86.4% |
| 20,768 everyday name words never seen in training | 59.6% | 83.6% | 84.0% |

¹ Same name, different but common spelling (Haque/Hoque, Mohammad/Mohammed, Shanto/Shanta).
² People spell the same Bangla name differently (হক is Haque, Haq, Huq or Hoque), so no system can match every person's own spelling. This ceiling is the score you would get by always picking the most common spelling of each word, chosen after looking at the answers.

The everyday test data comes from West Bengal, whose spellings follow Indian habits (Abhi, Sanjay, Khatoon). This library writes Bangladeshi style (Ovi, Sanjoy, Khatun), so those rows count many correct Bangladeshi spellings as misses. That is why the "close" column is the better guide there.

Run `npm run fetch:data` and then `npm run evaluate` to reproduce these numbers.

## Limitations

- **Spelling is a choice.** The output is the most common spelling, which may not be the one a particular person uses. For official documents (passports, certificates), let people confirm their spelling, or pass it through `dictionary`.
- **Some sounds are ambiguous in writing.** Examples are `জ` as j or z (Jasim / Nazrul), the inherent vowel as a or o (Rani / Roni), and `ছ` read as "s" in some regional spellings (ছাত্তার → Sattar). The learned dictionary covers common names; rare names fall back to the rules.
- **Rare Sanskrit-style names** not in the dictionary can lose a vowel in the middle, because the vowel-dropping rule that suits most names (তানভীর → Tanvir) does not suit them.

## Development

```sh
npm test                    # ~390 test cases
npm run fetch:data          # download Wikidata names and everyday name records into data/
npm run build:dictionary    # regenerate src/learned-dictionary.json
npm run evaluate            # held-out accuracy report (add -- --errors 50 to list errors)
```

## Data

The learned dictionary is built from:
- person labels on [Wikidata](https://www.wikidata.org/) ([CC0](https://creativecommons.org/publicdomain/zero/1.0/))
- the everyday Bengali name word pairs in [p3jitnath/Transliteration-Model](https://github.com/p3jitnath/Transliteration-Model) (MIT)

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## License

MIT © Shahariar Hriday
