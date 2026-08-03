import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import patientService from '../services/patient.service';
import telemetryService from '../services/telemetry.service';
import alertService from '../services/alert.service';
import Card from '../components/Card';
import Badge from '../components/Badge';
import StatusDot from '../components/StatusDot';
import VitalCard from '../components/VitalCard';
import DataTable from '../components/DataTable';
import Loader from '../components/Loader';
import Button from '../components/Button';
import { formatDate, formatEnum, timeAgo, formatAlertType, getHeartRateStatus, getSpo2Status } from '../utils/formatters';
import './PatientDetail.css';

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: patientData, loading: patientLoading } = useFetch(
    () => patientService.getById(id), [id]
  );

  const patient = patientData?.patient || patientData?.data || patientData;
  const device = patient?.devices?.[0] || null;
  const deviceId = device?.id;

  const { data: telemetryData } = useFetch(
    () => deviceId ? telemetryService.getLatest(deviceId) : Promise.resolve(null),
    [deviceId]
  );

  const { data: alertsData, loading: alertsLoading } = useFetch(
    () => alertService.getByPatient(id), [id]
  );

  const telemetry = telemetryData?.telemetry || telemetryData?.data || telemetryData;
  const alerts = alertsData?.alerts || alertsData?.data || (Array.isArray(alertsData) ? alertsData : []);

  if (patientLoading) return <Loader />;
  if (!patient) return <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 48 }}>Patient not found</p>;

  const alertColumns = [
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
  ];

  return (
    <div className="patient-detail">
      {/* Header */}
      <div className="patient-detail__header">
        <button className="patient-detail__back" onClick={() => navigate('/patients')}>
          <ArrowLeft size={20} />
        </button>
        <div className="patient-detail__title-group">
          <div className="patient-detail__name">
            {patient.firstName} {patient.lastName}
            <Badge variant={patient.status?.toLowerCase() || 'inactive'}>
              {formatEnum(patient.status)}
            </Badge>
          </div>
          <div className="patient-detail__code">{patient.patientCode}</div>
        </div>
        <Button variant="outlined" onClick={() => navigate(`/patients/${id}`)}>
          Edit
        </Button>
      </div>

      {/* Info */}
      <Card title="Patient Information">
        <div className="patient-detail__info-grid">
          <div className="patient-detail__field">
            <span className="patient-detail__field-label">Gender</span>
            <span className="patient-detail__field-value">{formatEnum(patient.gender)}</span>
          </div>
          <div className="patient-detail__field">
            <span className="patient-detail__field-label">Date of Birth</span>
            <span className="patient-detail__field-value">{formatDate(patient.dateOfBirth)}</span>
          </div>
          <div className="patient-detail__field">
            <span className="patient-detail__field-label">Blood Group</span>
            <span className="patient-detail__field-value">{patient.bloodGroup || '—'}</span>
          </div>
          <div className="patient-detail__field">
            <span className="patient-detail__field-label">Phone</span>
            <span className="patient-detail__field-value">{patient.phone || '—'}</span>
          </div>
          <div className="patient-detail__field">
            <span className="patient-detail__field-label">Emergency Contact</span>
            <span className="patient-detail__field-value">{patient.emergencyContact || '—'}</span>
          </div>
          <div className="patient-detail__field">
            <span className="patient-detail__field-label">Address</span>
            <span className="patient-detail__field-value">{patient.address || '—'}</span>
          </div>
        </div>
      </Card>

      {/* Assigned Device */}
      <Card title="Assigned Device">
        {device ? (
          <div className="patient-detail__device-info">
            <StatusDot status={device.status?.toLowerCase() === 'online' ? 'online' : 'offline'} />
            <div>
              <div className="patient-detail__device-code">{device.deviceCode}</div>
              <div className="patient-detail__device-meta">
                Battery: {device.batteryLevel ?? '—'}% · Last seen: {timeAgo(device.lastSeen)}
              </div>
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>No device assigned</p>
        )}
      </Card>

      {/* Latest Vitals */}
      {telemetry && (
        <Card title="Latest Vitals">
          <div className="patient-detail__vitals-row">
            <VitalCard
              label="Heart Rate"
              value={telemetry.heartRate}
              unit="BPM"
              status={getHeartRateStatus(telemetry.heartRate)}
            />
            <VitalCard
              label="SpO2"
              value={telemetry.spo2}
              unit="%"
              status={getSpo2Status(telemetry.spo2)}
            />
            <VitalCard
              label="Motion"
              value={formatEnum(telemetry.motionState)}
              status={telemetry.motionState === 'FALL' ? 'critical' : 'normal'}
            />
            <VitalCard
              label="Battery"
              value={telemetry.battery}
              unit="%"
              barValue={telemetry.battery}
              barColor={telemetry.battery < 20 ? 'var(--red)' : 'var(--green)'}
            />
          </div>
        </Card>
      )}

      {/* Alert History */}
      <Card title="Alert History" flush>
        <DataTable
          columns={alertColumns}
          data={alerts}
          loading={alertsLoading}
          emptyMessage="No alerts for this patient"
        />
      </Card>
    </div>
  );
}
