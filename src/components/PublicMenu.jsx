import { useState } from 'react';
import { Search, UtensilsCrossed, ArrowUpRight } from 'lucide-react';
import { menuTagLabel } from '../data/menuTags';

export default function PublicMenu({ profile, design, items, money }) {
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const categories = [...new Set(items.map(item => item.category || 'Menu'))];
  const activeCategory = design.showCategories && categories.includes(category) ? category : '';
  const query = design.showSearch ? search.toLowerCase() : '';
  const visible = items.filter(item => (!activeCategory || (item.category || 'Menu') === activeCategory) && `${item.name} ${item.description} ${item.category}`.toLowerCase().includes(query));
  const foodTemplate = design.palette.food;
  const sidebar = design.sidebar && design.showCategories;
  const categoryNavigation = <div className={sidebar ? 'menu-category-sidebar' : 'category-tabs'} aria-label="Menu categories">
    {sidebar && <p className="menu-sidebar-label">EXPLORE</p>}
    {[{ value: '', label: 'All' }, ...categories.map(name => ({ value: name, label: name }))].map(({ value, label }) => <button key={value} aria-pressed={activeCategory === value} className={activeCategory === value ? 'active' : ''} onClick={() => setCategory(value)}><span>{label}</span>{sidebar && <ArrowUpRight size={14} />}</button>)}
  </div>;
  return <main className={`shop-menu-main layout-${design.layout} density-${design.density}`}>
    {foodTemplate && <div className="food-menu-masthead">{design.showCover && profile.coverImage && <img className="food-menu-cover" src={profile.coverImage} alt={`${profile.name} atmosphere`} />}{design.showBrand && <div className="food-menu-brand">{profile.logo ? <img src={profile.logo} alt="" /> : <span className="food-brand-mark"><UtensilsCrossed size={25} /></span>}<strong>{profile.name || 'Your restaurant'}</strong></div>}</div>}
    <div className="menu-public-heading"><div><p className="shop-kicker">{design.palette.eyebrow}</p><h1>{design.title || 'Our menu'}</h1><p>{design.subtitle || profile.tagline || 'Find your next favourite.'}</p>{design.showPrices && design.priceStyle === 'number' && <small className="menu-currency-note">Prices in {profile.currency || 'LKR'}</small>}</div>
      {design.showSearch && <label className="menu-search"><Search size={18} /><input aria-label="Search menu" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search the menu…" /></label>}
    </div>
    <div className={sidebar ? 'menu-sidebar-shell' : 'menu-category-shell'}>
      {design.showCategories && categoryNavigation}
      <div className="menu-category-content">{categories.filter(name => visible.some(item => (item.category || 'Menu') === name)).map((name, index) => <section className="public-menu-category" key={name}><div className="menu-category-heading">{design.numbered && <span className="menu-section-number">{String(index + 1).padStart(2, '0')}</span>}<h2>{name}</h2><span className="menu-heading-line" /></div><div className="public-menu-grid">{visible.filter(item => (item.category || 'Menu') === name).map(item => <MenuItem key={item.id} item={item} money={money} design={design} />)}</div></section>)}
        {!visible.length && <div className="public-empty"><UtensilsCrossed size={32} /><h2>{items.length ? 'No matching items' : 'Menu coming soon'}</h2><p>{items.length ? 'Try a different search or category.' : 'Ask our team about today’s options.'}</p></div>}
      </div>
    </div>
  </main>;
}

export function MenuItem({ item, money, design }) {
  const placeholder = design.template === 'catalog' && design.layout === 'cards';
  const tags = item.tags || [];
  return <article className={`public-menu-item ${item.soldOut ? 'sold-out' : ''}`}>
    {design.showImages && (item.image ? <img src={item.image} alt={item.name} loading="lazy" /> : placeholder && <div className="menu-item-image-placeholder" aria-hidden="true"><UtensilsCrossed size={32} /></div>)}
    <div className="public-menu-item-body"><div className="public-item-title"><h3>{item.name || 'Untitled item'}</h3>{design.showPrices && <strong>{money(item.price)}</strong>}</div>{design.showDescriptions && item.description && <p>{item.description}</p>}
      {(item.soldOut || tags.length > 0) && <div className="menu-item-labels">{item.soldOut && <span className="menu-label sold">Sold out</span>}{tags.map(tag => <span key={tag} className={`menu-label tag-${tag}`}>{menuTagLabel(tag)}</span>)}</div>}
    </div>
  </article>;
}
