// crypto.randomUUID only exists in secure contexts (HTTPS or localhost), so fall back elsewhere.
export const newId = () => crypto.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
