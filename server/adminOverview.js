const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const bookingStatuses = ['new', 'contacted', 'confirmed', 'cancelled', 'follow-up', 'converted'];
const enquiryStatuses = ['new', 'contacted', 'confirmed', 'cancelled', 'follow-up', 'converted'];

function sourceValue(source) {
  return source?.ok === true
    && Array.isArray(source.value)
    && source.value.every((record) => record !== null && typeof record === 'object' && !Array.isArray(record))
    ? source.value
    : null;
}

function countStatuses(records, statuses) {
  return Object.fromEntries(statuses.map((status) => [
    status,
    records.filter((record) => record.status === status).length,
  ]));
}

function unreadState(enquiry) {
  const states = [];
  if (typeof enquiry.unread === 'boolean') states.push(enquiry.unread);
  if (typeof enquiry.isRead === 'boolean') states.push(!enquiry.isRead);
  if (typeof enquiry.read === 'boolean') states.push(!enquiry.read);
  if (states.length === 0 || states.some((state) => state !== states[0])) return null;
  return states[0];
}

function countUnreadEnquiries(enquiries) {
  if (enquiries.length === 0) return 0;
  const states = enquiries.map(unreadState);
  if (states.some((state) => state === null)) return null;
  return states.filter(Boolean).length;
}

function createMonthlyTrends(records, now) {
  const months = [];
  const currentMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  for (let offset = 11; offset >= 0; offset -= 1) {
    const date = new Date(Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth() - offset, 1));
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    months.push({ key, month: `${monthLabels[date.getUTCMonth()]} ${date.getUTCFullYear()}`, bookings: 0, enquiries: 0 });
  }

  const monthByKey = new Map(months.map((month) => [month.key, month]));
  for (const record of records) {
    const timestamp = record.createdAt || record.timestamp;
    if (!timestamp) continue;
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) continue;
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    const month = monthByKey.get(key);
    if (month) {
      if (record.type === 'enquiry') month.enquiries += 1;
      else month.bookings += 1;
    }
  }

  return months;
}

export function projectAdminOverview(sources, now = new Date()) {
  const motorcycles = sourceValue(sources.motorcycles);
  const records = sourceValue(sources.bookings);
  const serviceVideos = sourceValue(sources.serviceVideos);
  const socialPosts = sourceValue(sources.socialPosts);
  const reviews = sourceValue(sources.reviews);
  const activity = sourceValue(sources.activity);

  const bookings = records?.filter((record) => record.type !== 'enquiry') ?? null;
  const enquiries = records?.filter((record) => record.type === 'enquiry') ?? null;
  const publishedSocialPosts = socialPosts?.filter((post) => post.status === 'published' || post.published === true) ?? null;
  const recent = (items) => items?.slice().sort((a, b) => {
    const aTime = new Date(a.createdAt || a.timestamp || 0).getTime();
    const bTime = new Date(b.createdAt || b.timestamp || 0).getTime();
    return bTime - aTime;
  }).slice(0, 5) ?? null;

  const sourceStatus = Object.fromEntries(Object.entries(sources).map(([name, source]) => [
    name,
    sourceValue(source) ? 'available' : 'unavailable',
  ]));

  return {
    sourceStatus,
    totalMotorcycles: motorcycles?.length ?? null,
    totalBookings: bookings?.length ?? null,
    totalEnquiries: enquiries?.length ?? null,
    pendingBookings: null,
    confirmedBookings: bookings ? bookings.filter((record) => record.status === 'confirmed').length : null,
    completedBookings: null,
    unreadEnquiries: enquiries ? countUnreadEnquiries(enquiries) : null,
    totalReviews: reviews?.length ?? null,
    publishedSocialPosts: publishedSocialPosts?.length ?? null,
    totalServiceVideos: serviceVideos?.length ?? null,
    bookingStatusCounts: bookings ? countStatuses(bookings, bookingStatuses) : null,
    enquiryStatusCounts: enquiries ? countStatuses(enquiries, enquiryStatuses) : null,
    monthlyTrends: records ? createMonthlyTrends(records, now) : null,
    recentBookings: bookings ? recent(bookings) : null,
    recentEnquiries: enquiries ? recent(enquiries) : null,
    recentActivity: activity
      ? activity
        .filter((entry) => entry.id !== 'act-init' && entry.action !== 'SYSTEM_START')
        .slice()
        .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
        .slice(0, 6)
      : null,
  };
}
