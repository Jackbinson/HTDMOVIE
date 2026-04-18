const pool = require('../../config/database');
const logger = require('../utils/logger');
const {
  createManagementReportPage,
  getNotionConfig
} = require('./notion.client');

const DEFAULT_PERIOD_DAYS = 7;
const MAX_PERIOD_DAYS = 90;

const parsePeriodDays = value => {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return DEFAULT_PERIOD_DAYS;
  }

  return Math.min(parsed, MAX_PERIOD_DAYS);
};

const normalizeNumber = value => Number(value || 0);

const formatPercent = value => `${(normalizeNumber(value) * 100).toFixed(1)}%`;

const buildInsightItems = overview => {
  const insights = [];
  const {
    kpis,
    bookingStatus,
    topMovies,
    upcomingShows,
    period: { days }
  } = overview;

  const completionRate = normalizeNumber(kpis.booking_completion_rate);
  const failedRate = normalizeNumber(bookingStatus.failed_rate);
  const revenueGrowth = normalizeNumber(kpis.revenue_growth_rate);
  const topMovie = topMovies[0];
  const highestOccupancyShow = [...upcomingShows]
    .sort((left, right) => normalizeNumber(right.occupancy_rate) - normalizeNumber(left.occupancy_rate))[0];
  const lowestOccupancyShow = [...upcomingShows]
    .sort((left, right) => normalizeNumber(left.occupancy_rate) - normalizeNumber(right.occupancy_rate))[0];

  if (completionRate < 0.75) {
    insights.push({
      level: 'warning',
      title: 'Ty le hoan tat booking dang thap',
      detail: `Trong ${days} ngay gan nhat, ty le booking thanh cong moi dat ${formatPercent(completionRate)}. Nen kiem tra lai quy trinh thanh toan va giu ghe.`
    });
  }

  if (failedRate >= 0.1) {
    insights.push({
      level: 'warning',
      title: 'Co dau hieu mat don vi thanh toan that bai',
      detail: `Booking that bai chiem ${formatPercent(failedRate)} tong giao dich. Nen doi soat cong thanh toan, timeout va luong retry.`
    });
  }

  if (revenueGrowth > 0.15) {
    insights.push({
      level: 'positive',
      title: 'Doanh thu dang tang tot',
      detail: `Doanh thu da tang ${formatPercent(revenueGrowth)} so voi giai doan truoc. Co the day manh them phim dang co luc keo khach.`
    });
  }

  if (revenueGrowth < -0.1) {
    insights.push({
      level: 'warning',
      title: 'Doanh thu dang giam so voi ky truoc',
      detail: `Doanh thu giam ${Math.abs(revenueGrowth * 100).toFixed(1)}% so voi ${days} ngay truoc do. Nen xem lai lich chieu, gia ve va kenh quang ba.`
    });
  }

  if (topMovie && normalizeNumber(topMovie.completed_bookings) >= 3) {
    insights.push({
      level: 'info',
      title: 'Phim dang dan dau ve chuyen doi',
      detail: `${topMovie.movie_name} hien co ${topMovie.completed_bookings} booking thanh cong, doanh thu ${normalizeNumber(topMovie.revenue).toLocaleString('vi-VN')} VND.`
    });
  }

  if (highestOccupancyShow && normalizeNumber(highestOccupancyShow.occupancy_rate) >= 0.7) {
    insights.push({
      level: 'positive',
      title: 'Mot so suat chieu dang gan day cho',
      detail: `${highestOccupancyShow.movie_name} luc ${highestOccupancyShow.start_time} da dat ${formatPercent(highestOccupancyShow.occupancy_rate)} suc chua phong ${highestOccupancyShow.room_name}.`
    });
  }

  if (lowestOccupancyShow && normalizeNumber(lowestOccupancyShow.occupancy_rate) <= 0.2) {
    insights.push({
      level: 'info',
      title: 'Co suat chieu can kich cau som',
      detail: `${lowestOccupancyShow.movie_name} luc ${lowestOccupancyShow.start_time} moi dat ${formatPercent(lowestOccupancyShow.occupancy_rate)} suc chua. Nen can nhac uu dai hoac day noi dung.`
    });
  }

  if (insights.length === 0) {
    insights.push({
      level: 'info',
      title: 'He thong chua ghi nhan bat thuong lon',
      detail: `Du lieu ${days} ngay gan nhat dang o muc on dinh. Co the tiep tuc theo doi them doanh thu, cong suat phong va ty le thanh toan.`
    });
  }

  return insights.slice(0, 5);
};

const buildMarkdownReport = overview => {
  const { period, kpis, bookingStatus, topMovies, loyalCustomers, upcomingShows, insights } = overview;
  const lines = [
    `# Bao cao tro ly quan ly HTDMOVIE`,
    '',
    `- Khoang du lieu: ${period.startDate} den ${period.endDate}`,
    `- So ngay phan tich: ${period.days}`,
    '',
    '## Tong quan KPI',
    `- Doanh thu hoan tat: ${normalizeNumber(kpis.current_revenue).toLocaleString('vi-VN')} VND`,
    `- Tong booking: ${normalizeNumber(kpis.current_total_bookings).toLocaleString('vi-VN')}`,
    `- Booking thanh cong: ${normalizeNumber(kpis.current_completed_bookings).toLocaleString('vi-VN')}`,
    `- Ty le hoan tat: ${formatPercent(kpis.booking_completion_rate)}`,
    `- Bien dong doanh thu: ${(normalizeNumber(kpis.revenue_growth_rate) * 100).toFixed(1)}%`,
    '',
    '## Trang thai booking',
    `- COMPLETED: ${normalizeNumber(bookingStatus.completed_count)}`,
    `- PENDING: ${normalizeNumber(bookingStatus.pending_count)}`,
    `- FAILED: ${normalizeNumber(bookingStatus.failed_count)}`,
    `- CANCELLED: ${normalizeNumber(bookingStatus.cancelled_count)}`,
    '',
    '## Goi y hanh dong'
  ];

  insights.forEach((item, index) => {
    lines.push(`${index + 1}. [${item.level.toUpperCase()}] ${item.title}: ${item.detail}`);
  });

  lines.push('', '## Top phim theo doanh thu');

  if (topMovies.length === 0) {
    lines.push('- Chua co du lieu phim trong giai doan nay.');
  } else {
    topMovies.forEach(movie => {
      lines.push(
        `- ${movie.movie_name}: ${normalizeNumber(movie.completed_bookings)} booking thanh cong, ${normalizeNumber(movie.revenue).toLocaleString('vi-VN')} VND`
      );
    });
  }

  lines.push('', '## Khach hang noi bat');

  if (loyalCustomers.length === 0) {
    lines.push('- Chua co du lieu khach hang noi bat.');
  } else {
    loyalCustomers.forEach(customer => {
      lines.push(
        `- ${customer.full_name || customer.username}: ${normalizeNumber(customer.total_transactions)} giao dich, ${normalizeNumber(customer.total_spent).toLocaleString('vi-VN')} VND`
      );
    });
  }

  lines.push('', '## Suat chieu sap toi');

  if (upcomingShows.length === 0) {
    lines.push('- Khong co suat chieu sap toi trong 72 gio.');
  } else {
    upcomingShows.forEach(show => {
      lines.push(
        `- ${show.movie_name} | ${show.start_time} | ${show.room_name} | lap day ${formatPercent(show.occupancy_rate)}`
      );
    });
  }

  return lines.join('\n');
};

const loadManagementOverview = async days => {
  const overviewQuery = `
    WITH current_period AS (
      SELECT
        COALESCE(SUM(CASE WHEN payment_status = 'COMPLETED' THEN total_amount ELSE 0 END), 0) AS revenue,
        COUNT(*) AS total_bookings,
        COUNT(*) FILTER (WHERE payment_status = 'COMPLETED') AS completed_bookings
      FROM bookings
      WHERE created_at >= NOW() - ($1::int * INTERVAL '1 day')
    ),
    previous_period AS (
      SELECT
        COALESCE(SUM(CASE WHEN payment_status = 'COMPLETED' THEN total_amount ELSE 0 END), 0) AS revenue,
        COUNT(*) AS total_bookings,
        COUNT(*) FILTER (WHERE payment_status = 'COMPLETED') AS completed_bookings
      FROM bookings
      WHERE created_at >= NOW() - (($1::int * 2) * INTERVAL '1 day')
        AND created_at < NOW() - ($1::int * INTERVAL '1 day')
    )
    SELECT
      current_period.revenue AS current_revenue,
      current_period.total_bookings AS current_total_bookings,
      current_period.completed_bookings AS current_completed_bookings,
      previous_period.revenue AS previous_revenue,
      previous_period.total_bookings AS previous_total_bookings,
      previous_period.completed_bookings AS previous_completed_bookings,
      CASE
        WHEN current_period.total_bookings = 0 THEN 0
        ELSE current_period.completed_bookings::numeric / current_period.total_bookings
      END AS booking_completion_rate,
      CASE
        WHEN previous_period.revenue = 0 THEN
          CASE WHEN current_period.revenue > 0 THEN 1 ELSE 0 END
        ELSE (current_period.revenue - previous_period.revenue) / previous_period.revenue
      END AS revenue_growth_rate
    FROM current_period, previous_period
  `;

  const bookingStatusQuery = `
    SELECT
      COUNT(*) FILTER (WHERE payment_status = 'COMPLETED') AS completed_count,
      COUNT(*) FILTER (WHERE payment_status = 'PENDING') AS pending_count,
      COUNT(*) FILTER (WHERE payment_status = 'FAILED') AS failed_count,
      COUNT(*) FILTER (WHERE payment_status = 'CANCELLED') AS cancelled_count,
      CASE
        WHEN COUNT(*) = 0 THEN 0
        ELSE COUNT(*) FILTER (WHERE payment_status = 'FAILED')::numeric / COUNT(*)
      END AS failed_rate
    FROM bookings
    WHERE created_at >= NOW() - ($1::int * INTERVAL '1 day')
  `;

  const topMoviesQuery = `
    SELECT
      s.id,
      s.movie_name,
      COUNT(*) FILTER (WHERE b.payment_status = 'COMPLETED') AS completed_bookings,
      COALESCE(SUM(CASE WHEN b.payment_status = 'COMPLETED' THEN b.total_amount ELSE 0 END), 0) AS revenue
    FROM shows s
    LEFT JOIN bookings b
      ON b.show_id = s.id
     AND b.created_at >= NOW() - ($1::int * INTERVAL '1 day')
    GROUP BY s.id, s.movie_name
    HAVING COUNT(b.id) > 0
    ORDER BY revenue DESC, completed_bookings DESC, s.movie_name ASC
    LIMIT 5
  `;

  const loyalCustomersQuery = `
    SELECT
      u.id,
      u.username,
      u.full_name,
      COUNT(b.id) FILTER (WHERE b.payment_status = 'COMPLETED') AS total_transactions,
      COALESCE(SUM(CASE WHEN b.payment_status = 'COMPLETED' THEN b.total_amount ELSE 0 END), 0) AS total_spent
    FROM users u
    JOIN bookings b ON b.user_id = u.id
    WHERE b.created_at >= NOW() - ($1::int * INTERVAL '1 day')
    GROUP BY u.id, u.username, u.full_name
    ORDER BY total_spent DESC, total_transactions DESC, u.id ASC
    LIMIT 5
  `;

  const upcomingShowsQuery = `
    SELECT
      s.id,
      s.movie_name,
      to_char(s.start_time, 'YYYY-MM-DD HH24:MI') AS start_time,
      r.name AS room_name,
      r.total_seats,
      COUNT(t.id) AS sold_tickets,
      CASE
        WHEN COALESCE(r.total_seats, 0) = 0 THEN 0
        ELSE COUNT(t.id)::numeric / r.total_seats
      END AS occupancy_rate
    FROM shows s
    LEFT JOIN rooms r ON r.id = s.room_id
    LEFT JOIN tickets t ON t.show_id = s.id
    WHERE s.start_time BETWEEN NOW() AND NOW() + INTERVAL '72 hours'
    GROUP BY s.id, s.movie_name, s.start_time, r.name, r.total_seats
    ORDER BY s.start_time ASC
    LIMIT 5
  `;

  const [overviewResult, bookingStatusResult, topMoviesResult, loyalCustomersResult, upcomingShowsResult] =
    await Promise.all([
      pool.query(overviewQuery, [days]),
      pool.query(bookingStatusQuery, [days]),
      pool.query(topMoviesQuery, [days]),
      pool.query(loyalCustomersQuery, [days]),
      pool.query(upcomingShowsQuery)
    ]);

  const period = {
    days,
    startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10)
  };

  const overview = {
    period,
    kpis: overviewResult.rows[0],
    bookingStatus: bookingStatusResult.rows[0],
    topMovies: topMoviesResult.rows,
    loyalCustomers: loyalCustomersResult.rows,
    upcomingShows: upcomingShowsResult.rows,
    notion: getNotionConfig()
  };

  overview.insights = buildInsightItems(overview);

  return overview;
};

exports.getManagementOverview = async (req, res) => {
  try {
    const days = parsePeriodDays(req.query.days);
    const overview = await loadManagementOverview(days);

    res.status(200).json({
      success: true,
      message: 'Lay tong hop tro ly quan ly thanh cong.',
      data: overview
    });
  } catch (error) {
    logger.error(`Loi lay overview tro ly quan ly: ${error.message}`);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Loi may chu khi tong hop du lieu quan ly.'
    });
  }
};

exports.exportManagementOverviewToNotion = async (req, res) => {
  try {
    const days = parsePeriodDays(req.body?.days || req.query.days);
    const overview = await loadManagementOverview(days);
    const reportTitle =
      req.body?.title?.trim() ||
      `HTDMOVIE Management Report - ${overview.period.endDate}`;
    const markdown = buildMarkdownReport(overview);
    const notionPage = await createManagementReportPage({
      title: reportTitle,
      markdown
    });

    logger.info(
      `User [${req.user.username}] (${req.user.role}) da xuat bao cao quan ly len Notion.`
    );

    res.status(201).json({
      success: true,
      message: 'Da xuat bao cao quan ly len Notion thanh cong.',
      data: {
        title: reportTitle,
        notion_page_id: notionPage.id,
        notion_url: notionPage.url,
        report: overview
      }
    });
  } catch (error) {
    logger.error(`Loi xuat bao cao quan ly len Notion: ${error.message}`);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Loi may chu khi xuat bao cao len Notion.',
      details: error.details || undefined
    });
  }
};
