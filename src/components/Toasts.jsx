import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function Toasts({ toasts, onDismiss }) {
  return <div className="sp-toasts no-print" role="status" aria-live="polite">
    {toasts.map(toast => <div key={toast.id} className={`sp-toast ${toast.tone}`}>
      {toast.tone === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
      <span>{toast.message}</span>
      <button type="button" className="btn btn-ghost btn-icon btn-sm" aria-label="Dismiss" onClick={() => onDismiss(toast.id)}><X size={14} /></button>
    </div>)}
  </div>;
}
