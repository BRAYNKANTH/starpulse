import { useEffect, useRef, useState } from 'react';
import ShopLanding from './ShopLanding';
import { menuExample } from '../data/menuExamples';

// A scaled sample menu in a template, rendered only once its card scrolls into view.
export default function TemplatePreview({ template }) {
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
    {visible ? <div className="template-preview-content"><ShopLanding businessProfile={menuExample(template)} initialView="menu" preview /></div> : <div className="md-preview-placeholder" style={{ background: template.background }} />}
  </div>;
}
