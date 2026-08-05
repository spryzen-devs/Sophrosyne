import { Link } from 'react-router-dom';
import Button from '../components/Button';
import './NotFound.css';

export default function NotFound() {
  return (
    <div className="not-found">
      <div className="not-found__code">404</div>
      <p className="not-found__message">Page not found</p>
      <Link to="/dashboard">
        <Button variant="primary">Go to Dashboard</Button>
      </Link>
    </div>
  );
}
