import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  AlertCircle,
  Banknote,
  CalendarClock,
  Copy,
  Loader2,
  MapPin,
  Printer,
  QrCode,
  Receipt,
  Store,
  Ticket
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import { API_BASE_URL } from '../../config/api';

const formatDateTime = value => {
  if (!value) return '--';
  return new Date(value).toLocaleString('vi-VN');
};

const formatCurrency = value => `${Number(value || 0).toLocaleString('vi-VN')}d`;

const buildQrImageUrl = value =>
  `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(value)}`;

const MyTickets = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [notice, setNotice] = useState('');
  const [paymentPanels, setPaymentPanels] = useState({});
  const [loadingPayments, setLoadingPayments] = useState({});

  const authConfig = useMemo(() => {
    const token = localStorage.getItem('accessToken');
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  }, []);

  const fetchMyTickets = useCallback(
    async showLoader => {
      try {
        if (showLoader) {
          setLoading(true);
        }

        setErrorMsg('');

        const response = await axios.get(`${API_BASE_URL}/users/me/bookings`, authConfig);
        setBookings(response.data?.data || []);
      } catch (error) {
        setErrorMsg(error.response?.data?.message || 'Khong the tai ve cua ban luc nay.');
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [authConfig]
  );

  useEffect(() => {
    fetchMyTickets(true);
  }, [fetchMyTickets]);

  useEffect(() => {
    const pollingTargets = Object.values(paymentPanels).filter(
      panel => panel?.paymentInfo?.paymentMethod === 'ONLINE' && panel.paymentStatus !== 'COMPLETED'
    );

    if (pollingTargets.length === 0) {
      return undefined;
    }

    const intervalId = window.setInterval(async () => {
      for (const panel of pollingTargets) {
        try {
          const bookingResponse = await axios.get(
            `${API_BASE_URL}/bookings/${panel.bookingId}`,
            authConfig
          );

          const bookingData = bookingResponse.data?.data;
          if (!bookingData) continue;

          setPaymentPanels(prev => ({
            ...prev,
            [panel.bookingId]: {
              ...prev[panel.bookingId],
              paymentStatus: bookingData.payment_status || prev[panel.bookingId]?.paymentStatus
            }
          }));

          if (bookingData.payment_status === 'COMPLETED') {
            const billResponse = await axios.get(
              `${API_BASE_URL}/payments/bill/${panel.bookingId}?method=ONLINE`,
              authConfig
            );

            setPaymentPanels(prev => ({
              ...prev,
              [panel.bookingId]: {
                ...prev[panel.bookingId],
                paymentInfo: billResponse.data?.data || prev[panel.bookingId]?.paymentInfo,
                paymentStatus: 'COMPLETED'
              }
            }));

            setNotice(`Thanh toan booking #${panel.bookingId} thanh cong. Ve da duoc xuat.`);
            fetchMyTickets(false);
          }
        } catch (error) {
          console.error('Khong the cap nhat trang thai thanh toan:', error);
        }
      }
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [authConfig, fetchMyTickets, paymentPanels]);

  const handleCopy = async value => {
    try {
      await navigator.clipboard.writeText(String(value || ''));
      setNotice(`Da sao chep: ${value}`);
      setTimeout(() => setNotice(''), 2200);
    } catch (error) {
      setErrorMsg('Khong the sao chep ma ve luc nay.');
    }
  };

  const handleChoosePaymentMethod = async (booking, method) => {
    try {
      setErrorMsg('');
      setNotice('');
      setLoadingPayments(prev => ({
        ...prev,
        [booking.booking_id]: method
      }));

      const endpoint = method === 'ONLINE' ? '/payments/qr' : '/payments/counter-bill';
      const response = await axios.post(
        `${API_BASE_URL}${endpoint}`,
        { bookingId: booking.booking_id },
        authConfig
      );

      setPaymentPanels(prev => ({
        ...prev,
        [booking.booking_id]: {
          bookingId: booking.booking_id,
          paymentStatus: response.data?.data?.status || booking.payment_status,
          paymentInfo: response.data?.data || null
        }
      }));

      if (method === 'ONLINE') {
        setNotice(`Da tao ma QR cho booking #${booking.booking_id}. He thong se tu dong kiem tra thanh toan.`);
      } else {
        setNotice(`Da tao bill thanh toan tai quay cho booking #${booking.booking_id}.`);
      }
    } catch (error) {
      setErrorMsg(
        error.response?.data?.message || 'Khong the tai thong tin thanh toan cho booking nay.'
      );
    } finally {
      setLoadingPayments(prev => ({
        ...prev,
        [booking.booking_id]: ''
      }));
    }
  };

  const renderPaymentBill = bookingId => {
    const panel = paymentPanels[bookingId];
    const paymentInfo = panel?.paymentInfo;

    if (!paymentInfo) return null;

    return (
      <div className="mt-5 rounded-[26px] border border-white/10 bg-black/25 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Bill thanh toan</p>
            <h3 className="mt-2 flex items-center gap-2 text-xl font-bold">
              {paymentInfo.paymentMethod === 'ONLINE' ? (
                <QrCode size={20} className="text-red-400" />
              ) : (
                <Receipt size={20} className="text-amber-300" />
              )}
              {paymentInfo.paymentMethodLabel}
            </h3>
            <p className="mt-2 text-sm text-gray-400">{paymentInfo.note}</p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                panel.paymentStatus === 'COMPLETED'
                  ? 'bg-emerald-500/15 text-emerald-200'
                  : 'bg-amber-500/15 text-amber-200'
              }`}
            >
              {panel.paymentStatus || paymentInfo.status || 'PENDING'}
            </span>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <Printer size={15} />
              In bill
            </button>
          </div>
        </div>

        {paymentInfo.paymentMethod === 'ONLINE' ? (
          <div className="mt-5 grid gap-5 lg:grid-cols-[280px,1fr]">
            <div className="space-y-4">
              <div className="rounded-3xl bg-white p-4">
                <img
                  src={paymentInfo.qrCodeUrl}
                  alt={`QR thanh toan booking ${paymentInfo.bookingId}`}
                  className="w-full rounded-2xl"
                />
              </div>

              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-red-200/70">Noi dung chuyen khoan</p>
                <p className="mt-2 text-lg font-black text-red-300">{paymentInfo.description}</p>
                <button
                  type="button"
                  onClick={() => handleCopy(paymentInfo.description)}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl border border-red-400/20 bg-black/20 px-3 py-2 text-xs font-semibold transition hover:bg-black/30"
                >
                  <Copy size={14} />
                  Sao chep
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Ngan hang</p>
                  <p className="mt-2 text-lg font-bold">{paymentInfo.bankId}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-500">So tien</p>
                  <p className="mt-2 text-lg font-bold text-red-300">{formatCurrency(paymentInfo.amount)}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-500">So tai khoan</p>
                    <p className="mt-2 text-lg font-black">{paymentInfo.accountNo}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(paymentInfo.accountNo)}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold transition hover:bg-white/10"
                  >
                    <Copy size={14} />
                    Sao chep
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Chu tai khoan</p>
                    <p className="mt-2 text-lg font-bold">{paymentInfo.accountName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(paymentInfo.accountName)}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold transition hover:bg-white/10"
                  >
                    <Copy size={14} />
                    Sao chep
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-gray-300">
                He thong dang tu dong kiem tra thanh toan moi 5 giay. Sau khi thanh cong, `ticket_code`
                se hien ngay tai booking nay.
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-5 grid gap-5 lg:grid-cols-[220px,1fr]">
            <div className="flex h-[220px] items-center justify-center rounded-2xl border border-dashed border-amber-500/30 bg-amber-500/5 p-6 text-center">
              <div>
                <Banknote className="mx-auto text-amber-300" size={34} />
                <p className="mt-4 text-sm text-amber-100">Thanh toan tai quay</p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-amber-200/70">
                  Dua ma booking cho nhan vien
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Booking</p>
                <p className="mt-2 text-lg font-bold">#{paymentInfo.bookingId}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Tong thanh toan</p>
                <p className="mt-2 text-lg font-bold">{formatCurrency(paymentInfo.amount)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Phim</p>
                <p className="mt-2 font-semibold">{paymentInfo.movieName}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Ghe</p>
                <p className="mt-2 font-semibold text-amber-200">
                  {paymentInfo.seatCodes?.join(', ') || 'Chua co ghe'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#111] text-white">
      <Navbar />

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-red-200">
            <Ticket size={14} />
            My Tickets
          </div>
          <h1 className="mt-4 text-4xl font-black uppercase tracking-tight">Ve cua toi</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-300 md:text-base">
            Luu ma ve, QR check-in va thong tin suat chieu de dua cho nhan vien khi vao rap.
          </p>
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

        {loading ? (
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-10 text-center text-gray-300">
            Dang tai ve cua ban...
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-white/10 bg-white/5 p-10 text-center text-gray-400">
            Ban chua co booking nao.
          </div>
        ) : (
          <div className="space-y-8">
            {bookings.map(booking => {
              const isPending = booking.payment_status !== 'COMPLETED';
              const loadingMethod = loadingPayments[booking.booking_id];

              return (
                <section key={booking.booking_id} className="rounded-[30px] border border-white/10 bg-white/5 p-6">
                  <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">{booking.movie_name}</h2>
                      <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-300">
                        <div className="inline-flex items-center gap-2">
                          <CalendarClock size={16} />
                          {formatDateTime(booking.start_time)}
                        </div>
                        <div className="inline-flex items-center gap-2">
                          <MapPin size={16} />
                          {booking.room_name || `Phong ${booking.room_id}`}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-right">
                      <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Booking #{booking.booking_id}</p>
                      <p className="mt-2 text-lg font-bold text-white">{formatCurrency(booking.total_amount)}</p>
                      <p className={`mt-1 text-sm ${isPending ? 'text-amber-300' : 'text-emerald-300'}`}>
                        {booking.payment_status}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
                    {(booking.tickets || []).length === 0 ? (
                      <div
                        className={`rounded-[24px] border p-6 text-sm ${
                          isPending
                            ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                            : 'border-dashed border-white/10 bg-black/20 text-gray-400'
                        }`}
                      >
                        {isPending
                          ? `Booking nay dang o trang thai ${booking.payment_status}. Ticket_code chi duoc tao sau khi thanh toan thanh cong.`
                          : 'Booking nay da thanh toan nhung chua co ticket_code. Vui long lien he nhan vien de kiem tra them.'}
                        {booking.seat_codes ? (
                          <p className="mt-3 text-xs uppercase tracking-[0.18em] opacity-80">
                            Ghe da giu: {booking.seat_codes}
                          </p>
                        ) : null}

                        {isPending && (
                          <div className="mt-5 grid gap-3 md:grid-cols-2">
                            <button
                              type="button"
                              onClick={() => handleChoosePaymentMethod(booking, 'ONLINE')}
                              disabled={Boolean(loadingMethod)}
                              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100 transition hover:bg-red-500/15 disabled:opacity-60"
                            >
                              {loadingMethod === 'ONLINE' ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <QrCode size={16} />
                              )}
                              Thanh toan online
                            </button>

                            <button
                              type="button"
                              onClick={() => handleChoosePaymentMethod(booking, 'COUNTER')}
                              disabled={Boolean(loadingMethod)}
                              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-500/30 bg-black/20 px-4 py-3 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/10 disabled:opacity-60"
                            >
                              {loadingMethod === 'COUNTER' ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Store size={16} />
                              )}
                              Thanh toan tai quay
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      booking.tickets.map(ticket => (
                        <article key={`${booking.booking_id}-${ticket.ticket_code}-${ticket.seat_code}`} className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                          <div className="mb-4 flex items-center justify-between">
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-gray-300">
                              <QrCode size={14} />
                              Ghe {ticket.seat_code}
                            </div>
                            <span className={`text-xs font-semibold ${ticket.is_used ? 'text-amber-300' : 'text-emerald-300'}`}>
                              {ticket.is_used ? 'Da check-in' : 'Chua check-in'}
                            </span>
                          </div>

                          {ticket.ticket_code ? (
                            <>
                              <div className="overflow-hidden rounded-3xl bg-white p-4">
                                <img
                                  src={buildQrImageUrl(ticket.ticket_code)}
                                  alt={`QR ${ticket.ticket_code}`}
                                  className="mx-auto h-52 w-52 rounded-2xl object-contain"
                                />
                              </div>

                              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                                <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Ticket code</p>
                                <p className="mt-2 break-all font-mono text-sm text-white">{ticket.ticket_code}</p>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(ticket.ticket_code)}
                                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                                >
                                  <Copy size={14} />
                                  Sao chep ma
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                              Ma ve chua duoc tao cho ghe nay.
                            </div>
                          )}
                        </article>
                      ))
                    )}
                  </div>

                  {isPending && renderPaymentBill(booking.booking_id)}
                </section>
              );
            })}
          </div>
        )}

        <div className="mt-8 rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm text-gray-300">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 text-red-400" size={18} />
            <p>
              Khi vao rap, ban co the dua QR hoac `ticket_code` cho nhan vien. Neu booking van
              dang `PENDING`, ban co the thanh toan tiep ngay trong trang nay.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyTickets;
