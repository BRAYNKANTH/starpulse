// Every address the app answers. Anything else is a real 404: vercel.json rewrites only these to the app,
// server/index.mjs answers other paths with status 404, and tests/routes.test.mjs keeps the three in step.
export const PUBLIC_PATHS = ['/', '/pricing', '/about', '/contact', '/terms', '/privacy'];
export const APP_PATHS = [...PUBLIC_PATHS, '/signin', '/login', '/demo', '/demo/cards'];
