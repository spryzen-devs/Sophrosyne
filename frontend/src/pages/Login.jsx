import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Activity, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/Input';
import Button from '../components/Button';
import './Login.css';

export default function Login() {
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (authLoading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (!result.success) {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <nav className="login-nav">
        <div className="login-nav__brand">
          <Activity size={28} strokeWidth={2.5} />
          <span>SENTINEL</span>
        </div>
      </nav>

      <div className="login-content">
        <div className="login-hero">
          <h1 className="login-hero__title">
            Healthcare that puts <span className="login-hero__title-highlight">you</span> first
          </h1>
          <p className="login-hero__subtitle">
            Compassionate care. Advanced telemetry. Better health outcomes.
          </p>
        </div>

        <div className="login-card-wrapper">
          <div className="login-card">
            <h2 className="login-card__title">Welcome back</h2>
            <p className="login-card__subtitle">Sign in to access your health dashboard</p>

            <form className="login-card__form" onSubmit={handleSubmit}>
              <Input
                id="login-email"
                type="email"
                placeholder="Email or phone"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                id="login-password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              {error && (
                <div className="login-card__error" role="alert">
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                loading={loading}
                className="login-card__submit"
                style={{ width: '100%' }}
              >
                Sign in
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
