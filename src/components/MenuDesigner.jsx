import { useEffect, useRef, useState } from 'react';
import { Check, LayoutGrid, Monitor, RotateCcw, Smartphone } from 'lucide-react';
import Field from './Field';
import ShopLanding from './ShopLanding';
import { menuExample } from '../data/menuExamples';
import { MENU_LAYOUTS, MENU_OPTIONS, MENU_TEMPLATES, TEMPLATE_GROUPS, TEMPLATE_RESET, normalizeMenuDesign } from '../data/menuDesign';
import { FONT_PAIRS, fontPair, loadFonts } from '../data/menuFonts';

const SECTIONS = [['layout', 'Layout'], ['type', 'Typography'], ['details', 'Prices & sections'], ['colours', 'Colours'], ['content', 'Content']];

// Renders the scaled template preview only once its card scrolls into view.
// `previewProfile` overrides the sample dish/photo preview: with "my menu" it shows
// the owner's own items under this template, and with "no photos" it strips images,
// so the gallery stops selling a photo-perfect menu the owner does not have.
function LazyPreview({ template, previewProfile }) {
  const box = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = box.current;
    if (!node || visible) return undefined;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setVisible(true); }, { rootMargin: '200px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);
  return <div ref={box} className="template-preview-window" aria-hidden="true" inert>
    {visible ? <div className="template-preview-content"><ShopLanding businessProfile={previewProfile || menuExample(template)} initialView="menu" preview /></div> : <div className="md-preview-placeholder" style={{ background: template.background }} />}
  </div>;
}

function Choice({ label, field, design, template, options, help }) {
  const inherited = field === 'layout' ? template.layout : template.defaults?.[field];
  const inheritedLabel = options.find(([value]) => value === inherited)?.[1];
  return <div className="md-field">
    <span className="form-label" id={`md-${field}`}>{label}</span>
    <div className="md-choices" role="group" aria-labelledby={`md-${field}`}>
      <button type="button" aria-pressed={design[field] === 'template'} onClick={() => design.onSet(field, 'template')}>Template{inheritedLabel ? ` · ${inheritedLabel}` : ''}</button>
      {options.map(([value, name]) => <button key={value} type="button" aria-pressed={design[field] === value} onClick={() => design.onSet(field, value)}>{name}</button>)}
    </div>
    {help && <p className="field-help">{help}</p>}
  </div>;
}

function ColourField({ label, field, design, fallback, onSet }) {
  const value = design[field] || fallback;
  return <div className="md-colour">
    <label className="form-label" htmlFor={`md-colour-${field}`}>{label}</label>
    <div className="md-colour-row">
      <input id={`md-colour-${field}`} type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#000000'} onChange={event => onSet(field, event.target.value)} />
      <code>{design[field] ? value.toUpperCase() : 'Template'}</code>
      {design[field] && <button type="button" className="btn btn-ghost btn-sm" onClick={() => onSet(field, '')}>Reset</button>}
    </div>
  </div>;
}

export default function MenuDesigner({ businessProfile, onChange }) {
  const design = normalizeMenuDesign(businessProfile.menuDesign);
  const template = MENU_TEMPLATES.find(t => t.id === design.template);
  const [group, setGroup] = useState('all');
  // The gallery stays open for comparison (it used to collapse once a template existed,
  // hiding the other options). "Done" still collapses it to the current template.
  const [browsing, setBrowsing] = useState(true);
  const [galleryMyMenu, setGalleryMyMenu] = useState(false);
  const [galleryNoPhotos, setGalleryNoPhotos] = useState(false);
  const [section, setSection] = useState('layout');
  const [device, setDevice] = useState('phone');
  const frame = useRef(null);
  const [frameWidth, setFrameWidth] = useState(520);
  useEffect(() => { loadFonts(FONT_PAIRS); }, []);
  useEffect(() => {
    const node = frame.current;
    if (!node) return undefined;
    const observer = new ResizeObserver(([entry]) => setFrameWidth(entry.contentRect.width));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const set = (field, value) => onChange({ ...design, [field]: value });
  const bound = { ...design, onSet: set };
  const selectTemplate = id => onChange({ ...design, ...TEMPLATE_RESET, template: id });
  const groupName = TEMPLATE_GROUPS.find(g => g.id === template.group)?.name;
  const customised = Object.keys(TEMPLATE_RESET).filter(key => design[key] !== TEMPLATE_RESET[key]).length;
  const templates = MENU_TEMPLATES.filter(t => group === 'all' || t.group === group);
  const templateFont = fontPair(template.font);

  return <section className="md" aria-label="Menu design studio">
    {!browsing ? <div className="card md-current">
      <span className="md-swatches md-current-swatches" aria-hidden="true">{[template.background, template.surface, template.accent].map(c => <i key={c} style={{ background: c }} />)}</span>
      <div><p className="eyebrow">Template · {groupName}</p><h2>{template.name}</h2><p className="muted">{template.description}</p></div>
      <button type="button" className="btn btn-secondary" onClick={() => setBrowsing(true)}><LayoutGrid size={16} aria-hidden="true" />Browse {MENU_TEMPLATES.length} templates</button>
    </div> : <div className="card card-flush">
      <div className="card-head"><div><h2>Templates</h2><p>{MENU_TEMPLATES.length} designs. Choosing one keeps your items, prices and text and resets layout, fonts and colours to the template.</p><p className="field-help">Gallery previews use sample dishes &amp; photos — your menu may look different. Use “My menu” to preview with your own items, and “No photos” to see how a template holds up without photos.</p></div>
        {businessProfile.menuDesign?.template && <button type="button" className="btn btn-secondary btn-sm" onClick={() => setBrowsing(false)}>Done</button>}</div>
      <div className="md-groups" role="group" aria-label="Gallery preview options">
        <label><input type="checkbox" checked={galleryMyMenu} disabled={!businessProfile.menu?.length} onChange={event => setGalleryMyMenu(event.target.checked)} /> Preview with my menu{businessProfile.menu?.length ? '' : ' (add menu items first)'}</label>
        <label><input type="checkbox" checked={galleryNoPhotos} onChange={event => setGalleryNoPhotos(event.target.checked)} /> No photos</label>
      </div>
      <div className="md-groups" role="group" aria-label="Template collection">
        {[['all', 'All', MENU_TEMPLATES.length], ...TEMPLATE_GROUPS.map(g => [g.id, g.name, MENU_TEMPLATES.filter(t => t.group === g.id).length])].map(([id, name, count]) => <button key={id} type="button" aria-pressed={group === id} onClick={() => setGroup(id)}>{name}<span>{count}</span></button>)}
      </div>
      <div className="md-gallery">{templates.map(t => <article key={t.id} className={`md-template ${design.template === t.id ? 'selected' : ''}`}>
        <LazyPreview template={t} previewProfile={galleryMyMenu && businessProfile.menu?.length ? { ...businessProfile, menuDesign: { ...TEMPLATE_RESET, template: t.id }, menu: galleryNoPhotos ? businessProfile.menu.map(item => ({ ...item, image: '' })) : businessProfile.menu } : galleryNoPhotos ? { ...menuExample(t), menu: menuExample(t).menu.map(item => ({ ...item, image: '' })) } : null} />
        <div className="md-template-meta">
          <div><strong>{t.name}</strong><span className="md-swatches" aria-hidden="true">{[t.background, t.surface, t.accent].map(c => <i key={c} style={{ background: c }} />)}</span></div>
          <p>{t.description}</p><p className="field-help">Sample dishes &amp; photos — your menu may look different.</p>
          <button type="button" className={`btn btn-sm ${design.template === t.id ? 'btn-ghost md-selected' : 'btn-secondary'}`} aria-pressed={design.template === t.id} onClick={() => selectTemplate(t.id)}>{design.template === t.id ? <><Check size={15} aria-hidden="true" />Selected</> : 'Use template'}<span className="sr-only">: {t.name}</span></button>
        </div>
      </article>)}</div>
    </div>}

    <div className="md-workbench">
      <div className="card md-options">
        <div className="card-head"><div><h2>Customise {template.name}</h2><p>{customised ? `${customised} setting${customised > 1 ? 's' : ''} changed from the template.` : 'Using the template’s own design.'}</p></div>
          <button type="button" className="btn btn-secondary btn-sm" disabled={!customised} onClick={() => selectTemplate(design.template)}><RotateCcw size={14} />Reset</button></div>
        <div className="tabs" role="tablist" aria-label="Design settings">{SECTIONS.map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={section === id} onClick={() => setSection(id)}>{label}</button>)}</div>

        {section === 'layout' && <div className="md-section">
          <Choice label="Item layout" field="layout" design={bound} template={template} options={MENU_LAYOUTS} />
          <Choice label="Columns" field="columns" design={bound} template={template} options={MENU_OPTIONS.columns} help="Phones always show one column (two for photo tiles)." />
          <Choice label="Card style" field="cardStyle" design={bound} template={template} options={MENU_OPTIONS.cardStyle} />
          <Choice label="Corners" field="radius" design={bound} template={template} options={MENU_OPTIONS.radius} />
          <Choice label="Photo shape" field="imageShape" design={bound} template={template} options={MENU_OPTIONS.imageShape} />
          <Choice label="Photo position" field="imagePosition" design={bound} template={template} options={MENU_OPTIONS.imagePosition} help="For side-photo cards, classic rows and the compact board." />
          <div className="md-field"><span className="form-label" id="md-density">Spacing</span><div className="md-choices" role="group" aria-labelledby="md-density">{[['comfortable', 'Comfortable'], ['compact', 'Compact']].map(([value, name]) => <button key={value} type="button" aria-pressed={design.density === value} onClick={() => set('density', value)}>{name}</button>)}</div></div>
        </div>}

        {section === 'type' && <div className="md-section">
          <div className="md-field"><span className="form-label" id="md-font">Font pairing</span>
            <div className="md-fonts" role="group" aria-labelledby="md-font">
              <button type="button" aria-pressed={design.font === 'template'} onClick={() => set('font', 'template')}><span className="md-font-sample" style={templateFont ? { fontFamily: `'${templateFont.heading}'` } : undefined}>Aa</span><strong>Template</strong><small>{templateFont ? templateFont.name : template.font === 'serif' ? 'Classic serif' : 'Modern sans'}</small></button>
              {FONT_PAIRS.map(pair => <button key={pair.id} type="button" aria-pressed={design.font === pair.id} onClick={() => set('font', pair.id)}><span className="md-font-sample" style={{ fontFamily: `'${pair.heading}', ${pair.fallback}`, fontWeight: pair.weight || 700 }}>Aa</span><strong>{pair.name}</strong><small>{pair.note}</small></button>)}
            </div>
          </div>
          <Choice label="Heading alignment" field="align" design={bound} template={template} options={MENU_OPTIONS.align} />
          <Choice label="Item text alignment" field="itemAlign" design={bound} template={template} options={MENU_OPTIONS.itemAlign} />
          <Choice label="Heading size" field="headingSize" design={bound} template={template} options={MENU_OPTIONS.headingSize} />
          <Choice label="Heading letters" field="headingCase" design={bound} template={template} options={MENU_OPTIONS.headingCase} />
        </div>}

        {section === 'details' && <div className="md-section">
          <Choice label="Price display" field="pricePosition" design={bound} template={template} options={MENU_OPTIONS.pricePosition} />
          <div className="md-field"><span className="form-label" id="md-price-format">Price format</span><div className="md-choices" role="group" aria-labelledby="md-price-format">{[['currency', 'With currency'], ['number', 'Amount only']].map(([value, name]) => <button key={value} type="button" aria-pressed={design.priceStyle === value} onClick={() => set('priceStyle', value)}>{name}</button>)}</div></div>
          <Choice label="Row dividers" field="divider" design={bound} template={template} options={MENU_OPTIONS.divider} help="Shown between classic rows, and between flat cards." />
          <Choice label="Category navigation" field="navStyle" design={bound} template={template} options={MENU_OPTIONS.navStyle} />
          <Choice label="Section headings" field="sectionStyle" design={bound} template={template} options={MENU_OPTIONS.sectionStyle} />
        </div>}

        {section === 'colours' && <div className="md-section">
          <div className="md-colours">
            <ColourField label="Accent" field="accent" design={design} fallback={template.accent} onSet={set} />
            <ColourField label="Page background" field="background" design={design} fallback={template.background} onSet={set} />
            <ColourField label="Cards" field="surface" design={design} fallback={template.surface} onSet={set} />
            <ColourField label="Text" field="text" design={design} fallback={template.text} onSet={set} />
          </div>
          <p className="field-help">Card text switches between dark and light automatically to stay readable.</p>
          <Choice label="Background texture" field="texture" design={bound} template={template} options={MENU_OPTIONS.texture} />
        </div>}

        {section === 'content' && <div className="md-section">
          <Field id="design-title" label="Menu heading" value={design.title} maxLength={100} placeholder="Our menu" onChange={value => set('title', value)} />
          <Field id="design-subtitle" label="Menu introduction" multiline rows={2} maxLength={300} value={design.subtitle} placeholder="Use your shop tagline, or write a welcome message…" onChange={value => set('subtitle', value)} />
          <div className="md-toggles">{[['showCover', 'Cover photo'], ['showBrand', 'Logo & name header'], ['showImages', 'Item photos'], ['showDescriptions', 'Descriptions'], ['showPrices', 'Prices'], ['showSearch', 'Search box'], ['showCategories', 'Category navigation']].map(([field, label]) => <label key={field} className="switch"><input type="checkbox" role="switch" checked={design[field]} onChange={event => set(field, event.target.checked)} /><span aria-hidden="true" />{label}</label>)}</div>
        </div>}
        <p className="field-help">Save in the top bar to publish design changes. Printed QR codes keep working.</p>
      </div>

      <aside className="md-preview">
        <div className="md-preview-bar"><span><span className="preview-live-dot" />Live preview</span>
          <div className="segmented" role="group" aria-label="Preview size"><button type="button" aria-pressed={device === 'phone'} aria-label="Phone" onClick={() => setDevice('phone')}><Smartphone size={15} /></button><button type="button" aria-pressed={device === 'desktop'} aria-label="Desktop" onClick={() => setDevice('desktop')}><Monitor size={15} /></button></div>
        </div>
        <div ref={frame} className={`md-preview-frame ${device}`} aria-hidden="true" inert><div className="design-preview-scroll" style={device === 'desktop' ? { width: 1024, zoom: Math.min(1, frameWidth / 1024) } : undefined}><ShopLanding businessProfile={businessProfile.menu?.length ? businessProfile : { ...menuExample(template), name: businessProfile.name || menuExample(template).name, menuDesign: businessProfile.menuDesign }} initialView="menu" preview /></div></div>
        {!businessProfile.menu?.length && <p className="field-help">Showing sample dishes until you add menu items.</p>}
      </aside>
    </div>
  </section>;
}
