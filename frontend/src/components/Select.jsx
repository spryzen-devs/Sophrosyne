import './Select.css';

/**
 * Select dropdown component
 * @param {Object} props
 * @param {string} props.label
 * @param {{value: string, label: string}[]} props.options
 * @param {'sm'|'md'} props.size
 */
export default function Select({
  label,
  options = [],
  size = 'md',
  className = '',
  id,
  ...props
}) {
  return (
    <div className={`select-group ${className}`}>
      {label && <label className="select-group__label" htmlFor={id}>{label}</label>}
      <select
        id={id}
        className={`select-group__field ${size === 'sm' ? 'select-group__field--sm' : ''}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
