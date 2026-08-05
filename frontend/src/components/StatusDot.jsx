import './StatusDot.css';

/**
 * Status dot indicator
 * @param {Object} props
 * @param {'online'|'offline'} props.status
 * @param {'sm'|'md'} props.size
 */
export default function StatusDot({ status = 'offline', size = 'md' }) {
  return (
    <span
      className={`status-dot status-dot--${status.toLowerCase()} ${size === 'sm' ? 'status-dot--sm' : ''}`}
      aria-label={status}
    />
  );
}
