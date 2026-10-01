#!/usr/bin/env node
'use strict';

const { banglaNameToEnglish } = require('../src');

// Usage: bangla-to-english-name-translator "শাহারিয়ার হৃদয়"
//        echo "শুভ দাশ" | bangla-to-english-name-translator      (one name per line)
const args = process.argv.slice(2);

if (args.includes('-h') || args.includes('--help')) {
  console.log('Usage: bangla-to-english-name-translator "<Bangla name>"\n       cat names.txt | bangla-to-english-name-translator');
} else if (args.length > 0) {
  console.log(banglaNameToEnglish(args.join(' ')));
} else if (!process.stdin.isTTY) {
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => { input += chunk; });
  process.stdin.on('end', () => {
    for (const line of input.split(/\r?\n/)) {
      if (line.trim()) console.log(banglaNameToEnglish(line));
    }
  });
} else {
  console.error('Please pass a Bangla name, e.g. bangla-to-english-name-translator "শুভ দাশ"');
  process.exitCode = 1;
}
