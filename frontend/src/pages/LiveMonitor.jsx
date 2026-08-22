import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { useSocket } from '../hooks/useSocket';
import dashboardService from '../services/dashboard.service';
import Badge from '../components/Badge';
import StatusDot from '../components/StatusDot';
import Button from '../components/Button';
import Loader from '../components/Loader';
import { timeAgo, formatEnum, getHeartRateStatus, getSpo2Status } from '../utils/formatters';
import toast from 'react-hot-toast';
import './LiveMonitor.css';

export default function LiveMonitor() {
  const navigate = useNavigate();
  const [liveData, setLiveData] = useState({});
  const [alertBanner, setAlertBanner] = useState(null);
  const [highlightedCards, setHighlightedCards] = useState(new Set());
  const bannerTimerRef = useRef(null);

  const { data: patientsData, loading } = useFetch(() => dashboardService.getLivePatients());
  const patients = Array.isArray(patientsData) ? patientsData : (patientsData?.patients || []);

  // Get patient IDs for socket subscription
  const patientIds = patients.map((p) => p.id);

  const handleTelemetry = useCallback((data) => {
    if (!data) return;
    const deviceKey = data.deviceId;
    const patientKey = data.patientId;
    setLiveData((prev) => {
      const next = { ...prev };
      const entry = {
        ...data,
        receivedAt: new Date().toISOString(),
      };
      if (deviceKey) next[deviceKey] = entry;
      if (patientKey) next[patientKey] = entry;
      return next;
    });
  }, []);

  const handleAlert = useCallback((alert) => {
    // Show toast
    toast.error(`${alert.alertType}: ${alert.message}`, { duration: 5000 });

    // Highlight card
    if (alert.patientId) {
      setHighlightedCards((prev) => {
        const next = new Set(prev);
        next.add(alert.patientId);
        return next;
      });
      setTimeout(() => {
        setHighlightedCards((prev) => {
          const next = new Set(prev);
          next.delete(alert.patientId);
          return next;
        });
      }, 5000);
    }

    // Show banner for critical
    if (alert.severity === 'CRITICAL') {
      setAlertBanner(alert);
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
      bannerTimerRef.current = setTimeout(() => setAlertBanner(null), 30000);
    }
  }, []);

  useSocket({
    onTelemetry: handleTelemetry,
    onAlert: handleAlert,
    patientIds,
  });

  // Cleanup banner timer
  useEffect(() => {
    return () => {
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    };
  }, []);

  if (loading) return <Loader />;

  const getVitalStatus = (type, value) => {
    if (type === 'hr') return getHeartRateStatus(value);
    if (type === 'spo2') return getSpo2Status(value);
    return 'normal';
  };

  const getVitalClass = (status) => {
    if (status === 'critical') return 'monitor-card__vital--critical';
    if (status === 'warning') return 'monitor-card__vital--warning';
    return '';
  };

  return (
    <div className="live-monitor">
      {/* Critical Alert Banner */}
      {alertBanner && (
        <div className="live-monitor__alert-banner">
          <AlertTriangle size={20} className="live-monitor__alert-icon" />
          <div className="live-monitor__alert-content">
            <div className="live-monitor__alert-patient">
              {alertBanner.patientName || 'Patient'}
            </div>
            <div className="live-monitor__alert-message">{alertBanner.message}</div>
          </div>
          <div className="live-monitor__alert-actions">
            <Button variant="text" size="sm" onClick={() => navigate(`/alerts`)}>
              View
            </Button>
            <Button variant="text" size="sm" onClick={() => setAlertBanner(null)}>
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {patients.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-secondary)' }}>
          No active patients with assigned devices
        </div>
      ) : (
        <div className="live-monitor__grid">
          {patients.map((patient) => {
            const device = patient.devices?.[0] || patient.device;
            const deviceId = device?.id;
            const live = (deviceId && liveData[deviceId]) || (patient.id && liveData[patient.id]) || null;

            // Use live data if available, otherwise fall back to latest
            const hr = live?.heartRate ?? patient.latestTelemetry?.heartRate;
            const spo2 = live?.spo2 ?? patient.latestTelemetry?.spo2;
            const motion = live?.motionState ?? patient.latestTelemetry?.motionState;
            const battery = live?.battery ?? device?.batteryLevel;
            const fallDetected = live?.fallDetected || motion === 'FALL';
            const lastUpdate = live?.receivedAt || patient.latestTelemetry?.recordedAt;

            const hrStatus = getVitalStatus('hr', hr);
            const spo2Status = getVitalStatus('spo2', spo2);
            const isHighlighted = highlightedCards.has(patient.id);

            return (
              <div
                key={patient.id}
                className={`monitor-card ${fallDetected ? 'monitor-card--fall' : ''} ${isHighlighted ? 'monitor-card--highlighted' : ''}`}
              >
                <div className="monitor-card__header">
                  <span className="monitor-card__name">
                    {patient.firstName} {patient.lastName}
                  </span>
                  <StatusDot status={device?.status?.toLowerCase() === 'online' ? 'online' : 'offline'} />
                </div>

                <div className="monitor-card__device-row">
                  <span className="monitor-card__code">{patient.patientCode}</span>
                  <span style={{ color: 'var(--border)' }}>·</span>
                  <span className="monitor-card__device-code">{device?.deviceCode || '—'}</span>
                </div>

                <div className="monitor-card__vitals">
                  <div className={`monitor-card__vital ${getVitalClass(hrStatus)}`}>
                    <span className="monitor-card__vital-label">Heart Rate</span>
                    <span>
                      <span className={`monitor-card__vital-value ${hr != null ? 'vital-pulse' : ''}`}>
                        {hr ?? '—'}
                      </span>
                      <span className="monitor-card__vital-unit"> BPM</span>
                    </span>
                  </div>

                  <div className={`monitor-card__vital ${getVitalClass(spo2Status)}`}>
                    <span className="monitor-card__vital-label">SpO2</span>
                    <span>
                      <span className="monitor-card__vital-value">{spo2 ?? '—'}</span>
                      <span className="monitor-card__vital-unit"> %</span>
                    </span>
                  </div>

                  <div className="monitor-card__vital">
                    <span className="monitor-card__vital-label">Motion</span>
                    <Badge variant={motion?.toLowerCase() || 'resting'}>
                      {formatEnum(motion) || 'Unknown'}
                    </Badge>
                  </div>

                  <div className="monitor-card__vital">
                    <span className="monitor-card__vital-label">Battery</span>
                    <span>
                      <span className="monitor-card__vital-value" style={{ fontSize: 18 }}>
                        {battery ?? '—'}
                      </span>
                      <span className="monitor-card__vital-unit"> %</span>
                    </span>
                  </div>
                </div>

                <div className="monitor-card__footer">
                  <span className="monitor-card__timestamp">
                    {lastUpdate ? `Updated ${timeAgo(lastUpdate)}` : 'No data'}
                  </span>
                  {fallDetected && (
                    <Badge variant="fall">FALL DETECTED</Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
