import { ArrowRight } from 'lucide-react';

export default function Quick({ icon, title, text, onClick }) {
  return (
    <button className="quick-card" onClick={onClick}>
      <div>
        {icon}
        <ArrowRight size={16} />
      </div>
      <b>{title}</b>
      <span>{text}</span>
    </button>
  );
}
