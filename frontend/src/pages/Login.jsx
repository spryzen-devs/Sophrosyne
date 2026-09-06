import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Activity, AlertCircle, Mail, Lock, ArrowRight, Shield } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/Input';
import Button from '../components/Button';
import FullscreenToggle from '../components/FullscreenToggle';
import './Login.css';

const HERO_SLIDES = [
  {
    counter: '01',
    eyebrow: 'A HEALTHIER TOMORROW',
    headlineLine1: 'Care, connected',
    headlineLine2Prefix: 'to ',
    headlineHighlight: 'what matters.',
    description: 'Sophrosyne brings real-time patient insights and compassionate care together — for better outcomes every day.',
  },
  {
    counter: '02',
    eyebrow: 'CARE THAT SEES MORE',
    headlineLine1: 'Every signal,',
    headlineLine2Prefix: '',
    headlineHighlight: 'closer to better care.',
    description: 'Meaningful patient insights, brought closer to the people who need them — when every moment matters.',
  },
  {
    counter: '03',
    eyebrow: 'BUILT AROUND PEOPLE',
    headlineLine1: 'Technology that helps',
    headlineLine2Prefix: '',
    headlineHighlight: 'care feel more human.',
    description: 'Thoughtful technology designed to support better decisions, deeper connection, and more compassionate care.',
  },
];

export default function Login() {
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Cinematic Hero Content Rotation
  const [activeSlide, setActiveSlide] = useState(0);
  const [fadeState, setFadeState] = useState('in'); // 'in' | 'out'

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeState('out');
      setTimeout(() => {
        setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
        setFadeState('in');
      }, 500);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (authLoading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const currentHero = HERO_SLIDES[activeSlide];

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    const targetEmail = email.trim() || 'doctor@campus.com';
    const targetPassword = password || 'doctor123';

    const result = await login(targetEmail, targetPassword);

    if (!result.success) {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <div className="sophrosyne-layout">
      {/* --------------------------------------------------------------------- */}
      {/* LEFT SIDE: Immersive Architectural Environment (57% Viewport)         */}
      {/* --------------------------------------------------------------------- */}
      <div className="sophrosyne-left">
        {/* Top Left Logo Header */}
        <div className="sophrosyne-left__header">
          <div className="sophrosyne-logo">
            <Activity size={22} color="#2F73E8" strokeWidth={2.6} className="sophrosyne-logo__icon" />
            <span className="sophrosyne-logo__text">Sophrosyne</span>
          </div>
        </div>

        {/* Hero Text Composition */}
        <div className="sophrosyne-left__hero">
          <span className={`sophrosyne-hero__eyebrow ${fadeState === 'out' ? 'sophrosyne-fade-out' : ''}`}>
            {currentHero.eyebrow}
          </span>
          
          <h1 className={`sophrosyne-hero__headline ${fadeState === 'out' ? 'sophrosyne-fade-out' : ''}`}>
            {currentHero.headlineLine1} <br />
            {currentHero.headlineLine2Prefix}
            <span className="sophrosyne-hero__highlight">{currentHero.headlineHighlight}</span>
          </h1>

          <p className={`sophrosyne-hero__description ${fadeState === 'out' ? 'sophrosyne-fade-out' : ''}`}>
            {currentHero.description}
          </p>
        </div>

        {/* Bottom Left Editorial Indicator */}
        <div className="sophrosyne-left__footer">
          <div className="sophrosyne-indicator">
            <span className={`sophrosyne-indicator__num ${fadeState === 'out' ? 'sophrosyne-fade-out' : ''}`}>
              {currentHero.counter} <span className="sophrosyne-indicator__total">/ 03</span>
            </span>
            <div className="sophrosyne-indicator__line-track">
              <div key={activeSlide} className="sophrosyne-indicator__line-fill" />
            </div>
          </div>
          <span className="sophrosyne-indicator__caption">Real-time care. Real human impact.</span>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* RIGHT SIDE: Clean Pure White Login Section (43% Viewport)             */}
      {/* --------------------------------------------------------------------- */}
      <div className="sophrosyne-right">
        {/* Top Right Fullscreen Toggle */}
        <div className="sophrosyne-right__topbar">
          <FullscreenToggle variant="glass" />
        </div>

        {/* Centered Login Column (400px wide, 42-45% from top) */}
        <div className="sophrosyne-login-col">
          {/* Header */}
          <div className="sophrosyne-header">
            <span className="sophrosyne-header__eyebrow">WELCOME BACK</span>
            <h2 className="sophrosyne-header__title">
              Sign in to <br />
              Sophrosyne
            </h2>
            <p className="sophrosyne-header__subtitle">A quiet place for better care.</p>
            <p className="sophrosyne-header__subnote">Sign in to continue.</p>
          </div>

          {/* Form */}
          <form className="sophrosyne-form" onSubmit={handleSubmit}>
            <Input
              id="login-email"
              type="email"
              label="Email address"
              placeholder="name@yourinstitution.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail size={16} color="#7185A3" />}
              required
            />

            <Input
              id="login-password"
              type="password"
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock size={16} color="#7185A3" />}
              required
            />

            {error && (
              <div className="sophrosyne-form__error" role="alert">
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="sophrosyne-submit-btn"
            >
              <span>Sign in</span>
              {!loading && <ArrowRight size={16} className="sophrosyne-submit-btn__arrow" />}
            </Button>
          </form>

          {/* Quiet Brand Statement Footer (64px below forgot password) */}
          <div className="sophrosyne-brand-statement">
            <Shield size={14} color="#7185A3" strokeWidth={1.8} />
            <span>Your care, held with intention.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
