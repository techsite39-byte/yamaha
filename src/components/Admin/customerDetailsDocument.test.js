import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createBookingDetailsDocument,
  createEnquiryDetailsDocument,
  createGalleryDetailsDocument,
  createHomeSlideDetailsDocument,
  createMediaDetailsDocument,
  createReviewDetailsDocument,
  createVideoDetailsDocument,
  createWebsiteSectionDetailsDocument,
  createWebsiteContentDetailsDocument,
} from './customerDetailsDocument.js';

test('booking detail document escapes customer input and shows available details', () => {
  const document = createBookingDetailsDocument({
    reference: 'VM-123',
    customer: { name: '<img src=x onerror=alert(1)>', email: 'rider@example.com' },
    model: 'Yamaha R15',
    status: 'confirmed',
    appointmentDate: '2026-11-20',
    appointmentTime: '10:00',
  });

  assert.match(document, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(document, /<img src=x onerror=alert\(1\)>/);
  assert.match(document, /rider@example\.com/);
  assert.match(document, /Yamaha R15/);
  assert.match(document, /2026-11-20 · 10:00/);
  assert.match(document, /Content-Security-Policy/);
  assert.doesNotMatch(document, /<script\b/i);
});

test('booking detail document labels missing values without inventing customer data', () => {
  const document = createBookingDetailsDocument({});

  assert.match(document, /Customer<\/dt><dd>Not provided<\/dd>/);
  assert.match(document, /Email<\/dt><dd>Not provided<\/dd>/);
  assert.match(document, /Flexible/);
});

test('enquiry detail document escapes customer input and includes their enquiry message', () => {
  const document = createEnquiryDetailsDocument({
    reference: 'ENQ-456',
    customer: { name: 'Rider', phone: '9876543210' },
    motorcycle: { model: 'Yamaha MT-15' },
    message: '<script>alert(1)</script>',
    status: 'new',
  });

  assert.match(document, /Customer enquiry/);
  assert.match(document, /Yamaha MT-15/);
  assert.match(document, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(document, /<script>alert\(1\)<\/script>/);
});

test('review detail document escapes comments and includes rating and publication status', () => {
  const document = createReviewDetailsDocument({
    id: 'review-7',
    name: 'Rider',
    rating: 5,
    bikeModel: 'Yamaha R15',
    comment: '<img src=x onerror=alert(1)>',
    published: true,
  });

  assert.match(document, /5 \/ 5/);
  assert.match(document, /Yamaha R15/);
  assert.match(document, /Published/);
  assert.match(document, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(document, /<img src=x onerror=alert\(1\)>/);
});

test('gallery detail document renders safe image previews and escapes gallery text', () => {
  const document = createGalleryDetailsDocument({
    id: 'gallery-4',
    title: '<script>alert(1)</script>',
    category: 'Showroom',
    imageUrl: '/imgs/showroom.jpg',
    altText: 'New showroom',
    featured: true,
  });

  assert.match(document, /src="\/imgs\/showroom\.jpg"/);
  assert.match(document, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(document, /Featured/);
  assert.doesNotMatch(document, /<script>alert\(1\)<\/script>/);
});

test('gallery detail document does not embed unsafe image protocols', () => {
  const document = createGalleryDetailsDocument({
    title: 'Unsupported image',
    imageUrl: 'javascript:alert(1)',
  });

  assert.match(document, /Image preview unavailable/);
  assert.doesNotMatch(document, /<img\b/);
});

test('video detail document provides a safe player and escapes video metadata', () => {
  const document = createVideoDetailsDocument({
    id: 'video-3',
    title: '<script>alert(1)</script>',
    category: 'Maintenance',
    path: '/videos/service.mp4',
    description: 'Oil change guide',
    duration: '3:45',
  });

  assert.match(document, /<video src="\/videos\/service\.mp4" controls/);
  assert.match(document, /Oil change guide/);
  assert.match(document, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(document, /<script>alert\(1\)<\/script>/);
});

test('video detail document rejects unsafe media protocols', () => {
  const document = createVideoDetailsDocument({ title: 'Bad media', path: 'javascript:alert(1)' });

  assert.match(document, /Video preview unavailable/);
  assert.doesNotMatch(document, /<video\b/);
});

test('media detail document supports the backend media-library fields and previews files', () => {
  const document = createMediaDetailsDocument({
    id: 'med-1',
    fileName: 'rider.jpg',
    filePath: '/uploads/rider.jpg',
    mediaType: 'image',
    mimeType: 'image/jpeg',
    sizeBytes: 1048576,
  });

  assert.match(document, /src="\/uploads\/rider\.jpg"/);
  assert.match(document, /rider\.jpg/);
  assert.match(document, /1\.00 MB/);
});

test('media detail document rejects unsafe preview URLs', () => {
  const document = createMediaDetailsDocument({
    fileName: 'bad.jpg',
    filePath: 'javascript:alert(1)',
    mediaType: 'image',
  });

  assert.match(document, /Media preview unavailable/);
  assert.doesNotMatch(document, /<img\b/);
});

test('website content detail document escapes stored text and shows its section and key', () => {
  const document = createWebsiteContentDetailsDocument({
    key: 'home.headline',
    label: 'Homepage headline',
    section: 'Homepage',
    value: '<script>alert(1)</script>',
  });

  assert.match(document, /home\.headline/);
  assert.match(document, /Homepage/);
  assert.match(document, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(document, /<script>alert\(1\)<\/script>/);
});

test('homepage slide detail document includes a safe preview and escapes slide text', () => {
  const document = createHomeSlideDetailsDocument({
    slideNumber: 2,
    image: '/imgs/hero.jpg',
    title: '<script>alert(1)</script>',
    subtitle: 'Ride further',
    link: '/bikes',
  });

  assert.match(document, /src="\/imgs\/hero\.jpg"/);
  assert.match(document, /Slide 2/);
  assert.match(document, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(document, /<script>alert\(1\)<\/script>/);
});

test('homepage slide details do not embed unsafe image protocols', () => {
  const document = createHomeSlideDetailsDocument({
    slideNumber: 1,
    image: 'javascript:alert(1)',
    title: 'Welcome',
  });

  assert.doesNotMatch(document, /src="javascript:/i);
  assert.match(document, /Slide image preview unavailable/);
});

test('website section details document reports visibility and escapes descriptions', () => {
  const document = createWebsiteSectionDetailsDocument({
    id: 'section-1',
    title: 'Services',
    subtitle: '<b>Workshop highlights</b>',
    order: 4,
    enabled: false,
  });

  assert.match(document, /Hidden/);
  assert.match(document, /4/);
  assert.match(document, /&lt;b&gt;Workshop highlights&lt;\/b&gt;/);
});
