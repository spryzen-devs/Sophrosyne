import './Loader.css';

/**
 * Loading spinner
 * @param {Object} props
 * @param {'sm'|'md'} props.size
 */
export default function Loader({ size = 'md' }) {
  return (
    <div className="loader">
      <div className={`loader__spinner ${size === 'sm' ? 'loader__spinner--sm' : ''}`} />
    </div>
  );
}
