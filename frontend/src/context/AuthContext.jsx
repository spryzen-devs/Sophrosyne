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
        dispatch({ type: 'SET_USER', payload: data.data });
      } catch {
        localStorage.removeItem('sentinel_token');
        dispatch({ type: 'LOGOUT' });
      }
    }
    verifyToken();
  }, []);

  const login = useCallback(async (email, password) => {
    dispatch({ type: 'AUTH_LOADING' });
    try {
      const data = await authService.login(email, password);
      const token = data.data?.token || data.token;
      const user = data.data?.user || data.user || data;
      localStorage.setItem('sentinel_token', token);
      dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      dispatch({ type: 'AUTH_ERROR', payload: message });
      return { success: false, message };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('sentinel_token');
    dispatch({ type: 'LOGOUT' });
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
