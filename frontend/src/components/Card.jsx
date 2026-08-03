import './Card.css';

/**
 * Card container component
 * @param {Object} props
 * @param {string} props.title
 * @param {React.ReactNode} props.action
 * @param {boolean} props.elevated
 * @param {boolean} props.flush - remove body padding
 */
export default function Card({
  title,
  action,
  elevated = false,
  flush = false,
  children,
  className = '',
  ...props
}) {
  return (
    <div className={`card ${elevated ? 'card--elevated' : ''} ${className}`} {...props}>
      {title && (
        <div className="card__header">
          <h3 className="card__title">{title}</h3>
          {action && <span className="card__action">{action}</span>}
        </div>
      )}
      <div className={`card__body ${flush ? 'card__body--flush' : ''}`}>
        {children}
      </div>
    </div>
  );
}
