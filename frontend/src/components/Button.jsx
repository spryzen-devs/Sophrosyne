import './Button.css';

/**
 * Button component
 * @param {Object} props
 * @param {'primary'|'outlined'|'text'|'danger'} props.variant
 * @param {'sm'|'md'} props.size
 * @param {boolean} props.loading
 * @param {React.ReactNode} props.icon
 * @param {React.ReactNode} props.children
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  ...props
}) {
  const classes = [
    'btn',
    `btn--${variant}`,
    size === 'sm' && 'btn--sm',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button className={classes} disabled={loading || props.disabled} {...props}>
      {loading ? (
        <span className="btn__spinner" />
      ) : (
        <>
          {icon && <span className="btn__icon">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}
