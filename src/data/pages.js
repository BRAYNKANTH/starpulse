import { Building2, CircleUser, Users, LayoutDashboard, MessageSquare, QrCode, Store, UtensilsCrossed, Plus } from 'lucide-react';

// `shop: true` pages work on the selected shop, so the top bar shows the shop switcher and Publish there.
export const PAGES = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, shop: true },
  { id: 'register', label: 'Business profile', icon: Store, group: 'Shop', shop: true },
  { id: 'menu', label: 'Menu', icon: UtensilsCrossed, group: 'Shop', shop: true },
  { id: 'qr', label: 'QR & print', icon: QrCode, group: 'Shop', shop: true },
  { id: 'inbox', label: 'Feedback', icon: MessageSquare, group: 'Customers', shop: true },
  { id: 'profiles', label: 'All shops', icon: Building2, group: 'Account' },
  { id: 'account', label: 'My account', icon: CircleUser, group: 'Account' },
  { id: 'accounts', label: 'Clients', icon: Users, group: 'Administration', adminOnly: true },
  { id: 'new', label: 'New shop', icon: Plus, hidden: true },
];

// Old links (#/print) still open the right page.
export const PAGE_ALIASES = { print: 'qr' };
