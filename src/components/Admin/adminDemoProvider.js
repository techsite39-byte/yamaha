const STORAGE_KEY = 'yamaha-admin-demo-data-v1';

export const DEMO_MODE_ENABLED = import.meta.env.DEV && import.meta.env.VITE_ADMIN_DEMO_MODE === 'true';

export const demoCollections = {
  motorcycles: {
    title: 'Demo motorcycle inventory',
    description: 'Sample records are isolated from the public motorcycle catalog.',
    fields: [
      { key: 'model', label: 'Model', required: true },
      { key: 'category', label: 'Category', type: 'select', options: ['Sport', 'Naked', 'Adventure', 'Touring'], required: true },
      { key: 'modelYear', label: 'Model year', type: 'number', required: true },
      { key: 'price', label: 'Price (demo)', type: 'number', required: true },
      { key: 'status', label: 'Inventory status', type: 'select', options: ['Draft', 'Published', 'Archived'], required: true },
      { key: 'imageUrl', label: 'Image URL', type: 'media' },
      { key: 'description', label: 'Description', type: 'textarea' },
    ],
    columns: ['model', 'category', 'modelYear', 'price', 'status', 'imageUrl'],
    statusField: 'status',
    mediaField: 'imageUrl',
    seed: [
      { id: 'demo-bike-1', model: 'YZF-R7 Demo', category: 'Sport', modelYear: 2025, price: 9200, status: 'Published', imageUrl: '/bikevid/ezgif-frame-076.webp', description: 'Sample sport motorcycle record for admin UI testing.' },
      { id: 'demo-bike-2', model: 'MT-07 Demo', category: 'Naked', modelYear: 2025, price: 8200, status: 'Draft', imageUrl: '/bikevid/ezgif-frame-077.webp', description: 'Second isolated sample record.' },
      { id: 'demo-bike-3', model: 'Ténéré Demo', category: 'Adventure', modelYear: 2024, price: 11999, status: 'Archived', imageUrl: '/bikevid/ezgif-frame-078.webp', description: 'Sample archived record.' },
    ],
  },
  serviceVideos: {
    title: 'Demo service video playlist',
    description: 'The six existing public video files are previewed in their current order. Demo edits never alter the public playlist.',
    fields: [
      { key: 'title', label: 'Video title', required: true },
      { key: 'fileName', label: 'File name', required: true },
      { key: 'order', label: 'Playback order', type: 'number', required: true },
      { key: 'status', label: 'Review status', type: 'select', options: ['Draft', 'Ready', 'Archived'], required: true },
      { key: 'mediaUrl', label: 'Video file URL', type: 'media' },
    ],
    columns: ['title', 'fileName', 'order', 'status', 'mediaUrl'],
    statusField: 'status',
    mediaField: 'mediaUrl',
    seed: Array.from({ length: 6 }, (_, index) => ({
      id: `demo-service-video-${index + 1}`,
      title: `Workshop service ${index + 1}`,
      fileName: `s${index + 1}.mp4`,
      order: index + 1,
      status: index === 0 ? 'Ready' : 'Draft',
      mediaUrl: `/s${index + 1}.mp4`,
    })),
  },
  socialProfiles: {
    title: 'Social platform profiles',
    description: 'Sample profiles are placeholders only; no platform is connected.',
    fields: [
      { key: 'platform', label: 'Platform', type: 'select', options: ['Instagram', 'Facebook', 'YouTube', 'X', 'LinkedIn'], required: true },
      { key: 'profileUrl', label: 'Profile URL', type: 'url', required: true },
      { key: 'status', label: 'Connection status', type: 'select', options: ['Not connected', 'Setup required', 'Connected (demo only)'], required: true },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
    columns: ['platform', 'profileUrl', 'status', 'notes'],
    statusField: 'status',
    seed: [
      { id: 'demo-social-instagram', platform: 'Instagram', profileUrl: 'https://example.com/yamaha-demo-instagram', status: 'Not connected', notes: 'Demo URL. Not an official profile.' },
      { id: 'demo-social-facebook', platform: 'Facebook', profileUrl: 'https://example.com/yamaha-demo-facebook', status: 'Setup required', notes: 'API credentials required to connect.' },
      { id: 'demo-social-youtube', platform: 'YouTube', profileUrl: 'https://example.com/yamaha-demo-youtube', status: 'Not connected', notes: 'No YouTube API integration.' },
      { id: 'demo-social-x', platform: 'X', profileUrl: 'https://example.com/yamaha-demo-x', status: 'Not connected', notes: 'No X API integration.' },
      { id: 'demo-social-linkedin', platform: 'LinkedIn', profileUrl: 'https://example.com/yamaha-demo-linkedin', status: 'Not connected', notes: 'No LinkedIn API integration.' },
    ],
  },
  socialPosts: {
    title: 'Demo social posts',
    description: 'Post records and status changes are simulated. No content is sent to social networks.',
    fields: [
      { key: 'platform', label: 'Platform', type: 'select', options: ['Instagram', 'Facebook', 'YouTube', 'X', 'LinkedIn'], required: true },
      { key: 'caption', label: 'Caption', type: 'textarea', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'status', label: 'Post status', type: 'select', options: ['Draft', 'Scheduled', 'Published', 'Failed'], required: true },
      { key: 'scheduledAt', label: 'Schedule time', type: 'datetime-local' },
      { key: 'postUrl', label: 'Post URL', type: 'url' },
      { key: 'mediaUrl', label: 'Image/video URL', type: 'media' },
    ],
    columns: ['platform', 'caption', 'status', 'scheduledAt', 'mediaUrl'],
    statusField: 'status',
    mediaField: 'mediaUrl',
    seed: [
      { id: 'demo-post-1', platform: 'Instagram', caption: 'Built for every curve. #YamahaDemo', description: 'Sample launch caption. Not published.', status: 'Draft', scheduledAt: '', postUrl: '', mediaUrl: '/bikevid/ezgif-frame-076.webp' },
      { id: 'demo-post-2', platform: 'YouTube', caption: 'Workshop walkaround — demo video', description: 'Sample video description.', status: 'Scheduled', scheduledAt: '2026-12-01T10:00', postUrl: '', mediaUrl: '/s1.mp4' },
      { id: 'demo-post-3', platform: 'LinkedIn', caption: 'Engineering in motion.', description: 'Sample company update.', status: 'Failed', scheduledAt: '', postUrl: '', mediaUrl: '' },
    ],
  },
  enquiries: {
    title: 'Demo customer enquiries',
    description: 'All names and contact details are fictional demo data using reserved example.com email addresses.',
    fields: [
      { key: 'customerName', label: 'Customer name', required: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'phone', label: 'Phone', type: 'tel' },
      { key: 'message', label: 'Message', type: 'textarea', required: true },
      { key: 'status', label: 'Enquiry status', type: 'select', options: ['New', 'In Progress', 'Completed'], required: true },
      { key: 'receivedAt', label: 'Received date', type: 'date' },
    ],
    columns: ['customerName', 'email', 'phone', 'message', 'status', 'receivedAt'],
    statusField: 'status',
    seed: [
      { id: 'demo-enquiry-1', customerName: 'Alex Morgan (Demo)', email: 'alex.morgan@example.com', phone: '+1 555 010 0123', message: 'Interested in a test ride.', status: 'New', receivedAt: '2026-10-28' },
      { id: 'demo-enquiry-2', customerName: 'Taylor Reed (Demo)', email: 'taylor.reed@example.com', phone: '+1 555 010 0456', message: 'Please share service package details.', status: 'In Progress', receivedAt: '2026-10-26' },
      { id: 'demo-enquiry-3', customerName: 'Jordan Lee (Demo)', email: 'jordan.lee@example.com', phone: '+1 555 010 0789', message: 'Question about availability.', status: 'Completed', receivedAt: '2026-10-20' },
    ],
  },
  reviews: {
    title: 'Demo customer reviews',
    description: 'Fictional feedback for UI testing only. It is not published to the public website.',
    fields: [
      { key: 'customerName', label: 'Customer name', required: true },
      { key: 'model', label: 'Motorcycle model', required: true },
      { key: 'rating', label: 'Rating (1–5)', type: 'number', min: 1, max: 5, required: true },
      { key: 'review', label: 'Review', type: 'textarea', required: true },
      { key: 'status', label: 'Visibility', type: 'select', options: ['Draft', 'Published', 'Hidden'], required: true },
      { key: 'imageUrl', label: 'Review image URL', type: 'media' },
    ],
    columns: ['customerName', 'model', 'rating', 'review', 'status', 'imageUrl'],
    statusField: 'status',
    mediaField: 'imageUrl',
    seed: [
      { id: 'demo-review-1', customerName: 'Casey Park (Demo)', model: 'YZF-R7 Demo', rating: 5, review: 'Responsive, confidence-inspiring, and fun on every ride.', status: 'Published', imageUrl: '/bikevid/ezgif-frame-079.webp' },
      { id: 'demo-review-2', customerName: 'Riley Chen (Demo)', model: 'MT-07 Demo', rating: 4, review: 'Comfortable daily ride with a lively engine.', status: 'Draft', imageUrl: '' },
    ],
  },
  gallery: {
    title: 'Demo gallery',
    description: 'Gallery categories and uploads are examples only. File selection previews are temporary and do not upload.',
    fields: [
      { key: 'title', label: 'Gallery title', required: true },
      { key: 'category', label: 'Category', type: 'select', options: ['Motorcycles', 'Events', 'Workshop', 'Campaign'], required: true },
      { key: 'mediaType', label: 'Media type', type: 'select', options: ['Image', 'Video'], required: true },
      { key: 'mediaUrl', label: 'Media URL', type: 'media' },
      { key: 'status', label: 'Visibility', type: 'select', options: ['Draft', 'Published', 'Hidden'], required: true },
      { key: 'altText', label: 'Alt text', type: 'textarea' },
    ],
    columns: ['title', 'category', 'mediaType', 'status', 'mediaUrl', 'altText'],
    statusField: 'status',
    mediaField: 'mediaUrl',
    seed: [
      { id: 'demo-gallery-1', title: 'Blue machine detail', category: 'Motorcycles', mediaType: 'Image', mediaUrl: '/bikevid/ezgif-frame-080.webp', status: 'Published', altText: 'Demo motorcycle campaign image' },
      { id: 'demo-gallery-2', title: 'Service bay preview', category: 'Workshop', mediaType: 'Video', mediaUrl: '/s2.mp4', status: 'Draft', altText: 'Demo workshop video' },
    ],
  },
  homePage: {
    title: 'Demo homepage content',
    description: 'Edits are isolated demo records and are not applied to the public homepage.',
    fields: [
      { key: 'bannerTitle', label: 'Banner title', required: true },
      { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
      { key: 'imageUrl', label: 'Banner image URL', type: 'media' },
      { key: 'ctaLabel', label: 'Call-to-action label' },
      { key: 'status', label: 'Content status', type: 'select', options: ['Draft', 'Published', 'Hidden'], required: true },
    ],
    columns: ['bannerTitle', 'subtitle', 'ctaLabel', 'status', 'imageUrl'],
    statusField: 'status',
    mediaField: 'imageUrl',
    seed: [
      { id: 'demo-home-1', bannerTitle: 'Ride beyond.', subtitle: 'A sample hero banner for admin testing.', imageUrl: '/bikevid/ezgif-frame-081.webp', ctaLabel: 'Explore the range', status: 'Draft' },
      { id: 'demo-home-2', bannerTitle: 'Built to move.', subtitle: 'Secondary sample promotional banner.', imageUrl: '/bikevid/ezgif-frame-082.webp', ctaLabel: 'Discover more', status: 'Hidden' },
    ],
  },
  websiteSections: {
    title: 'Demo website sections',
    description: 'Sample sections are not connected to public page rendering.',
    fields: [
      { key: 'title', label: 'Section title', required: true },
      { key: 'placement', label: 'Placement', type: 'select', options: ['Homepage', 'Services', 'Campaign'], required: true },
      { key: 'content', label: 'Section content', type: 'textarea' },
      { key: 'status', label: 'Status', type: 'select', options: ['Draft', 'Published', 'Hidden'], required: true },
    ],
    columns: ['title', 'placement', 'content', 'status'],
    statusField: 'status',
    seed: [
      { id: 'demo-section-1', title: 'Performance spotlight', placement: 'Homepage', content: 'Sample section copy.', status: 'Draft' },
      { id: 'demo-section-2', title: 'Service promise', placement: 'Services', content: 'Sample service content.', status: 'Published' },
    ],
  },
  mediaLibrary: {
    title: 'Demo media library',
    description: 'Existing project assets are not moved or modified. Demo selections only store metadata in browser demo state.',
    fields: [
      { key: 'fileName', label: 'File name', required: true },
      { key: 'mediaType', label: 'Media type', type: 'select', options: ['Image', 'Video'], required: true },
      { key: 'category', label: 'Category', type: 'select', options: ['Campaign', 'Motorcycle', 'Workshop', 'General'], required: true },
      { key: 'mediaUrl', label: 'Preview URL', type: 'media' },
      { key: 'altText', label: 'Alt text' },
      { key: 'status', label: 'Status', type: 'select', options: ['Available (demo)', 'Archived'], required: true },
    ],
    columns: ['fileName', 'mediaType', 'category', 'status', 'mediaUrl', 'altText'],
    statusField: 'status',
    mediaField: 'mediaUrl',
    seed: [
      { id: 'demo-media-1', fileName: 'campaign-blue.webp', mediaType: 'Image', category: 'Campaign', mediaUrl: '/bikevid/ezgif-frame-083.webp', altText: 'Demo campaign preview', status: 'Available (demo)' },
      { id: 'demo-media-2', fileName: 'service-s1.mp4', mediaType: 'Video', category: 'Workshop', mediaUrl: '/s1.mp4', altText: 'Demo service video preview', status: 'Available (demo)' },
    ],
  },
  websiteContent: {
    title: 'Demo website content',
    description: 'These sample entries are not published or connected to public content.',
    fields: [
      { key: 'title', label: 'Content title', required: true },
      { key: 'section', label: 'Website section', type: 'select', options: ['Homepage', 'Promotion', 'Social links', 'Footer'], required: true },
      { key: 'body', label: 'Text/content', type: 'textarea' },
      { key: 'imageUrl', label: 'Image or social URL', type: 'url' },
      { key: 'status', label: 'Publication status', type: 'select', options: ['Draft', 'Published', 'Hidden'], required: true },
    ],
    columns: ['title', 'section', 'body', 'status', 'imageUrl'],
    statusField: 'status',
    seed: [
      { id: 'demo-content-1', title: 'Homepage headline', section: 'Homepage', body: 'Sample content only.', imageUrl: '', status: 'Draft' },
      { id: 'demo-content-2', title: 'Instagram profile URL', section: 'Social links', body: 'Placeholder link; not a real profile.', imageUrl: 'https://example.com/yamaha-demo', status: 'Hidden' },
    ],
  },
  seo: {
    title: 'Demo SEO settings',
    description: 'Sample metadata is not applied to the public site.',
    fields: [
      { key: 'page', label: 'Page name', required: true },
      { key: 'title', label: 'Title tag', required: true },
      { key: 'description', label: 'Meta description', type: 'textarea' },
      { key: 'canonicalPath', label: 'Canonical path', required: true },
      { key: 'status', label: 'Status', type: 'select', options: ['Draft', 'Approved'], required: true },
    ],
    columns: ['page', 'title', 'description', 'canonicalPath', 'status'],
    statusField: 'status',
    seed: [
      { id: 'demo-seo-1', page: 'Homepage (demo)', title: 'Yamaha demo metadata', description: 'Sample meta description for testing only.', canonicalPath: '/', status: 'Draft' },
      { id: 'demo-seo-2', page: 'Services (demo)', title: 'Service demo metadata', description: 'Not applied to public page.', canonicalPath: '/services', status: 'Draft' },
    ],
  },
  users: {
    title: 'Demo admin users & roles',
    description: 'Sample user records are not Auth0 accounts and do not authorize any API request.',
    fields: [
      { key: 'name', label: 'Name', required: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'role', label: 'Demo role', type: 'select', options: ['Super Admin', 'Admin', 'Editor', 'Viewer'], required: true },
      { key: 'status', label: 'Account status', type: 'select', options: ['Active (demo)', 'Invited (demo)', 'Disabled (demo)'], required: true },
    ],
    columns: ['name', 'email', 'role', 'status'],
    statusField: 'status',
    seed: [
      { id: 'demo-user-1', name: 'Demo Administrator', email: 'admin@example.com', role: 'Super Admin', status: 'Active (demo)' },
      { id: 'demo-user-2', name: 'Demo Content Editor', email: 'editor@example.com', role: 'Editor', status: 'Invited (demo)' },
      { id: 'demo-user-3', name: 'Demo Analyst', email: 'analyst@example.com', role: 'Viewer', status: 'Active (demo)' },
    ],
  },
  activity: {
    title: 'Demo activity log',
    description: 'Simulated actions in this browser demo only. This is not a security or audit record.',
    fields: [
      { key: 'action', label: 'Action', required: true },
      { key: 'actor', label: 'Actor', required: true },
      { key: 'target', label: 'Affected item' },
      { key: 'timestamp', label: 'Timestamp', type: 'datetime-local' },
      { key: 'status', label: 'Result', type: 'select', options: ['Demo action'], required: true },
    ],
    columns: ['action', 'actor', 'target', 'timestamp', 'status'],
    readOnly: true,
    seed: [
      { id: 'demo-activity-1', action: 'Opened admin dashboard', actor: 'Demo Administrator', target: 'Dashboard', timestamp: '2026-11-03T09:30', status: 'Demo action' },
      { id: 'demo-activity-2', action: 'Updated sample campaign post', actor: 'Demo Content Editor', target: 'Instagram post', timestamp: '2026-11-03T09:15', status: 'Demo action' },
    ],
  },
  analytics: {
    title: 'Demo analytics samples',
    description: 'Sample metrics are for exercising the analytics layout only; they are not live traffic or business reports.',
    fields: [
      { key: 'key', label: 'Metric', required: true },
      { key: 'value', label: 'Sample value', type: 'number', required: true },
      { key: 'source', label: 'Source', required: true },
    ],
    columns: ['key', 'value', 'source'],
    readOnly: true,
    seed: [
      { id: 'demo-analytics-visitors', key: 'visitors', value: 1284, source: 'Synthetic demo sample' },
      { id: 'demo-analytics-enquiry-rate', key: 'enquiry rate', value: 6, source: 'Synthetic demo sample' },
      { id: 'demo-analytics-engagement', key: 'social engagement', value: 42, source: 'Synthetic demo sample' },
    ],
  },
  profile: {
    title: 'Demo admin profile',
    description: 'Profile values are local demo settings and are not an authenticated identity.',
    fields: [
      { key: 'displayName', label: 'Display name', required: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'role', label: 'Demo role', required: true },
      { key: 'timezone', label: 'Timezone', required: true },
      { key: 'notifications', label: 'Notification preference', type: 'select', options: ['Enabled (demo)', 'Disabled (demo)'], required: true },
    ],
    columns: ['displayName', 'email', 'role', 'timezone', 'notifications'],
    seed: [
      { id: 'demo-profile', displayName: 'Yamaha Demo Admin', email: 'admin@example.com', role: 'Super Admin (demo)', timezone: 'Asia/Kolkata', notifications: 'Enabled (demo)' },
    ],
  },
  settings: {
    title: 'Demo admin settings',
    description: 'Changing these demo values does not configure the server or affect the public site.',
    fields: [
      { key: 'setting', label: 'Setting', required: true },
      { key: 'value', label: 'Value', required: true },
      { key: 'category', label: 'Category', type: 'select', options: ['General', 'Security', 'Notifications'], required: true },
      { key: 'status', label: 'State', type: 'select', options: ['Demo only', 'Disabled'], required: true },
    ],
    columns: ['setting', 'value', 'category', 'status'],
    statusField: 'status',
    seed: [
      { id: 'demo-setting-1', setting: 'Session timeout', value: '60 minutes (demo)', category: 'Security', status: 'Demo only' },
      { id: 'demo-setting-2', setting: 'Email notifications', value: 'Enabled (demo)', category: 'Notifications', status: 'Demo only' },
    ],
  },
};

const clone = (value) => JSON.parse(JSON.stringify(value));
let memoryData;
let storageMode = 'browser development storage';
let storageWarning = '';

function requireDemoMode() {
  if (!DEMO_MODE_ENABLED) throw new Error('Admin demo mode is only available in Vite development.');
}

function seedDemoData() {
  return Object.fromEntries(Object.entries(demoCollections).map(([key, config]) => [key, clone(config.seed)]));
}

function dispatchChange() {
  window.dispatchEvent(new CustomEvent('yamaha-admin-demo-change'));
}

export function readDemoData() {
  requireDemoMode();
  if (memoryData) return memoryData;
  memoryData = seedDemoData();
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid demo data shape.');
      memoryData = { ...memoryData, ...parsed };
    }
  } catch {
    storageMode = 'temporary in-memory state';
    storageWarning = 'Browser storage is unavailable or saved demo data is invalid. Changes may not survive refresh.';
  }
  return memoryData;
}

export function readDemoCollection(key) {
  const data = readDemoData();
  return clone(Array.isArray(data[key]) ? data[key] : []);
}

export function readDemoStorageStatus() {
  requireDemoMode();
  return { mode: storageMode, warning: storageWarning };
}

function persistDemoData() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryData));
    storageMode = 'browser development storage';
    storageWarning = '';
    return 'browser demo storage';
  } catch {
    storageMode = 'temporary in-memory state';
    storageWarning = 'Browser storage is unavailable. Changes remain only until this page is refreshed or closed.';
    return 'temporary in-memory demo state';
  }
}

export function mutateDemoCollection(key, action, payload) {
  requireDemoMode();
  const config = demoCollections[key];
  if (!config || config.readOnly) throw new Error('This demo collection is read-only.');

  const data = readDemoData();
  const collection = Array.isArray(data[key]) ? [...data[key]] : [];
  const now = new Date();
  let affected;

  if (action === 'create') {
    affected = { ...payload, id: `demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` };
    collection.unshift(affected);
  } else if (action === 'update') {
    const index = collection.findIndex((item) => item.id === payload.id);
    if (index < 0) throw new Error('The demo record no longer exists.');
    affected = { ...collection[index], ...payload };
    collection[index] = affected;
  } else if (action === 'delete') {
    const index = collection.findIndex((item) => item.id === payload);
    if (index < 0) throw new Error('The demo record no longer exists.');
    [affected] = collection.splice(index, 1);
  } else {
    throw new Error(`Unsupported demo action: ${action}`);
  }

  data[key] = collection;
  const activity = Array.isArray(data.activity) ? [...data.activity] : [];
  const titleField = config.fields[0]?.key;
  activity.unshift({
    id: `demo-activity-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    action: `${action[0].toUpperCase()}${action.slice(1)} ${config.title}`,
    actor: 'Yamaha Demo Admin',
    target: affected?.[titleField] ?? affected?.id ?? key,
    timestamp: now.toISOString().slice(0, 16),
    status: 'Demo action',
  });
  data.activity = activity.slice(0, 25);
  memoryData = data;
  const persistence = persistDemoData();
  dispatchChange();
  return persistence;
}

export function resetDemoData() {
  requireDemoMode();
  memoryData = seedDemoData();
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    storageMode = 'browser development storage';
    storageWarning = '';
  } catch {
    storageMode = 'temporary in-memory state';
    storageWarning = 'Browser storage could not be cleared. The reset sample is active for this page only.';
  }
  dispatchChange();
}

export function subscribeToDemoChanges(callback) {
  requireDemoMode();
  const handleStorage = (event) => {
    if (event.key === STORAGE_KEY) {
      memoryData = null;
      callback();
    }
  };
  window.addEventListener('yamaha-admin-demo-change', callback);
  window.addEventListener('storage', handleStorage);
  return () => {
    window.removeEventListener('yamaha-admin-demo-change', callback);
    window.removeEventListener('storage', handleStorage);
  };
}
