// Plan limits shared by the server (enforcement) and the studio (usage display).
// Billing is not connected yet: change an account's plan with `npm run set-plan -- <email> <plan>`.
export const PLANS = {
  free: { id: 'free', name: 'Free', shops: 1 },
  pro: { id: 'pro', name: 'Pro', shops: 5 },
  business: { id: 'business', name: 'Business', shops: 50 },
};

export const planFor = id => PLANS[id] || PLANS.free;
