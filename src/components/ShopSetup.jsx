import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Plus, Trash2 } from 'lucide-react';
import TemplatePreview from './TemplatePreview';
import { MENU_TEMPLATES, RECOMMENDED_TEMPLATES } from '../data/menuDesign';

// Three short steps for a new shop: name it, pick a look, add a few dishes. Everything can be changed later.
const TYPES = [
  { id: 'cafe', name: 'Café or coffee shop', templates: ['cafe', 'chalkboard', 'brunch', 'garden'] },
  { id: 'restaurant', name: 'Restaurant', templates: ['trattoria', 'spice', 'maison', 'restaurant', 'sushi', 'ember'] },
  { id: 'bakery', name: 'Bakery or desserts', templates: ['cafe', 'scoop', 'brunch', 'garden'] },
  { id: 'fastfood', name: 'Fast food or street food', templates: ['burger', 'pizzeria', 'taqueria', 'wok', 'diner'] },
  { id: 'bar', name: 'Bar or lounge', templates: ['copper', 'midnight', 'ember'] },
  { id: 'other', name: 'Something else', templates: RECOMMENDED_TEMPLATES },
];
const CURRENCIES = ['LKR', 'USD', 'EUR', 'GBP', 'INR', 'AED', 'AUD', 'CAD', 'SGD', 'MYR', 'THB', 'JPY'];
const emptyItem = () => ({ name: '', price: '', category: '' });

export default function ShopSetup({ first, busy, error, onCreate, onCancel }) {
  const [step, setStep] = useState(1);
  const [details, setDetails] = useState({ name: '', type: 'cafe', currency: 'LKR' });
  const type = TYPES.find(t => t.id === details.type);
  const [template, setTemplate] = useState(type.templates[0]);
  const [items, setItems] = useState([emptyItem(), emptyItem(), emptyItem()]);
  const setItem = (index, patch) => setItems(current => current.map((item, i) => i === index ? { ...item, ...patch } : item));
  const filled = items.filter(item => item.name.trim());
  const itemProblem = filled.some(item => item.price === '' || Number(item.price) < 0) ? 'Give each dish a price, or clear its name to leave it out.' : '';
  const choices = [...new Set([...type.templates, ...RECOMMENDED_TEMPLATES])].slice(0, 6).map(id => MENU_TEMPLATES.find(t => t.id === id));
  const create = () => onCreate({ name: details.name.trim(), category: type.id === 'other' ? '' : type.name, currency: details.currency, template, items: filled.map(item => ({ name: item.name.trim(), price: Number(item.price), category: item.category.trim() || 'Menu' })) });

  return <div className="sp-page setup">
    <header className="page-header">
      <div><h1>{first ? 'Let’s set up your shop' : 'Add a new shop'}</h1><p>Three quick steps. You can change everything later.</p></div>
      {!first && <div className="page-actions"><button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button></div>}
    </header>
    <ol className="setup-steps" aria-label="Steps">{['Your shop', 'Choose a look', 'First dishes'].map((label, i) => <li key={label} className={step === i + 1 ? 'current' : step > i + 1 ? 'done' : ''} aria-current={step === i + 1 ? 'step' : undefined}><span>{step > i + 1 ? <Check size={14} aria-hidden="true" /> : i + 1}</span>{label}</li>)}</ol>

    {step === 1 && <form className="card setup-card" onSubmit={event => { event.preventDefault(); setTemplate(type.templates[0]); setStep(2); }}>
      <div className="form-group"><label className="form-label" htmlFor="setup-name">What’s your shop called?</label><input id="setup-name" className="form-input" autoFocus required maxLength={150} placeholder="e.g. The Corner Café" value={details.name} onChange={e => setDetails({ ...details, name: e.target.value })} /></div>
      <div className="form-group"><span className="form-label" id="setup-type">What kind of place is it?</span>
        <div className="md-choices" role="radiogroup" aria-labelledby="setup-type">{TYPES.map(t => <button key={t.id} type="button" role="radio" aria-checked={details.type === t.id} aria-pressed={details.type === t.id} onClick={() => setDetails({ ...details, type: t.id })}>{t.name}</button>)}</div>
      </div>
      <div className="form-group"><label className="form-label" htmlFor="setup-currency">Currency for your prices</label><select id="setup-currency" className="form-input select-inline" value={details.currency} onChange={e => setDetails({ ...details, currency: e.target.value })}>{CURRENCIES.map(c => <option key={c}>{c}</option>)}</select></div>
      <div className="page-actions setup-nav"><button className="btn btn-primary" disabled={!details.name.trim()}>Next<ArrowRight size={16} aria-hidden="true" /></button></div>
    </form>}

    {step === 2 && <section className="card setup-card">
      <div className="card-head"><div><h2>Choose a look for your menu</h2><p>Picked for a {type.name.toLowerCase()}. There are {MENU_TEMPLATES.length} designs in Menu → Design if you want to see more later.</p></div></div>
      {/* The preview contains the menu's own buttons (inert), so the card is a plain clickable area with a real button inside. */}
      <div className="md-gallery setup-gallery">{choices.map(t => <div key={t.id} className={`md-template setup-template ${template === t.id ? 'selected' : ''}`} onClick={() => setTemplate(t.id)}>
        <TemplatePreview template={t} />
        <div className="md-template-meta"><strong>{t.name}</strong><small>{t.description}</small>
          <button type="button" className={`btn btn-sm ${template === t.id ? 'btn-ghost md-selected' : 'btn-secondary'}`} aria-pressed={template === t.id} onClick={event => { event.stopPropagation(); setTemplate(t.id); }}>{template === t.id ? <><Check size={15} aria-hidden="true" />Chosen</> : 'Choose'}<span className="sr-only">: {t.name}</span></button>
        </div>
      </div>)}</div>
      <div className="page-actions setup-nav"><button type="button" className="btn btn-ghost" onClick={() => setStep(1)}><ArrowLeft size={16} aria-hidden="true" />Back</button><button type="button" className="btn btn-primary" onClick={() => setStep(3)}>Next<ArrowRight size={16} aria-hidden="true" /></button></div>
    </section>}

    {step === 3 && <section className="card setup-card">
      <div className="card-head"><div><h2>Add a few dishes or drinks</h2><p>Just names and prices for now. Photos, descriptions and more items go in Menu. You can also skip this.</p></div></div>
      <div className="setup-items">
        <div className="setup-item setup-item-head" aria-hidden="true"><span>Name</span><span>Price ({details.currency})</span><span>Category (optional)</span><span /></div>
        {items.map((item, index) => <div key={index} className="setup-item">
          <input className="form-input" aria-label={`Dish ${index + 1} name`} placeholder={['Iced latte', 'Chicken kottu', 'Chocolate cake'][index] || 'Name'} maxLength={150} value={item.name} onChange={e => setItem(index, { name: e.target.value })} />
          <input className="form-input" aria-label={`Dish ${index + 1} price`} type="number" min="0" step="0.01" inputMode="decimal" value={item.price} onChange={e => setItem(index, { price: e.target.value })} />
          <input className="form-input" aria-label={`Dish ${index + 1} category`} placeholder={['Drinks', 'Mains', 'Desserts'][index] || 'Menu'} maxLength={80} value={item.category} onChange={e => setItem(index, { category: e.target.value })} />
          <button type="button" className="btn btn-ghost btn-icon btn-sm" aria-label={`Remove dish ${index + 1}`} disabled={items.length === 1} onClick={() => setItems(items.filter((_, i) => i !== index))}><Trash2 size={15} aria-hidden="true" /></button>
        </div>)}
        {items.length < 10 && <button type="button" className="btn btn-ghost btn-sm setup-add" onClick={() => setItems([...items, emptyItem()])}><Plus size={15} aria-hidden="true" />Add another</button>}
      </div>
      {itemProblem && <p className="notice warning">{itemProblem}</p>}
      {error && <p className="notice error" role="alert">{error}</p>}
      <div className="page-actions setup-nav"><button type="button" className="btn btn-ghost" onClick={() => setStep(2)}><ArrowLeft size={16} aria-hidden="true" />Back</button>
        <button type="button" className="btn btn-primary" disabled={busy || !!itemProblem} onClick={create}>{busy ? 'Creating…' : filled.length ? 'Create my shop' : 'Skip and create my shop'}</button></div>
      <p className="field-help">Your shop starts as a draft that only you can see. Publish it when you’re ready.</p>
    </section>}
  </div>;
}
