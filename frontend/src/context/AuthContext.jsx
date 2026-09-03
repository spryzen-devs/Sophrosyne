import { createContext, useReducer, useEffect, useCallback } from 'react';
import authService from '../services/auth.service';

export const AuthContext = createContext(null);

const initialState = {
  user: null,
  token: localStorage.getItem('sentinel_token'),
  loading: true,
  error: null,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'AUTH_LOADING':
      return { ...state, loading: true, error: null };
    case 'AUTH_SUCCESS':
      return { ...state, user: action.payload.user, token: action.payload.token, loading: false, error: null };
    case 'AUTH_ERROR':
      return { ...state, user: null, loading: false, error: action.payload };
    case 'LOGOUT':
      return { ...state, user: null, token: null, loading: false, error: null };
    case 'SET_USER':
      return { ...state, user: action.payload, loading: false };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const logout = useCallback(() => {
    localStorage.removeItem('sentinel_token');
    dispatch({ type: 'LOGOUT' });
  }, []);

  // Check existing token on mount
  useEffect(() => {
    async function verifyToken() {
      const token = localStorage.getItem('sentinel_token');
      if (!token) {
        dispatch({ type: 'LOGOUT' });
        return;
      }
      try {
        const data = await authService.getMe();
        if (data?.data) {
          dispatch({ type: 'SET_USER', payload: data.data });
        } else {
          throw new Error('Invalid user payload');
        }
      } catch {
        localStorage.removeItem('sentinel_token');
        dispatch({ type: 'LOGOUT' });
      }
    }

    verifyToken();

    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [logout]);

  const login = useCallback(async (email, password) => {
    dispatch({ type: 'AUTH_LOADING' });
    try {
      const data = await authService.login(email, password);
      const token = data.data?.token || data.token;
      const user = data.data?.user || data.user || data;
      if (!token || !user) {
        throw new Error('Malformed authentication response from server');
      }
      localStorage.setItem('sentinel_token', token);
      dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
      return { success: true };
    } catch (error) {
      let message = 'Login failed. Please try again.';
      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message) {
        message = error.message;
      }
      if (error.code === 'ERR_NETWORK' || !error.response) {
        message = 'Unable to connect to backend server. Please verify backend is running.';
      }

      // If message is a raw JSON string (e.g., from Zod or raw API dump), parse it to user-friendly format
      if (typeof message === 'string' && (message.trim().startsWith('[') || message.trim().startsWith('{'))) {
        try {
          const parsed = JSON.parse(message);
          if (Array.isArray(parsed)) {
            message = parsed.map((err) => err.message || 'Invalid input').join(', ');
          } else if (parsed && parsed.message) {
            message = parsed.message;
          }
        } catch (e) {
          // ignore parsing error
        }
      }

      dispatch({ type: 'AUTH_ERROR', payload: message });
      return { success: false, message };
    }
  }, []);

  const value = {
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    login,
    logout,
    isAuthenticated: !!state.token && !!state.user,
    hasRole: (...roles) => state.user && roles.includes(state.user.role),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
