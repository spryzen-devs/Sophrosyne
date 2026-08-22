import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useFetch } from '../hooks/useFetch';
import { useSocket } from '../hooks/useSocket';
import patientService from '../services/patient.service';
import authService from '../services/auth.service';
import telemetryService from '../services/telemetry.service';
import alertService from '../services/alert.service';
import Card from '../components/Card';
import Badge from '../components/Badge';
import StatusDot from '../components/StatusDot';
import VitalCard from '../components/VitalCard';
import DataTable from '../components/DataTable';
import Loader from '../components/Loader';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Select from '../components/Select';
import { formatDate, formatEnum, timeAgo, formatAlertType, getHeartRateStatus, getSpo2Status } from '../utils/formatters';
import { GENDERS, BLOOD_GROUPS } from '../utils/constants';
import toast from 'react-hot-toast';
import './PatientDetail.css';

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [liveTelemetry, setLiveTelemetry] = useState(null);

  const { data: patientData, loading: patientLoading, refetch } = useFetch(
    () => patientService.getById(id), [id]
  );

  const patient = patientData?.patient || patientData?.data || patientData;
  const device = patient?.device || patient?.devices?.[0] || null;
  const deviceId = device?.id;

  const { data: telemetryData } = useFetch(
    () => deviceId ? telemetryService.getLatest(deviceId) : Promise.resolve(null),
    [deviceId]
  );

  const { data: alertsData, loading: alertsLoading, refetch: refetchAlerts } = useFetch(
    () => alertService.getByPatient(id), [id]
  );

  const handleTelemetryEvent = useCallback((data) => {
    if (!data) return;
    if (data.patientId === id || data.deviceId === deviceId || data.deviceCode === device?.deviceCode) {
      setLiveTelemetry({
        heartRate: data.heartRate ?? data.telemetry?.heartRate,
        spo2: data.spo2 ?? data.telemetry?.spo2,
        motionState: data.motionState ?? data.telemetry?.motionState,
        fallDetected: data.fallDetected ?? data.telemetry?.fallDetected,
        battery: data.battery ?? data.telemetry?.battery,
        recordedAt: (data.recordedAt ?? data.telemetry?.recordedAt) || new Date().toISOString(),
      });
    }
  }, [id, deviceId, device?.deviceCode]);

  const handleAlertEvent = useCallback((data) => {
    if (!data) return;
    if (data.patientId === id) {
      refetchAlerts();
    }
  }, [id, refetchAlerts]);

  useSocket({
    patientIds: id ? [id] : [],
    onTelemetry: handleTelemetryEvent,
    onAlert: handleAlertEvent,
  });

  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    gender: 'MALE',
    dateOfBirth: '',
    bloodGroup: '',
    phone: '',
    emergencyContact: '',
    address: '',
    status: 'ACTIVE',
    assignedDoctorId: '',
  });

  useEffect(() => {
    if (patient) {
      setEditForm({
        firstName: patient.firstName || '',
        lastName: patient.lastName || '',
        gender: patient.gender || 'MALE',
        dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : '',
        bloodGroup: patient.bloodGroup || '',
        phone: patient.phone || '',
        emergencyContact: patient.emergencyContact || '',
        address: patient.address || '',
        status: patient.status || 'ACTIVE',
        assignedDoctorId: patient.assignedDoctorId || '',
      });
    }
  }, [patient]);

  const fetchDoctors = useCallback(async () => {
    try {
      const res = await authService.getDoctors();
      setDoctors(res.data || res || []);
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    if (showEditModal) {
      fetchDoctors();
    }
  }, [showEditModal, fetchDoctors]);

  const initialTelemetry = telemetryData?.telemetry || telemetryData?.data || telemetryData;
  const currentTelemetry = liveTelemetry || initialTelemetry;
  const alerts = alertsData?.alerts || alertsData?.data || (Array.isArray(alertsData) ? alertsData : []);

  if (patientLoading) return <Loader />;
  if (!patient) return <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 48 }}>Patient not found</p>;

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const payload = { ...editForm };
      if (!payload.assignedDoctorId) delete payload.assignedDoctorId;
      await patientService.update(id, payload);
      toast.success('Patient details updated successfully');
      setShowEditModal(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update patient');
    } finally {
      setUpdating(false);
    }
  };

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

  const genderOptions = Object.values(GENDERS).map((g) => ({ value: g, label: formatEnum(g) }));
  const bloodGroupOptions = [
    { value: '', label: 'Select blood group' },
    ...BLOOD_GROUPS.map((b) => ({ value: b, label: b })),
  ];
  const doctorOptions = [
    { value: '', label: 'Unassigned (No doctor)' },
    ...doctors.map((d) => ({ value: d.id, label: d.fullName.startsWith('Dr.') ? d.fullName : `Dr. ${d.fullName}` })),
  ];
  const statusOptions = [
    { value: 'ACTIVE', label: 'ACTIVE' },
    { value: 'INACTIVE', label: 'INACTIVE' },
  ];

  const doctorName = patient.assignedDoctor?.fullName;
  const formattedDoctorName = doctorName ? (doctorName.startsWith('Dr.') ? doctorName : `Dr. ${doctorName}`) : 'Unassigned';

  const currentBattery = liveTelemetry?.battery ?? device?.batteryLevel;
  const currentLastSeen = liveTelemetry?.recordedAt ?? device?.lastSeen;

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
        <Button variant="outlined" onClick={() => setShowEditModal(true)}>
          Edit Patient
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
            <span className="patient-detail__field-label">Assigned Doctor</span>
            <span className="patient-detail__field-value">
              {formattedDoctorName}
            </span>
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
                Battery: {currentBattery ?? '—'}% · Last seen: {timeAgo(currentLastSeen)}
              </div>
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>No device assigned</p>
        )}
      </Card>

      {/* Latest Vitals */}
      {currentTelemetry && (
        <Card title="Latest Vitals">
          <div className="patient-detail__vitals-row">
            <VitalCard
              label="Heart Rate"
              value={currentTelemetry.heartRate}
              unit="BPM"
              status={getHeartRateStatus(currentTelemetry.heartRate)}
            />
            <VitalCard
              label="SpO2"
              value={currentTelemetry.spo2}
              unit="%"
              status={getSpo2Status(currentTelemetry.spo2)}
            />
            <VitalCard
              label="Motion"
              value={formatEnum(currentTelemetry.motionState)}
              status={currentTelemetry.motionState === 'FALL' ? 'critical' : 'normal'}
            />
            <VitalCard
              label="Battery"
              value={currentTelemetry.battery}
              unit="%"
              barValue={currentTelemetry.battery}
              barColor={currentTelemetry.battery < 20 ? 'var(--red)' : 'var(--green)'}
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

      {/* Edit Patient Modal */}
      <Modal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Patient Profile"
        footer={
          <>
            <Button variant="text" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button variant="primary" loading={updating} onClick={handleUpdate}>Save Changes</Button>
          </>
        }
      >
        <form className="add-patient-form" onSubmit={handleUpdate}>
          <div className="add-patient-form__row">
            <Input
              id="edit-first-name"
              label="First Name"
              value={editForm.firstName}
              onChange={(e) => handleEditChange('firstName', e.target.value)}
              required
            />
            <Input
              id="edit-last-name"
              label="Last Name"
              value={editForm.lastName}
              onChange={(e) => handleEditChange('lastName', e.target.value)}
              required
            />
          </div>
          <div className="add-patient-form__row">
            <Select
              id="edit-gender"
              label="Gender"
              options={genderOptions}
              value={editForm.gender}
              onChange={(e) => handleEditChange('gender', e.target.value)}
            />
            <Input
              id="edit-dob"
              type="date"
              label="Date of Birth"
              value={editForm.dateOfBirth}
              onChange={(e) => handleEditChange('dateOfBirth', e.target.value)}
              required
            />
          </div>
          <div className="add-patient-form__row">
            <Select
              id="edit-blood-group"
              label="Blood Group"
              options={bloodGroupOptions}
              value={editForm.bloodGroup}
              onChange={(e) => handleEditChange('bloodGroup', e.target.value)}
            />
            <Select
              id="edit-status"
              label="Patient Status"
              options={statusOptions}
              value={editForm.status}
              onChange={(e) => handleEditChange('status', e.target.value)}
            />
          </div>
          {hasRole('ADMIN') && (
            <Select
              id="edit-assigned-doctor"
              label="Assigned Doctor"
              options={doctorOptions}
              value={editForm.assignedDoctorId}
              onChange={(e) => handleEditChange('assignedDoctorId', e.target.value)}
            />
          )}
          <Input
            id="edit-phone"
            label="Phone"
            value={editForm.phone}
            onChange={(e) => handleEditChange('phone', e.target.value)}
          />
          <Input
            id="edit-emergency-contact"
            label="Emergency Contact"
            value={editForm.emergencyContact}
            onChange={(e) => handleEditChange('emergencyContact', e.target.value)}
          />
          <Input
            id="edit-address"
            type="textarea"
            label="Address"
            value={editForm.address}
            onChange={(e) => handleEditChange('address', e.target.value)}
          />
        </form>
      </Modal>
    </div>
  );
}
