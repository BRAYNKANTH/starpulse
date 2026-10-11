// Operator commands that run against the data directory directly.
//   npm run create-admin -- admin@example.com "Your Name"  Create an administrator (or promote an existing account).
//   npm run claim-shops -- owner@example.com              Give shops imported from the old single-owner store to an account.
//   npm run set-plan -- owner@example.com pro             Change an account's plan (free, pro, business).
import { resolve } from 'node:path';
import { createStore } from './store.mjs';
import { hashPassword, temporaryPassword, validEmail } from './auth.mjs';
import { PLANS } from '../src/data/plans.js';

const [command, email, ...rest] = process.argv.slice(2);
const store = createStore(resolve(process.env.DATA_DIR || '.data'));
try {
  if (command === 'create-admin') {
    if (!validEmail(email)) throw new Error('Give a valid email: npm run create-admin -- admin@example.com "Your Name"');
    const existing = store.userByEmail(email);
    if (existing) {
      store.updateUser(existing.id, { role: 'admin' });
      console.log(`${existing.email} is now an administrator. Their password is unchanged.`);
    } else {
      const password = temporaryPassword();
      store.createUser({ email: email.trim().toLowerCase(), name: rest.join(' ').trim() || 'Administrator', role: 'admin', plan: 'business', passwordHash: await hashPassword(password), mustChangePassword: true });
      console.log(`Administrator ${email} created.\nTemporary password: ${password}\nYou will be asked to choose a new password after signing in.`);
    }
  } else {
    const user = email && store.userByEmail(email);
    if (!user) throw new Error(email ? `No account uses ${email}.` : 'Give the account email.');
    if (command === 'claim-shops') console.log(`Assigned ${store.claimUnowned(user.id)} imported shop(s) to ${user.email}.`);
    else if (command === 'set-plan') {
      const [plan] = rest;
      if (!PLANS[plan]) throw new Error(`Choose a plan: ${Object.keys(PLANS).join(', ')}.`);
      store.updateUser(user.id, { plan });
      console.log(`${user.email} is now on the ${PLANS[plan].name} plan.`);
    } else throw new Error('Unknown command. Use create-admin, claim-shops or set-plan.');
  }
} catch (error) { console.error(error.message); process.exitCode = 1; } finally { store.close(); }
