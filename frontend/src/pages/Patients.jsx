import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, UserPlus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useFetch } from '../hooks/useFetch';
import patientService from '../services/patient.service';
import authService from '../services/auth.service';
import Card from '../components/Card';
import SearchBar from '../components/SearchBar';
import Button from '../components/Button';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Select from '../components/Select';
import Badge from '../components/Badge';
import { formatDate, formatEnum } from '../utils/formatters';
import { GENDERS, BLOOD_GROUPS } from '../utils/constants';
import toast from 'react-hot-toast';
import './Patients.css';

export default function Patients() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [creatingDoctor, setCreatingDoctor] = useState(false);
  const [doctors, setDoctors] = useState([]);

  const [form, setForm] = useState({
    patientCode: '',
    firstName: '',
    lastName: '',
    gender: 'MALE',
    dateOfBirth: '',
    bloodGroup: '',
    phone: '',
    emergencyContact: '',
    address: '',
    assignedDoctorId: '',
  });

  const [doctorForm, setDoctorForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
  });

  const fetchDoctors = useCallback(async () => {
    try {
      const res = await authService.getDoctors();
      const docs = res.data || res || [];
      setDoctors(docs);
    } catch {
      // Silently fail or ignore
    }
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const { data, loading, refetch } = useFetch(
    () => patientService.getAll({ search, page, limit: 10 }),
    [search, page]
  );

  const patients = data?.patients || data?.data || (Array.isArray(data) ? data : []);
  const pagination = data?.pagination || {};
  const total = pagination.total || patients.length;
  const totalPages = pagination.totalPages || Math.ceil(total / 10);

  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleDoctorFormChange = (field, value) => {
    setDoctorForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = { ...form };
      Object.keys(payload).forEach((key) => {
        if (payload[key] === '') delete payload[key];
      });
      await patientService.create(payload);
      toast.success('Patient created successfully');
      setShowModal(false);
      setForm({
        patientCode: '', firstName: '', lastName: '', gender: 'MALE',
        dateOfBirth: '', bloodGroup: '', phone: '', emergencyContact: '', address: '', assignedDoctorId: '',
      });
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create patient');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateDoctor = async (e) => {
    e.preventDefault();
    setCreatingDoctor(true);
    try {
      await authService.registerDoctor({ ...doctorForm, role: 'DOCTOR' });
      toast.success(`Doctor ${doctorForm.fullName} created successfully! Credentials ready for login.`);
      setShowDoctorModal(false);
      setDoctorForm({ fullName: '', email: '', password: '', phone: '' });
      fetchDoctors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create doctor');
    } finally {
      setCreatingDoctor(false);
    }
  };

  const handleDelete = async (patient) => {
    if (!window.confirm(`Are you sure you want to delete patient ${patient.firstName} ${patient.lastName} (${patient.patientCode})?`)) {
      return;
    }
    try {
      await patientService.remove(patient.id);
      toast.success('Patient deleted successfully');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete patient');
    }
  };

  const columns = [
    { key: 'patientCode', label: 'Code' },
    {
      key: 'name',
      label: 'Name',
      render: (_, row) => `${row.firstName} ${row.lastName}`,
    },
    {
      key: 'gender',
      label: 'Gender',
      render: (val) => formatEnum(val),
    },
    {
      key: 'dateOfBirth',
      label: 'Date of Birth',
      render: (val) => formatDate(val),
    },
    { key: 'bloodGroup', label: 'Blood Group' },
    {
      key: 'assignedDoctor',
      label: 'Assigned Doctor',
      render: (_, row) => row.assignedDoctor ? `Dr. ${row.assignedDoctor.fullName}` : <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => (
        <Badge variant={val?.toLowerCase() || 'inactive'}>
          {formatEnum(val)}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="data-table__action" onClick={() => navigate(`/patients/${row.id}`)}>
            View
          </button>
          {hasRole('ADMIN') && (
            <button
              className="data-table__action"
              style={{ color: 'var(--red, #ef4444)' }}
              onClick={() => handleDelete(row)}
            >
              Delete
            </button>
          )}
        </div>
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
    ...doctors.map((d) => ({ value: d.id, label: `Dr. ${d.fullName} (${d.email})` })),
  ];

  return (
    <div>
      <div className="patients-page__toolbar">
        <div className="patients-page__toolbar-left">
          <SearchBar
            value={search}
            onChange={handleSearchChange}
            placeholder="Search patients..."
          />
        </div>
        {hasRole('ADMIN') && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="outline"
              icon={<UserPlus size={18} />}
              onClick={() => setShowDoctorModal(true)}
            >
              Add Doctor
            </Button>
            <Button
              variant="primary"
              icon={<Plus size={18} />}
              onClick={() => setShowModal(true)}
            >
              Add Patient
            </Button>
          </div>
        )}
      </div>

      <Card flush>
        <DataTable
          columns={columns}
          data={patients}
          loading={loading}
          emptyMessage="No patients found"
        />
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={10}
          onPageChange={setPage}
        />
      </Card>

      {/* Add Doctor Modal (Admin Only) */}
      <Modal
        open={showDoctorModal}
        onClose={() => setShowDoctorModal(false)}
        title="Add New Doctor Account"
        footer={
          <>
            <Button variant="text" onClick={() => setShowDoctorModal(false)}>Cancel</Button>
            <Button variant="primary" loading={creatingDoctor} onClick={handleCreateDoctor}>Create Doctor</Button>
          </>
        }
      >
        <form className="add-patient-form" onSubmit={handleCreateDoctor}>
          <Input
            id="doctor-fullname"
            label="Full Name (e.g. Dr. John Watson)"
            placeholder="Dr. Full Name"
            value={doctorForm.fullName}
            onChange={(e) => handleDoctorFormChange('fullName', e.target.value)}
            required
          />
          <Input
            id="doctor-email"
            type="email"
            label="Email Address"
            placeholder="doctor@sentinel.com"
            value={doctorForm.email}
            onChange={(e) => handleDoctorFormChange('email', e.target.value)}
            required
          />
          <Input
            id="doctor-password"
            type="password"
            label="Password"
            placeholder="At least 6 characters"
            value={doctorForm.password}
            onChange={(e) => handleDoctorFormChange('password', e.target.value)}
            required
          />
          <Input
            id="doctor-phone"
            label="Phone Number"
            placeholder="Optional"
            value={doctorForm.phone}
            onChange={(e) => handleDoctorFormChange('phone', e.target.value)}
          />
        </form>
      </Modal>

      {/* Add Patient Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Add Patient"
        footer={
          <>
            <Button variant="text" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" loading={creating} onClick={handleCreate}>Save</Button>
          </>
        }
      >
        <form className="add-patient-form" onSubmit={handleCreate}>
          <Input
            id="patient-code"
            label="Patient Code"
            placeholder="Auto-generated if left blank (e.g., PAT-0001)"
            value={form.patientCode}
            onChange={(e) => handleFormChange('patientCode', e.target.value)}
          />
          <div className="add-patient-form__row">
            <Input
              id="first-name"
              label="First Name"
              value={form.firstName}
              onChange={(e) => handleFormChange('firstName', e.target.value)}
              required
            />
            <Input
              id="last-name"
              label="Last Name"
              value={form.lastName}
              onChange={(e) => handleFormChange('lastName', e.target.value)}
              required
            />
          </div>
          <div className="add-patient-form__row">
            <Select
              id="gender"
              label="Gender"
              options={genderOptions}
              value={form.gender}
              onChange={(e) => handleFormChange('gender', e.target.value)}
            />
            <Input
              id="dob"
              type="date"
              label="Date of Birth"
              value={form.dateOfBirth}
              onChange={(e) => handleFormChange('dateOfBirth', e.target.value)}
              required
            />
          </div>
          <div className="add-patient-form__row">
            <Select
              id="blood-group"
              label="Blood Group"
              options={bloodGroupOptions}
              value={form.bloodGroup}
              onChange={(e) => handleFormChange('bloodGroup', e.target.value)}
            />
            <Input
              id="phone"
              label="Phone"
              placeholder="Optional"
              value={form.phone}
              onChange={(e) => handleFormChange('phone', e.target.value)}
            />
          </div>
          <Select
            id="assigned-doctor"
            label="Assign Doctor (Only Admin Can Assign)"
            options={doctorOptions}
            value={form.assignedDoctorId}
            onChange={(e) => handleFormChange('assignedDoctorId', e.target.value)}
          />
          <Input
            id="emergency-contact"
            label="Emergency Contact"
            placeholder="Optional"
            value={form.emergencyContact}
            onChange={(e) => handleFormChange('emergencyContact', e.target.value)}
          />
          <Input
            id="address"
            type="textarea"
            label="Address"
            placeholder="Optional"
            value={form.address}
            onChange={(e) => handleFormChange('address', e.target.value)}
          />
        </form>
      </Modal>
    </div>
  );
}
