import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import './Input.css';

/**
 * Input component with label, icon, and error support
 * @param {Object} props
 * @param {string} props.label
 * @param {string} props.error
 * @param {React.ReactNode} props.icon
 * @param {'text'|'password'|'email'|'date'|'number'|'textarea'} props.type
 */
export default function Input({
  label,
  error,
  icon,
  type = 'text',
  className = '',
  id,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  if (type === 'textarea') {
    return (
      <div className={`input-group ${className}`}>
        {label && <label className="input-group__label" htmlFor={id}>{label}</label>}
        <textarea
          id={id}
          className={`input-group__textarea ${error ? 'input-group__field--error' : ''}`}
          {...props}
        />
        {error && <span className="input-group__error">{error}</span>}
      </div>
    );
  }

  return (
    <div className={`input-group ${className}`}>
      {label && <label className="input-group__label" htmlFor={id}>{label}</label>}
      <div className="input-group__icon-wrapper">
        {icon && <span className="input-group__icon">{icon}</span>}
        <input
          id={id}
          type={inputType}
          className={`input-group__field ${icon ? 'input-group__field--with-icon' : ''} ${error ? 'input-group__field--error' : ''}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            className="input-group__suffix"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <span className="input-group__error">{error}</span>}
    </div>
  );
}
