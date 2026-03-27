import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  BarChart3,
  CalendarClock,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Ticket,
  UserCog,
  Users
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

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
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [notice, setNotice] = useState('');
  const [activeTab, setActiveTab] = useState(role === 'admin' ? 'overview' : 'bookings');
  const [formData, setFormData] = useState({
    movie_name: '',
    start_time: '',
    price: '',
    room_id: ''
  });
  const [editingId, setEditingId] = useState(null);

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
    if (!user) return;
    fetchDashboardData();
  }, [user]);

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

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      setNotice('');

      const requests = [
        axios.get(`${API_BASE_URL}/admin/bookings`, authHeaders()),
        axios.get(`${API_BASE_URL}/admin/booking-overview`, authHeaders()),
        axios.get(`${API_BASE_URL}/admin/loyal-customers`, authHeaders())
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
        setRooms(responses[4].data?.data || []);
        setSystemUsers(responses[5].data?.data || []);
        setReport(responses[6].data?.report || null);
      } else {
        setBookings(responses[0].data?.data || []);
        setBookingOverview(responses[1].data?.data || []);
        setCustomers(responses[2].data?.data || []);
      }
    } catch (error) {
      handleRequestError(error, 'Khong the tai du lieu quan ly luc nay.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      movie_name: '',
      start_time: '',
      price: '',
      room_id: ''
    });
    setEditingId(null);
  };

  const handleSubmitShow = async (e) => {
    e.preventDefault();
    if (!formData.movie_name || !formData.start_time || !formData.price || !formData.room_id) {
      setErrorMsg('Vui long nhap day du thong tin suat chieu.');
      return;
    }

    try {
      setBusy(true);
      setErrorMsg('');
      setNotice('');

      const payload = {
        ...formData,
        price: Number(formData.price),
        room_id: Number(formData.room_id)
      };

      if (editingId) {
        await axios.put(`${API_BASE_URL}/admin/shows/${editingId}`, payload, authHeaders());
        setNotice('Cap nhat suat chieu thanh cong.');
      } else {
        await axios.post(`${API_BASE_URL}/admin/shows`, payload, authHeaders());
        setNotice('Tao suat chieu moi thanh cong.');
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
    const startTime = show.start_time
      ? new Date(show.start_time).toISOString().slice(0, 16)
      : '';

    setFormData({
      movie_name: show.title || show.movie_name || '',
      start_time: startTime,
      price: show.price || '',
      room_id: show.room_id || ''
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

  const totalRevenue = Number(report?.total_revenue || 0);
  const totalBookings = Number(report?.total_bookings || bookings.length || 0);
  const pendingBookings = bookings.filter((booking) => booking.payment_status !== 'COMPLETED').length;

  const tabs = role === 'admin'
    ? [
        { id: 'overview', label: 'Tong quan', icon: BarChart3 },
        { id: 'shows', label: 'Suat chieu', icon: CalendarClock },
        { id: 'bookings', label: 'Don ve', icon: Ticket },
        { id: 'customers', label: 'Khach hang', icon: Users },
        { id: 'users', label: 'Tai khoan', icon: UserCog }
      ]
    : [
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

            {role === 'admin' && activeTab === 'shows' && (
              <div className="grid gap-6 xl:grid-cols-[380px,1fr]">
                <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
                  <div className="mb-5">
                    <h2 className="text-2xl font-bold">{editingId ? 'Cap nhat suat chieu' : 'Tao suat chieu'}</h2>
                    <p className="mt-2 text-sm text-gray-400">
                      Dien thong tin suat chieu de them moi hoac cap nhat nhanh ngay tren dashboard.
                    </p>
                  </div>

                  <form onSubmit={handleSubmitShow} className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-200">Ten phim</label>
                      <input
                        value={formData.movie_name}
                        onChange={(e) => setFormData({ ...formData, movie_name: e.target.value })}
                        className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-red-400"
                        placeholder="Nhap ten phim"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-200">Thoi gian chieu</label>
                      <input
                        type="datetime-local"
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                        className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-red-400"
                      />
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

                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={busy}
                        className="flex-1 rounded-2xl bg-red-600 px-4 py-3 font-bold text-white transition hover:bg-red-500 disabled:opacity-60"
                      >
                        {editingId ? 'Luu thay doi' : 'Them suat chieu'}
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
                            <td className="py-4 pr-4 font-semibold">{show.title || show.movie_name}</td>
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
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Quan ly tai khoan</h2>
                    <p className="mt-2 text-sm text-gray-400">
                      Admin co the nang quyen nguoi dung thong thuong thanh nhan vien de ho tro van hanh rap.
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs uppercase tracking-[0.18em] text-gray-300">
                    {systemUsers.length} tai khoan
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="text-gray-400">
                      <tr className="border-b border-white/10">
                        <th className="pb-3 pr-4">Ten dang nhap</th>
                        <th className="pb-3 pr-4">Nguoi dung</th>
                        <th className="pb-3 pr-4">Email</th>
                        <th className="pb-3 pr-4">Vai tro</th>
                        <th className="pb-3 pr-4">Ngay tao</th>
                        <th className="pb-3 text-right">Thao tac</th>
                      </tr>
                    </thead>
                    <tbody>
                      {systemUsers.map((account) => (
                        <tr key={account.id} className="border-b border-white/5 text-gray-100">
                          <td className="py-4 pr-4 font-semibold">{account.username}</td>
                          <td className="py-4 pr-4">{account.full_name || '--'}</td>
                          <td className="py-4 pr-4">{account.email}</td>
                          <td className="py-4 pr-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                                account.role === 'admin'
                                  ? 'bg-red-500/15 text-red-200'
                                  : account.role === 'staff'
                                    ? 'bg-sky-500/15 text-sky-200'
                                    : 'bg-white/10 text-gray-200'
                              }`}
                            >
                              {account.role}
                            </span>
                          </td>
                          <td className="py-4 pr-4">{formatDateTime(account.created_at)}</td>
                          <td className="py-4 text-right">
                            {account.role === 'user' ? (
                              <button
                                disabled={busy}
                                onClick={() => handlePromoteToStaff(account.id)}
                                className="rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-500 disabled:opacity-60"
                              >
                                Nang len staff
                              </button>
                            ) : (
                              <span className="text-xs text-gray-500">
                                {account.role === 'staff' ? 'Da la staff' : 'Admin'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ManagementDashboard;
