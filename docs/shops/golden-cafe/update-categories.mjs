// Moves Golden Cafe's menu items into the corrected categories. Run from the repo root:
//   node docs/shops/golden-cafe/update-categories.mjs
// It uses DATABASE_URL from .env.local (the live site), like the admin commands, and prints which database it used.
// Only categories and their order change. Names, prices, photos, availability and items added in the studio are kept.
// It is safe to run twice. To try it on a copy of the local database instead: --data-dir <folder containing pglite>
import { existsSync } from 'node:fs';
import { createStore, validateProfile } from '../../../server/store.mjs';
import { openDatabase } from '../../../server/db.mjs';

const SHOP = 'golden-cafe';
const ids = (...numbers) => numbers.map(number => `gc-${number}`);
const MOVES = {
  'Short Eats': ids('28', '29', '30', '31', '32', '33', '33-1'),
  'Idli, Hoppers & Breads': ids('34', '35', '35-1', '36', '37', '53', '54'),
  'Dosa & Uthappam': ids('38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', '50', '51', '52', '65', '66', '67', '68', '69', '70', '71', '72', '73', '74', '75', '76', '77', '78'),
  Curries: ids('79', '80', '81'),
};
const ORDER = ['Fresh Juice', 'Hot Tea', 'Short Eats', 'Idli, Hoppers & Breads', 'Special Items', 'Dosa & Uthappam', 'Curries'];

// Exported so the import file can be kept in step with the live shop.
export function recategorise(menu) {
  const target = new Map(Object.entries(MOVES).flatMap(([category, list]) => list.map(id => [id, category])));
  const moved = menu.map(item => ({ ...item, category: target.get(item.id) || item.category }));
  // Categories the owner added in the studio stay, after the ones above.
  const rank = item => { const at = ORDER.indexOf(item.category); return at === -1 ? ORDER.length : at; };
  return moved.map((item, index) => ({ item, index })).sort((a, b) => rank(a.item) - rank(b.item) || a.index - b.index).map(({ item }) => item);
}

if (process.argv[1]?.endsWith('update-categories.mjs')) {
  const flag = process.argv.indexOf('--data-dir');
  if (flag !== -1) {
    process.env.DATA_DIR = process.argv[flag + 1];
    delete process.env.DATABASE_URL;
    delete process.env.POSTGRES_URL;
  } else {
    for (const file of ['.env.local', '.env']) if (existsSync(file)) process.loadEnvFile(file);
  }
  console.log(`Database: ${process.env.DATABASE_URL || process.env.POSTGRES_URL ? 'Neon (DATABASE_URL)' : `local (${process.env.DATA_DIR || '.data'}/pglite)`}`);
  const store = await createStore(await openDatabase());
  try {
    const profile = await store.profile(SHOP);
    if (!profile) throw new Error(`No shop called ${SHOP} in this database. Nothing was changed.`);
    const updated = validateProfile({ ...profile, menu: recategorise(profile.menu || []) }, SHOP);
    const owner = await store.ownerOf(SHOP);
    await store.save(updated, owner);
    const counts = updated.menu.reduce((all, item) => ({ ...all, [item.category]: (all[item.category] || 0) + 1 }), {});
    console.log(`Updated ${updated.name}: ${updated.menu.length} items.`);
    for (const [category, count] of Object.entries(counts)) console.log(`  ${category}: ${count}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await store.close();
  }
}
