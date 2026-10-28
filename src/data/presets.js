import { normalizeQrDesign } from './qrDesign.js';
import { normalizeMenuDesign } from './menuDesign.js';
import { normalizeMenuTags } from './menuTags.js';
import { newShopId } from '../utils/ids.js';
import { normalizePosterDesign } from './qrDesign.js';
// Default Business Presets and Demo Data (Clean & Authentic - No fake ratings)

export const INITIAL_PRESETS = [
  {
    id: 'apex-coffee',
    name: 'Apex Coffee Roasters & Bakery',
    tagline: 'Artisanal Brews, Fresh Pastries & Warm Vibes',
    category: 'Coffee Shop & Bakery',
    address: '420 Specialty St, Downtown Arts District',
    googleReviewUrl: '',
    googlePlaceId: '',
    googleRating: '',
    totalGoogleReviews: '',
    showRatingBadge: false, // Default false to avoid fake ratings
    logo: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1000&auto=format&fit=crop&q=80',
    accentColor: '#F59E0B', // Amber
    themeMode: 'dark',
    customPrompt: 'How was your experience with us today?',
    notePlaceholder: 'Tell us what you enjoyed about your coffee or visit...',
    quickTags: ['☕ Excellent Coffee', '🥐 Delicious Pastries', '⚡ Fast Service', '🌿 Great Ambience', '😃 Friendly Baristas', '💻 Great WiFi'],
    phone: '+1 (555) 382-9011',
    email: 'hello@apexcoffeeroasters.com'
  },
  {
    id: 'golden-crust',
    name: 'Golden Crust Bakery',
    tagline: 'Baked fresh every morning',
    category: 'Bakery & Café',
    customPrompt: 'How were your treats today?',
    notePlaceholder: 'Tell us about your favourite bake…',
    quickTags: ['🥐 Fresh pastries', '🎂 Lovely cakes', '☕ Good coffee', '😊 Friendly staff', '⚡ Quick service']
  },
  {
    id: 'urban-bistro',
    name: 'Urban Bites Bistro & Cocktail Bar',
    tagline: 'Farm-to-Table Dining & Crafted Cocktails',
    category: 'Modern Restaurant & Bar',
    address: '108 Culinary Way, Waterfront District',
    googleReviewUrl: '',
    googlePlaceId: '',
    googleRating: '',
    totalGoogleReviews: '',
    showRatingBadge: false,
    logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1000&auto=format&fit=crop&q=80',
    accentColor: '#6366F1', // Indigo
    themeMode: 'dark',
    customPrompt: 'How was your dining and service experience?',
    notePlaceholder: 'What was your favorite dish or cocktail?',
    quickTags: ['🍷 Signature Cocktails', '🍽️ Gourmet Food', '🕯️ Romantic Vibe', '🍷 Attentive Service', '🎶 Great Music'],
    phone: '+1 (555) 902-1144',
    email: 'manager@urbanbitesbistro.com'
  },
  {
    id: 'spice-garden',
    name: 'Spice Garden Kitchen',
    tagline: 'Rice & curry, kottu and hoppers, made the way we like it at home',
    category: 'Sri Lankan Restaurant',
    customPrompt: 'How was your meal today?',
    notePlaceholder: 'What did you enjoy most?',
    quickTags: ['🍛 Tasty curries', '🌶️ Just the right spice', '🍽️ Generous portions', '😊 Friendly staff', '⚡ Quick service']
  }
];

export function createBusiness() {
  return { id: newShopId(), name: '', tagline: '', category: '', address: '', phone: '', email: '', hours: '', logo: '', coverImage: '', googleReviewUrl: '', accentColor: '#F59E0B', currency: 'LKR', menu: [], menuDesign: normalizeMenuDesign(), qrDesign: normalizeQrDesign(), qrDestination: 'menu', qrUrl: '', posterDesign: normalizePosterDesign(), quickTags: [], published: false };
}
export function getStoredBusinessProfile() {
  try {
    const saved = JSON.parse(localStorage.getItem('starpulse_business_profile'));
    if (saved && typeof saved.id === 'string' && /^[a-z0-9-]{1,80}$/.test(saved.id) && typeof saved.name === 'string') {
      const profile = createBusiness();
      for (const key of Object.keys(profile)) if (typeof profile[key] === 'string' && typeof saved[key] === 'string') profile[key] = saved[key];
      profile.googlePlaceId = typeof saved.googlePlaceId === 'string' ? saved.googlePlaceId : '';
      profile.menuDesign = normalizeMenuDesign(saved.menuDesign);
      profile.qrDesign = normalizeQrDesign(saved.qrDesign);
      profile.menu = Array.isArray(saved.menu) ? saved.menu.filter(item => item && typeof item.id === 'string' && typeof item.name === 'string' && Number.isFinite(Number(item.price))).map(item => ({ id: item.id, name: item.name, category: typeof item.category === 'string' ? item.category : 'Menu', description: typeof item.description === 'string' ? item.description : '', price: item.price, image: typeof item.image === 'string' ? item.image : '', available: item.available !== false, soldOut: item.soldOut === true, tags: normalizeMenuTags(item.tags) })) : [];
      return profile;
    }
  } catch { /* Invalid or unavailable browser cache. */ }
  return createBusiness();
}
export function saveStoredBusinessProfile(profile) {
  try { localStorage.setItem('starpulse_business_profile', JSON.stringify(profile)); } catch { /* Server data remains saved. */ }
}
