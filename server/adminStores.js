import { randomBytes } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultBusinessSettings } from '../src/components/Yamaha/businessConfig.js';

const serverDirectory = dirname(fileURLToPath(import.meta.url));
const dataDirectory = join(serverDirectory, 'data');

let mongoDbRef = null;

export function setMongoDatabaseReference(db) {
  mongoDbRef = db;
}

export function createDataStore(collectionName, seedData, isSingleton = false) {
  const filePath = join(dataDirectory, `${collectionName}.json`);
  let mutationQueue = Promise.resolve();

  async function read() {
    if (mongoDbRef) {
      const col = mongoDbRef.collection(collectionName);
      if (isSingleton) {
        const doc = await col.findOne({ _id: 'singleton' });
        if (doc) {
          const { _id, ...rest } = doc;
          return rest;
        }
        const seed = typeof seedData === 'function' ? await seedData() : seedData;
        await col.insertOne({ ...seed, _id: 'singleton' });
        return seed;
      }

      const docs = await col.find({}).sort({ createdAt: -1, _id: 1 }).toArray();
      if (docs.length > 0) {
        return docs.map(({ _id, ...rest }) => rest);
      }
      const seed = typeof seedData === 'function' ? await seedData() : seedData;
      if (Array.isArray(seed) && seed.length > 0) {
        await col.insertMany(seed.map((item) => ({
          ...item,
          _id: item.id || item.reference || `rec-${Date.now()}-${randomBytes(3).toString('hex')}`,
        })));
        return seed;
      }
      return [];
    }

    try {
      const contents = await readFile(filePath, 'utf8');
      return JSON.parse(contents);
    } catch (err) {
      if (err.code === 'ENOENT') {
        const seed = typeof seedData === 'function' ? await seedData() : seedData;
        await write(seed);
        return seed;
      }
      throw err;
    }
  }

  async function write(data) {
    if (mongoDbRef) {
      const col = mongoDbRef.collection(collectionName);
      if (isSingleton) {
        await col.replaceOne({ _id: 'singleton' }, { ...data, _id: 'singleton' }, { upsert: true });
        return;
      }
      await col.deleteMany({});
      if (Array.isArray(data) && data.length > 0) {
        await col.insertMany(data.map((item) => ({
          ...item,
          _id: item.id || item.reference || `rec-${Date.now()}-${randomBytes(3).toString('hex')}`,
        })));
      }
      return;
    }

    await mkdir(dataDirectory, { recursive: true });
    const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(tmp, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
    await rename(tmp, filePath);
  }

  function mutate(mutationFn) {
    const op = mutationQueue.then(async () => {
      const current = await read();
      const result = await mutationFn(current);
      await write(current);
      return result !== undefined ? result : current;
    });
    mutationQueue = op.then(() => undefined, () => undefined);
    return op;
  }

  return { read, write, mutate };
}

// ==========================================
// SEED DATA DEFINITIONS
// ==========================================

export const defaultServiceVideos = [
  {
    id: 'video-s1',
    title: 'Yamaha Certified Master Service',
    fileName: 's1.mp4',
    mediaUrl: '/s1.mp4',
    thumbnailUrl: '/imgs/f1.png',
    order: 1,
    status: 'published',
    description: 'Complete multipoint diagnostic and synthetic Yamalube oil service inspection.',
    sizeBytes: 3145728,
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-01T10:00:00.000Z',
  },
  {
    id: 'video-s2',
    title: 'Precision Engine Diagnostics & Tuning',
    fileName: 's2.mp4',
    mediaUrl: '/s2.mp4',
    thumbnailUrl: '/imgs/f2.png',
    order: 2,
    status: 'published',
    description: 'Yamaha Diagnostic Tool (YDT) computerized electronic systems evaluation.',
    sizeBytes: 2845000,
    createdAt: '2026-11-01T10:05:00.000Z',
    updatedAt: '2026-11-01T10:05:00.000Z',
  },
  {
    id: 'video-s3',
    title: 'Suspension & Chassis Alignment',
    fileName: 's3.mp4',
    mediaUrl: '/s3.mp4',
    thumbnailUrl: '/imgs/f3.png',
    order: 3,
    status: 'published',
    description: 'Inverted front fork rebuild, swingarm inspection, and high-speed suspension tuning.',
    sizeBytes: 3012000,
    createdAt: '2026-11-01T10:10:00.000Z',
    updatedAt: '2026-11-01T10:10:00.000Z',
  },
  {
    id: 'video-s4',
    title: 'Dual-Channel ABS & Brake Overhaul',
    fileName: 's4.mp4',
    mediaUrl: '/s4.mp4',
    thumbnailUrl: '/imgs/f4.png',
    order: 4,
    status: 'published',
    description: 'Brembo-caliper bleed, high-temperature brake fluid flush, and pad replacement.',
    sizeBytes: 2950000,
    createdAt: '2026-11-01T10:15:00.000Z',
    updatedAt: '2026-11-01T10:15:00.000Z',
  },
  {
    id: 'video-s5',
    title: 'EFI Fuel Injection & Throttle Calibration',
    fileName: 's5.mp4',
    mediaUrl: '/s5.mp4',
    thumbnailUrl: '/imgs/f1.png',
    order: 5,
    status: 'published',
    description: 'Ultrasonic injector cleaning, air-fuel sensor diagnostics, and throttle body sync.',
    sizeBytes: 3200000,
    createdAt: '2026-11-01T10:20:00.000Z',
    updatedAt: '2026-11-01T10:20:00.000Z',
  },
  {
    id: 'video-s6',
    title: 'Final 40-Point Pre-Delivery Quality Inspection',
    fileName: 's6.mp4',
    mediaUrl: '/s6.mp4',
    thumbnailUrl: '/imgs/f2.png',
    order: 6,
    status: 'published',
    description: 'Comprehensive road testing, dynamometer clearance, and final detailing.',
    sizeBytes: 2780000,
    createdAt: '2026-11-01T10:25:00.000Z',
    updatedAt: '2026-11-01T10:25:00.000Z',
  },
];

export const defaultSocialProfiles = [
  {
    id: 'soc-instagram',
    platform: 'Instagram',
    profileUrl: 'https://www.instagram.com/yamahamotorindia',
    handle: '@yamahamotorindia',
    status: 'connected',
    notes: 'Official Yamaha Motor India community updates and rider stories.',
    displayOrder: 1,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'soc-facebook',
    platform: 'Facebook',
    profileUrl: 'https://www.facebook.com/yamahamotorindia',
    handle: 'yamahamotorindia',
    status: 'connected',
    notes: 'Dealership events, product announcements, and customer rallies.',
    displayOrder: 2,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'soc-youtube',
    platform: 'YouTube',
    profileUrl: 'https://www.youtube.com/@YamahaMotorIndia',
    handle: '@YamahaMotorIndia',
    status: 'connected',
    notes: 'Track reviews, exhaust sound notes, walkarounds and masterclass tutorials.',
    displayOrder: 3,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'soc-x',
    platform: 'X',
    profileUrl: 'https://x.com/India_Yamaha',
    handle: '@India_Yamaha',
    status: 'connected',
    notes: 'Official announcements and customer support helpline updates.',
    displayOrder: 4,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'soc-linkedin',
    platform: 'LinkedIn',
    profileUrl: 'https://www.linkedin.com/company/yamaha-motor-india',
    handle: 'yamaha-motor-india',
    status: 'connected',
    notes: 'Corporate news, dealership expansions, and automotive technology updates.',
    displayOrder: 5,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  },
];

export const defaultSocialPosts = [
  {
    id: 'post-1',
    platform: 'Instagram',
    caption: 'The R-Series DNA is waiting for you. Experience the Yamaha YZF-R15M at Vathilai Motors with quickshifter and traction control. #YamahaR15M #VathilaiMotors',
    description: 'Launch showcase campaign for R15M 2026 model.',
    mediaUrl: '/imgs/f1.png',
    postUrl: 'https://www.instagram.com/p/DBYamahaR15M',
    scheduledAt: '',
    status: 'published',
    displayOrder: 1,
    createdAt: '2026-11-10T10:00:00.000Z',
    updatedAt: '2026-11-10T10:00:00.000Z',
  },
  {
    id: 'post-2',
    platform: 'YouTube',
    caption: 'Workshop Walkaround: Keeping your Yamaha MT-15 in peak performance condition with Yamalube Full Synthetic.',
    description: 'Certified workshop service video release.',
    mediaUrl: '/s1.mp4',
    postUrl: 'https://www.youtube.com/watch?v=yamaha-service-guide',
    scheduledAt: '',
    status: 'published',
    displayOrder: 2,
    createdAt: '2026-11-11T14:30:00.000Z',
    updatedAt: '2026-11-11T14:30:00.000Z',
  },
  {
    id: 'post-3',
    platform: 'Facebook',
    caption: 'Special test ride weekend at Vathilai Motors Anna Salai! Book your priority slot online and experience the Dark Side of Japan.',
    description: 'Showroom test ride announcement campaign.',
    mediaUrl: '/imgs/f2.png',
    postUrl: 'https://www.facebook.com/events/vathilai-test-ride',
    scheduledAt: '2026-11-20T09:00:00.000Z',
    status: 'scheduled',
    displayOrder: 3,
    createdAt: '2026-11-12T16:00:00.000Z',
    updatedAt: '2026-11-12T16:00:00.000Z',
  },
];

export const defaultReviews = [
  {
    id: 'rev-1',
    customerName: 'Arjun Ramesh',
    model: 'Yamaha YZF-R15 V4',
    rating: 5,
    review: 'Exceptional riding posture, quick-shifter is ultra smooth, and mileage is easily 45+ km/l in Chennai city traffic. Vathilai Motors delivered on the promised date with zero hassle.',
    imageUrl: '/bikevid/ezgif-frame-076.webp',
    status: 'published',
    displayOrder: 1,
    createdAt: '2026-11-01T12:00:00.000Z',
    updatedAt: '2026-11-01T12:00:00.000Z',
  },
  {
    id: 'rev-2',
    customerName: 'Deepak Sundaram',
    model: 'Yamaha MT-15 V2',
    rating: 5,
    review: 'Torquey low-end and incredible agility for city commutes. The workshop team at Vathilai Motors completed the first free service with thorough care and computerized diagnostics.',
    imageUrl: '/bikevid/ezgif-frame-080.webp',
    status: 'published',
    displayOrder: 2,
    createdAt: '2026-11-04T15:20:00.000Z',
    updatedAt: '2026-11-04T15:20:00.000Z',
  },
  {
    id: 'rev-3',
    customerName: 'Karthik Subramanian',
    model: 'Yamaha FZ-S FI Ver 4.0',
    rating: 4,
    review: 'Very comfortable seat and relaxed handling for daily office rides. Great customer service, transparent on-road pricing, and clear documentation at the dealership.',
    imageUrl: '/bikevid/ezgif-frame-085.webp',
    status: 'published',
    displayOrder: 3,
    createdAt: '2026-11-08T09:45:00.000Z',
    updatedAt: '2026-11-08T09:45:00.000Z',
  },
];

export const defaultGallery = [
  {
    id: 'gal-1',
    title: 'YZF-R15M Track Heritage',
    category: 'Motorcycles',
    mediaType: 'image',
    mediaUrl: '/imgs/f1.png',
    altText: 'Yamaha R15M Racing Edition in paddock setup',
    description: 'Track-ready aerodynamics, carbon-look saddle, and metallic finish.',
    status: 'published',
    displayOrder: 1,
    createdAt: '2026-11-02T10:00:00.000Z',
    updatedAt: '2026-11-02T10:00:00.000Z',
  },
  {
    id: 'gal-2',
    title: 'MT-15 Street Fighter Night Run',
    category: 'Motorcycles',
    mediaType: 'image',
    mediaUrl: '/imgs/f2.png',
    altText: 'Yamaha MT-15 in dark city atmosphere',
    description: 'Dark Side of Japan design language with twin LED position lamps.',
    status: 'published',
    displayOrder: 2,
    createdAt: '2026-11-03T11:00:00.000Z',
    updatedAt: '2026-11-03T11:00:00.000Z',
  },
  {
    id: 'gal-3',
    title: 'FZ Series Urban Tour',
    category: 'Motorcycles',
    mediaType: 'image',
    mediaUrl: '/imgs/f3.png',
    altText: 'Yamaha FZ-S City Riding in Chennai',
    description: 'Lord of the Streets touring shot with muscular fuel tank profile.',
    status: 'published',
    displayOrder: 3,
    createdAt: '2026-11-04T12:00:00.000Z',
    updatedAt: '2026-11-04T12:00:00.000Z',
  },
  {
    id: 'gal-4',
    title: 'Aerox 160 Maxi-Sports Scooter',
    category: 'Motorcycles',
    mediaType: 'image',
    mediaUrl: '/imgs/f4.png',
    altText: 'Yamaha Aerox 155 with racing graphics',
    description: 'Liquid-cooled 155cc performance scooter with variable valve actuation.',
    status: 'published',
    displayOrder: 4,
    createdAt: '2026-11-05T13:00:00.000Z',
    updatedAt: '2026-11-05T13:00:00.000Z',
  },
  {
    id: 'gal-5',
    title: 'Vathilai Motors Certified Service Bay',
    category: 'Workshop',
    mediaType: 'video',
    mediaUrl: '/s1.mp4',
    altText: 'Workshop service bay walkthrough',
    description: 'Authorized service bay equipped with specialized Yamaha tools and diagnostic racks.',
    status: 'published',
    displayOrder: 5,
    createdAt: '2026-11-06T14:00:00.000Z',
    updatedAt: '2026-11-06T14:00:00.000Z',
  },
];

export const defaultWebsiteContent = [
  {
    id: 'cnt-1',
    key: 'hero-headline',
    title: 'Homepage Hero Headline',
    section: 'Homepage',
    body: 'REVS YOUR HEART — PURE YAMAHA ENGINEERING',
    imageUrl: '/imgs/f1.png',
    ctaText: 'BOOK A TEST RIDE',
    ctaLink: '/book-us',
    status: 'published',
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'cnt-2',
    key: 'service-headline',
    title: 'Services Page Heading',
    section: 'Services',
    body: 'PRECISION WORKSHOP CARE & YAMAHA GENUINE PARTS',
    imageUrl: '/s1.mp4',
    ctaText: 'SCHEDULE SERVICE',
    ctaLink: '/book-us',
    status: 'published',
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'cnt-3',
    key: 'dealership-about',
    title: 'About Vathilai Motors',
    section: 'About',
    body: 'Premier authorized Yamaha dealership in Chennai delivering genuine motorcycles, factory-certified maintenance, transparent on-road pricing, and dedicated customer support.',
    imageUrl: '/imgs/bgsec2.png',
    ctaText: 'VISIT DEALERSHIP',
    ctaLink: '/#yamaha-footer',
    status: 'published',
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  },
];

export const defaultHomePage = {
  autoplayInterval: 3000,
  headline: 'REVS YOUR HEART',
  tagline: 'Experience the Thrill of Yamaha Innovation & Track Precision',
  slides: [
    {
      id: 'slide-1',
      image: '/imgs/f1.png',
      title: 'Yamaha YZF-R15M',
      subtitle: 'Born from the Track. Engineered for the Street.',
      ctaText: 'EXPLORE R15M',
      ctaLink: '/bike-details/yamaha-r15m?bike=r15m-india',
      order: 1,
    },
    {
      id: 'slide-2',
      image: '/imgs/f2.png',
      title: 'Yamaha MT-15 V2',
      subtitle: 'Dark Side of Japan — Pure Hyper Naked Torque.',
      ctaText: 'DISCOVER MT-15',
      ctaLink: '/bike-details/yamaha-mt-15?bike=mt-15-v2',
      order: 2,
    },
    {
      id: 'slide-3',
      image: '/imgs/f3.png',
      title: 'Yamaha FZ-S FI Ver 4.0',
      subtitle: 'Lord of the Streets with Traction Control System.',
      ctaText: 'VIEW FZ-S',
      ctaLink: '/bike-details/yamaha-fz-s-fi?bike=fz-s-fi',
      order: 3,
    },
    {
      id: 'slide-4',
      image: '/imgs/f4.png',
      title: 'Yamaha Aerox 155',
      subtitle: 'Maxi Sports Scooter with R15 Engine DNA.',
      ctaText: 'MEET AEROX',
      ctaLink: '/bikes',
      order: 4,
    },
  ],
  featuredMotorcycles: ['r15m-india', 'mt-15-v2', 'fz-s-fi'],
  updatedAt: new Date().toISOString(),
};

export const defaultWebsiteSections = [
  {
    id: 'sec-1',
    sectionKey: 'performance-spotlight',
    title: 'Performance Spotlight',
    subtitle: 'Racing Heritage in Every Machine',
    placement: 'Homepage',
    content: 'From variable valve actuation (VVA) to assist & slipper clutches and traction control, Yamaha engineering gives you unmatched control.',
    imageUrl: '/imgs/f1.png',
    status: 'active',
    displayOrder: 1,
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'sec-2',
    sectionKey: 'certified-service',
    title: 'Certified Workshop Care',
    subtitle: 'Factory Trained Technicians',
    placement: 'Services',
    content: 'Our service facility uses computerized Yamaha diagnostic systems, laser wheel alignment, and 100% genuine Yamalube lubricants.',
    imageUrl: '/s1.mp4',
    status: 'active',
    displayOrder: 2,
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'sec-3',
    sectionKey: 'dealership-network',
    title: 'Authorised Dealership Network',
    subtitle: 'Vathilai Motors Chennai',
    placement: 'Footer',
    content: 'Conveniently located at Anna Salai, Chennai with full showroom display, dedicated test ride fleet, and certified workshop bays.',
    imageUrl: '/imgs/f3.png',
    status: 'active',
    displayOrder: 3,
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  },
];

export const defaultMediaLibrary = [
  {
    id: 'med-1',
    fileName: 'f1.png',
    originalName: 'f1.png',
    filePath: '/imgs/f1.png',
    mediaType: 'image',
    mimeType: 'image/png',
    sizeBytes: 524288,
    category: 'Hero',
    altText: 'Yamaha R15M Hero Slide',
    createdAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'med-2',
    fileName: 'f2.png',
    originalName: 'f2.png',
    filePath: '/imgs/f2.png',
    mediaType: 'image',
    mimeType: 'image/png',
    sizeBytes: 480000,
    category: 'Hero',
    altText: 'Yamaha MT-15 Hero Slide',
    createdAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'med-3',
    fileName: 'f3.png',
    originalName: 'f3.png',
    filePath: '/imgs/f3.png',
    mediaType: 'image',
    mimeType: 'image/png',
    sizeBytes: 460000,
    category: 'Hero',
    altText: 'Yamaha FZ Hero Slide',
    createdAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'med-4',
    fileName: 'f4.png',
    originalName: 'f4.png',
    filePath: '/imgs/f4.png',
    mediaType: 'image',
    mimeType: 'image/png',
    sizeBytes: 510000,
    category: 'Hero',
    altText: 'Yamaha Aerox Hero Slide',
    createdAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'med-5',
    fileName: 's1.mp4',
    originalName: 's1.mp4',
    filePath: '/s1.mp4',
    mediaType: 'video',
    mimeType: 'video/mp4',
    sizeBytes: 3145728,
    category: 'Service',
    altText: 'Master Service Video 1',
    createdAt: '2026-11-01T00:00:00.000Z',
  },
];

export const defaultSeoSettings = [
  {
    id: 'seo-home',
    page: 'Homepage',
    path: '/',
    title: 'Yamaha Motorcycles Chennai | Vathilai Motors Official Dealer',
    description: 'Authorized Yamaha motorcycle dealer in Chennai. Explore YZF-R15, MT-15, FZ series with best on-road prices, test rides and service.',
    keywords: 'yamaha chennai, vathilai motors, r15m price, mt 15 on road price chennai, yamaha showroom',
    ogImage: '/imgs/f1.png',
    canonicalUrl: 'https://vathilaimotors.com/',
    status: 'published',
    updatedAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'seo-bikes',
    page: 'Motorcycle Catalogue',
    path: '/bikes',
    title: 'Yamaha Motorcycle Range 2026 | Vathilai Motors Chennai',
    description: 'Browse the complete lineup of Yamaha sport, street, and maxi-scooters. Compare technical specs, verified prices and book your test ride.',
    keywords: 'yamaha bike catalogue, yamaha sport bikes, yamaha prices india, r15 v4 specs',
    ogImage: '/imgs/f2.png',
    canonicalUrl: 'https://vathilaimotors.com/bikes',
    status: 'published',
    updatedAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'seo-services',
    page: 'Workshop & Services',
    path: '/services',
    title: 'Authorised Yamaha Service Center | Vathilai Motors Chennai',
    description: 'Certified Yamaha motorcycle maintenance, genuine Yamalube oil service, and computer diagnostics in Anna Salai, Chennai.',
    keywords: 'yamaha service center chennai, motorcycle service, genuine yamaha parts, yamalube chennai',
    ogImage: '/s1.mp4',
    canonicalUrl: 'https://vathilaimotors.com/services',
    status: 'published',
    updatedAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'seo-booking',
    page: 'Book Us',
    path: '/book-us',
    title: 'Book Test Ride & Consultation | Vathilai Motors Yamaha',
    description: 'Schedule an authorized showroom visit or test ride for your dream Yamaha motorcycle at Vathilai Motors Anna Salai.',
    keywords: 'book yamaha test ride, yamaha showroom chennai booking, yamaha test drive slot',
    ogImage: '/imgs/f1.png',
    canonicalUrl: 'https://vathilaimotors.com/book-us',
    status: 'published',
    updatedAt: '2026-11-01T00:00:00.000Z',
  },
];

export const defaultUsers = [
  {
    id: 'adm-1',
    name: 'Sanjay',
    email: 'yourssanjay63@gmail.com',
    role: 'Super Admin',
    status: 'Active',
    lastLogin: new Date().toISOString(),
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-11-16T00:00:00.000Z',
  },
];

export const defaultSiteSettings = {
  ...defaultBusinessSettings,
  availableSlots: [
    '10:00 AM – 12:00 PM (Morning Slot)',
    '12:00 PM – 02:00 PM (Noon Slot)',
    '02:00 PM – 04:00 PM (Afternoon Slot)',
    '04:00 PM – 06:00 PM (Evening Slot)',
    '06:00 PM – 08:00 PM (Late Slot)',
  ],
  maintenanceMode: false,
  allowOnlineBookings: true,
  updatedAt: new Date().toISOString(),
};

export const defaultActivityLogs = [
  {
    id: 'act-init',
    user: 'System',
    action: 'SYSTEM_START',
    target: 'Database Engine',
    details: 'Yamaha Production Admin Database initialized and operational.',
    timestamp: new Date().toISOString(),
  },
];

// Stores
export const serviceVideosStore = createDataStore('serviceVideos', defaultServiceVideos);
export const socialProfilesStore = createDataStore('socialProfiles', defaultSocialProfiles);
export const socialPostsStore = createDataStore('socialPosts', defaultSocialPosts);
export const reviewsStore = createDataStore('reviews', defaultReviews);
export const galleryStore = createDataStore('gallery', defaultGallery);
export const websiteContentStore = createDataStore('websiteContent', defaultWebsiteContent);
export const homePageStore = createDataStore('homePage', defaultHomePage, true);
export const websiteSectionsStore = createDataStore('websiteSections', defaultWebsiteSections);
export const mediaLibraryStore = createDataStore('mediaLibrary', defaultMediaLibrary);
export const seoSettingsStore = createDataStore('seoSettings', defaultSeoSettings);
export const usersStore = createDataStore('users', defaultUsers);
export const siteSettingsStore = createDataStore('siteSettings', defaultSiteSettings, true);
export const activityStore = createDataStore('activity', defaultActivityLogs);

export async function logAdminActivity(action, target, details, user = 'Vathilai Administrator') {
  try {
    await activityStore.mutate((logs) => {
      logs.unshift({
        id: `act-${Date.now()}-${randomBytes(3).toString('hex')}`,
        user,
        action,
        target,
        details: typeof details === 'object' ? JSON.stringify(details) : String(details),
        timestamp: new Date().toISOString(),
      });
      if (logs.length > 250) logs.pop();
    });
  } catch (err) {
    console.warn('Failed to log admin activity:', err.message);
  }
}
