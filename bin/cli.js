#!/usr/bin/env node
'use strict';

const { banglaNameToEnglish } = require('../src');

const USAGE = `Usage: bangla-to-english-name-translator "<Bangla name>"
       cat names.txt | bangla-to-english-name-translator   (one name per line)

Options:
  -h, --help     show this help
  -v, --version  show the version`;

function fail(message) {
  console.error(`Error: ${message}`);
  process.exitCode = 1;
}

function main() {
  const args = process.argv.slice(2);

  if (args.includes('-h') || args.includes('--help')) {
    console.log(USAGE);
  } else if (args.includes('-v') || args.includes('--version')) {
    console.log(require('../package.json').version);
  } else if (args.length > 0) {
    console.log(banglaNameToEnglish(args.join(' ')));
  } else if (!process.stdin.isTTY) {
    let input = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { input += chunk; });
    process.stdin.on('error', (err) => fail(err.message));
    process.stdin.on('end', () => {
      try {
        for (const line of input.split(/\r?\n/)) {
          if (line.trim()) console.log(banglaNameToEnglish(line));
        }
      } catch (err) {
        fail(err.message);
      }
    });
  } else {
    fail('please pass a Bangla name, e.g. bangla-to-english-name-translator "শুভ দাশ"');
    console.error(`\n${USAGE}`);
  }
}

try {
  main();
} catch (err) {
  fail(err.message);
}
