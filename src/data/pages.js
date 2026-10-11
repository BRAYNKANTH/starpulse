import { Building2, CircleUser, Users, LayoutDashboard, MessageSquare, Printer, QrCode, Store, UtensilsCrossed } from 'lucide-react';

export const PAGES = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'register', label: 'Business profile', icon: Store, group: 'Shop' },
  { id: 'menu', label: 'Menu', icon: UtensilsCrossed, group: 'Shop' },
  { id: 'qr', label: 'QR codes', icon: QrCode, group: 'Shop' },
  { id: 'print', label: 'Print & NFC', icon: Printer, group: 'Shop' },
  { id: 'inbox', label: 'Feedback', icon: MessageSquare, group: 'Customers' },
  { id: 'profiles', label: 'All shops', icon: Building2, group: 'Workspace' },
  { id: 'account', label: 'Account & plan', icon: CircleUser, group: 'Workspace' },
  { id: 'accounts', label: 'Accounts', icon: Users, group: 'Administration', adminOnly: true },
];
