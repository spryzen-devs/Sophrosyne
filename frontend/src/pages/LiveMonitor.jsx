import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  AlertTriangle,
  Heart,
  Droplet,
  Thermometer,
  Activity,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Bell,
  Menu,
  Sparkles,
  ArrowRight,
  Battery,
} from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { useSocket } from '../hooks/useSocket';
import dashboardService from '../services/dashboard.service';
import alertService from '../services/alert.service';
import Button from '../components/Button';
import Loader from '../components/Loader';
import FullscreenToggle from '../components/FullscreenToggle';
import { timeAgo, formatEnum, getHeartRateStatus, getSpo2Status, getTemperatureStatus } from '../utils/formatters';
import toast from 'react-hot-toast';
import './LiveMonitor.css';

/* ===========================================================================
   Smooth SVG Waveform Components
   =========================================================================== */
function ECGWaveform({ status }) {
  const strokeColor = status === 'critical' ? '#E11D48' : status === 'warning' ? '#D97706' : '#2F80ED';
  return (
    <div className="vital-waveform">
      <svg viewBox="0 0 300 40" preserveAspectRatio="none" className="vital-waveform__svg">
        <defs>
          <linearGradient id="ecg-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.2" />
            <stop offset="50%" stopColor={strokeColor} stopOpacity="1" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <path
          d="M0,20 L30,20 L35,15 L40,25 L45,20 L65,20 L70,5 L76,35 L82,0 L88,28 L94,20 L115,20 L120,17 L125,23 L130,20 L150,20 L180,20 L185,15 L190,25 L195,20 L215,20 L220,5 L226,35 L232,0 L238,28 L244,20 L265,20 L270,17 L275,23 L280,20 L300,20"
          fill="none"
          stroke="url(#ecg-gradient)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="vital-waveform__path vital-waveform__path--anim"
        />
      </svg>
    </div>
  );
}

function SpO2Waveform({ status }) {
  const strokeColor = status === 'critical' ? '#E11D48' : status === 'warning' ? '#D97706' : '#2F80ED';
  return (
    <div className="vital-waveform">
      <svg viewBox="0 0 300 40" preserveAspectRatio="none" className="vital-waveform__svg">
        <defs>
          <linearGradient id="spo2-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.2" />
            <stop offset="50%" stopColor={strokeColor} stopOpacity="1" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <path
          d="M0,25 C20,25 25,8 40,8 C55,8 60,25 75,25 C85,25 90,16 98,16 C105,16 110,25 125,25 C145,25 150,8 165,8 C180,8 185,25 200,25 C210,25 215,16 223,16 C230,16 235,25 250,25 C270,25 275,8 290,8 C298,8 300,20 300,25"
          fill="none"
          stroke="url(#spo2-gradient)"
          strokeWidth="2"
          strokeLinecap="round"
          className="vital-waveform__path vital-waveform__path--anim"
        />
      </svg>
    </div>
  );
}

function TempWaveform({ status }) {
  const strokeColor = status === 'critical' ? '#E11D48' : status === 'warning' ? '#D97706' : '#2F80ED';
  return (
    <div className="vital-waveform">
      <svg viewBox="0 0 300 40" preserveAspectRatio="none" className="vital-waveform__svg">
        <path
          d="M0,20 Q37.5,14 75,20 T150,20 T225,20 T300,20"
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.8"
          strokeOpacity="0.7"
          className="vital-waveform__path vital-waveform__path--slow"
        />
      </svg>
    </div>
  );
}

function MotionWaveform({ motionState }) {
  const isFall = motionState === 'FALL';
  const isActive = motionState === 'ACTIVE' || motionState === 'WALKING';
  const strokeColor = isFall ? '#E11D48' : isActive ? '#D97706' : '#2F80ED';
  const pathD = isFall
    ? "M0,20 L40,20 L50,5 L60,35 L70,20 L120,20 L130,5 L140,35 L150,20 L300,20"
    : isActive
    ? "M0,20 C30,12 40,28 75,20 C110,12 120,28 150,20 C185,12 195,28 225,20 C260,12 270,28 300,20"
    : "M0,20 L100,20 C110,19 115,21 120,20 C125,19 130,21 140,20 L300,20";
  return (
    <div className="vital-waveform">
      <svg viewBox="0 0 300 40" preserveAspectRatio="none" className="vital-waveform__svg">
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.8"
          strokeOpacity="0.65"
          className="vital-waveform__path vital-waveform__path--anim"
        />
      </svg>
    </div>
  );
}

function MiniWaveform({ status }) {
  const strokeColor = status === 'critical' ? '#E11D48' : status === 'observe' || status === 'warning' ? '#D97706' : '#2F80ED';
  return (
    <div className="mini-waveform">
      <svg viewBox="0 0 100 30" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
        <path
          d="M0,15 L15,15 L20,8 L25,22 L30,15 L45,15 L50,3 L55,27 L60,15 L75,15 L80,10 L85,20 L90,15 L100,15"
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.8"
          strokeLinecap="round"
          className="vital-waveform__path vital-waveform__path--anim"
        />
      </svg>
    </div>
  );
}

export default function LiveMonitor() {
  const navigate = useNavigate();
  const outletCtx = useOutletContext() || {};
  const { onMenuClick, hasAlerts: layoutHasAlerts } = outletCtx;

  const [liveData, setLiveData] = useState({});
  const [alertBanner, setAlertBanner] = useState(null);
  const [highlightedCards, setHighlightedCards] = useState(new Set());
  const [resolvingBanner, setResolvingBanner] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [now, setNow] = useState(new Date());
  const bannerTimerRef = useRef(null);

  // Live clock timer
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleResolveBanner = async () => {
    const targetId = alertBanner?.alertId || alertBanner?.id;
    if (targetId) {
      setResolvingBanner(true);
      try {
        await alertService.resolve(targetId);
        toast.success('Alert resolved successfully');
        setAlertBanner(null);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to resolve alert');
      } finally {
        setResolvingBanner(false);
      }
    } else {
      setAlertBanner(null);
    }
  };

  const { data: patientsData, loading } = useFetch(() => dashboardService.getLivePatients());
  const patients = Array.isArray(patientsData) ? patientsData : (patientsData?.patients || []);

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
    toast.error(`${alert.alertType}: ${alert.message}`, { duration: 5000 });

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

  const [laptopBattery, setLaptopBattery] = useState(null);

  // Web Battery API hook to get real laptop battery level
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      navigator.getBattery().then((batteryObj) => {
        setLaptopBattery(Math.round(batteryObj.level * 100));
        const handleLevelChange = () => {
          setLaptopBattery(Math.round(batteryObj.level * 100));
        };
        batteryObj.addEventListener('levelchange', handleLevelChange);
        return () => {
          batteryObj.removeEventListener('levelchange', handleLevelChange);
        };
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    return () => {
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    };
  }, []);

  if (loading) return <Loader />;

  const getVitalStatus = (type, value) => {
    if (value == null) return 'normal';
    if (type === 'hr') return getHeartRateStatus(value);
    if (type === 'spo2') return getSpo2Status(value);
    return 'normal';
  };

  const formatLastSignalText = (timestamp) => {
    if (!timestamp) return 'No signal received';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'No signal received';

    const diffMs = Date.now() - date.getTime();
    const secondsAgo = Math.floor(diffMs / 1000);

    if (secondsAgo < 0 || secondsAgo < 5) return 'Last signal: Just now';
    if (secondsAgo < 60) return `Last signal: ${secondsAgo}s ago`;
    if (secondsAgo < 3600) {
      const mins = Math.floor(secondsAgo / 60);
      return `Last signal: ${mins}m ago`;
    }

    const dateStr = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `Last signal: ${dateStr}, ${timeStr}`;
  };

  // Primary patient calculation
  const primaryPatient = (selectedPatientId && patients.find((p) => p.id === selectedPatientId)) || patients[0];
  const otherPatients = patients.filter((p) => p.id !== primaryPatient?.id);

  // Date & Time formatting
  const currentDateStr = now.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const currentTimeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  // Extract primary patient vitals
  const primaryDevice = primaryPatient?.devices?.[0] || primaryPatient?.device;
  const primaryDeviceId = primaryDevice?.id;
  const primaryLive = (primaryDeviceId && liveData[primaryDeviceId]) || (primaryPatient?.id && liveData[primaryPatient.id]) || null;

  // Determine if telemetry is actively arriving over USB/socket (within last 30s)
  const lastUpdate = primaryLive?.receivedAt || primaryPatient?.latestTelemetry?.recordedAt || primaryDevice?.lastSeen || null;

  const isLiveActive = Boolean(
    primaryLive &&
    primaryLive.receivedAt &&
    (Date.now() - new Date(primaryLive.receivedAt).getTime() < 5000)
  );

  const hr = isLiveActive ? primaryLive.heartRate : null;
  const spo2 = isLiveActive ? primaryLive.spo2 : null;
  const temp = isLiveActive ? primaryLive.temperature : null;
  const motion = isLiveActive ? primaryLive.motionState : (primaryLive?.motionState || null);
  const fallDetected = isLiveActive ? (primaryLive.fallDetected || motion === 'FALL') : false;

  // Battery level: sensor battery if live; else real laptop battery
  const batteryVal = (primaryLive && primaryLive.battery != null)
    ? primaryLive.battery
    : (laptopBattery != null ? laptopBattery : (primaryDevice?.batteryLevel ?? null));

  const hrStatus = getVitalStatus('hr', hr);
  const spo2Status = getVitalStatus('spo2', spo2);
  const tempStatus = getTemperatureStatus(temp);
  const isPrimaryHighlighted = primaryPatient ? highlightedCards.has(primaryPatient.id) : false;

  return (
    <div className="live-monitor-page">
      {/* 1. TOP HEADER */}
      <header className="live-header">
        <div className="live-header__left">
          {onMenuClick && (
            <button className="live-header__mobile-toggle" onClick={onMenuClick} aria-label="Toggle navigation">
              <Menu size={20} />
            </button>
          )}
          <div>
            <h1 className="live-header__title">Live Monitor</h1>
            <p className="live-header__subtitle">Real-time insights. Real human impact.</p>
          </div>
        </div>

        <div className="live-header__right">
          <div className="live-header__actions">
            <FullscreenToggle variant="topbar" showText={false} />
            <button className="live-header__icon-btn" onClick={() => navigate('/alerts')} aria-label="Alerts">
              <Bell size={18} />
              {(layoutHasAlerts || alertBanner) && <span className="live-header__bell-dot" />}
            </button>
          </div>

          <div className="live-header__datetime">
            <span className="live-header__date">{currentDateStr}</span>
            <span className="live-header__time">{currentTimeStr}</span>
          </div>
        </div>
      </header>

      {/* CRITICAL ALERT BANNER */}
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
            <Button variant="danger" size="sm" onClick={handleResolveBanner} loading={resolvingBanner}>
              Resolve Alert
            </Button>
            <Button variant="text" size="sm" onClick={() => navigate(`/alerts`)}>
              View All
            </Button>
          </div>
        </div>
      )}

      {patients.length === 0 ? (
        <div className="live-monitor__empty-state">
          No active patients with assigned devices
        </div>
      ) : (
        <>
          {/* 2. HERO CARD (MOUNTAIN LAKE IMAGE USED ONLY HERE) */}
          <section className="live-hero-card">
            <div className="live-hero-card__overlay" />

            <div className="live-hero-card__left">
              <span className="live-hero-card__eyebrow">Watching over</span>
              <div className="live-hero-card__count-row">
                <span className="live-hero-card__count">{patients.length}</span>
                <span className="live-hero-card__count-label">
                  {patients.length === 1 ? 'patient' : 'patients'}
                </span>
              </div>
              <p className="live-hero-card__subnote">Because every signal tells a story.</p>
            </div>

            <div className="live-hero-card__right">
              <p className="live-hero-card__quote">
                &ldquo;Technology that<br />keeps people closer to care.&rdquo;
              </p>
            </div>
          </section>

          {/* 3. PRIMARY PATIENT CARD */}
          {primaryPatient && (
            <section className={`primary-patient-card ${isPrimaryHighlighted ? 'primary-patient-card--highlighted' : ''} ${fallDetected ? 'primary-patient-card--fall' : ''}`}>
              <div className="primary-patient-card__header">
                <div className="primary-patient-card__identity">
                  <div className="primary-patient-card__avatar">
                    {primaryPatient.firstName?.[0] || 'P'}
                  </div>
                  <div>
                    <h2 className="primary-patient-card__name">
                      {primaryPatient.firstName} {primaryPatient.lastName}
                    </h2>
                    <div className="primary-patient-card__codes">
                      <span>{primaryPatient.patientCode}</span>
                      <span className="primary-patient-card__dot-sep">&middot;</span>
                      <span>{primaryDevice?.deviceCode || 'DEV-001'}</span>
                    </div>
                  </div>
                </div>

                <div className="primary-patient-card__meta">
                  <span className="primary-patient-card__signal-time">
                    {formatLastSignalText(lastUpdate)}
                  </span>
                  <div className="primary-patient-card__battery">
                    <Battery size={16} className="primary-patient-card__battery-icon" />
                    <span>Battery: {isLiveActive && batteryVal != null ? `${batteryVal}%` : '—'}</span>
                  </div>
                  <button
                    className="primary-patient-card__details-btn"
                    onClick={() => navigate(`/patients/${primaryPatient.id}`)}
                  >
                    <span>View Details</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* VITAL CARDS GRID */}
              <div className="primary-patient-card__vitals">
                {/* Heart Rate */}
                <div className={`vital-card ${hrStatus !== 'normal' ? `vital-card--${hrStatus}` : ''}`}>
                  <div className="vital-card__header">
                    <div className="vital-card__icon-wrap vital-card__icon-wrap--red">
                      <Heart size={15} fill="#EF4444" stroke="none" />
                    </div>
                    <span className="vital-card__label">Heart Rate</span>
                  </div>
                  <div className="vital-card__value-row">
                    <span className={`vital-card__value ${hr != null ? 'vital-pulse' : ''}`}>
                      {hr ?? '—'}
                    </span>
                    <span className="vital-card__unit">BPM</span>
                  </div>

                  <ECGWaveform status={hrStatus} />

                  <div className="vital-card__footer">
                    <span className="vital-card__range">60 &ndash; 100</span>
                    {hrStatus !== 'normal' && (
                      <span className={`vital-card__warning-badge vital-card__warning-badge--${hrStatus}`}>
                        &bull; {hrStatus === 'critical' ? 'Critical High' : 'Elevated'}
                      </span>
                    )}
                  </div>
                </div>

                {/* SpO2 */}
                <div className={`vital-card ${spo2Status !== 'normal' ? `vital-card--${spo2Status}` : ''}`}>
                  <div className="vital-card__header">
                    <div className="vital-card__icon-wrap vital-card__icon-wrap--blue">
                      <Droplet size={15} fill="#2F80ED" stroke="none" />
                    </div>
                    <span className="vital-card__label">SpO<sub>2</sub></span>
                  </div>
                  <div className="vital-card__value-row">
                    <span className="vital-card__value">{spo2 ?? '—'}</span>
                    <span className="vital-card__unit">%</span>
                  </div>

                  <SpO2Waveform status={spo2Status} />

                  <div className="vital-card__footer">
                    <span className="vital-card__range">95 &ndash; 100</span>
                    {spo2Status !== 'normal' && (
                      <span className={`vital-card__warning-badge vital-card__warning-badge--${spo2Status}`}>
                        &bull; Low SpO2
                      </span>
                    )}
                  </div>
                </div>

                {/* Room Temp */}
                <div className={`vital-card ${tempStatus !== 'normal' ? `vital-card--${tempStatus}` : ''}`}>
                  <div className="vital-card__header">
                    <div className="vital-card__icon-wrap vital-card__icon-wrap--cyan">
                      <Thermometer size={15} stroke="#06B6D4" />
                    </div>
                    <span className="vital-card__label">Room Temp</span>
                  </div>
                  <div className="vital-card__value-row">
                    <span className="vital-card__value">
                      {temp != null ? Number(temp).toFixed(1) : '—'}
                    </span>
                    <span className="vital-card__unit">&deg;C</span>
                  </div>

                  <TempWaveform status={tempStatus} />

                  <div className="vital-card__footer">
                    <span className="vital-card__range">18 &ndash; 30</span>
                    {tempStatus !== 'normal' && (
                      <span className={`vital-card__warning-badge vital-card__warning-badge--${tempStatus}`}>
                        &bull; Elevated Temp
                      </span>
                    )}
                  </div>
                </div>

                {/* Motion */}
                <div className={`vital-card ${fallDetected ? 'vital-card--critical' : ''}`}>
                  <div className="vital-card__header">
                    <div className="vital-card__icon-wrap vital-card__icon-wrap--indigo">
                      <Activity size={15} stroke="#6366F1" />
                    </div>
                    <span className="vital-card__label">Motion</span>
                  </div>
                  <div className="vital-card__value-row">
                    <span className="vital-card__value vital-card__value--text">
                      {motion ? formatEnum(motion) : '—'}
                    </span>
                  </div>

                  <MotionWaveform motionState={motion} />

                  <div className="vital-card__footer">
                    <span className="vital-card__range">
                      {fallDetected ? 'Fall Alert' : motion === 'ACTIVE' ? 'Active' : motion ? 'Low movement' : 'No telemetry'}
                    </span>
                    {fallDetected && (
                      <span className="vital-card__warning-badge vital-card__warning-badge--critical">
                        &bull; Fall Alert
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* 4. OTHER PATIENTS SECTION */}
          {otherPatients.length > 0 && (
            <section className="other-patients-section">
              <div className="other-patients-section__header">
                <h3 className="other-patients-section__title">Other Patients</h3>

                <div className="other-patients-section__controls">
                  <div className="other-patients__sort">
                    <span className="other-patients__sort-label">Sort by</span>
                    <strong className="other-patients__sort-val">Status</strong>
                    <ChevronDown size={14} />
                  </div>
                  <div className="other-patients__nav">
                    <button className="other-patients__nav-btn" aria-label="Previous patient">
                      <ChevronLeft size={16} />
                    </button>
                    <button className="other-patients__nav-btn" aria-label="Next patient">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="other-patients__grid">
                {otherPatients.map((patient) => {
                  const oDevice = patient.devices?.[0] || patient.device;
                  const oDeviceId = oDevice?.id;
                  const oLive = (oDeviceId && liveData[oDeviceId]) || (patient.id && liveData[patient.id]) || null;

                  const oIsActive = Boolean(
                    oLive &&
                    oLive.receivedAt &&
                    (Date.now() - new Date(oLive.receivedAt).getTime() < 5000)
                  );

                  const oHr = oIsActive ? oLive.heartRate : null;
                  const oSpo2 = oIsActive ? oLive.spo2 : null;
                  const oTemp = oIsActive ? oLive.temperature : null;
                  const oMotion = oIsActive ? oLive.motionState : (oLive?.motionState || null);
                  const oFall = oIsActive ? (oLive.fallDetected || oMotion === 'FALL') : false;

                  const oHrStatus = getVitalStatus('hr', oHr);
                  const oSpo2Status = getVitalStatus('spo2', oSpo2);
                  const oTempStatus = getTemperatureStatus(oTemp);

                  let isAbnormal = false;
                  let cardStatusType = 'normal';
                  let cardStatusText = '';

                  if (oFall || oHrStatus === 'critical' || oSpo2Status === 'critical' || oTempStatus === 'critical') {
                    isAbnormal = true;
                    cardStatusType = 'critical';
                    cardStatusText = oFall ? 'Fall Alert' : 'Critical';
                  } else if (oHrStatus === 'warning' || oSpo2Status === 'warning' || oTempStatus === 'warning') {
                    isAbnormal = true;
                    cardStatusType = 'observe';
                    cardStatusText = 'Observe';
                  }

                  return (
                    <div
                      key={patient.id}
                      className={`other-patient-card ${isAbnormal ? `other-patient-card--${cardStatusType}` : ''}`}
                      onClick={() => setSelectedPatientId(patient.id)}
                    >
                      <div className="other-patient-card__top">
                        <div className="other-patient-card__identity">
                          <div className="other-patient-card__avatar">
                            {patient.firstName?.[0] || 'P'}
                          </div>
                          <div>
                            <h4 className="other-patient-card__name">
                              {patient.firstName} {patient.lastName}
                            </h4>
                            <div className="other-patient-card__codes">
                              <span>{patient.patientCode}</span>
                              <span className="primary-patient-card__dot-sep">&middot;</span>
                              <span>{oDevice?.deviceCode || 'DEV-000'}</span>
                            </div>
                          </div>
                        </div>

                        {isAbnormal && (
                          <div className={`other-patient-card__badge other-patient-card__badge--${cardStatusType}`}>
                            <span>{cardStatusText}</span>
                          </div>
                        )}
                      </div>

                      <div className="other-patient-card__bottom">
                        <div className="other-patient-card__vitals-grid">
                          <div className="other-patient-card__vital">
                            <span className="other-patient-card__vital-num">{oHr ?? '—'}</span>
                            <span className="other-patient-card__vital-lbl">BPM</span>
                          </div>
                          <div className="other-patient-card__vital">
                            <span className="other-patient-card__vital-num">{oSpo2 ?? '—'}%</span>
                            <span className="other-patient-card__vital-lbl">SpO2</span>
                          </div>
                          <div className="other-patient-card__vital">
                            <span className="other-patient-card__vital-num">
                              {oTemp != null ? Number(oTemp).toFixed(1) : '—'}&deg;C
                            </span>
                            <span className="other-patient-card__vital-lbl">Temp</span>
                          </div>
                          <div className="other-patient-card__vital">
                            <span className="other-patient-card__vital-num">
                              {oMotion ? formatEnum(oMotion) : '—'}
                            </span>
                            <span className="other-patient-card__vital-lbl">Motion</span>
                          </div>
                        </div>

                        <div className="other-patient-card__graph">
                          <MiniWaveform status={cardStatusType} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 5. BRAND FOOTER BAR */}
          <footer className="live-footer-bar">
            <div className="live-footer-bar__left">
              <Sparkles size={15} className="live-footer-bar__icon" />
              <span>Calmer care. Brighter tomorrows.</span>
            </div>
            <div className="live-footer-bar__right">
              <span>&mdash; Real-time care. Real human impact.</span>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}
