import './VitalCard.css';

/**
 * Vital sign display card
 * @param {Object} props
 * @param {string} props.label - e.g. "Heart Rate"
 * @param {number|string} props.value
 * @param {string} props.unit - e.g. "BPM", "%"
 * @param {'normal'|'warning'|'critical'} props.status
 * @param {boolean} props.pulse - enable pulse animation
 * @param {number} props.barValue - 0–100 for battery-style bar
 * @param {string} props.barColor
 * @param {'sm'|'md'} props.size
 */
export default function VitalCard({
  label,
  value,
  unit,
  status = 'normal',
  pulse = false,
  barValue,
  barColor,
  size = 'md',
  className = '',
}) {
  const statusClass = status !== 'normal' ? `vital-card--${status}` : '';
  const sizeClass = size === 'sm' ? 'vital-card--sm' : '';

  return (
    <div className={`vital-card ${statusClass} ${sizeClass} ${className}`}>
      <span className="vital-card__label">{label}</span>
      <div className="vital-card__value-row">
        <span className={`vital-card__value ${pulse ? 'vital-pulse' : ''}`}>
          {value ?? '—'}
        </span>
        {unit && <span className="vital-card__unit">{unit}</span>}
      </div>
      {barValue != null && (
        <div className="vital-card__bar">
          <div
            className="vital-card__bar-fill"
            style={{
              width: `${Math.min(100, Math.max(0, barValue))}%`,
              backgroundColor: barColor || 'var(--green)',
            }}
          />
        </div>
      )}
    </div>
  );
}
