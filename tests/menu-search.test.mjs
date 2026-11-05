import test from 'node:test';
import assert from 'node:assert/strict';
import { matchesMenuSearch } from '../src/data/menuSearch.js';

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

test('missing fields do not match or break the search', () => {
  assert.equal(matchesMenuSearch({ name: 'Tea' }, 'undefined'), false);
  assert.equal(matchesMenuSearch({}, 'tea'), false);
});
