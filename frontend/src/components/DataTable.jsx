import './DataTable.css';

/**
 * Data table component
 * @param {Object} props
 * @param {{key: string, label: string, render?: Function}[]} props.columns
 * @param {Object[]} props.data
 * @param {boolean} props.loading
 * @param {string} props.emptyMessage
 */
export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No data found',
  className = '',
}) {
  if (loading) {
    return (
      <table className={`data-table ${className}`}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i} className="data-table__skeleton">
              {columns.map((col) => (
                <td key={col.key}>
                  <div className="data-table__skeleton-cell skeleton" style={{ width: `${60 + Math.random() * 30}%` }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (!data.length) {
    return (
      <table className={`data-table ${className}`}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={columns.length} className="data-table__empty">
              {emptyMessage}
            </td>
          </tr>
        </tbody>
      </table>
    );
  }

  return (
    <table className={`data-table ${className}`}>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key}>{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIndex) => (
          <tr key={row.id || rowIndex}>
            {columns.map((col) => (
              <td key={col.key}>
                {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
