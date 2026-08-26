import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useDashboardOverview, useDashboardRecentAlerts, useDashboardDeviceStatus, useDashboardLivePatients } from '../hooks/useDashboard';
import { useFetch } from '../hooks/useFetch';
import { useSocket } from '../hooks/useSocket';
import telemetryService from '../services/telemetry.service';
import alertService from '../services/alert.service';
import Card from '../components/Card';
import Badge from '../components/Badge';
import StatusDot from '../components/StatusDot';
import DataTable from '../components/DataTable';
import Button from '../components/Button';
import { timeAgo, formatAlertType } from '../utils/formatters';
import toast from 'react-hot-toast';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    data: overview,
    isLoading: overviewLoading,
    isError: overviewError,
    error: overviewErrorData,
    refetch: refetchOverview,
  } = useDashboardOverview();

  const {
    data: recentAlerts,
    isLoading: alertsLoading,
    isError: alertsError,
    error: alertsErrorData,
    refetch: refetchAlerts,
  } = useDashboardRecentAlerts();

  const {
    data: deviceStatus,
    isLoading: deviceLoading,
    isError: deviceError,
    error: deviceErrorData,
    refetch: refetchDevices,
  } = useDashboardDeviceStatus();

  const {
    data: livePatients,
    isLoading: livePatientsLoading,
    isError: livePatientsError,
    error: livePatientsErrorData,
    refetch: refetchLivePatients,
  } = useDashboardLivePatients();

  const {
    data: telemetryTrendResult,
    loading: trendLoading,
    refetch: refetchTrend,
  } = useFetch(() => telemetryService.getAll({ limit: 15 }), []);

  const handleSocketUpdate = useCallback(() => {
    refetchOverview();
    refetchAlerts();
    refetchDevices();
    refetchLivePatients();
    refetchTrend();
  }, [refetchOverview, refetchAlerts, refetchDevices, refetchLivePatients, refetchTrend]);

  useSocket({
    onTelemetry: handleSocketUpdate,
    onAlert: handleSocketUpdate,
  });

  const stats = overview?.data?.data || overview?.data || overview || {};
  const alerts = recentAlerts?.data?.data || recentAlerts?.data || recentAlerts?.alerts || (Array.isArray(recentAlerts) ? recentAlerts : []);
  const deviceList = deviceStatus?.data?.data || deviceStatus?.data || deviceStatus || (Array.isArray(deviceStatus) ? deviceStatus : []);
  const patients = livePatients?.data?.data || livePatients?.data || livePatients?.patients || (Array.isArray(livePatients) ? livePatients : []);
  const rawTelemetry = telemetryTrendResult?.data?.data || telemetryTrendResult?.data || (Array.isArray(telemetryTrendResult) ? telemetryTrendResult : []);

  const onlineCount = stats.onlineDevices ?? (Array.isArray(deviceList) ? deviceList.filter((d) => d.status === 'ONLINE').length : 0);
  const offlineCount = stats.offlineDevices ?? (Array.isArray(deviceList) ? deviceList.filter((d) => d.status === 'OFFLINE').length : 0);
  const totalDevices = onlineCount + offlineCount || 1;
  const onlinePercent = Math.round((onlineCount / totalDevices) * 100);

  const chartData = [...rawTelemetry]
    .reverse()
    .map((t) => ({
      time: new Date(t.recordedAt || t.timestamp || t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      heartRate: t.heartRate,
      spo2: t.spo2,
    }));

  const [resolvingId, setResolvingId] = useState(null);

  const handleResolveAlert = async (alertId) => {
    setResolvingId(alertId);
    try {
      await alertService.resolve(alertId);
      toast.success('Alert resolved successfully');
      refetchAlerts();
      refetchOverview();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resolve alert');
    } finally {
      setResolvingId(null);
    }
  };

  const alertColumns = [
    {
      key: 'severity',
      label: 'Severity',
      render: (val) => <Badge variant={val?.toLowerCase() || 'low'}>{val}</Badge>,
    },
    {
      key: 'patient',
      label: 'Patient',
      render: (_, row) => {
        if (row.patientName) return row.patientName;
        if (row.patient) return `${row.patient.firstName} ${row.patient.lastName}`;
        return '—';
      },
    },
    {
      key: 'alertType',
      label: 'Type',
      render: (val) => formatAlertType(val),
    },
    {
      key: 'createdAt',
      label: 'Time',
      render: (val) => timeAgo(val),
    },
    {
      key: 'actions',
      label: 'Action',
      render: (_, row) => {
        const id = row.id || row.alertId;
        if (row.resolved) {
          return <Badge variant="resolved">Resolved</Badge>;
        }
        return (
          <Button
            size="sm"
            variant="outline-secondary"
            onClick={() => handleResolveAlert(id)}
            loading={resolvingId === id}
          >
            Resolve
          </Button>
        );
      },
    },
  ];

  return (
    <div className="dashboard">
      {/* Stat Cards */}
      <div className="dashboard__stats">
        {overviewLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="stat-card stat-card--skeleton">
              <div className="stat-card__label skeleton" />
              <div className="stat-card__value skeleton" />
            </div>
          ))
        ) : overviewError ? (
          <div
            style={{
              gridColumn: '1 / -1',
              backgroundColor: 'var(--white)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-sm)',
              padding: 20,
              borderLeft: '3px solid var(--red)',
              color: 'var(--red)',
              textAlign: 'center',
            }}
          >
            Failed to load dashboard overview. {overviewErrorData?.message || 'Please try again.'}
          </div>
        ) : (
          <>
            <div className="stat-card stat-card--patients">
              <div className="stat-card__label">Active Patients</div>
              <div className="stat-card__value">{stats.activePatients ?? stats.totalPatients ?? 0}</div>
            </div>
            <div className="stat-card stat-card--devices">
              <div className="stat-card__label">Online Devices</div>
              <div className="stat-card__value">{stats.onlineDevices ?? onlineCount}</div>
            </div>
            <div className="stat-card stat-card--alerts">
              <div className="stat-card__label">Active Alerts</div>
              <div className="stat-card__value">{stats.activeAlerts ?? 0}</div>
            </div>
            <div className="stat-card stat-card--critical">
              <div className="stat-card__label">Critical Alerts</div>
              <div className="stat-card__value">{stats.criticalAlerts ?? 0}</div>
            </div>
          </>
        )}
      </div>

      {/* Middle Row */}
      <div className="dashboard__middle">
        {/* Recent Alerts */}
        <Card
          title="Recent Alerts"
          action={
            <button
              onClick={() => navigate('/alerts')}
              style={{ background: 'none', border: 'none', color: 'var(--blue)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
            >
              View all
            </button>
          }
          flush
        >
          {alertsError ? (
            <p style={{ color: 'var(--red)', fontSize: 14, padding: 24, margin: 0, textAlign: 'center' }}>
              Failed to load recent alerts. {alertsErrorData?.message || 'Please try again.'}
            </p>
          ) : (
            <DataTable
              columns={alertColumns}
              data={alerts.slice(0, 8)}
              loading={alertsLoading}
              emptyMessage="No recent alerts"
            />
          )}
        </Card>

        {/* Device Status */}
        <Card title="Device Status">
          {deviceLoading ? (
            <div style={{ padding: 24 }}>
              <div className="skeleton" style={{ height: 20, width: '60%', marginBottom: 16 }} />
              <div className="skeleton" style={{ height: 20, width: '50%', marginBottom: 16 }} />
              <div className="skeleton" style={{ height: 4, width: '100%' }} />
            </div>
          ) : deviceError ? (
            <p style={{ color: 'var(--red)', fontSize: 14, padding: 24, margin: 0, textAlign: 'center' }}>
              Failed to load device status. {deviceErrorData?.message || 'Please try again.'}
            </p>
          ) : (
            <>
              <div className="device-status__row">
                <span className="device-status__dot device-status__dot--online" />
                <span className="device-status__label">Online</span>
                <span className="device-status__count">{onlineCount}</span>
              </div>
              <div className="device-status__row">
                <span className="device-status__dot device-status__dot--offline" />
                <span className="device-status__label">Offline</span>
                <span className="device-status__count">{offlineCount}</span>
              </div>
              <div className="device-status__bar">
                <div
                  className="device-status__bar-fill"
                  style={{ width: `${onlinePercent}%` }}
                />
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Telemetry Trends Chart */}
      <Card title="Telemetry Vitals Trends">
        {trendLoading ? (
          <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="loader__spinner" style={{ width: 24, height: 24, border: '2px solid var(--border-light)', borderTopColor: 'var(--blue)', borderRadius: '50%', animation: 'loader-spin 0.7s linear infinite' }} />
          </div>
        ) : chartData.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, textAlign: 'center', padding: 48 }}>No telemetry trends available</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
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
              <Line type="monotone" dataKey="heartRate" stroke="#EA4335" name="Heart Rate (BPM)" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="spo2" stroke="#1A73E8" name="SpO2 (%)" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Live Patients */}
      <Card
        title="Live Patients"
        action={<span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Currently monitored patients</span>}
      >
        {livePatientsLoading ? (
          <div className="dashboard__live-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="live-patient-card">
                <div className="skeleton" style={{ height: 16, width: '70%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 12, width: '40%', marginBottom: 16 }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <div className="skeleton" style={{ height: 22, width: 60 }} />
                  <div className="skeleton" style={{ height: 22, width: 50 }} />
                </div>
              </div>
            ))}
          </div>
        ) : livePatientsError ? (
          <p style={{ color: 'var(--red)', fontSize: 14, textAlign: 'center', padding: 24, margin: 0 }}>
            Failed to load live patients. {livePatientsErrorData?.message || 'Please try again.'}
          </p>
        ) : patients.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, textAlign: 'center', padding: 24 }}>No active patients with devices</p>
        ) : (
          <div className="dashboard__live-grid">
            {patients.map((p) => {
              const dev = p.device || p.devices?.[0];
              const hr = p.latestTelemetry?.heartRate;
              const spo2 = p.latestTelemetry?.spo2;
              const temp = p.latestTelemetry?.temperature;

              return (
                <div
                  key={p.id || p.patientId}
                  className="live-patient-card"
                  onClick={() => navigate(`/patients/${p.id || p.patientId}`)}
                >
                  <div className="live-patient-card__header">
                    <span className="live-patient-card__name">
                      {p.patientName || `${p.firstName} ${p.lastName}`}
                    </span>
                    <StatusDot status={dev?.status?.toLowerCase() === 'online' ? 'online' : 'offline'} />
                  </div>
                  <div className="live-patient-card__code">{p.patientCode}</div>
                  <div className="live-patient-card__vitals">
                    {hr != null && (
                      <span className="live-patient-card__vital">
                        HR {hr} BPM
                      </span>
                    )}
                    {spo2 != null && (
                      <span className="live-patient-card__vital">
                        SpO2 {spo2}%
                      </span>
                    )}
                    {temp != null && (
                      <span className="live-patient-card__vital">
                        Room Temp {Number(temp).toFixed(1)}°C
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
