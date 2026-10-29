import './components/foodMenus.css';
import { lazy, Suspense, useEffect, useState } from 'react';
import ShopLanding from './components/ShopLanding';
import { api } from './data/api';

// The studio, public site and reset screen load separately, so a QR scan only downloads the shop page.
const OwnerStudio = lazy(() => import('./OwnerStudio'));
const ResetPasswordPage = lazy(() => import('./OwnerStudio').then(module => ({ default: module.ResetPasswordPage })));
const PublicPage = lazy(() => import('./components/PublicPages').then(module => ({ default: module.PublicPage })));
const DemoShop = lazy(() => import('./components/DemoCards').then(module => ({ default: module.DemoShop })));
const DemoCards = lazy(() => import('./components/DemoCards'));
const PublicNotFound = lazy(() => import('./components/PublicPages').then(module => ({ default: module.PublicNotFound })));

const PUBLIC_PATHS = ['/', '/pricing', '/about', '/contact', '/terms', '/privacy'];
const loading = <div className="studio-loading" role="status">Loading…</div>;

export default function App() {
  const params = new URLSearchParams(window.location.search);
  const bizId = params.get('biz');
  if (bizId) return <PublicShop id={bizId} />;
  // Public pages are real paths, checked before the studio: the studio
  // itself lives at /signin (and /login). Unknown paths get a real
  // 404 page instead of silently rendering the login screen.
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  let page;
  if (path === '/demo') page = <DemoShop />;
  else if (path === '/demo/cards') page = <DemoCards />;
  else if (PUBLIC_PATHS.includes(path)) page = <PublicPage path={path} />;
  else if (path === '/signin' || path === '/login') {
    // A reset link (/signin?reset=<token>) is handled before the studio
    // branch, so it works whether or not the visitor is already signed in.
    const resetToken = params.get('reset');
    page = resetToken ? <ResetPasswordPage token={resetToken} /> : <OwnerStudio />;
  } else page = <PublicNotFound />;
  return <Suspense fallback={loading}>{page}</Suspense>;
}

function PublicShop({ id }) {
  const [result, setResult] = useState({ loading: true });
  useEffect(() => {
    let active = true;
    api(`/businesses/${encodeURIComponent(id)}`).then(profile => { if (active) setResult({ profile }); }).catch(error => { if (active) setResult({ error: error.message }); });
    return () => { active = false; };
  }, [id]);
  // A neutral page outline while the shop loads, so customers see structure instead of a blank screen.
  if (result.loading) return <main className="public-loading" aria-busy="true"><span className="sr-only" role="status">Opening the shop…</span>
    <div className="public-skeleton" aria-hidden="true"><i className="sk-bar sk-nav" /><i className="sk-bar sk-title" /><i className="sk-bar sk-line" />{[0, 1, 2].map(n => <i key={n} className="sk-card" />)}</div>
  </main>;
  if (!result.profile) return <main className="public-loading public-status"><h1>This shop isn’t available</h1><p>{result.error} If you scanned a QR code, ask the staff for help.</p></main>;
  return <ShopLanding businessProfile={result.profile} initialView={new URLSearchParams(window.location.search).get('view') || 'landing'} />;
}
