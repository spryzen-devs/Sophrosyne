import './EmptyState.css';

/**
 * Empty state display
 * @param {Object} props
 * @param {string} props.message
 * @param {React.ReactNode} props.action
 */
export default function EmptyState({ message = 'No data found', action }) {
  return (
    <div className="empty-state">
      <p className="empty-state__message">{message}</p>
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
}
