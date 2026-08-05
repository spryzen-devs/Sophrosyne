import './Badge.css';

/**
 * Badge component for status/severity display
 * @param {Object} props
 * @param {'critical'|'high'|'medium'|'low'|'active'|'inactive'|'online'|'offline'|'resolved'|'resting'|'walking'|'running'|'fall'} props.variant
 */
export default function Badge({ variant = 'low', children, className = '' }) {
  return (
    <span className={`badge badge--${variant.toLowerCase()} ${className}`}>
      {children}
    </span>
  );
}
