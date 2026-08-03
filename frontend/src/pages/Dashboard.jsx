import { useNavigate } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import dashboardService from '../services/dashboard.service';
import Card from '../components/Card';
import Badge from '../components/Badge';
import StatusDot from '../components/StatusDot';
import DataTable from '../components/DataTable';
import { timeAgo, formatAlertType } from '../utils/formatters';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: overview, loading: overviewLoading } = useFetch(() => dashboardService.getOverview());
  const { data: recentAlerts, loading: alertsLoading } = useFetch(() => dashboardService.getRecentAlerts());
  const { data: deviceStatus, loading: deviceLoading } = useFetch(() => dashboardService.getDeviceStatus());
  const { data: livePatients, loading: livePatientsLoading } = useFetch(() => dashboardService.getLivePatients());

  const stats = overview || {};
  const alerts = Array.isArray(recentAlerts) ? recentAlerts : (recentAlerts?.alerts || []);
  const devices = deviceStatus || {};
  const patients = Array.isArray(livePatients) ? livePatients : (livePatients?.patients || []);

  const onlineCount = devices.online || devices.onlineCount || 0;
  const offlineCount = devices.offline || devices.offlineCount || 0;
  const totalDevices = onlineCount + offlineCount || 1;
  const onlinePercent = (onlineCount / totalDevices) * 100;

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
        const name = row.patient ? `${row.patient.firstName} ${row.patient.lastName}` : '—';
        return name;
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
        ) : (
          <>
            <div className="stat-card stat-card--patients">
              <div className="stat-card__label">Total Patients</div>
              <div className="stat-card__value">{stats.totalPatients ?? stats.patients ?? 0}</div>
            </div>
            <div className="stat-card stat-card--devices">
              <div className="stat-card__label">Active Devices</div>
              <div className="stat-card__value">{stats.activeDevices ?? stats.onlineDevices ?? onlineCount}</div>
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
          action={<button onClick={() => navigate('/alerts')} style={{ background: 'none', border: 'none', color: 'var(--blue)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>View all</button>}
          flush
        >
          <DataTable
            columns={alertColumns}
            data={alerts.slice(0, 8)}
            loading={alertsLoading}
            emptyMessage="No recent alerts"
          />
        </Card>

        {/* Device Status */}
        <Card title="Device Status">
          {deviceLoading ? (
            <div style={{ padding: 24 }}>
              <div className="skeleton" style={{ height: 20, width: '60%', marginBottom: 16 }} />
              <div className="skeleton" style={{ height: 20, width: '50%', marginBottom: 16 }} />
              <div className="skeleton" style={{ height: 4, width: '100%' }} />
            </div>
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
        ) : patients.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, textAlign: 'center', padding: 24 }}>No active patients with devices</p>
        ) : (
          <div className="dashboard__live-grid">
            {patients.map((p) => (
              <div
                key={p.id}
                className="live-patient-card"
                onClick={() => navigate(`/patients/${p.id}`)}
              >
                <div className="live-patient-card__header">
                  <span className="live-patient-card__name">
                    {p.firstName} {p.lastName}
                  </span>
                  <StatusDot status={p.devices?.[0]?.status?.toLowerCase() === 'online' ? 'online' : 'offline'} />
                </div>
                <div className="live-patient-card__code">{p.patientCode}</div>
                <div className="live-patient-card__vitals">
                  {p.latestTelemetry?.heartRate != null && (
                    <span className="live-patient-card__vital">
                      HR {p.latestTelemetry.heartRate}
                    </span>
                  )}
                  {p.latestTelemetry?.spo2 != null && (
                    <span className="live-patient-card__vital">
                      SpO2 {p.latestTelemetry.spo2}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
