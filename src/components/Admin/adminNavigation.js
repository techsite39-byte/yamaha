export const navigation = [
  { label: 'Dashboard', path: '/admin', icon: 'dashboard', group: 'Overview' },
  { label: 'Bookings', path: '/admin/bookings', icon: 'bookings', group: 'Sales & Leads' },
  { label: 'Contact & Enquiries', path: '/admin/enquiries', icon: 'enquiries', group: 'Sales & Leads' },
  { label: 'Motorcycles', path: '/admin/motorcycles', icon: 'motorcycles', group: 'Inventory' },
  { label: 'Service Videos', path: '/admin/service-videos', icon: 'videos', group: 'Services' },
  { label: 'Social Media', path: '/admin/social', icon: 'social', group: 'Marketing' },
  { label: 'Social Posts', path: '/admin/social/posts', icon: 'posts', group: 'Marketing' },
  { label: 'Customer Reviews', path: '/admin/reviews', icon: 'reviews', group: 'Marketing' },
  { label: 'Gallery Management', path: '/admin/gallery', icon: 'gallery', group: 'Website Content' },
  { label: 'Website Content', path: '/admin/content', icon: 'content', group: 'Website Content' },
  { label: 'Home Page', path: '/admin/home-page', icon: 'home', group: 'Website Content' },
  { label: 'Website Sections', path: '/admin/sections', icon: 'sections', group: 'Website Content' },
  { label: 'Media Library', path: '/admin/media', icon: 'media', group: 'Website Content' },
  { label: 'Analytics', path: '/admin/analytics', icon: 'analytics', group: 'Performance' },
  { label: 'Admin Profile & Settings', path: '/admin/profile', icon: 'profile', group: 'Configuration' },
  { label: 'SEO Settings', path: '/admin/seo', icon: 'seo', group: 'Configuration' },
  { label: 'Users & Roles', path: '/admin/users', icon: 'users', group: 'Configuration' },
  { label: 'Activity Logs', path: '/admin/activity', icon: 'activity', group: 'Configuration' },
  { label: 'Dealership Settings', path: '/admin/settings', icon: 'settings', group: 'Configuration' },
];

export const pageTitles = new Map(navigation.map((item) => [item.path, item.label]));
