import { useState, useEffect, useCallback } from 'react';

/**
 * Generic data fetching hook
 * @param {Function} fetchFn - async function that returns data
 * @param {Array} deps - dependency array for re-fetching
 */
export function useFetch(fetchFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result.data || result);
      return result.data || result;
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, loading, error, refetch: execute, setData };
}
