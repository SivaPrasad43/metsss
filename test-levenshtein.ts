import { levenshteinDistance } from './src/utils/levenshtein';

console.log('Testing Levenshtein Distance Implementation\n');

const testCases = [
  { str1: 'javascript', str2: 'javascript', expected: 0 },
  { str1: 'js', str2: 'js', expected: 0 },
  { str1: 'mongodb', str2: 'mongodb', expected: 0 },
  { str1: 'nodejs', str2: 'node-js', expected: 1 },
  { str1: 'typescript', str2: 'typscript', expected: 1 },
  { str1: 'javascript', str2: 'java-script', expected: 1 },
  { str1: 'react', str2: 'angular', expected: 7 },
  { str1: 'js', str2: 'javascript', expected: 8 },
];

let passed = 0;
let failed = 0;

testCases.forEach(({ str1, str2, expected }) => {
  const result = levenshteinDistance(str1, str2);
  const status = result === expected ? '✅ PASS' : '❌ FAIL';
  
  if (result === expected) {
    passed++;
  } else {
    failed++;
  }
  
  console.log(`${status}: levenshteinDistance("${str1}", "${str2}") = ${result} (expected: ${expected})`);
});

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
