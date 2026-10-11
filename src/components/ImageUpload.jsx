import { useContext, useEffect, useRef, useState } from 'react';
import { Upload, Trash2, ImagePlus } from 'lucide-react';
import { prepareImage } from '../utils/images';
import { ImageUploadStatus } from './ImageUploadStatus';

export default function ImageUpload({ id, label, value, onChange, maxWidth = 1000 }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const callback = useRef(onChange);
  const mounted = useRef(false);
  const pending = useRef(false);
  const trackUpload = useContext(ImageUploadStatus);
  useEffect(() => { callback.current = onChange; }, [onChange]);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; if (pending.current) { pending.current = false; trackUpload(-1); } }; }, [trackUpload]);
  const upload = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setBusy(true); setError('');
    pending.current = true; trackUpload(1);
    try {
      const data = await prepareImage(file, maxWidth);
      if (mounted.current) callback.current(data);
    } catch (e) { if (mounted.current) setError(e.message); }
    finally { if (pending.current) { pending.current = false; trackUpload(-1); } if (mounted.current) setBusy(false); }
  };
  return <div className="form-group image-upload-field"><label className="form-label" htmlFor={id}>{label}</label><div className={`image-upload-box ${value ? 'has-image' : ''}`}>
    {value ? <img src={value} alt={`${label} preview`} /> : <div className="image-upload-placeholder"><ImagePlus size={26} /><span>No image yet</span></div>}
    <div className="image-upload-actions"><label className={`image-upload-button ${busy ? 'busy' : ''}`} htmlFor={id}><Upload size={16} />{busy ? 'Preparing image…' : value ? 'Replace image' : 'Upload image'}</label><input id={id} className="image-upload-input" type="file" accept="image/png,image/jpeg,image/webp,image/gif" disabled={busy} onChange={upload} aria-describedby={`${id}-help`} />{value && <button type="button" className="preset-chip" disabled={busy} onClick={() => { setError(''); onChange(''); }} aria-label={`Remove ${label.toLowerCase()}`}><Trash2 size={15} />Remove</button>}</div>
    <p id={`${id}-help`} className="field-help">PNG, JPEG, WebP or GIF · up to 10 MB. Photos are optimized automatically. GIFs are saved as a still image.</p>
    {busy && <p role="status" className="field-help">Preparing your photo. Save once the preview is ready.</p>}{error && <p role="alert" className="error">{error}</p>}
  </div></div>;
}
