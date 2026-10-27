import { useEffect, useState } from 'react';
import { loadFonts } from '../data/menuFonts';
import './menuOptions.css';
import './menuTemplates.css';
import { MapPin, Phone, Clock, ArrowRight, UtensilsCrossed } from 'lucide-react';
import CustomerFunnel from './CustomerFunnel';
import PublicMenu, { MenuItem } from './PublicMenu';
import { resolveMenuDesign } from '../data/menuDesign';
import { formatMoney } from '../utils/money';

export default function ShopLanding({ businessProfile: p, initialView = 'landing', preview = false }) {
  const [view, setView] = useState(['landing', 'menu', 'review'].includes(initialView) ? initialView : 'landing');
  const design = resolveMenuDesign(p.menuDesign);
  // Inside the studio's live previews the page already has a <main>.
  const Main = preview ? 'div' : 'main';
  const items = (p.menu || []).filter(item => item.available !== false);
  useEffect(() => { loadFonts([design.fontPair]); }, [design.fontPair]);
  const changeView = next => {
    setView(next);
    if (!preview) { const url = new URL(window.location.href); url.searchParams.set('view', next); window.history.replaceState(null, '', url); }
  };
  const money = value => formatMoney(value, p.currency || 'LKR', design.priceStyle);
  return <div className={`shop-public menu-template-${design.template} menu-font-${design.font} ${design.classes}`} style={{ ...design.vars, '--shop-accent': design.accent, '--menu-accent': design.accent, '--menu-bg': design.palette.background, '--menu-surface': design.palette.surface, '--menu-text': design.palette.text, '--menu-muted': design.palette.muted, '--menu-border': design.palette.border }}>
    <header className="shop-public-nav"><button onClick={() => changeView('landing')} className="shop-wordmark">{p.logo ? <img src={p.logo} alt="" /> : <UtensilsCrossed size={22} />}<span>{p.name || 'Your shop'}</span></button><nav aria-label="Shop navigation">{[['landing', 'Home'], ['menu', 'Menu'], ['review', 'Feedback']].map(([key, label]) => <button key={key} aria-current={view === key ? 'page' : undefined} className={view === key ? 'active' : ''} onClick={() => changeView(key)}>{label}</button>)}</nav></header>
    {view === 'landing' && <Main className="shop-landing-main"><section className="shop-hero" style={p.coverImage ? { backgroundImage: `linear-gradient(90deg, rgba(8,17,15,.9), rgba(8,17,15,.28)), url("${p.coverImage}")` } : undefined}><div><p className="shop-kicker">{p.category || 'WELCOME TO OUR SHOP'}</p><h1>{p.name || 'Your shop'}</h1><p>{p.tagline || 'Discover something you’ll love.'}</p><button className="shop-primary-button" onClick={() => changeView('menu')}>Explore our menu <ArrowRight size={18} /></button></div></section><section className="shop-info-grid">{p.hours && <div><Clock size={20} /><strong>Opening hours</strong><p>{p.hours}</p></div>}{p.address && <div><MapPin size={20} /><strong>Find us</strong><p>{p.address}</p></div>}{p.phone && <div><Phone size={20} /><strong>Say hello</strong><a href={`tel:${p.phone.replace(/[^+\d]/g, '')}`}>{p.phone}</a></div>}</section><section className="shop-feature-section"><p className="shop-kicker">TAKE A LOOK</p><h2>Fresh picks from our menu</h2><div className="public-menu-grid">{items.filter(item => !item.soldOut).sort((a, b) => (b.tags?.includes('popular') ? 1 : 0) - (a.tags?.includes('popular') ? 1 : 0)).slice(0, 3).map(item => <MenuItem key={item.id} item={item} money={money} design={design} />)}</div>{!items.length && <p>Our menu is coming soon. Contact us for today’s options.</p>}<button className="shop-text-button" onClick={() => changeView('menu')}>View the full menu →</button></section></Main>}
    {view === 'menu' && <PublicMenu profile={p} design={design} items={items} money={money} preview={preview} />}
    {view === 'review' && <Main><CustomerFunnel businessProfile={p} preview={preview} /></Main>}
    <footer className="shop-public-footer"><strong>{p.name}</strong><span>{p.address || 'Thank you for visiting.'}</span>{p.email && <a href={`mailto:${p.email}`}>Contact us</a>}<small>Powered by DQ.lk</small></footer>
  </div>;
}
