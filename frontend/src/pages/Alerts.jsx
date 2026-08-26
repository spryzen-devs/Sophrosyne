import { useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useFetch } from '../hooks/useFetch';
import { useSocket } from '../hooks/useSocket';
import alertService from '../services/alert.service';
import Card from '../components/Card';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import Select from '../components/Select';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { timeAgo, formatAlertType, formatEnum } from '../utils/formatters';
import { SEVERITY, ALERT_TYPES } from '../utils/constants';
import toast from 'react-hot-toast';
import './Alerts.css';

export default function Alerts() {
  const { hasRole } = useAuth();
  const [severity, setSeverity] = useState('');
  const [alertType, setAlertType] = useState('');
  const [resolved, setResolved] = useState('false');
  const [page, setPage] = useState(1);
  const [resolvingId, setResolvingId] = useState(null);

  const { data, loading, refetch } = useFetch(
    () => alertService.getAll({
      severity: severity || undefined,
      alertType: alertType || undefined,
      resolved: resolved || undefined,
      page,
      limit: 10,
    }),
    [severity, alertType, resolved, page]
  );

  const handleAlertEvent = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleAlertResolvedEvent = useCallback(() => {
    refetch();
  }, [refetch]);

  useSocket({
    onAlert: handleAlertEvent,
    onAlertResolved: handleAlertResolvedEvent,
  });

  const alerts = data?.alerts || data?.data || (Array.isArray(data) ? data : []);
  const pagination = data?.pagination || {};
  const total = pagination.total || alerts.length;
  const totalPages = pagination.totalPages || Math.ceil(total / 10);

  const handleResolve = async (alertId) => {
    setResolvingId(alertId);
    try {
      await alertService.resolve(alertId);
      toast.success('Alert resolved successfully');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resolve alert');
    } finally {
      setResolvingId(null);
    }
  };

  const columns = [
    {
      key: 'severity',
      label: 'Severity',
      render: (val) => <Badge variant={val?.toLowerCase()}>{val}</Badge>,
    },
    {
      key: 'alertType',
      label: 'Type',
      render: (val) => formatAlertType(val),
    },
    {
      key: 'patient',
      label: 'Patient',
      render: (_, row) => row.patient ? `${row.patient.firstName} ${row.patient.lastName}` : '—',
    },
    { key: 'message', label: 'Message' },
    {
      key: 'createdAt',
      label: 'Time',
      render: (val) => timeAgo(val),
    },
    {
      key: 'resolved',
      label: 'Status',
      render: (val) => (
        <Badge variant={val ? 'resolved' : 'active'}>
          {val ? 'Resolved' : 'Active'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => {
        if (row.resolved) return null;
        if (!hasRole('DOCTOR')) return null;
        return (
          <Button
            variant="text"
            size="sm"
            loading={resolvingId === row.id}
            onClick={() => handleResolve(row.id)}
          >
            Resolve
          </Button>
        );
      },
    },
  ];

  const severityOptions = [
    { value: '', label: 'All Severities' },
    ...Object.values(SEVERITY).map((s) => ({ value: s, label: formatEnum(s) })),
  ];

  const alertTypeOptions = [
    { value: '', label: 'All Types' },
    ...Object.values(ALERT_TYPES).map((t) => ({ value: t, label: formatAlertType(t) })),
  ];

  return (
    <div>
      <div className="alerts-page__toolbar">
        <Select
          options={severityOptions}
          value={severity}
          onChange={(e) => { setSeverity(e.target.value); setPage(1); }}
          size="sm"
        />
        <Select
          options={alertTypeOptions}
          value={alertType}
          onChange={(e) => { setAlertType(e.target.value); setPage(1); }}
          size="sm"
        />
        <div className="alerts-page__toggle">
          <button
            className={`alerts-page__toggle-btn ${resolved === 'false' ? 'alerts-page__toggle-btn--active' : ''}`}
            onClick={() => { setResolved('false'); setPage(1); }}
          >
            Active
          </button>
          <button
            className={`alerts-page__toggle-btn ${resolved === 'true' ? 'alerts-page__toggle-btn--active' : ''}`}
            onClick={() => { setResolved('true'); setPage(1); }}
          >
            Resolved
          </button>
        </div>
      </div>

      <Card flush>
        <DataTable
          columns={columns}
          data={alerts}
          loading={loading}
          emptyMessage="No alerts found"
        />
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={10}
          onPageChange={setPage}
        />
      </Card>
    </div>
  );
}
