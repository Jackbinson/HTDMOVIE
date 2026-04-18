import React, { useMemo, useState } from 'react';
import {
  Bot,
  BrainCircuit,
  CalendarRange,
  CircleAlert,
  CircleCheckBig,
  LoaderCircle,
  Sparkles,
  Upload
} from 'lucide-react';

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return `${amount.toLocaleString('vi-VN')}d`;
};

const formatPercent = (value) => `${(Number(value || 0) * 100).toFixed(1)}%`;

const insightTheme = {
  positive: {
    border: 'border-emerald-500/30',
    background: 'bg-emerald-500/10',
    text: 'text-emerald-100',
    icon: CircleCheckBig
  },
  warning: {
    border: 'border-amber-500/30',
    background: 'bg-amber-500/10',
    text: 'text-amber-100',
    icon: CircleAlert
  },
  info: {
    border: 'border-sky-500/30',
    background: 'bg-sky-500/10',
    text: 'text-sky-100',
    icon: Sparkles
  }
};

const ManagementAiPanel = ({
  managementAi,
  loading,
  busy,
  onRefresh,
  onExport,
  role
}) => {
  const [title, setTitle] = useState('');
  const [selectedDays, setSelectedDays] = useState(7);

  const overview = managementAi?.data;
  const notionConfig = overview?.notion;
  const isNotionConfigured = Boolean(notionConfig?.configured);

  React.useEffect(() => {
    if (overview?.period?.days) {
      setSelectedDays(overview.period.days);
    }
  }, [overview?.period?.days]);

  const exportTitle = useMemo(() => {
    if (title.trim()) {
      return title.trim();
    }

    return overview?.period?.endDate
      ? `HTDMOVIE Management Report - ${overview.period.endDate}`
      : 'HTDMOVIE Management Report';
  }, [overview?.period?.endDate, title]);

  const handleExport = () => {
    onExport({
      days: selectedDays,
      title: exportTitle
    });
  };

  if (loading) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-8">
        <div className="flex items-center gap-3 text-gray-300">
          <LoaderCircle className="animate-spin" size={18} />
          Dang phan tich du lieu quan ly...
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-8 text-gray-300">
        Khong co du lieu tro ly quan ly de hien thi.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(127,29,29,0.72),rgba(12,12,14,0.96))]">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.3fr,0.9fr] lg:p-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-red-100">
              <Bot size={14} />
              Management AI
            </div>
            <h2 className="mt-4 text-3xl font-black uppercase tracking-tight md:text-4xl">
              Tro ly dieu hanh cho {role === 'admin' ? 'ban quan tri' : 'doi van hanh'}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-red-50/78 md:text-base">
              He thong tong hop booking, doanh thu, suat chieu va dua ra goi y hanh dong de ban ra quyet dinh nhanh hon.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-red-100/60">Doanh thu</p>
                <p className="mt-3 text-2xl font-black text-white">
                  {formatCurrency(overview.kpis?.current_revenue)}
                </p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-red-100/60">Ty le hoan tat</p>
                <p className="mt-3 text-2xl font-black text-white">
                  {formatPercent(overview.kpis?.booking_completion_rate)}
                </p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-red-100/60">Tang truong</p>
                <p className="mt-3 text-2xl font-black text-white">
                  {(Number(overview.kpis?.revenue_growth_rate || 0) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-red-100/60">Booking thanh cong</p>
                <p className="mt-3 text-2xl font-black text-white">
                  {Number(overview.kpis?.current_completed_bookings || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[26px] border border-white/10 bg-black/30 p-5 backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-gray-300">
              <CalendarRange size={16} />
              Khoang phan tich
            </div>
            <p className="mt-3 text-2xl font-black text-white">
              {overview.period?.days} ngay
            </p>
            <p className="mt-2 text-sm text-gray-300">
              Tu {overview.period?.startDate} den {overview.period?.endDate}
            </p>

            <div className="mt-5">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Moc phan tich</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[7, 14, 30, 60, 90].map((days) => (
                  <button
                    key={days}
                    onClick={() => setSelectedDays(days)}
                    className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                      selectedDays === days
                        ? 'bg-white text-black'
                        : 'border border-white/10 bg-white/5 text-white hover:bg-white/10'
                    }`}
                  >
                    {days} ngay
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-[22px] border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <BrainCircuit size={16} />
                Xuat sang Notion
              </div>
              <p className="mt-2 text-sm leading-6 text-gray-300">
                {isNotionConfigured
                  ? 'Tich hop Notion da san sang. Ban co the tao bao cao va chia se cho doi nhom ngay tai day.'
                  : 'Backend chua co du thong tin Notion. Can them bien moi truong de xuat bao cao.'}
              </p>

              <label className="mt-4 block text-sm font-semibold text-gray-200">
                Tieu de bao cao
              </label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-red-400"
                placeholder="HTDMOVIE Management Report - 2026-04-16"
              />

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => onRefresh(selectedDays)}
                  disabled={busy}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-60"
                >
                  Lam moi insight
                </button>
                <button
                  onClick={handleExport}
                  disabled={busy || !isNotionConfigured}
                  className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Upload size={16} />
                  Xuat len Notion
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">Goi y hanh dong</h3>
              <p className="mt-2 text-sm text-gray-400">
                Cac nhan dinh duoc suy ra tu doanh thu, booking va muc lap day suat chieu.
              </p>
            </div>
            <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs uppercase tracking-[0.18em] text-gray-300">
              {overview.insights?.length || 0} insight
            </span>
          </div>

          <div className="space-y-4">
            {(overview.insights || []).map((item, index) => {
              const theme = insightTheme[item.level] || insightTheme.info;
              const Icon = theme.icon;

              return (
                <div
                  key={`${item.title}-${index}`}
                  className={`rounded-[22px] border p-4 ${theme.border} ${theme.background}`}
                >
                  <div className={`flex items-start gap-3 ${theme.text}`}>
                    <div className="mt-0.5 rounded-full bg-black/20 p-2">
                      <Icon size={16} />
                    </div>
                    <div>
                      <h4 className="font-bold">{item.title}</h4>
                      <p className="mt-1 text-sm leading-6 opacity-90">{item.detail}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">Trang thai booking</h3>
                <p className="mt-2 text-sm text-gray-400">Nhanh de nhin ra diem tac o luong thanh toan.</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[20px] border border-emerald-500/20 bg-emerald-500/10 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/80">Completed</p>
                <p className="mt-3 text-2xl font-black text-emerald-100">
                  {Number(overview.bookingStatus?.completed_count || 0)}
                </p>
              </div>
              <div className="rounded-[20px] border border-amber-500/20 bg-amber-500/10 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-amber-200/80">Pending</p>
                <p className="mt-3 text-2xl font-black text-amber-100">
                  {Number(overview.bookingStatus?.pending_count || 0)}
                </p>
              </div>
              <div className="rounded-[20px] border border-rose-500/20 bg-rose-500/10 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-rose-200/80">Failed</p>
                <p className="mt-3 text-2xl font-black text-rose-100">
                  {Number(overview.bookingStatus?.failed_count || 0)}
                </p>
              </div>
              <div className="rounded-[20px] border border-slate-400/20 bg-slate-400/10 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-200/80">Cancelled</p>
                <p className="mt-3 text-2xl font-black text-slate-100">
                  {Number(overview.bookingStatus?.cancelled_count || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <div className="mb-5">
              <h3 className="text-2xl font-bold">Cau hinh Notion</h3>
              <p className="mt-2 text-sm text-gray-400">Trang thai ket noi de doi van hanh kiem tra nhanh.</p>
            </div>

            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                <span>Trang thai</span>
                <span className={isNotionConfigured ? 'text-emerald-300' : 'text-amber-300'}>
                  {isNotionConfigured ? 'San sang' : 'Chua cau hinh'}
                </span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Parent Page</p>
                <p className="mt-2 break-all">{notionConfig?.parentPageId || '--'}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Data Source</p>
                <p className="mt-2 break-all">{notionConfig?.dataSourceId || '--'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">Top phim theo doanh thu</h3>
              <p className="mt-2 text-sm text-gray-400">Phim dang tao dong tien tot nhat trong khoang da chon.</p>
            </div>
          </div>

          <div className="space-y-3">
            {(overview.topMovies || []).length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-white/10 bg-black/20 px-4 py-6 text-sm text-gray-400">
                Chua co du lieu phim noi bat trong khoang thoi gian nay.
              </div>
            ) : (
              (overview.topMovies || []).map((movie, index) => (
                <div
                  key={`${movie.id}-${index}`}
                  className="flex items-center justify-between rounded-[22px] border border-white/10 bg-black/25 px-4 py-4"
                >
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-red-200/70">
                      Hang {index + 1}
                    </p>
                    <h4 className="mt-2 font-bold text-white">{movie.movie_name}</h4>
                    <p className="mt-1 text-sm text-gray-400">
                      {Number(movie.completed_bookings || 0)} booking thanh cong
                    </p>
                  </div>
                  <p className="text-right text-lg font-black text-red-200">
                    {formatCurrency(movie.revenue)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">Suat chieu sap toi</h3>
              <p className="mt-2 text-sm text-gray-400">Theo doi muc lap day de kip dieu chinh truyen thong va nhan su.</p>
            </div>
          </div>

          <div className="space-y-3">
            {(overview.upcomingShows || []).length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-white/10 bg-black/20 px-4 py-6 text-sm text-gray-400">
                Chua co suat chieu sap toi trong 72 gio de phan tich.
              </div>
            ) : (
              (overview.upcomingShows || []).map((show, index) => (
                <div
                  key={`${show.id}-${index}`}
                  className="rounded-[22px] border border-white/10 bg-black/25 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-white">{show.movie_name}</h4>
                      <p className="mt-2 text-sm text-gray-400">{show.start_time}</p>
                      <p className="mt-1 text-sm text-gray-400">{show.room_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Lap day</p>
                      <p className="mt-2 text-xl font-black text-white">
                        {formatPercent(show.occupancy_rate)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ManagementAiPanel;
