import { cosineSimilarity } from './src/utils/similarity';
import { normalizeTags } from './src/utils/normalize';

// Test cosine similarity
console.log('Testing Cosine Similarity...\n');

// Test 1: Identical vectors
const vec1 = [1, 0, 0];
const vec2 = [1, 0, 0];
const similarity1 = cosineSimilarity(vec1, vec2);
console.log(`Test 1 - Identical vectors: ${similarity1}`);
console.log(`Expected: 1.0, Got: ${similarity1}, ${similarity1 === 1 ? '✓ PASS' : '✗ FAIL'}\n`);

// Test 2: Orthogonal vectors
const vec3 = [1, 0, 0];
const vec4 = [0, 1, 0];
const similarity2 = cosineSimilarity(vec3, vec4);
console.log(`Test 2 - Orthogonal vectors: ${similarity2}`);
console.log(`Expected: 0.0, Got: ${similarity2}, ${similarity2 === 0 ? '✓ PASS' : '✗ FAIL'}\n`);

// Test 3: Similar vectors
const vec5 = [1, 2, 3];
const vec6 = [2, 4, 6];
const similarity3 = cosineSimilarity(vec5, vec6);
console.log(`Test 3 - Similar vectors (scaled): ${similarity3}`);
console.log(`Expected: ~1.0, Got: ${similarity3}, ${Math.abs(similarity3 - 1) < 0.0001 ? '✓ PASS' : '✗ FAIL'}\n`);

// Test 4: Partially similar vectors
const vec7 = [1, 0, 0];
const vec8 = [1, 1, 0];
const similarity4 = cosineSimilarity(vec7, vec8);
console.log(`Test 4 - Partially similar vectors: ${similarity4}`);
console.log(`Expected: ~0.707, Got: ${similarity4}, ${Math.abs(similarity4 - 0.707) < 0.01 ? '✓ PASS' : '✗ FAIL'}\n`);

// Test tag normalization
console.log('Testing Tag Normalization...\n');

// Test 5: Lowercase and trim
const tags1 = ['MongoDB', '  Database  ', 'NOSQL'];
const normalized1 = normalizeTags(tags1);
console.log(`Test 5 - Lowercase and trim:`);
console.log(`Input: ${JSON.stringify(tags1)}`);
console.log(`Output: ${JSON.stringify(normalized1)}`);
console.log(`Expected: ["mongodb", "database", "nosql"]`);
console.log(`${JSON.stringify(normalized1) === JSON.stringify(['mongodb', 'database', 'nosql']) ? '✓ PASS' : '✗ FAIL'}\n`);

// Test 6: Deduplicate
const tags2 = ['mongodb', 'MongoDB', 'MONGODB', 'database'];
const normalized2 = normalizeTags(tags2);
console.log(`Test 6 - Deduplicate:`);
console.log(`Input: ${JSON.stringify(tags2)}`);
console.log(`Output: ${JSON.stringify(normalized2)}`);
console.log(`Expected: ["mongodb", "database"]`);
console.log(`${JSON.stringify(normalized2) === JSON.stringify(['mongodb', 'database']) ? '✓ PASS' : '✗ FAIL'}\n`);

// Test 7: Filter empty strings
const tags3 = ['mongodb', '', '  ', 'database'];
const normalized3 = normalizeTags(tags3);
console.log(`Test 7 - Filter empty strings:`);
console.log(`Input: ${JSON.stringify(tags3)}`);
console.log(`Output: ${JSON.stringify(normalized3)}`);
console.log(`Expected: ["mongodb", "database"]`);
console.log(`${JSON.stringify(normalized3) === JSON.stringify(['mongodb', 'database']) ? '✓ PASS' : '✗ FAIL'}\n`);

console.log('All tests completed!');
