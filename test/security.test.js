const test = require('node:test');
const assert = require('node:assert');
const lib = require('../src');
const { banglaNameToEnglish, transliterateWord } = lib;

// Hostile or huge input must stay fast (linear time) and never crash the caller.
test('Long and hostile input finishes quickly', () => {
  const inputs = [
    'ক'.repeat(200000), // one huge word (was quadratic)
    '(ক.'.repeat(60000), // punctuation mixed into a word (was regex backtracking)
    'এম'.repeat(20000), // glued initials (was a stack overflow)
    'রাম' + 'চন্দ্র'.repeat(20000), // compound chain
    'ক-'.repeat(50000),
    'মোঃ'.repeat(30000),
    'শাকিল আহমেদ '.repeat(20000),
    '('.repeat(100000),
  ];
  for (const input of inputs) {
    const start = Date.now();
    assert.strictEqual(typeof banglaNameToEnglish(input), 'string');
    assert.ok(Date.now() - start < 2000, `took ${Date.now() - start} ms for input of length ${input.length}`);
  }
});

test('Invalid arguments throw TypeError with a clear message', () => {
  for (const bad of [undefined, null, 5, {}, [], true]) {
    assert.throws(() => banglaNameToEnglish(bad), TypeError);
  }
  assert.throws(() => banglaNameToEnglish('শুভ', 'x'), /options must be an object/);
  assert.throws(() => banglaNameToEnglish('শুভ', []), /options must be an object/);
  assert.throws(() => banglaNameToEnglish('শুভ', { dictionary: ['x'] }), /options.dictionary must be an object/);
  assert.throws(() => banglaNameToEnglish('শুভ', { dictionary: { 'শুভ': 5 } }), /must be a string/);
  assert.throws(() => banglaNameToEnglish('শুভ', { useLearnedDictionary: 'no' }), /must be a boolean/);
  assert.throws(() => transliterateWord(null), TypeError);
});

test('Missing options are fine', () => {
  assert.strictEqual(banglaNameToEnglish('শুভ দাশ', null), 'Shuvo Das');
  assert.strictEqual(banglaNameToEnglish('শুভ দাশ', {}), 'Shuvo Das');
  assert.strictEqual(banglaNameToEnglish('শুভ দাশ', { dictionary: null }), 'Shuvo Das');
});

test('No prototype pollution and no inherited-property lookups', () => {
  banglaNameToEnglish('শুভ', JSON.parse('{"dictionary":{"__proto__":"x","constructor":"y"}}'));
  assert.strictEqual(Object.keys(Object.prototype).length, 0);
  assert.strictEqual(({}).x, undefined);
  for (const w of ['__proto__', 'constructor', 'toString', 'hasOwnProperty']) {
    assert.strictEqual(banglaNameToEnglish(w), w); // English text passes through untouched
  }
});

test('Public API is exactly what the types document', () => {
  assert.deepStrictEqual(Object.keys(lib).sort(), ['banglaNameToEnglish', 'transliterateWord']);
  // Internal evaluation hooks are not reachable through options.
  assert.strictEqual(banglaNameToEnglish('নজরুল', { learnedDictionary: { 'নজরুল': 'X' } }), 'Nazrul');
});

test('Importing and using the library prints nothing', () => {
  const methods = ['log', 'info', 'warn', 'error', 'debug', 'trace'];
  const original = methods.map((m) => console[m]);
  let calls = 0;
  methods.forEach((m) => { console[m] = () => { calls++; }; });
  try {
    delete require.cache[require.resolve('../src')];
    require('../src').banglaNameToEnglish('মোঃ শাকিল আহমেদ');
    try { require('../src').banglaNameToEnglish(1); } catch { /* expected */ }
  } finally {
    methods.forEach((m, i) => { console[m] = original[i]; });
  }
  assert.strictEqual(calls, 0);
});
