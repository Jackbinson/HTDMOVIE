import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import SeatMatrix from '../../components/SeatMatrix';
import {
  Banknote,
  CheckCircle2,
  Copy,
  CreditCard,
  Loader2,
  Printer,
  QrCode,
  Receipt,
  Store
} from 'lucide-react';
import { API_BASE_URL, buildAssetUrl } from '../../config/api';

const formatCurrency = value => `${Number(value || 0).toLocaleString()}d`;

const formatDateTime = value => {
  if (!value) return 'Chua co du lieu';

  return new Date(value).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const formatCountdown = seconds => {
  const safeSeconds = Math.max(Number(seconds || 0), 0);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

const MovieDetail = () => {
  const { movieId } = useParams();
  const [show, setShow] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingPaymentMethod, setLoadingPaymentMethod] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [checkoutInfo, setCheckoutInfo] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [holdCountdown, setHoldCountdown] = useState(0);

  const authConfig = useMemo(() => {
    const token = localStorage.getItem('accessToken');
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  }, []);

  const fetchSeatMap = async () => {
    if (!movieId) return [];

    const seatsRes = await axios.get(`${API_BASE_URL}/seats/show/${movieId}`);
    const latestSeats = seatsRes.data;

    setSeats(latestSeats);
    setSelectedSeats(prev =>
      prev.filter(code => {
        const matchedSeat = latestSeats.find(seat => seat.seat_code === code);
        return matchedSeat && matchedSeat.status === 0;
      })
    );

    return latestSeats;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setErrorMsg('');

        const [showRes, seatsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/movies/${movieId}`),
          fetchSeatMap()
        ]);

        setShow(showRes.data.data);
        setSeats(seatsRes);
      } catch (error) {
        console.error('Khong the lay du lieu chi tiet phim:', error);
        setErrorMsg('Khong the tai du lieu phim va so do ghe.');
      } finally {
        setLoading(false);
      }
    };

    if (movieId) {
      fetchData();
    }
  }, [movieId]);

  useEffect(() => {
    if (!movieId) return undefined;

    const intervalId = window.setInterval(() => {
      fetchSeatMap().catch(error => {
        console.error('Khong the cap nhat so do ghe:', error);
      });
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [movieId]);

  useEffect(() => {
    if (!checkoutInfo?.expiresIn) {
      setHoldCountdown(0);
      return undefined;
    }

    setHoldCountdown(checkoutInfo.expiresIn);

    const intervalId = window.setInterval(() => {
      setHoldCountdown(prev => {
        if (prev <= 1) {
          window.clearInterval(intervalId);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [checkoutInfo]);

  useEffect(() => {
    if (!paymentInfo?.bookingId || paymentInfo.paymentMethod !== 'ONLINE') return undefined;

    const intervalId = window.setInterval(async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/bookings/${paymentInfo.bookingId}`,
          authConfig
        );

        const booking = response.data?.data;
        if (!booking) return;

        setPaymentStatus(booking.payment_status);

        if (booking.payment_status === 'COMPLETED') {
          const billResponse = await axios.get(
            `${API_BASE_URL}/payments/bill/${paymentInfo.bookingId}?method=ONLINE`,
            authConfig
          );

          setPaymentInfo(billResponse.data.data);
          setSuccessMsg('Thanh toan thanh cong! Bill va ve cua ban da san sang.');
          setSelectedSeats([]);
          setCheckoutInfo(null);
          window.clearInterval(intervalId);
        }
      } catch (error) {
        console.error('Khong the cap nhat trang thai booking:', error);
      }
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [paymentInfo, authConfig]);

  const handleSeatClick = code => {
    setErrorMsg('');
    setSelectedSeats(prev =>
      prev.includes(code) ? prev.filter(seat => seat !== code) : [...prev, code]
    );
  };

  const handleBooking = async () => {
    if (selectedSeats.length === 0) {
      setErrorMsg('Vui long chon ghe truoc khi thanh toan.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      setSuccessMsg('');
      setCheckoutInfo(null);
      setPaymentInfo(null);
      setPaymentStatus('');

      const holdResponse = await axios.post(
        `${API_BASE_URL}/bookings/hold`,
        {
          showId: Number(movieId),
          seatCodes: selectedSeats
        },
        authConfig
      );

      const bookingData = holdResponse.data?.data;

      setCheckoutInfo({
        bookingId: bookingData.bookingId,
        amount: bookingData.totalAmount,
        expiresIn: bookingData.expiresIn,
        seatCodes: bookingData.seatCodes
      });
      setPaymentStatus('PENDING');
      setSuccessMsg('Giu ghe thanh cong. Hay chon cach thanh toan phu hop.');
      setSelectedSeats([]);
      await fetchSeatMap();
    } catch (err) {
      console.error('Khong the tao checkout:', err);
      setErrorMsg(
        err.response?.data?.message || 'Khong the giu ghe hoac tao checkout luc nay.'
      );
      await fetchSeatMap().catch(refreshError => {
        console.error('Khong the lam moi so do ghe sau khi dat that bai:', refreshError);
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChoosePaymentMethod = async method => {
    if (!checkoutInfo?.bookingId) return;

    try {
      setLoadingPaymentMethod(method);
      setErrorMsg('');
      setSuccessMsg('');

      const endpoint =
        method === 'ONLINE' ? '/payments/qr' : '/payments/counter-bill';

      const response = await axios.post(
        `${API_BASE_URL}${endpoint}`,
        { bookingId: checkoutInfo.bookingId },
        authConfig
      );

      setPaymentInfo({
        ...response.data.data,
        expiresIn: checkoutInfo.expiresIn
      });
      setPaymentStatus(response.data.data.status || 'PENDING');

      if (method === 'ONLINE') {
        setSuccessMsg('Ma QR da san sang. Sau khi chuyen khoan thanh cong, he thong se tu dong xuat bill.');
      } else {
        setSuccessMsg('Bill thanh toan tai quay da duoc tao. Ban co the mang bill nay den quay de thanh toan.');
      }
    } catch (error) {
      console.error('Khong the tai phuong thuc thanh toan:', error);
      setErrorMsg(
        error.response?.data?.message || 'Khong the tai thong tin thanh toan luc nay.'
      );
    } finally {
      setLoadingPaymentMethod('');
    }
  };

  const handleCopyValue = async value => {
    try {
      await navigator.clipboard.writeText(String(value || ''));
      setSuccessMsg('Da sao chep thong tin thanh toan.');
    } catch (error) {
      console.error('Khong the sao chep thong tin:', error);
      setErrorMsg('Khong the sao chep thong tin thanh toan.');
    }
  };

  const renderPaymentMethodSelection = () => {
    if (!checkoutInfo) return null;

    return (
      <div className="w-full rounded-3xl border border-gray-800 bg-[#151515] p-6 shadow-2xl">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Thanh toan</p>
            <h2 className="mt-2 text-2xl font-bold">Chon cach thanh toan cho booking #{checkoutInfo.bookingId}</h2>
            <p className="mt-2 text-sm text-gray-400">
              Ghe {checkoutInfo.seatCodes.join(', ')} dang duoc giu trong {formatCountdown(holdCountdown)}.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Tong thanh toan</p>
            <p className="mt-2 text-2xl font-black">{formatCurrency(checkoutInfo.amount)}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <button
            type="button"
            onClick={() => handleChoosePaymentMethod('ONLINE')}
            disabled={loadingPaymentMethod !== ''}
            className="rounded-3xl border border-red-500/30 bg-gradient-to-br from-red-600/15 via-red-500/5 to-transparent p-5 text-left transition hover:border-red-400 hover:bg-red-500/10 disabled:opacity-60"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-red-500/15 p-3 text-red-300">
                {loadingPaymentMethod === 'ONLINE' ? <Loader2 className="animate-spin" /> : <QrCode />}
              </div>
              <div>
                <p className="text-lg font-bold">Thanh toan truc tuyen</p>
                <p className="text-sm text-gray-400">Hien QR ngan hang va tu dong cap nhat khi da chuyen khoan.</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleChoosePaymentMethod('COUNTER')}
            disabled={loadingPaymentMethod !== ''}
            className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/15 via-amber-400/5 to-transparent p-5 text-left transition hover:border-amber-400 hover:bg-amber-500/10 disabled:opacity-60"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-500/15 p-3 text-amber-200">
                {loadingPaymentMethod === 'COUNTER' ? <Loader2 className="animate-spin" /> : <Store />}
              </div>
              <div>
                <p className="text-lg font-bold">Thanh toan tai quay</p>
                <p className="text-sm text-gray-400">Xuat bill voi thong tin can thanh toan de mang den quay.</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  };

  const renderBill = () => {
    if (!paymentInfo) return null;

    return (
      <div className="w-full rounded-3xl border border-gray-800 bg-[#151515] p-6 shadow-2xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Bill thanh toan</p>
            <h2 className="mt-2 flex items-center gap-2 text-2xl font-bold">
              {paymentInfo.paymentMethod === 'ONLINE' ? (
                <QrCode size={22} className="text-red-400" />
              ) : (
                <Receipt size={22} className="text-amber-300" />
              )}
              {paymentInfo.paymentMethod === 'ONLINE' ? 'Thanh toan truc tuyen' : 'Thanh toan tai quay'}
            </h2>
            <p className="mt-2 text-sm text-gray-400">{paymentInfo.note}</p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                paymentStatus === 'COMPLETED'
                  ? 'bg-emerald-500/15 text-emerald-200'
                  : 'bg-amber-500/15 text-amber-200'
              }`}
            >
              {paymentStatus || paymentInfo.status || 'PENDING'}
            </span>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <Printer size={16} />
              In bill
            </button>
          </div>
        </div>

        {paymentInfo.paymentMethod === 'ONLINE' && (
          <div className="mt-6 rounded-3xl border border-red-500/20 bg-gradient-to-br from-red-500/10 via-white/0 to-black/20 p-6">
            <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
              <div className="space-y-4">
                <div className="rounded-3xl bg-white p-4 shadow-xl">
                  <img
                    src={paymentInfo.qrCodeUrl}
                    alt={`QR thanh toan booking ${paymentInfo.bookingId}`}
                    className="w-full rounded-2xl"
                  />
                </div>

                <div className="rounded-2xl border border-red-500/20 bg-black/30 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-red-200/70">Thoi gian giu ghe</p>
                  <p className="mt-2 text-3xl font-black text-red-300">{formatCountdown(holdCountdown)}</p>
                  <p className="mt-2 text-sm text-gray-400">
                    Hoan tat chuyen khoan truoc khi het gio de tranh bi nha ghe.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Huong dan thanh toan</p>
                  <div className="mt-3 space-y-2 text-sm text-gray-300">
                    <p>1. Mo ung dung ngan hang va quet dung ma QR ben trai.</p>
                    <p>2. Kiem tra so tien va noi dung chuyen khoan ben duoi.</p>
                    <p>3. Sau khi thanh toan, he thong se tu dong cap nhat trang thai.</p>
                  </div>
                </div>

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
                      <p className="mt-2 text-xl font-black">{paymentInfo.accountNo}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyValue(paymentInfo.accountNo)}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold transition hover:bg-white/10"
                    >
                      <Copy size={16} />
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
                      onClick={() => handleCopyValue(paymentInfo.accountName)}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold transition hover:bg-white/10"
                    >
                      <Copy size={16} />
                      Sao chep
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-red-200/70">Noi dung chuyen khoan</p>
                      <p className="mt-2 text-lg font-black text-red-300">{paymentInfo.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyValue(paymentInfo.description)}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-400/20 bg-black/20 px-4 py-2 text-sm font-semibold transition hover:bg-black/30"
                    >
                      <Copy size={16} />
                      Sao chep
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[220px,1fr]">
          <div className="space-y-4">
            {paymentInfo.paymentMethod !== 'ONLINE' ? (
              <div className="flex h-[220px] items-center justify-center rounded-2xl border border-dashed border-amber-500/30 bg-amber-500/5 p-6 text-center">
                <div>
                  <Banknote className="mx-auto text-amber-300" size={34} />
                  <p className="mt-4 text-sm text-amber-100">Thanh toan tai quay</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-amber-200/70">
                    Dua ma booking cho nhan vien khi thanh toan
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Thanh toan truc tuyen</p>
                <p className="mt-2 text-sm text-gray-300">
                  Giao dien nay dang dung chinh ma QR do backend tra ve tu `payment.controller`.
                </p>
              </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Booking</p>
              <p className="mt-2 text-lg font-bold">#{paymentInfo.bookingId}</p>
            </div>

            {paymentInfo.paymentMethod === 'ONLINE' && (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Noi dung chuyen khoan</p>
                <p className="mt-2 text-lg font-bold text-red-300">{paymentInfo.description}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Khach hang</p>
                <p className="mt-2 text-lg font-bold">{paymentInfo.customerName}</p>
                <p className="mt-1 text-sm text-gray-400">{paymentInfo.customerEmail}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Tong thanh toan</p>
                <p className="mt-2 text-2xl font-black">{formatCurrency(paymentInfo.amount)}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Thong tin suat chieu</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-400">Phim</p>
                  <p className="font-semibold">{paymentInfo.movieName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Phong</p>
                  <p className="font-semibold">{paymentInfo.roomName || 'Dang cap nhat'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Gio chieu</p>
                  <p className="font-semibold">{formatDateTime(paymentInfo.startTime)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Ngay tao bill</p>
                  <p className="font-semibold">{formatDateTime(paymentInfo.createdAt)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Ghe</p>
              <p className="mt-2 text-lg font-bold text-red-300">
                {paymentInfo.seatCodes?.join(', ') || 'Chua co ghe'}
              </p>
            </div>

            {paymentInfo.ticketCodes?.length > 0 && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <p className="flex items-center gap-2 text-sm text-emerald-100">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  Ve da duoc xuat cho booking nay.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {paymentInfo.ticketCodes.map(ticketCode => (
                    <span
                      key={ticketCode}
                      className="rounded-full border border-emerald-500/20 bg-black/20 px-3 py-1 text-xs font-semibold text-emerald-100"
                    >
                      {ticketCode}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {paymentInfo.paymentMethod === 'ONLINE' && paymentStatus !== 'COMPLETED' && (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  He thong dang tu dong kiem tra trang thai thanh toan moi 5 giay.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#111] text-white">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!show) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#111] text-white">
        Khong tim thay du lieu phim.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111] p-10 text-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <img
            src={buildAssetUrl(show.poster_url)}
            className="mb-6 w-full rounded-2xl shadow-2xl"
            alt={show.title}
          />
          <h1 className="text-3xl font-bold uppercase">{show.title}</h1>
          <p className="mt-4 text-sm leading-relaxed text-gray-400">{show.description}</p>
        </div>

        <div className="flex flex-col items-center gap-6 lg:col-span-2">
          {errorMsg && (
            <div className="w-full rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="w-full rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              {successMsg}
            </div>
          )}

          <SeatMatrix
            seatsData={seats}
            selectedSeats={selectedSeats}
            onSeatSelect={handleSeatClick}
          />

          <div className="w-full rounded-2xl border border-gray-800 bg-[#151515] px-4 py-3 text-sm text-gray-300">
            Ghe trong hien mau xam. Ghe da giu hoac da ban hien mau do va khong the chon.
          </div>

          <div className="mt-2 flex w-full flex-col gap-4 rounded-2xl border border-gray-800 bg-[#1a1a1a] p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-gray-500">Ghe da chon</p>
              <p className="font-mono text-xl text-red-500">
                {selectedSeats.join(', ') || 'Chua chon'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase text-gray-500">Tong tam tinh</p>
              <p className="text-2xl font-black">
                {(selectedSeats.length * show.price).toLocaleString()}d
              </p>
            </div>
            <button
              onClick={handleBooking}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-8 py-4 font-bold transition-all hover:bg-red-500 disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <CreditCard size={20} />}
              {isSubmitting ? 'DANG TAO DON THANH TOAN' : 'TIEP TUC THANH TOAN'}
            </button>
          </div>

          {renderPaymentMethodSelection()}
          {renderBill()}
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;
