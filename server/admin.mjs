// Operator commands. They use DATABASE_URL (your Neon database) when it is set, otherwise the local database.
// Load Neon's address first with `vercel env pull .env.local`; the commands read .env.local and .env automatically.
//   npm run create-admin -- admin@example.com "Your Name"  Create an administrator (or promote an existing account).
//   npm run import-json -- .data                          Import shops, feedback and visits from the old store.json/visits.json.
//   npm run claim-shops -- owner@example.com              Give every unassigned shop to an account.
//   npm run set-plan -- owner@example.com pro             Change an account's plan (free, pro, business).
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createStore } from './store.mjs';
import { openDatabase } from './db.mjs';
import { hashPassword, temporaryPassword, validEmail } from './auth.mjs';
import { PLANS } from '../src/data/plans.js';

for (const file of ['.env.local', '.env']) if (existsSync(file)) process.loadEnvFile(file);
const [command, arg, ...rest] = process.argv.slice(2);
const store = await createStore(await openDatabase());
console.log(`Database: ${process.env.DATABASE_URL || process.env.POSTGRES_URL ? 'Neon (DATABASE_URL)' : 'local (.data/pglite)'}`);
try {
  if (command === 'create-admin') {
    if (!validEmail(arg)) throw new Error('Give a valid email: npm run create-admin -- admin@example.com "Your Name"');
    const existing = await store.userByEmail(arg);
    if (existing) {
      await store.updateUser(existing.id, { role: 'admin' });
      console.log(`${existing.email} is now an administrator. Their password is unchanged.`);
    } else {
      const password = temporaryPassword();
      await store.createUser({ email: arg.trim().toLowerCase(), name: rest.join(' ').trim() || 'Administrator', role: 'admin', plan: 'business', passwordHash: await hashPassword(password), mustChangePassword: true });
      console.log(`Administrator ${arg} created.\nTemporary password: ${password}\nYou will be asked to choose a new password after signing in.`);
    }
  } else if (command === 'import-json') {
    const directory = arg || '.data';
    const file = join(directory, 'store.json');
    if (!existsSync(file)) throw new Error(`${file} not found.`);
    const legacy = JSON.parse(readFileSync(file, 'utf8'));
    const visitsFile = join(directory, 'visits.json');
    const visits = existsSync(visitsFile) ? JSON.parse(readFileSync(visitsFile, 'utf8')) : legacy.visits || {};
    const count = await store.importLegacy({ ...legacy, visits });
    console.log(`Imported ${count} new shop(s). Assign them under Accounts → Shop ownership.`);
  } else {
    const user = arg && await store.userByEmail(arg);
    if (!user) throw new Error(arg ? `No account uses ${arg}.` : 'Give the account email.');
    if (command === 'claim-shops') console.log(`Assigned ${await store.claimUnowned(user.id)} unassigned shop(s) to ${user.email}.`);
    else if (command === 'set-plan') {
      const [plan] = rest;
      if (!PLANS[plan]) throw new Error(`Choose a plan: ${Object.keys(PLANS).join(', ')}.`);
      await store.updateUser(user.id, { plan });
      console.log(`${user.email} is now on the ${PLANS[plan].name} plan.`);
    } else throw new Error('Unknown command. Use create-admin, import-json, claim-shops or set-plan.');
  }
} catch (error) { console.error(error.message); process.exitCode = 1; } finally { await store.close(); }
