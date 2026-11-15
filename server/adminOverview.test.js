import test from 'node:test';
import assert from 'node:assert/strict';
import { projectAdminOverview } from './adminOverview.js';

const successful = (value) => ({ ok: true, value });

test('confirmed empty sources return zero counts and twelve zero-filled months', () => {
  const overview = projectAdminOverview({
    motorcycles: successful([]),
    bookings: successful([]),
    serviceVideos: successful([]),
    socialPosts: successful([]),
    reviews: successful([]),
    activity: successful([]),
  }, new Date('2026-11-15T12:00:00.000Z'));

  assert.equal(overview.totalMotorcycles, 0);
  assert.equal(overview.totalBookings, 0);
  assert.equal(overview.totalEnquiries, 0);
  assert.equal(overview.monthlyTrends.length, 12);
  assert.ok(overview.monthlyTrends.every((month) => month.bookings === 0 && month.enquiries === 0));
});

test('failed or missing sources remain unavailable instead of becoming zero', () => {
  const overview = projectAdminOverview({
    motorcycles: { ok: false },
    bookings: successful([]),
    serviceVideos: { ok: false },
    socialPosts: successful([]),
    reviews: successful([]),
    activity: successful([]),
  });

  assert.equal(overview.totalMotorcycles, null);
  assert.equal(overview.totalServiceVideos, null);
  assert.equal(overview.sourceStatus.motorcycles, 'unavailable');
  assert.equal(overview.monthlyTrends.length, 12);
});

test('uses explicit booking/enquiry statuses and unread flags without inferring aliases', () => {
  const overview = projectAdminOverview({
    motorcycles: successful([]),
    bookings: successful([
      { reference: 'b-new', status: 'new', createdAt: '2026-11-02T00:00:00Z' },
      { reference: 'b-pending', status: 'pending', createdAt: '2026-11-03T00:00:00Z' },
      { reference: 'b-completed', status: 'completed', createdAt: '2026-11-04T00:00:00Z' },
      { reference: 'e-unread', type: 'enquiry', status: 'new', unread: true, createdAt: '2026-11-05T00:00:00Z' },
    ]),
    serviceVideos: successful([]),
    socialPosts: successful([{ status: 'published' }, { status: 'draft' }]),
    reviews: successful([]),
    activity: successful([{ id: 'act-init', action: 'SYSTEM_START' }, { id: 'act-real', action: 'CREATE' }]),
  }, new Date('2026-11-15T12:00:00.000Z'));

  assert.equal(overview.pendingBookings, null);
  assert.equal(overview.completedBookings, null);
  assert.equal(overview.confirmedBookings, 0);
  assert.equal(overview.unreadEnquiries, 1);
  assert.equal(overview.publishedSocialPosts, 1);
  assert.deepEqual(overview.recentActivity.map((item) => item.id), ['act-real']);
  assert.equal(overview.monthlyTrends.at(-1).bookings, 3);
  assert.equal(overview.monthlyTrends.at(-1).enquiries, 1);
});

test('returns a twelve-month series and orders recent records by date', () => {
  const overview = projectAdminOverview({
    motorcycles: successful([]),
    bookings: successful([
      { reference: 'older', createdAt: '2026-03-01T00:00:00Z' },
      { reference: 'newer', createdAt: '2026-11-01T00:00:00Z' },
    ]),
    serviceVideos: successful([]),
    socialPosts: successful([]),
    reviews: successful([]),
    activity: successful([]),
  }, new Date('2026-11-15T12:00:00.000Z'));

  assert.equal(overview.monthlyTrends.length, 12);
  assert.deepEqual(overview.recentBookings.map((record) => record.reference), ['newer', 'older']);
});

test('does not zero-fill trends when the booking source failed', () => {
  const overview = projectAdminOverview({
    motorcycles: successful([]),
    bookings: { ok: false },
    serviceVideos: successful([]),
    socialPosts: successful([]),
    reviews: successful([]),
    activity: successful([]),
  });

  assert.equal(overview.monthlyTrends, null);
});

test('analytics inputs distinguish a failed booking read from a confirmed empty read', () => {
  const otherSources = {
    motorcycles: successful([]),
    serviceVideos: successful([]),
    socialPosts: successful([]),
    reviews: successful([]),
    activity: successful([]),
  };
  const unavailable = projectAdminOverview({
    ...otherSources,
    bookings: { ok: false },
  });
  const confirmedEmpty = projectAdminOverview({
    ...otherSources,
    bookings: successful([]),
  });

  assert.equal(unavailable.totalBookings, null);
  assert.equal(unavailable.monthlyTrends, null);
  assert.equal(confirmedEmpty.totalBookings, 0);
  assert.equal(confirmedEmpty.monthlyTrends.length, 12);
  assert.ok(confirmedEmpty.monthlyTrends.every((month) => month.bookings === 0 && month.enquiries === 0));
});

test('does not report unread enquiries when any record lacks explicit read state', () => {
  const overview = projectAdminOverview({
    motorcycles: successful([]),
    bookings: successful([
      { type: 'enquiry', unread: true },
      { type: 'enquiry' },
    ]),
    serviceVideos: successful([]),
    socialPosts: successful([]),
    reviews: successful([]),
    activity: successful([]),
  });

  assert.equal(overview.totalEnquiries, 2);
  assert.equal(overview.unreadEnquiries, null);
});

test('malformed source entries make only their source unavailable', () => {
  const overview = projectAdminOverview({
    motorcycles: successful([]),
    bookings: successful([null]),
    serviceVideos: successful([]),
    socialPosts: successful([]),
    reviews: successful([]),
    activity: successful([]),
  });

  assert.equal(overview.sourceStatus.bookings, 'unavailable');
  assert.equal(overview.totalBookings, null);
  assert.equal(overview.totalMotorcycles, 0);
});

test('malformed source arrays are unavailable without changing other source results', () => {
  const overview = projectAdminOverview({
    motorcycles: successful([]),
    bookings: successful({ records: [] }),
    serviceVideos: successful([]),
    socialPosts: successful([null]),
    reviews: successful([]),
    activity: successful([]),
  });

  assert.equal(overview.sourceStatus.bookings, 'unavailable');
  assert.equal(overview.totalBookings, null);
  assert.equal(overview.monthlyTrends, null);
  assert.equal(overview.sourceStatus.socialPosts, 'unavailable');
  assert.equal(overview.publishedSocialPosts, null);
  assert.equal(overview.totalMotorcycles, 0);
  assert.equal(overview.totalReviews, 0);
});

test('unread count requires consistent explicit read-state signals', () => {
  const consistent = projectAdminOverview({
    motorcycles: successful([]),
    bookings: successful([
      { type: 'enquiry', unread: true, isRead: false, read: false },
      { type: 'enquiry', unread: false, isRead: true, read: true },
    ]),
    serviceVideos: successful([]),
    socialPosts: successful([]),
    reviews: successful([]),
    activity: successful([]),
  });
  const conflicting = projectAdminOverview({
    motorcycles: successful([]),
    bookings: successful([
      { type: 'enquiry', unread: true, isRead: true },
    ]),
    serviceVideos: successful([]),
    socialPosts: successful([]),
    reviews: successful([]),
    activity: successful([]),
  });

  assert.equal(consistent.totalEnquiries, 2);
  assert.equal(consistent.unreadEnquiries, 1);
  assert.equal(conflicting.totalEnquiries, 1);
  assert.equal(conflicting.unreadEnquiries, null);
});
