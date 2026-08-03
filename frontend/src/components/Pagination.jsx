import './Pagination.css';

/**
 * Pagination component
 * @param {Object} props
 * @param {number} props.page
 * @param {number} props.totalPages
 * @param {number} props.total
 * @param {number} props.limit
 * @param {Function} props.onPageChange
 */
export default function Pagination({ page = 1, totalPages = 1, total = 0, limit = 10, onPageChange }) {
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  if (total <= limit) return null;

  return (
    <div className="pagination">
      <span className="pagination__info">
        Showing {start}–{end} of {total}
      </span>
      <div className="pagination__controls">
        <button
          className="pagination__btn"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </button>
        <button
          className="pagination__btn"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
