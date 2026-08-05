import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useFetch } from '../hooks/useFetch';
import deviceService from '../services/device.service';
import Card from '../components/Card';
import SearchBar from '../components/SearchBar';
import Button from '../components/Button';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Select from '../components/Select';
import Badge from '../components/Badge';
import StatusDot from '../components/StatusDot';
import { timeAgo } from '../utils/formatters';
import toast from 'react-hot-toast';
import './Devices.css';

export default function Devices() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    deviceCode: '',
    firmwareVersion: '',
    hardwareVersion: '',
  });

  const { data, loading, refetch } = useFetch(
    () => deviceService.getAll({ search, page, limit: 10, status: statusFilter || undefined }),
    [search, page, statusFilter]
  );

  const devices = data?.devices || data?.data || (Array.isArray(data) ? data : []);
  const pagination = data?.pagination || {};
  const total = pagination.total || devices.length;
  const totalPages = pagination.totalPages || Math.ceil(total / 10);

  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = { ...form };
      Object.keys(payload).forEach((key) => {
        if (payload[key] === '') delete payload[key];
      });
      await deviceService.register(payload);
      toast.success('Device registered successfully');
      setShowModal(false);
      setForm({ deviceCode: '', firmwareVersion: '', hardwareVersion: '' });
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register device');
    } finally {
      setCreating(false);
    }
  };

  const columns = [
    { key: 'deviceCode', label: 'Device Code' },
    {
      key: 'patient',
      label: 'Assigned Patient',
      render: (_, row) => row.patient ? `${row.patient.firstName} ${row.patient.lastName}` : '—',
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <StatusDot status={val?.toLowerCase() === 'online' ? 'online' : 'offline'} />
          {val}
        </span>
      ),
    },
    {
      key: 'batteryLevel',
      label: 'Battery',
      render: (val) => val != null ? `${val}%` : '—',
    },
    { key: 'firmwareVersion', label: 'Firmware' },
    {
      key: 'lastSeen',
      label: 'Last Seen',
      render: (val) => timeAgo(val),
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <button className="data-table__action" onClick={() => navigate(`/devices/${row.id}`)}>
          View
        </button>
      ),
    },
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'ONLINE', label: 'Online' },
    { value: 'OFFLINE', label: 'Offline' },
  ];

  return (
    <div>
      <div className="devices-page__toolbar">
        <div className="devices-page__toolbar-left">
          <SearchBar
            value={search}
            onChange={handleSearchChange}
            placeholder="Search devices..."
          />
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            size="sm"
          />
        </div>
        {hasRole('ADMIN') && (
          <Button
            variant="primary"
            icon={<Plus size={18} />}
            onClick={() => setShowModal(true)}
          >
            Register Device
          </Button>
        )}
      </div>

      <Card flush>
        <DataTable
          columns={columns}
          data={devices}
          loading={loading}
          emptyMessage="No devices found"
        />
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={10}
          onPageChange={setPage}
        />
      </Card>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Register Device"
        footer={
          <>
            <Button variant="text" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" loading={creating} onClick={handleCreate}>Register</Button>
          </>
        }
      >
        <form className="register-device-form" onSubmit={handleCreate}>
          <Input
            id="device-code"
            label="Device Code"
            placeholder="e.g., SEN-0001"
            value={form.deviceCode}
            onChange={(e) => setForm((f) => ({ ...f, deviceCode: e.target.value }))}
            required
          />
          <Input
            id="firmware"
            label="Firmware Version"
            placeholder="Optional"
            value={form.firmwareVersion}
            onChange={(e) => setForm((f) => ({ ...f, firmwareVersion: e.target.value }))}
          />
          <Input
            id="hardware"
            label="Hardware Version"
            placeholder="Optional"
            value={form.hardwareVersion}
            onChange={(e) => setForm((f) => ({ ...f, hardwareVersion: e.target.value }))}
          />
        </form>
      </Modal>
    </div>
  );
}
