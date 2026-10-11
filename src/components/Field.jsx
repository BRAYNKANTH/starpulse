export default function Field({ id, label, value, onChange, multiline = false, ...props }) {
  const Input = multiline ? 'textarea' : 'input';
  return <div className="form-group"><label className="form-label" htmlFor={id}>{label}</label><Input id={id} className="form-input" value={value ?? ''} onChange={event => onChange(event.target.value)} {...props} /></div>;
}
