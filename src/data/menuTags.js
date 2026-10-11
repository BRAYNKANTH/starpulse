// Dietary and promotional labels a menu item can carry. Shared by the server validator and the UI.
export const MENU_TAGS = [
  { id: 'popular', label: 'Popular' },
  { id: 'new', label: 'New' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'spicy', label: 'Spicy' },
  { id: 'gluten-free', label: 'Gluten-free' },
];

export const menuTagLabel = id => MENU_TAGS.find(tag => tag.id === id)?.label || id;

export function normalizeMenuTags(value) {
  if (!Array.isArray(value)) return [];
  return MENU_TAGS.map(tag => tag.id).filter(id => value.includes(id));
}
