import { useState, useEffect } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import './FullscreenToggle.css';

/**
 * Reusable Fullscreen Toggle Button
 * @param {Object} props
 * @param {string} [props.className] - additional CSS class
 * @param {'glass'|'topbar'} [props.variant] - visual style variant
 * @param {boolean} [props.showText] - whether to render button text alongside icon
 */
export default function FullscreenToggle({ className = '', variant = 'glass', showText = true }) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.error('Fullscreen toggle error:', err);
    }
  };

  return (
    <button
      type="button"
      className={`fullscreen-toggle-btn fullscreen-toggle-btn--${variant} ${className}`}
      onClick={toggleFullscreen}
      title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Enter Fullscreen'}
      aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
    >
      {isFullscreen ? (
        <Minimize2 size={15} className="fullscreen-toggle-btn__icon" />
      ) : (
        <Maximize2 size={15} className="fullscreen-toggle-btn__icon" />
      )}
      {showText && (
        <span className="fullscreen-toggle-btn__text">
          {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        </span>
      )}
    </button>
  );
}
