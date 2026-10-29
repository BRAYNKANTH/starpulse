import { useEffect, useRef, useState } from 'react';
import { Search, UtensilsCrossed, ArrowUpRight } from 'lucide-react';
import { menuTagLabel } from '../data/menuTags';

// Category names move with the page, like a delivery app: the bar stays at the top, the section you are reading is
// highlighted and slid into view, and tapping a name scrolls to that section.
const smoothScroll = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

export default function PublicMenu({ profile, design, items, money, preview = false }) {
  const Main = preview ? 'div' : 'main';
  const root = useRef(null);
  // A tapped name stays highlighted until the visitor scrolls by hand, even when its section is too near the end of the page to reach the top.
  const tapped = useRef('');
  const [active, setActive] = useState('');
  const [search, setSearch] = useState('');
  const categories = [...new Set(items.map(item => item.category || 'Menu'))];
  const query = design.showSearch ? search.toLowerCase() : '';
  const visible = items.filter(item => `${item.name} ${item.description} ${item.category}`.toLowerCase().includes(query));
  const shown = categories.filter(name => visible.some(item => (item.category || 'Menu') === name));
  const shownKey = shown.join('|');
  const current = shown.includes(active) ? active : shown[0] || '';
  const foodTemplate = design.palette.food;
  const sidebar = design.sidebar && design.showCategories;
  const sections = () => [...(root.current?.querySelectorAll('.public-menu-category') || [])];

  // Follow the page: the active section is the last one whose top has passed the sticky bar.
  useEffect(() => {
    if (preview || !design.showCategories) return undefined;
    let frame = 0;
    const update = () => {
      frame = 0;
      if (tapped.current) { setActive(tapped.current); return; }
      const bar = root.current?.querySelector('.category-tabs, .menu-category-sidebar');
      const list = sections();
      if (!bar || !list.length) return;
      const horizontal = bar.classList.contains('category-tabs') || window.matchMedia('(max-width: 700px)').matches;
      root.current.style.setProperty('--menu-bar-offset', `${horizontal ? bar.offsetHeight : 12}px`);
      const line = (horizontal ? bar.getBoundingClientRect().bottom : 24) + 24;
      let name = list[0].dataset.category;
      for (const section of list) if (section.getBoundingClientRect().top <= line) name = section.dataset.category;
      if (window.scrollY > 0 && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) name = list[list.length - 1].dataset.category;
      setActive(name);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    const release = () => { tapped.current = ''; };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    for (const type of ['wheel', 'touchstart', 'keydown']) window.addEventListener(type, release, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll);
      for (const type of ['wheel', 'touchstart', 'keydown']) window.removeEventListener(type, release);
    };
  }, [preview, design.showCategories, shownKey]);

  // Slide the highlighted name to the middle of a sideways-scrolling bar.
  useEffect(() => {
    const bar = root.current?.querySelector('.category-tabs, .menu-category-sidebar');
    const button = bar?.querySelector('[aria-current="true"]');
    if (!bar || !button || bar.scrollWidth <= bar.clientWidth) return;
    bar.scrollTo({ left: button.offsetLeft - (bar.clientWidth - button.offsetWidth) / 2, behavior: smoothScroll() });
  }, [current]);

  const goTo = name => {
    tapped.current = name;
    setActive(name);
    sections().find(section => section.dataset.category === name)?.scrollIntoView({ behavior: smoothScroll(), block: 'start' });
  };
  const categoryNavigation = <nav className={sidebar ? 'menu-category-sidebar' : 'category-tabs'} aria-label="Menu categories">
    {sidebar && <p className="menu-sidebar-label">EXPLORE</p>}
    {shown.map(name => <button key={name} type="button" aria-current={current === name ? 'true' : undefined} className={current === name ? 'active' : ''} onClick={() => goTo(name)}><span>{name}</span>{sidebar && <ArrowUpRight size={14} />}</button>)}
  </nav>;
  return <Main ref={root} className={`shop-menu-main layout-${design.layout} density-${design.density}`}>
    {foodTemplate && <div className="food-menu-masthead">{design.showCover && profile.coverImage && <img className="food-menu-cover" src={profile.coverImage} alt={`${profile.name} atmosphere`} />}{design.showBrand && <div className="food-menu-brand">{profile.logo ? <img src={profile.logo} alt="" /> : <span className="food-brand-mark"><UtensilsCrossed size={25} /></span>}<strong>{profile.name || 'Your restaurant'}</strong></div>}</div>}
    <div className="menu-public-heading"><div><p className="shop-kicker">{design.palette.eyebrow}</p><h1>{design.title || 'Our menu'}</h1><p>{design.subtitle || profile.tagline || 'Find your next favourite.'}</p>{design.showPrices && design.priceStyle === 'number' && <small className="menu-currency-note">Prices in {profile.currency || 'LKR'}</small>}</div>
      {design.showSearch && <label className="menu-search"><Search size={18} /><input type="search" aria-label="Search menu" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search the menu…" /></label>}
    </div>
    <div className={sidebar ? 'menu-sidebar-shell' : 'menu-category-shell'}>
      {design.showCategories && shown.length > 0 && categoryNavigation}
      <div className="menu-category-content">{shown.map((name, index) => <section className="public-menu-category" key={name} data-category={name}><div className="menu-category-heading">{design.numbered && <span className="menu-section-number">{String(index + 1).padStart(2, '0')}</span>}<h2>{name}</h2><span className="menu-heading-line" /></div><div className="public-menu-grid">{visible.filter(item => (item.category || 'Menu') === name).map(item => <MenuItem key={item.id} item={item} money={money} design={design} />)}</div></section>)}
        {query && <p className="sr-only" aria-live="polite">{visible.length} {visible.length === 1 ? 'item' : 'items'} shown</p>}
        {!visible.length && <div className="public-empty"><UtensilsCrossed size={32} /><h2>{items.length ? 'No matching items' : 'Menu coming soon'}</h2><p>{items.length ? 'Try a different search.' : 'Ask our team about today’s options.'}</p></div>}
      </div>
    </div>
  </Main>;
}

export function MenuItem({ item, money, design }) {
  const placeholder = (design.template === 'catalog' && design.layout === 'cards') || design.layout === 'tiles';
  const tags = item.tags || [];
  return <article className={`public-menu-item ${item.soldOut ? 'sold-out' : ''}`}>
    {design.showImages && (item.image ? <img src={item.image} alt="" loading="lazy" /> : placeholder && <div className="menu-item-image-placeholder" aria-hidden="true"><UtensilsCrossed size={32} /></div>)}
    <div className="public-menu-item-body"><div className="public-item-title"><h3>{item.name || 'Untitled item'}</h3>{design.showPrices && <strong>{money(item.price)}</strong>}</div>{design.showDescriptions && item.description && <p>{item.description}</p>}
      {(item.soldOut || tags.length > 0) && <div className="menu-item-labels">{item.soldOut && <span className="menu-label sold">Sold out</span>}{tags.map(tag => <span key={tag} className={`menu-label tag-${tag}`}>{menuTagLabel(tag)}</span>)}</div>}
    </div>
  </article>;
}
