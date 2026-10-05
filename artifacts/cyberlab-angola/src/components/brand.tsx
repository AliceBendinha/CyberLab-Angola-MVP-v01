import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

export default function Brand() {
  return (
    <Link to="/" className="brand" aria-label="CyberLab Angola — início" data-testid="link-brand-home">
      <span className="brand-mark"><Shield size={18} strokeWidth={1.8} /></span>
      <span>CyberLab <span style={{ color: '#7fd7df' }}>Angola</span></span>
    </Link>
  );
}
