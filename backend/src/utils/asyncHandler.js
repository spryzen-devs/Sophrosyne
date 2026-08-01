/**
 * Higher-order function to wrap async express routes and catch errors
 * @param {Function} fn - The async function to wrap
 * @returns {Function} - The wrapped function
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
