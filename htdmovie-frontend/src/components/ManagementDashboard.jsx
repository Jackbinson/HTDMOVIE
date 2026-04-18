import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  BarChart3,
  BrainCircuit,
  CalendarClock,
  Camera,
  CheckCircle2,
  ScanLine,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Ticket,
  UserCog,
  Users
} from 'lucide-react';
import UserManagementPanel from './UserManagementPanel';
import ManagementAiPanel from './ManagementAiPanel';
import { API_BASE_URL, buildAssetUrl } from '../config/api';

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return `${amount.toLocaleString('vi-VN')}d`;
};

const formatDateTime = (value) => {
  if (!value) return '--';
  return new Date(value).toLocaleString('vi-VN');
};

const ManagementDashboard = ({ role = 'staff' }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [shows, setShows] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [systemUsers, setSystemUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bookingOverview, setBookingOverview] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [report, setReport] = useState(null);
  const [managementAi, setManagementAi] = useState(null);
  const [ticketCode, setTicketCode] = useState('');
  const [ticketLookup, setTicketLookup] = useState(null);
  const [ticketLookupLoading, setTicketLookupLoading] = useState(false);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [scannerSupported, setScannerSupported] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [notice, setNotice] = useState('');
  const [activeTab, setActiveTab] = useState(role === 'admin' ? 'overview' : 'checkin');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    start_clock: '',
    duration: '',
    price: '',
    room_id: '',
    posterFile: null,
    posterPreview: ''
  });
  const [userFormData, setUserFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    role: 'user'
  });
  const [editingId, setEditingId] = useState(null);
  const scannerVideoRef = useRef(null);
  const scannerStreamRef = useRef(null);
  const scannerIntervalRef = useRef(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('currentUser');

    if (!storedToken || !storedUser) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== role) {
      navigate(parsedUser.role === 'admin' ? '/admin' : parsedUser.role === 'staff' ? '/staff' : '/home');
      return;
    }

    setUser(parsedUser);
  }, [navigate, role]);

  useEffect(() => {
    setScannerSupported(typeof window !== 'undefined' && 'BarcodeDetector' in window);
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchDashboardData();
  }, [user]);

  useEffect(() => () => {
    if (scannerIntervalRef.current) {
      window.clearInterval(scannerIntervalRef.current);
    }
    if (scannerStreamRef.current) {
      scannerStreamRef.current.getTracks().forEach(track => track.stop());
    }
  }, []);

  const authHeaders = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`
    }
  });

  const handleRequestError = (error, fallbackMessage) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('currentUser');
      navigate('/login');
      return;
    }
    setErrorMsg(error.response?.data?.message || fallbackMessage);
  };

  const resetTicketLookup = () => {
    setTicketLookup(null);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      setNotice('');

      const requests = [
        axios.get(`${API_BASE_URL}/admin/bookings`, authHeaders()),
        axios.get(`${API_BASE_URL}/admin/booking-overview`, authHeaders()),
        axios.get(`${API_BASE_URL}/admin/loyal-customers`, authHeaders()),
        axios.get(`${API_BASE_URL}/management-ai/overview`, authHeaders())
      ];

      if (role === 'admin') {
        requests.unshift(axios.get(`${API_BASE_URL}/movies`));
        requests.push(axios.get(`${API_BASE_URL}/admin/rooms`, authHeaders()));
        requests.push(axios.get(`${API_BASE_URL}/admin/users`, authHeaders()));
        requests.push(axios.get(`${API_BASE_URL}/admin/report`, authHeaders()));
      }

      const responses = await Promise.all(requests);

      if (role === 'admin') {
        setShows(responses[0].data?.data || []);
        setBookings(responses[1].data?.data || []);
        setBookingOverview(responses[2].data?.data || []);
        setCustomers(responses[3].data?.data || []);
        setManagementAi(responses[4].data || null);
        setRooms(responses[5].data?.data || []);
        setSystemUsers(responses[6].data?.data || []);
        setReport(responses[7].data?.report || null);
      } else {
        setBookings(responses[0].data?.data || []);
        setBookingOverview(responses[1].data?.data || []);
        setCustomers(responses[2].data?.data || []);
        setManagementAi(responses[3].data || null);
      }
    } catch (error) {
      handleRequestError(error, 'Khong the tai du lieu quan ly luc nay.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      start_date: '',
      start_clock: '',
      duration: '',
      price: '',
      room_id: '',
      posterFile: null,
      posterPreview: ''
    });
    setEditingId(null);
  };

  const resetUserForm = () => {
    setUserFormData({
      username: '',
      fullName: '',
      email: '',
      password: '',
      role: 'user'
    });
  };

  const handleSubmitShow = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.start_date || !formData.start_clock || !formData.duration || !formData.price || !formData.room_id) {
      setErrorMsg('Vui long nhap day du thong tin phim.');
      return;
    }

    try {
      setBusy(true);
      setErrorMsg('');
      setNotice('');

      const payload = new FormData();
      const startTime = `${formData.start_date}T${formData.start_clock}`;
      payload.append('title', formData.title.trim());
      payload.append('description', formData.description.trim());
      payload.append('start_time', startTime);
      payload.append('duration', String(Number(formData.duration)));
      payload.append('price', String(Number(formData.price)));
      payload.append('room_id', String(Number(formData.room_id)));

      if (formData.posterFile) {
        payload.append('poster', formData.posterFile);
      }

      if (editingId) {
        await axios.put(`${API_BASE_URL}/movies/${editingId}`, payload, authHeaders());
        setNotice('Cap nhat phim thanh cong.');
      } else {
        await axios.post(`${API_BASE_URL}/movies`, payload, authHeaders());
        setNotice('Them phim moi thanh cong.');
      }

      resetForm();
      fetchDashboardData();
    } catch (error) {
      handleRequestError(error, 'Khong the luu suat chieu.');
    } finally {
      setBusy(false);
    }
  };

  const handleEditShow = (show) => {
    const showDate = show.start_time ? new Date(show.start_time) : null;
    const startDate = showDate ? showDate.toISOString().slice(0, 10) : '';
    const startClock = showDate
      ? `${String(showDate.getHours()).padStart(2, '0')}:${String(showDate.getMinutes()).padStart(2, '0')}`
      : '';

    setFormData({
      title: show.title || show.movie_name || '',
      description: show.description || '',
      start_date: startDate,
      start_clock: startClock,
      duration: show.duration || '',
      price: show.price || '',
      room_id: show.room_id || '',
      posterFile: null,
      posterPreview: show.poster_url ? buildAssetUrl(show.poster_url) : ''
    });
    setEditingId(show.id);
    setActiveTab('shows');
    setNotice('');
    setErrorMsg('');
  };

  const handleDeleteShow = async (showId) => {
    const isConfirmed = window.confirm('Ban co chac muon xoa suat chieu nay khong?');
    if (!isConfirmed) return;

    try {
      setBusy(true);
      setErrorMsg('');
      setNotice('');
      await axios.delete(`${API_BASE_URL}/admin/shows/${showId}`, authHeaders());
      setNotice('Da xoa suat chieu.');
      if (editingId === showId) {
        resetForm();
      }
      fetchDashboardData();
    } catch (error) {
      handleRequestError(error, 'Khong the xoa suat chieu.');
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  const handlePromoteToStaff = async (userId) => {
    const isConfirmed = window.confirm('Ban co chac muon nang quyen tai khoan nay thanh nhan vien khong?');
    if (!isConfirmed) return;

    try {
      setBusy(true);
      setErrorMsg('');
      setNotice('');
      await axios.patch(`${API_BASE_URL}/admin/users/${userId}/promote-staff`, {}, authHeaders());
      setNotice('Da cap nhat quyen nguoi dung thanh nhan vien.');
      fetchDashboardData();
    } catch (error) {
      handleRequestError(error, 'Khong the cap nhat quyen nguoi dung.');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();

    if (!userFormData.username || !userFormData.email || !userFormData.password) {
      setErrorMsg('Vui long nhap day du username, email va mat khau cho tai khoan moi.');
      return;
    }

    try {
      setBusy(true);
      setErrorMsg('');
      setNotice('');

      await axios.post(
        `${API_BASE_URL}/users`,
        {
          username: userFormData.username.trim(),
          fullName: userFormData.fullName.trim(),
          email: userFormData.email.trim(),
          password: userFormData.password,
          role: userFormData.role
        },
        authHeaders()
      );

      setNotice('Tao tai khoan moi thanh cong.');
      resetUserForm();
      fetchDashboardData();
    } catch (error) {
      handleRequestError(error, 'Khong the tao tai khoan moi.');
    } finally {
      setBusy(false);
    }
  };

  const handleRefreshManagementAi = async (days = managementAi?.data?.period?.days || 7) => {
    try {
      setBusy(true);
      setErrorMsg('');
      setNotice('');

      const response = await axios.get(`${API_BASE_URL}/management-ai/overview`, {
        ...authHeaders(),
        params: { days }
      });

      setManagementAi(response.data || null);
      setNotice('Da cap nhat du lieu tro ly quan ly.');
    } catch (error) {
      handleRequestError(error, 'Khong the lam moi tro ly quan ly.');
    } finally {
      setBusy(false);
    }
  };

  const handleExportManagementAi = async ({ days, title }) => {
    try {
      setBusy(true);
      setErrorMsg('');
      setNotice('');

      const response = await axios.post(
        `${API_BASE_URL}/management-ai/notion/export`,
        { days, title },
        authHeaders()
      );

      const notionUrl = response.data?.data?.notion_url;
      setNotice(
        notionUrl
          ? `Da xuat bao cao len Notion thanh cong: ${notionUrl}`
          : 'Da xuat bao cao len Notion thanh cong.'
      );

      if (response.data?.data?.report) {
        setManagementAi({
          success: true,
          message: response.data?.message,
          data: response.data.data.report
        });
      }
    } catch (error) {
      handleRequestError(error, 'Khong the xuat bao cao len Notion.');
    } finally {
      setBusy(false);
    }
  };

  const handleLookupTicket = async (event) => {
    event.preventDefault();

    if (!ticketCode.trim()) {
      setErrorMsg('Vui long nhap ma ve de tra cuu.');
      return;
    }

    try {
      setTicketLookupLoading(true);
      setErrorMsg('');
      setNotice('');

      const response = await axios.get(
        `${API_BASE_URL}/staff/tickets/${encodeURIComponent(ticketCode.trim())}`,
        authHeaders()
      );

      setTicketLookup(response.data?.data || null);
      setNotice('Da tai thong tin ve.');
    } catch (error) {
      setTicketLookup(null);
      handleRequestError(error, 'Khong the tra cuu ma ve luc nay.');
    } finally {
      setTicketLookupLoading(false);
    }
  };

  const handleCheckInTicket = async () => {
    const activeTicketCode = ticketLookup?.ticket_code || ticketCode.trim();

    if (!activeTicketCode) {
      setErrorMsg('Vui long tra cuu mot ma ve hop le truoc khi check-in.');
      return;
    }

    try {
      setCheckInLoading(true);
      setErrorMsg('');
      setNotice('');

      const response = await axios.post(
        `${API_BASE_URL}/staff/check-in`,
        { ticketCode: activeTicketCode },
        authHeaders()
      );

      setTicketLookup(response.data?.data || null);
      setNotice(response.data?.message || 'Check-in thanh cong.');
    } catch (error) {
      if (error.response?.data?.data) {
        setTicketLookup(error.response.data.data);
      }
      handleRequestError(error, 'Khong the check-in ma ve nay.');
    } finally {
      setCheckInLoading(false);
    }
  };

  const stopScanner = () => {
    if (scannerIntervalRef.current) {
      window.clearInterval(scannerIntervalRef.current);
      scannerIntervalRef.current = null;
    }

    if (scannerStreamRef.current) {
      scannerStreamRef.current.getTracks().forEach(track => track.stop());
      scannerStreamRef.current = null;
    }

    if (scannerVideoRef.current) {
      scannerVideoRef.current.srcObject = null;
    }

    setScannerActive(false);
  };

  const startScanner = async () => {
    if (!scannerSupported) {
      setScannerError('Trinh duyet hien tai chua ho tro quet QR bang camera.');
      return;
    }

    try {
      setScannerError('');
      setNotice('');
      setErrorMsg('');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });

      scannerStreamRef.current = stream;

      if (scannerVideoRef.current) {
        scannerVideoRef.current.srcObject = stream;
        await scannerVideoRef.current.play();
      }

      const detector = new window.BarcodeDetector({
        formats: ['qr_code']
      });

      setScannerActive(true);

      scannerIntervalRef.current = window.setInterval(async () => {
        if (!scannerVideoRef.current) return;

        try {
          const barcodes = await detector.detect(scannerVideoRef.current);

          if (barcodes.length > 0) {
            const nextTicketCode = barcodes[0]?.rawValue?.trim();

            if (nextTicketCode) {
              setTicketCode(nextTicketCode);
              stopScanner();
              setNotice(`Da quet duoc ma ve: ${nextTicketCode}`);

              const response = await axios.get(
                `${API_BASE_URL}/staff/tickets/${encodeURIComponent(nextTicketCode)}`,
                authHeaders()
              );

              setTicketLookup(response.data?.data || null);
            }
          }
        } catch (error) {
          setScannerError('Khong the doc ma QR tu camera luc nay.');
        }
      }, 800);
    } catch (error) {
      setScannerError('Khong the bat camera. Vui long cap quyen truy cap camera.');
      stopScanner();
    }
  };

  const totalRevenue = Number(report?.total_revenue || 0);
  const totalBookings = Number(report?.total_bookings || bookings.length || 0);
  const pendingBookings = bookings.filter((booking) => booking.payment_status !== 'COMPLETED').length;

  const tabs = role === 'admin'
    ? [
        { id: 'overview', label: 'Tong quan', icon: BarChart3 },
        { id: 'ai', label: 'AI Console', icon: BrainCircuit },
        { id: 'shows', label: 'Suat chieu', icon: CalendarClock },
        { id: 'bookings', label: 'Don ve', icon: Ticket },
        { id: 'customers', label: 'Khach hang', icon: Users },
        { id: 'users', label: 'Tai khoan', icon: UserCog }
      ]
    : [
        { id: 'ai', label: 'AI Console', icon: BrainCircuit },
        { id: 'checkin', label: 'Check-in ve', icon: ScanLine },
        { id: 'bookings', label: 'Don ve', icon: Ticket },
        { id: 'customers', label: 'Khach hang', icon: Users }
      ];

  return (
    <div className="min-h-screen bg-[#070707] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(185,28,28,0.25),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.06),transparent_20%)] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 py-6 md:px-6 md:py-8">
        <div className="mb-6 rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-red-200">
                <ShieldCheck size={14} />
                {role === 'admin' ? 'Admin Console' : 'Staff Console'}
              </div>
              <h1 className="text-3xl font-black uppercase tracking-tight md:text-5xl">
                {role === 'admin' ? 'Quan Ly Rap Chieu' : 'Van Hanh Quay Ve'}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-300 md:text-base">
                {role === 'admin'
                  ? 'Theo doi doanh thu, quan ly suat chieu va kiem soat toan bo luong dat ve trong cung mot man hinh.'
                  : 'Xu ly danh sach booking va theo doi khach hang than thiet de ho tro van hanh rap nhanh hon.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-gray-400">Nguoi dung</p>
                <p className="mt-1 font-bold">{user?.name || user?.email || 'Chua xac dinh'}</p>
              </div>
              <button
                onClick={fetchDashboardData}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <RefreshCw size={16} />
                Lam moi
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-500"
              >
                <LogOut size={16} />
                Dang xuat
              </button>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {errorMsg}
          </div>
        )}

        {notice && (
          <div className="mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {notice}
          </div>
        )}

        <div className="mb-6 flex flex-wrap gap-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-red-600 text-white shadow-lg shadow-red-900/30'
                    : 'border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-10 text-center text-gray-300">
            Dang tai du lieu quan ly...
          </div>
        ) : (
          <>
            {role === 'admin' && activeTab === 'overview' && (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Tong doanh thu</p>
                  <p className="mt-3 text-3xl font-black text-red-400">{formatCurrency(totalRevenue)}</p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Ve da xu ly</p>
                  <p className="mt-3 text-3xl font-black">{totalBookings}</p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Suat chieu hien co</p>
                  <p className="mt-3 text-3xl font-black">{shows.length}</p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Don chua hoan tat</p>
                  <p className="mt-3 text-3xl font-black text-amber-300">{pendingBookings}</p>
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <ManagementAiPanel
                managementAi={managementAi}
                loading={loading}
                busy={busy}
                role={role}
                onRefresh={handleRefreshManagementAi}
                onExport={handleExportManagementAi}
              />
            )}

            {role === 'staff' && activeTab === 'checkin' && (
              <div className="grid gap-6 xl:grid-cols-[380px,1fr]">
                <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
                  <div className="mb-5">
                    <h2 className="text-2xl font-bold">Check-in ve</h2>
                    <p className="mt-2 text-sm text-gray-400">
                      Nhap ma ve de tra cuu nhanh thong tin khach va xac nhan soat ve tai quay.
                    </p>
                  </div>

                  <form onSubmit={handleLookupTicket} className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-200">Ma ve</label>
                      <input
                        value={ticketCode}
                        onChange={(event) => {
                          setTicketCode(event.target.value);
                          setNotice('');
                          setErrorMsg('');
                        }}
                        className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-red-400"
                        placeholder="VD: TKT-DUNE-A1-QR123"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={ticketLookupLoading}
                        className="flex-1 rounded-2xl bg-red-600 px-4 py-3 font-bold text-white transition hover:bg-red-500 disabled:opacity-60"
                      >
                        {ticketLookupLoading ? 'Dang tra cuu...' : 'Tra cuu ma ve'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTicketCode('');
                          resetTicketLookup();
                          setNotice('');
                          setErrorMsg('');
                        }}
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-white transition hover:bg-white/10"
                      >
                        Xoa nhanh
                      </button>
                    </div>
                  </form>

                  <div className="mt-6 rounded-[22px] border border-white/10 bg-black/20 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">Quet QR bang camera</p>
                        <p className="mt-1 text-xs text-gray-400">
                          Staff co the quet truc tiep QR tu ve dien tu cua khach thay vi nhap tay.
                        </p>
                      </div>
                      {scannerActive ? (
                        <button
                          type="button"
                          onClick={stopScanner}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                        >
                          Tat camera
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={startScanner}
                          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-500"
                        >
                          <Camera size={14} />
                          Bat camera
                        </button>
                      )}
                    </div>

                    {scannerError && (
                      <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                        {scannerError}
                      </div>
                    )}

                    <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black">
                      <video
                        ref={scannerVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className={`aspect-video w-full object-cover ${scannerActive ? 'block' : 'hidden'}`}
                      />
                      {!scannerActive && (
                        <div className="flex aspect-video items-center justify-center text-sm text-gray-500">
                          Camera dang tat. Bat camera de quet QR.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">Thong tin ve</h2>
                      <p className="mt-2 text-sm text-gray-400">
                        Hien thi thong tin ve sau khi tra cuu va cho phep check-in ngay tai man hinh nay.
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs uppercase tracking-[0.18em] text-gray-300">
                      Staff Desk
                    </span>
                  </div>

                  {!ticketLookup ? (
                    <div className="rounded-[22px] border border-dashed border-white/10 bg-black/20 p-8 text-center text-gray-400">
                      Chua co ma ve nao duoc tra cuu.
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-[22px] border border-white/10 bg-black/25 p-5">
                          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Ma ve</p>
                          <p className="mt-2 text-lg font-bold text-white">{ticketLookup.ticket_code}</p>
                        </div>
                        <div className="rounded-[22px] border border-white/10 bg-black/25 p-5">
                          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Trang thai soat ve</p>
                          <p className={`mt-2 text-lg font-bold ${ticketLookup.is_used ? 'text-amber-300' : 'text-emerald-300'}`}>
                            {ticketLookup.is_used ? 'Da check-in' : 'Chua check-in'}
                          </p>
                        </div>
                        <div className="rounded-[22px] border border-white/10 bg-black/25 p-5">
                          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Khach hang</p>
                          <p className="mt-2 text-lg font-bold text-white">{ticketLookup.full_name || 'Chua co ten'}</p>
                          <p className="mt-1 text-sm text-gray-400">{ticketLookup.email}</p>
                        </div>
                        <div className="rounded-[22px] border border-white/10 bg-black/25 p-5">
                          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Thanh toan</p>
                          <p className="mt-2 text-lg font-bold text-white">{ticketLookup.payment_status}</p>
                        </div>
                        <div className="rounded-[22px] border border-white/10 bg-black/25 p-5">
                          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Phim</p>
                          <p className="mt-2 text-lg font-bold text-white">{ticketLookup.movie_name}</p>
                          <p className="mt-1 text-sm text-gray-400">{formatDateTime(ticketLookup.start_time)}</p>
                        </div>
                        <div className="rounded-[22px] border border-white/10 bg-black/25 p-5">
                          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Phong / Ghe</p>
                          <p className="mt-2 text-lg font-bold text-white">{ticketLookup.room_name || '--'}</p>
                          <p className="mt-1 text-sm text-gray-400">Ghe {ticketLookup.seat_code}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={handleCheckInTicket}
                          disabled={checkInLoading || ticketLookup.is_used || ticketLookup.payment_status !== 'COMPLETED'}
                          className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <CheckCircle2 size={16} />
                          {checkInLoading ? 'Dang check-in...' : 'Xac nhan check-in'}
                        </button>

                        {ticketLookup.payment_status !== 'COMPLETED' && (
                          <span className="text-sm text-amber-300">
                            Ve chua thanh toan thanh cong nen khong the check-in.
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {role === 'admin' && activeTab === 'shows' && (
              <div className="grid gap-6 xl:grid-cols-[380px,1fr]">
                <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
                  <div className="mb-5">
                    <h2 className="text-2xl font-bold">{editingId ? 'Cap nhat suat chieu' : 'Tao suat chieu'}</h2>
                    <p className="mt-2 text-sm text-gray-400">
                      Dien day du thong tin phim, poster va lich chieu de them moi hoac cap nhat nhanh ngay tren dashboard.
                    </p>
                  </div>

                  <form onSubmit={handleSubmitShow} className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-200">Ten phim</label>
                      <input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-red-400"
                        placeholder="Nhap ten phim"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-200">Mo ta</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={4}
                        className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-red-400"
                        placeholder="Nhap mo ta ngan cho bo phim"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-200">Ngay chieu</label>
                        <input
                          type="date"
                          value={formData.start_date}
                          onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                          className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-red-400"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-200">Gio chieu</label>
                        <input
                          type="time"
                          value={formData.start_clock}
                          onChange={(e) => setFormData({ ...formData, start_clock: e.target.value })}
                          className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-red-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-200">Thoi luong</label>
                        <input
                          type="number"
                          value={formData.duration}
                          onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                          className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-red-400"
                          placeholder="120"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-200">Gia ve</label>
                        <input
                          type="number"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-red-400"
                          placeholder="75000"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-200">Phong</label>
                        <select
                          value={formData.room_id}
                          onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                          className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-red-400"
                        >
                          <option value="">Chon phong chieu</option>
                          {rooms.map((room) => (
                            <option key={room.id} value={room.id}>
                              {room.name} - {room.total_seats} ghe
                            </option>
                          ))}
                        </select>
                        <p className="mt-2 text-xs text-gray-500">
                          Chi co the chon phong da ton tai trong bang rooms.
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-200">Poster phim</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setFormData({
                            ...formData,
                            posterFile: file,
                            posterPreview: file ? URL.createObjectURL(file) : formData.posterPreview
                          });
                        }}
                        className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition file:mr-4 file:rounded-xl file:border-0 file:bg-red-600 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-red-500"
                      />
                      {(formData.posterPreview || (editingId && formData.posterPreview)) && (
                        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-3">
                          <p className="mb-3 text-xs uppercase tracking-[0.18em] text-gray-400">Xem truoc poster</p>
                          <img
                            src={formData.posterPreview}
                            alt={formData.title || 'Poster preview'}
                            className="h-56 w-full rounded-xl object-cover"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={busy}
                        className="flex-1 rounded-2xl bg-red-600 px-4 py-3 font-bold text-white transition hover:bg-red-500 disabled:opacity-60"
                      >
                        {editingId ? 'Luu thay doi phim' : 'Them phim moi'}
                      </button>
                      <button
                        type="button"
                        onClick={resetForm}
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-white transition hover:bg-white/10"
                      >
                        Dat lai
                      </button>
                    </div>
                  </form>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">Danh sach suat chieu</h2>
                      <p className="mt-2 text-sm text-gray-400">Chon mot dong de sua, hoac xoa khi can don lich chieu.</p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs uppercase tracking-[0.18em] text-gray-300">
                      {shows.length} suat chieu
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="text-gray-400">
                        <tr className="border-b border-white/10">
                          <th className="pb-3 pr-4">Phim</th>
                          <th className="pb-3 pr-4">Gio chieu</th>
                          <th className="pb-3 pr-4">Phong</th>
                          <th className="pb-3 pr-4">Gia</th>
                          <th className="pb-3 text-right">Thao tac</th>
                        </tr>
                      </thead>
                      <tbody>
                      {shows.map((show) => (
                          <tr key={show.id} className="border-b border-white/5 text-gray-100">
                            <td className="py-4 pr-4 font-semibold">
                              <div className="flex items-center gap-3">
                                <div className="h-14 w-10 overflow-hidden rounded-lg border border-white/10 bg-black/30">
                                  {show.poster_url ? (
                                    <img
                                      src={buildAssetUrl(show.poster_url)}
                                      alt={show.title || show.movie_name}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-500">
                                      No img
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p>{show.title || show.movie_name}</p>
                                  <p className="mt-1 text-xs text-gray-400">{show.duration || '--'} phut</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 pr-4">{formatDateTime(show.start_time)}</td>
                            <td className="py-4 pr-4">Phong {show.room_id}</td>
                            <td className="py-4 pr-4">{formatCurrency(show.price)}</td>
                            <td className="py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleEditShow(show)}
                                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                                >
                                  Sua
                                </button>
                                <button
                                  onClick={() => handleDeleteShow(show.id)}
                                  className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-100 transition hover:bg-red-500/20"
                                >
                                  Xoa
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'bookings' && (
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Danh sach booking</h2>
                    <p className="mt-2 text-sm text-gray-400">
                      Theo doi trang thai thanh toan va lich su giao dich gan nhat cua rap.
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs uppercase tracking-[0.18em] text-gray-300">
                    {bookingOverview.length} booking
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="text-gray-400">
                      <tr className="border-b border-white/10">
                        <th className="pb-3 pr-4">Ma ve</th>
                        <th className="pb-3 pr-4">Khach hang</th>
                        <th className="pb-3 pr-4">Phim</th>
                        <th className="pb-3 pr-4">Phong</th>
                        <th className="pb-3 pr-4">Tong tien</th>
                        <th className="pb-3 pr-4">Trang thai</th>
                        <th className="pb-3">Thoi gian</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookingOverview.map((booking) => (
                        <tr key={booking.booking_id} className="border-b border-white/5 text-gray-100">
                          <td className="py-4 pr-4 font-semibold">#{booking.booking_id}</td>
                          <td className="py-4 pr-4">{booking.full_name || booking.username || 'Chua co ten'}</td>
                          <td className="py-4 pr-4">{booking.movie_name}</td>
                          <td className="py-4 pr-4">{booking.room_name}</td>
                          <td className="py-4 pr-4">{formatCurrency(booking.total_amount)}</td>
                          <td className="py-4 pr-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                                booking.payment_status === 'COMPLETED'
                                  ? 'bg-emerald-500/15 text-emerald-200'
                                  : 'bg-amber-500/15 text-amber-200'
                              }`}
                            >
                              {booking.payment_status}
                            </span>
                          </td>
                          <td className="py-4">{formatDateTime(booking.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'customers' && (
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Khach hang than thiet</h2>
                    <p className="mt-2 text-sm text-gray-400">
                      Nhom khach hang co tan suat giao dich cao de uu tien cham soc va gioi thieu uu dai.
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs uppercase tracking-[0.18em] text-gray-300">
                    Top {customers.length}
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {customers.map((customer, index) => (
                    <div key={`${customer.full_name}-${index}`} className="rounded-[24px] border border-white/10 bg-black/25 p-5">
                      <p className="text-xs uppercase tracking-[0.2em] text-red-200">Hang {index + 1}</p>
                      <h3 className="mt-3 text-xl font-bold">{customer.full_name || 'Khach le'}</h3>
                      <div className="mt-4 space-y-2 text-sm text-gray-300">
                        <p>Giao dich: <span className="font-semibold text-white">{customer.total_transactions}</span></p>
                        <p>Tong chi: <span className="font-semibold text-white">{formatCurrency(customer.total_spent)}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {role === 'admin' && activeTab === 'users' && (
              <UserManagementPanel
                busy={busy}
                systemUsers={systemUsers}
                userFormData={userFormData}
                setUserFormData={setUserFormData}
                handleCreateUser={handleCreateUser}
                handlePromoteToStaff={handlePromoteToStaff}
                resetUserForm={resetUserForm}
                formatDateTime={formatDateTime}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ManagementDashboard;
