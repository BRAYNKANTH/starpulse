import test from 'node:test';
import assert from 'node:assert/strict';
import { highlightParts, matchesMenuSearch } from '../src/data/menuSearch.js';

const biryani = { name: 'Hyderabadi chicken dum biryani', description: 'Slow-cooked with saffron', category: 'Rice', tags: ['spicy', 'popular'] };
const dhal = { name: 'Dhal curry', category: 'Curries', tags: ['vegan', 'gluten-free'] };

test('words match in any order, even with words between them', () => {
  assert.equal(matchesMenuSearch(biryani, 'hyderabadi biryani'), true);
  assert.equal(matchesMenuSearch(biryani, 'biryani chicken'), true);
});

test('every word has to match', () => {
  assert.equal(matchesMenuSearch(biryani, 'chicken kottu'), false);
});

test('capitals and extra spaces are ignored', () => {
  assert.equal(matchesMenuSearch(biryani, 'BIRYANI '), true);
  assert.equal(matchesMenuSearch(biryani, '  dum   biryani  '), true);
});

test('description and category are searched', () => {
  assert.equal(matchesMenuSearch(biryani, 'saffron'), true);
  assert.equal(matchesMenuSearch(dhal, 'curries'), true);
});

test('labels are searched by the name customers see', () => {
  assert.equal(matchesMenuSearch(biryani, 'spicy'), true);
  assert.equal(matchesMenuSearch(dhal, 'vegan curry'), true);
  assert.equal(matchesMenuSearch(dhal, 'gluten-free'), true);
  assert.equal(matchesMenuSearch(dhal, 'gluten free'), true);
  assert.equal(matchesMenuSearch(biryani, 'vegan'), false);
});

test('an empty search shows everything', () => {
  assert.equal(matchesMenuSearch(biryani, ''), true);
  assert.equal(matchesMenuSearch(biryani, '   '), true);
});

const marked = (text, query) => highlightParts(text, query).filter(part => part.match).map(part => part.text);

test('highlighting marks every word typed and keeps the original capitals', () => {
  assert.deepEqual(marked('Hyderabadi chicken dum biryani', 'BIRYANI hyder'), ['Hyder', 'biryani']);
  assert.deepEqual(highlightParts('Dhal curry', 'hal'), [{ text: 'D', match: false }, { text: 'hal', match: true }, { text: ' curry', match: false }]);
});

test('highlighting marks repeated, partial and overlapping matches', () => {
  assert.deepEqual(marked('Mango lassi with mango', 'mango'), ['Mango', 'mango']);
  assert.deepEqual(marked('Biryani', 'bir rya'), ['Birya']);
  assert.deepEqual(marked('aaa', 'aa'), ['aaa']);
});

test('highlighting always gives back the whole text', () => {
  for (const [text, query] of [['Egg biryani', 'egg'], ['Egg biryani', 'zzz'], ['Egg (2 pcs)', '(2'], ['Egg', '']]) {
    assert.equal(highlightParts(text, query).map(part => part.text).join(''), text);
  }
  assert.deepEqual(highlightParts('', 'egg'), []);
  assert.deepEqual(highlightParts(undefined, 'egg'), []);
  assert.deepEqual(marked('Egg', '   '), []);
});

test('missing fields do not match or break the search', () => {
  assert.equal(matchesMenuSearch({ name: 'Tea' }, 'undefined'), false);
  assert.equal(matchesMenuSearch({}, 'tea'), false);
});
