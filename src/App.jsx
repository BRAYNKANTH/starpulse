import './components/foodMenus.css';
import { lazy, Suspense, useEffect, useState } from 'react';
import ShopLanding from './components/ShopLanding';
import { api } from './data/api';

const OwnerStudio = lazy(() => import('./OwnerStudio'));

export default function App() {
  const bizId = new URLSearchParams(window.location.search).get('biz');
  return bizId ? <PublicShop id={bizId} /> : <Suspense fallback={<div className="studio-loading" role="status">Opening the studio…</div>}><OwnerStudio /></Suspense>;
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

