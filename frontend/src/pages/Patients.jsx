import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useFetch } from '../hooks/useFetch';
import patientService from '../services/patient.service';
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
  const [creating, setCreating] = useState(false);
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
  });

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

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = { ...form };
      // Remove empty optional fields
      Object.keys(payload).forEach((key) => {
        if (payload[key] === '') delete payload[key];
      });
      await patientService.create(payload);
      toast.success('Patient created successfully');
      setShowModal(false);
      setForm({
        patientCode: '', firstName: '', lastName: '', gender: 'MALE',
        dateOfBirth: '', bloodGroup: '', phone: '', emergencyContact: '', address: '',
      });
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create patient');
    } finally {
      setCreating(false);
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
      label: '',
      render: (_, row) => (
        <button className="data-table__action" onClick={() => navigate(`/patients/${row.id}`)}>
          View
        </button>
      ),
    },
  ];

  const genderOptions = Object.values(GENDERS).map((g) => ({ value: g, label: formatEnum(g) }));
  const bloodGroupOptions = [
    { value: '', label: 'Select blood group' },
    ...BLOOD_GROUPS.map((b) => ({ value: b, label: b })),
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
        {hasRole('ADMIN', 'DOCTOR') && (
          <Button
            variant="primary"
            icon={<Plus size={18} />}
            onClick={() => setShowModal(true)}
          >
            Add Patient
          </Button>
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
            placeholder="e.g., PAT-001"
            value={form.patientCode}
            onChange={(e) => handleFormChange('patientCode', e.target.value)}
            required
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
