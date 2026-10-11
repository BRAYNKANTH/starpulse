import { useState } from 'react';
import { ArrowDown, ArrowUp, Copy, Eye, EyeOff, FolderPlus, GripVertical, ImageIcon, Pencil, Plus, Search, Trash2, TriangleAlert } from 'lucide-react';
import ImageUpload from './ImageUpload';
import Field from './Field';
import ShopLanding from './ShopLanding';
import MenuDesigner from './MenuDesigner';
import { checkImageBudget } from '../utils/images';
import { shopUrl } from '../data/api';
import { MENU_TAGS, menuTagLabel } from '../data/menuTags';
import { newId } from '../utils/ids';

const categoryOf = item => item.category?.trim() || 'Menu';
const statusOf = item => item.available === false ? 'hidden' : item.soldOut ? 'soldout' : 'available';
const STATUS = { available: ['Available', 'success'], soldout: ['Sold out', 'warning'], hidden: ['Hidden', 'neutral'] };
const incomplete = item => !item.name?.trim() || String(item.price ?? '').trim() === '' || !(Number(item.price) >= 0);

export default function MenuBuilder({ businessProfile: p, setBusinessProfile, onSave, saving }) {
  const [tab, setTab] = useState('items');
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [query, setQuery] = useState('');
  const [pending, setPending] = useState([]);
  const [newCategory, setNewCategory] = useState(null);
  const [renaming, setRenaming] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const items = p.menu || [];

  const update = (field, value, checkImages = false) => {
    const next = { ...p, [field]: value };
    if (checkImages) { try { checkImageBudget(next); } catch (e) { setError(e.message); return; } }
    setError(''); setBusinessProfile(next);
  };
  const setItems = (next, checkImages) => update('menu', next, checkImages);
  const categories = [...new Set([...items.map(categoryOf), ...pending])];
  const groupsOf = list => categories.map(name => ({ name, items: list.filter(item => categoryOf(item) === name) }));
  const flatten = groups => groups.flatMap(group => group.items);
  const money = value => { try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: p.currency || 'LKR' }).format(Number(value) || 0); } catch { return `${p.currency} ${(Number(value) || 0).toFixed(2)}`; } };

  const addItem = category => {
    const item = { id: newId(), name: '', category, description: '', price: '', image: '', available: true, soldOut: false, tags: [] };
    const groups = groupsOf(items);
    const group = groups.find(g => g.name === category);
    if (group) group.items.push(item); else groups.push({ name: category, items: [item] });
    setItems(flatten(groups)); setPending(current => current.filter(name => name !== category)); setExpanded(item.id); setQuery('');
  };
  const changeItem = (id, patch, checkImages) => setItems(items.map(item => item.id === id ? { ...item, ...patch } : item), checkImages);
  const removeItem = item => { if (item.name && !window.confirm(`Delete “${item.name}”?`)) return; setItems(items.filter(i => i.id !== item.id)); };
  const duplicateItem = item => { const copy = { ...item, id: newId(), name: `${item.name} (copy)` }; const index = items.indexOf(item); setItems([...items.slice(0, index + 1), copy, ...items.slice(index + 1)], !!item.image); };
  const moveItem = (item, delta) => {
    const groups = groupsOf(items), group = groups.find(g => g.name === categoryOf(item)), index = group.items.indexOf(item);
    [group.items[index], group.items[index + delta]] = [group.items[index + delta], group.items[index]];
    setItems(flatten(groups));
  };
  const moveTo = (id, category, beforeId) => {
    const item = items.find(i => i.id === id);
    if (!item || id === beforeId) return;
    const groups = groupsOf(items.filter(i => i.id !== id));
    let group = groups.find(g => g.name === category);
    if (!group) { group = { name: category, items: [] }; groups.push(group); }
    const index = beforeId ? group.items.findIndex(i => i.id === beforeId) : -1;
    group.items.splice(index < 0 ? group.items.length : index, 0, { ...item, category });
    setItems(flatten(groups)); setPending(current => current.filter(name => name !== category));
  };
  const moveCategory = (name, delta) => {
    const groups = groupsOf(items).filter(g => g.items.length), index = groups.findIndex(g => g.name === name);
    [groups[index], groups[index + delta]] = [groups[index + delta], groups[index]];
    setItems(flatten(groups));
  };
  const renameCategory = (from, to) => {
    const name = to.trim().slice(0, 80);
    setRenaming(null);
    if (!name || name === from) return;
    setItems(items.map(item => categoryOf(item) === from ? { ...item, category: name } : item));
    setPending(current => current.map(c => c === from ? name : c).filter((c, i, all) => all.indexOf(c) === i));
  };
  const deleteCategory = group => {
    if (group.items.length && !window.confirm(`Delete “${group.name}” and its ${group.items.length} item${group.items.length > 1 ? 's' : ''}?`)) return;
    setPending(current => current.filter(name => name !== group.name));
    if (group.items.length) setItems(items.filter(item => categoryOf(item) !== group.name));
  };
  const createCategory = event => {
    event.preventDefault();
    const name = newCategory.trim().slice(0, 80);
    if (name && !categories.includes(name)) setPending(current => [...current, name]);
    setNewCategory(null);
  };

  const needsAttention = items.filter(incomplete).length;
  const search = query.trim().toLowerCase();
  const matches = item => !search || `${item.name} ${item.description} ${item.category}`.toLowerCase().includes(search);
  const groups = groupsOf(items).map(group => ({ ...group, items: group.items.filter(matches) })).filter(group => !search || group.items.length);
  const filled = groupsOf(items).filter(g => g.items.length).map(g => g.name);
  const dragProps = (category, beforeId) => dragging && !search ? {
    onDragOver: event => { event.preventDefault(); event.stopPropagation(); setDropTarget(beforeId || `end:${category}`); },
    onDrop: event => { event.preventDefault(); event.stopPropagation(); moveTo(dragging, category, beforeId); setDragging(null); setDropTarget(null); },
  } : {};

  return <div className="sp-page">
    <header className="page-header">
      <div><h1>Menu</h1><p>{items.length} item{items.length === 1 ? '' : 's'} in {filled.length} categor{filled.length === 1 ? 'y' : 'ies'}{p.published ? ' · Published' : ' · Draft'}</p></div>
      <div className="page-actions">
        <button type="button" className="btn btn-secondary" onClick={() => setPreview(!preview)}>{preview ? <EyeOff size={16} /> : <Eye size={16} />}{preview ? 'Close preview' : 'Preview'}</button>
        <button type="button" className="btn btn-primary" disabled={saving} onClick={onSave}>{saving ? 'Saving…' : 'Save menu'}</button>
      </div>
    </header>

    <section className="card publish-row">
      <div><h2>Customer page</h2><p className="muted">{p.published ? <>Live at <a href={shopUrl(p.id)} target="_blank" rel="noopener noreferrer">your shop page ↗</a> once saved.</> : 'Drafts are hidden from customers. Publish when your menu is ready.'}</p></div>
      <label className="switch"><input type="checkbox" role="switch" checked={p.published} onChange={event => update('published', event.target.checked)} /><span aria-hidden="true" />Publish this shop</label>
    </section>

    {error && <p className="notice error" role="alert">{error}</p>}
    {needsAttention > 0 && <p className="notice warning"><TriangleAlert size={16} />{needsAttention} item{needsAttention > 1 ? 's need' : ' needs'} a name and price before you can save.</p>}

    <div className="tabs" role="tablist" aria-label="Menu sections">{[['items', 'Items'], ['design', 'Design'], ['settings', 'Settings']].map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => { setTab(id); setPreview(false); }}>{label}</button>)}</div>

    {preview ? <div className="menu-preview-container"><ShopLanding businessProfile={p} initialView="menu" preview /></div> : <>
      {tab === 'items' && <>
        <div className="toolbar toolbar-plain">
          <label className="search-field"><Search size={16} /><span className="sr-only">Search items</span><input type="search" placeholder="Search items…" value={query} onChange={e => setQuery(e.target.value)} /></label>
          {newCategory === null ? <button type="button" className="btn btn-secondary" onClick={() => setNewCategory('')}><FolderPlus size={16} />New category</button>
            : <form className="inline-form" onSubmit={createCategory}><input className="form-input" aria-label="Category name" placeholder="e.g. Desserts" maxLength={80} autoFocus value={newCategory} onChange={e => setNewCategory(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') setNewCategory(null); }} /><button className="btn btn-primary btn-sm">Add</button><button type="button" className="btn btn-ghost btn-sm" onClick={() => setNewCategory(null)}>Cancel</button></form>}
          <button type="button" className="btn btn-primary" disabled={items.length >= 200} onClick={() => addItem(categories.at(-1) || 'Menu')}><Plus size={16} />Add item</button>
        </div>
        {!items.length && !pending.length && <section className="card empty-state"><ImageIcon size={30} /><h2>Build your first menu</h2><p>Add a dish, drink or service. Items sharing a category appear together for customers.</p><button type="button" className="btn btn-primary" onClick={() => addItem('Menu')}><Plus size={16} />Add first item</button></section>}
        {search && !groups.length && <section className="card empty-state"><p>No items match “{query}”.</p></section>}
        {groups.map(group => { const order = filled.indexOf(group.name); return <section key={group.name} className="card card-flush menu-category" {...dragProps(group.name)}>
          <div className={`menu-category-head ${dropTarget === `end:${group.name}` ? 'drop-end' : ''}`}>
            {renaming === group.name ? <form className="inline-form" onSubmit={e => { e.preventDefault(); renameCategory(group.name, e.currentTarget.elements.name.value); }}><input name="name" className="form-input" aria-label="Category name" defaultValue={group.name} maxLength={80} autoFocus onKeyDown={e => { if (e.key === 'Escape') setRenaming(null); }} /><button className="btn btn-primary btn-sm">Rename</button><button type="button" className="btn btn-ghost btn-sm" onClick={() => setRenaming(null)}>Cancel</button></form>
              : <h2>{group.name}<span className="count">{group.items.length}</span></h2>}
            <div className="sp-row-actions">
              <button type="button" className="btn btn-ghost btn-icon btn-sm" aria-label={`Rename ${group.name}`} title="Rename" onClick={() => setRenaming(group.name)}><Pencil size={15} /></button>
              <button type="button" className="btn btn-ghost btn-icon btn-sm" aria-label={`Move ${group.name} up`} title="Move up" disabled={order <= 0 || !!search} onClick={() => moveCategory(group.name, -1)}><ArrowUp size={15} /></button>
              <button type="button" className="btn btn-ghost btn-icon btn-sm" aria-label={`Move ${group.name} down`} title="Move down" disabled={order < 0 || order >= filled.length - 1 || !!search} onClick={() => moveCategory(group.name, 1)}><ArrowDown size={15} /></button>
              <button type="button" className="btn btn-ghost btn-icon btn-sm danger" aria-label={`Delete ${group.name}`} title="Delete category" onClick={() => deleteCategory(group)}><Trash2 size={15} /></button>
            </div>
          </div>
          <ul className="menu-rows">{group.items.map((item, index) => { const status = statusOf(item), open = expanded === item.id; return <li key={item.id} className={`menu-row ${open ? 'open' : ''} ${dropTarget === item.id ? 'drop-before' : ''} ${dragging === item.id ? 'dragging' : ''} status-${status}`} {...dragProps(group.name, item.id)}>
            <div className="menu-row-main" draggable={!search && !open} onDragStart={event => { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', item.id); setDragging(item.id); }} onDragEnd={() => { setDragging(null); setDropTarget(null); }}>
              <span className="drag-handle" aria-hidden="true" title="Drag to reorder"><GripVertical size={16} /></span>
              {item.image ? <img className="menu-thumb" src={item.image} alt="" /> : <span className="menu-thumb placeholder" aria-hidden="true"><ImageIcon size={16} /></span>}
              <button type="button" className="menu-row-title" aria-expanded={open} onClick={() => setExpanded(open ? null : item.id)}>
                <strong>{item.name || 'Untitled item'}{incomplete(item) && <TriangleAlert size={14} className="warn-icon" aria-label="Needs a name and price" />}</strong>
                <span>{item.description || 'No description'}</span>
              </button>
              <div className="chip-row hide-sm">{(item.tags || []).map(tag => <span key={tag} className="chip">{menuTagLabel(tag)}</span>)}</div>
              <span className="menu-row-price">{String(item.price ?? '').trim() === '' ? '—' : money(item.price)}</span>
              <span className={`badge badge-${STATUS[status][1]}`}>{STATUS[status][0]}</span>
              <div className="sp-row-actions">
                <button type="button" className="btn btn-ghost btn-icon btn-sm" aria-label={`Move ${item.name || 'item'} up`} title="Move up" disabled={index === 0 || !!search} onClick={() => moveItem(item, -1)}><ArrowUp size={15} /></button>
                <button type="button" className="btn btn-ghost btn-icon btn-sm" aria-label={`Move ${item.name || 'item'} down`} title="Move down" disabled={index === group.items.length - 1 || !!search} onClick={() => moveItem(item, 1)}><ArrowDown size={15} /></button>
                <button type="button" className="btn btn-ghost btn-icon btn-sm hide-sm" aria-label={`Duplicate ${item.name || 'item'}`} title="Duplicate" disabled={items.length >= 200} onClick={() => duplicateItem(item)}><Copy size={15} /></button>
                <button type="button" className="btn btn-ghost btn-icon btn-sm danger" aria-label={`Delete ${item.name || 'item'}`} title="Delete" onClick={() => removeItem(item)}><Trash2 size={15} /></button>
              </div>
            </div>
            {open && <div className="menu-row-editor">
              <div className="form-grid">
                <Field id={`name-${item.id}`} label="Item name" value={item.name} maxLength={150} onChange={value => changeItem(item.id, { name: value })} placeholder="e.g. Iced latte" autoFocus={!item.name} />
                <Field id={`price-${item.id}`} label={`Price (${p.currency || 'LKR'})`} type="number" min="0" step="0.01" inputMode="decimal" value={item.price} onChange={value => changeItem(item.id, { price: value })} />
                <div className="form-group"><label className="form-label" htmlFor={`category-${item.id}`}>Category</label><input id={`category-${item.id}`} key={item.category} className="form-input" list="menu-categories" maxLength={80} defaultValue={item.category} onBlur={e => { const category = e.target.value.trim() || 'Menu'; if (category !== item.category) moveTo(item.id, category); }} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }} /></div>
                <div className="form-group"><span className="form-label" id={`status-${item.id}`}>Availability</span><div className="segmented" role="group" aria-labelledby={`status-${item.id}`}>{Object.entries(STATUS).map(([value, [label]]) => <button key={value} type="button" aria-pressed={status === value} onClick={() => changeItem(item.id, { available: value !== 'hidden', soldOut: value === 'soldout' })}>{label}</button>)}</div></div>
              </div>
              <Field id={`description-${item.id}`} label="Description" multiline rows={2} value={item.description} onChange={value => changeItem(item.id, { description: value })} placeholder="Ingredients, flavours or details…" />
              <div className="form-group"><span className="form-label">Labels</span><div className="chip-row">{MENU_TAGS.map(tag => { const on = (item.tags || []).includes(tag.id); return <button key={tag.id} type="button" className={`chip chip-toggle ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => changeItem(item.id, { tags: on ? item.tags.filter(t => t !== tag.id) : [...(item.tags || []), tag.id] })}>{tag.label}</button>; })}</div></div>
              <ImageUpload id={`image-${item.id}`} label="Item photo" value={item.image} onChange={value => changeItem(item.id, { image: value }, true)} />
              <div className="menu-row-editor-foot"><span className="muted">Sold out items stay visible with a label. Hidden items are removed from the customer menu.</span><button type="button" className="btn btn-secondary btn-sm" onClick={() => setExpanded(null)}>Done</button></div>
            </div>}
          </li>; })}
            {!group.items.length && <li className="menu-row-empty">No items yet.</li>}
          </ul>
          {!search && <div className="card-foot"><button type="button" className="btn btn-ghost btn-sm" disabled={items.length >= 200} onClick={() => addItem(group.name)}><Plus size={15} />Add item to {group.name}</button></div>}
        </section>; })}
        <datalist id="menu-categories">{categories.map(name => <option key={name} value={name} />)}</datalist>
        {items.length > 1 && !search && <p className="field-help">Drag items by the handle to reorder them or move them to another category.</p>}
      </>}

      {tab === 'design' && <MenuDesigner businessProfile={p} onChange={value => update('menuDesign', value)} />}

      {tab === 'settings' && <div className="sp-stack">
        <section className="card"><div className="card-head"><div><h2>Currency</h2><p>Used for every price on your menu.</p></div></div><select id="menu-currency" aria-label="Menu currency" className="form-input select-inline" value={p.currency || 'LKR'} onChange={event => update('currency', event.target.value)}>{['LKR', 'USD', 'EUR', 'GBP', 'INR', 'AED', 'AUD', 'CAD', 'SGD', 'MYR', 'THB', 'JPY'].map(currency => <option key={currency}>{currency}</option>)}</select></section>
        <section className="card"><div className="card-head"><div><h2>Menu branding</h2><p>Shown at the top of menu templates that use a cover or logo.</p></div></div><div className="form-grid"><ImageUpload id="menu-cover-upload" label="Cover photo" value={p.coverImage} maxWidth={1400} onChange={value => update('coverImage', value, true)} /><ImageUpload id="menu-logo-upload" label="Logo" value={p.logo} maxWidth={512} onChange={value => update('logo', value, true)} /></div></section>
      </div>}
    </>}
  </div>;
}
