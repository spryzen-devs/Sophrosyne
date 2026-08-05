import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAuth } from '../hooks/useAuth';
import { useFetch } from '../hooks/useFetch';
import deviceService from '../services/device.service';
import telemetryService from '../services/telemetry.service';
import patientService from '../services/patient.service';
import Card from '../components/Card';
import Badge from '../components/Badge';
import StatusDot from '../components/StatusDot';
import Loader from '../components/Loader';
import Button from '../components/Button';
import Select from '../components/Select';
import { formatDate, formatDateTime, timeAgo } from '../utils/formatters';
import toast from 'react-hot-toast';
import './DeviceDetail.css';

const TIME_RANGES = [
  { label: '1 Hour', value: '1h', hours: 1 },
  { label: '6 Hours', value: '6h', hours: 6 },
  { label: '24 Hours', value: '24h', hours: 24 },
];

export default function DeviceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [timeRange, setTimeRange] = useState('1h');
  const [assignPatientId, setAssignPatientId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const { data: deviceData, loading: deviceLoading, refetch: refetchDevice } = useFetch(
    () => deviceService.getById(id), [id]
  );

  const device = deviceData?.device || deviceData?.data || deviceData;

  const { data: historyData, loading: historyLoading } = useFetch(
    () => device ? telemetryService.getHistory(id, {
      hours: TIME_RANGES.find((t) => t.value === timeRange)?.hours,
    }) : Promise.resolve(null),
    [id, timeRange, device?.id]
  );

  const { data: patientsData } = useFetch(
    () => hasRole('ADMIN') ? patientService.getAll({ limit: 100 }) : Promise.resolve(null),
    []
  );

  const history = historyData?.telemetry || historyData?.data || (Array.isArray(historyData) ? historyData : []);
  const allPatients = patientsData?.patients || patientsData?.data || (Array.isArray(patientsData) ? patientsData : []);

  const chartData = history.map((t) => ({
    time: new Date(t.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    heartRate: t.heartRate,
    spo2: t.spo2,
  }));

  const handleAssign = async () => {
    if (!assignPatientId) return;
    setAssigning(true);
    try {
      await deviceService.assign(id, assignPatientId);
      toast.success('Device assigned successfully');
      refetchDevice();
      setAssignPatientId('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign device');
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async () => {
    setAssigning(true);
    try {
      await deviceService.unassign(id);
      toast.success('Device unassigned');
      refetchDevice();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to unassign device');
    } finally {
      setAssigning(false);
    }
  };

  if (deviceLoading) return <Loader />;
  if (!device) return <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 48 }}>Device not found</p>;

  const patientOptions = [
    { value: '', label: 'Select patient...' },
    ...allPatients.map((p) => ({ value: p.id, label: `${p.firstName} ${p.lastName} (${p.patientCode})` })),
  ];

  return (
    <div className="device-detail">
      {/* Header */}
      <div className="device-detail__header">
        <button className="device-detail__back" onClick={() => navigate('/devices')}>
          <ArrowLeft size={20} />
        </button>
        <div className="device-detail__title-group">
          <div className="device-detail__name">
            {device.deviceCode}
            <Badge variant={device.status?.toLowerCase() === 'online' ? 'online' : 'offline'}>
              {device.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Device Info */}
      <Card title="Device Information">
        <div className="device-detail__info-grid">
          <div className="device-detail__field">
            <span className="device-detail__field-label">Firmware</span>
            <span className="device-detail__field-value">{device.firmwareVersion || '—'}</span>
          </div>
          <div className="device-detail__field">
            <span className="device-detail__field-label">Hardware</span>
            <span className="device-detail__field-value">{device.hardwareVersion || '—'}</span>
          </div>
          <div className="device-detail__field">
            <span className="device-detail__field-label">IP Address</span>
            <span className="device-detail__field-value">{device.ipAddress || '—'}</span>
          </div>
          <div className="device-detail__field">
            <span className="device-detail__field-label">Battery</span>
            <span className="device-detail__field-value">{device.batteryLevel != null ? `${device.batteryLevel}%` : '—'}</span>
          </div>
          <div className="device-detail__field">
            <span className="device-detail__field-label">Last Seen</span>
            <span className="device-detail__field-value">{timeAgo(device.lastSeen)}</span>
          </div>
          <div className="device-detail__field">
            <span className="device-detail__field-label">Registered</span>
            <span className="device-detail__field-value">{formatDate(device.registeredAt)}</span>
          </div>
        </div>
      </Card>

      {/* Assigned Patient */}
      <Card title="Assigned Patient">
        {device.patient ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link to={`/patients/${device.patient.id || device.patientId}`} style={{ fontSize: 14, fontWeight: 500 }}>
              {device.patient.firstName} {device.patient.lastName} ({device.patient.patientCode})
            </Link>
            {hasRole('ADMIN') && (
              <Button variant="danger" size="sm" onClick={handleUnassign} loading={assigning}>
                Unassign
              </Button>
            )}
          </div>
        ) : hasRole('ADMIN') ? (
          <div className="device-detail__assign">
            <div className="device-detail__assign-select">
              <Select
                options={patientOptions}
                value={assignPatientId}
                onChange={(e) => setAssignPatientId(e.target.value)}
              />
            </div>
            <Button variant="primary" size="sm" onClick={handleAssign} loading={assigning} disabled={!assignPatientId}>
              Assign
            </Button>
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>No patient assigned</p>
        )}
      </Card>

      {/* Telemetry History Chart */}
      <Card title="Telemetry History">
        <div className="device-detail__chart-controls">
          {TIME_RANGES.map((range) => (
            <button
              key={range.value}
              className={`device-detail__time-btn ${timeRange === range.value ? 'device-detail__time-btn--active' : ''}`}
              onClick={() => setTimeRange(range.value)}
            >
              {range.label}
            </button>
          ))}
        </div>
        {historyLoading ? (
          <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="loader__spinner" style={{ width: 24, height: 24, border: '2px solid var(--border-light)', borderTopColor: 'var(--blue)', borderRadius: '50%', animation: 'loader-spin 0.7s linear infinite' }} />
          </div>
        ) : chartData.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, textAlign: 'center', padding: 48 }}>No telemetry data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
              <XAxis dataKey="time" tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--white)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  fontSize: 13,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 13 }} />
              <Line type="monotone" dataKey="heartRate" stroke="#EA4335" name="Heart Rate" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="spo2" stroke="#1A73E8" name="SpO2" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}
