import { Search, X } from 'lucide-react';
import './SearchBar.css';

/**
 * Search bar component
 * @param {Object} props
 * @param {string} props.value
 * @param {Function} props.onChange
 * @param {string} props.placeholder
 */
export default function SearchBar({ value, onChange, placeholder = 'Search...', ...props }) {
  return (
    <div className="search-bar">
      <span className="search-bar__icon">
        <Search size={18} />
      </span>
      <input
        type="text"
        className="search-bar__input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        {...props}
      />
      {value && (
        <button className="search-bar__clear" onClick={() => onChange('')} aria-label="Clear search">
          <X size={16} />
        </button>
      )}
    </div>
  );
}
