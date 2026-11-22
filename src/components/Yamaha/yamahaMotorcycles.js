import { yamahaIndiaCatalog } from './yamahaIndiaCatalog.js';

export let yamahaMotorcycles = [
  {
    id: 'yzf-r1',
    model: 'YZF-R1',
    category: 'SUPERSPORT / RACE-BRED',
    heading: ['YZF-', 'R1'],
    description: 'Race-developed precision and crossplane power, engineered for uncompromising supersport performance.',
    cta: 'EXPLORE THE YZF-R1',
    signature: ['RACE', 'PRECISION', 'CONTROL'],
    image: '/imgs/1.%20Yamaha%20YZF-R1.webp',
    features: [
      { title: 'Crossplane Power', description: 'MotoGP-inspired engine character.' },
      { title: 'Track-Bred Control', description: 'Precision from corner to corner.' },
      { title: 'Race-Ready Chassis', description: 'Built for focused performance.' },
    ],
    specifications: ['Race character', 'Focused response', 'Rider control', 'Supersport DNA'],
  },
  {
    id: 'yzf-r7',
    model: 'YZF-R7',
    category: 'SUPERSPORT / AGILITY',
    heading: ['YZF-', 'R7'],
    tagline: 'Supersport Performance Powered by CP2 Torque and Track-Bred Chassis Dynamics',
    description: 'An agile supersport with engaging CP2 power, focused supersport ergonomics, and razor-sharp handling for both street and track.',
    cta: 'EXPLORE THE YZF-R7',
    signature: ['AGILITY', 'BALANCE', 'FREEDOM'],
    image: '/imgs/2.%20Yamaha%20YZF-R7.webp',
    displacementCc: 689,
    features: [
      { title: '689cc CP2 Engine', description: 'Crossplane concept 270-degree crankshaft delivering linear torque and exhilarating acceleration.' },
      { title: 'Supersport Ergonomics', description: 'Deep knee pockets, clip-on handlebars, and a focused riding posture connected to the chassis.' },
      { title: 'Fully Adjustable KYB Forks', description: '41mm inverted front forks with preload, rebound, and compression adjustability.' },
      { title: 'Assist & Slipper Clutch', description: 'Light lever pull and smooth deceleration control during aggressive corner downshifts.' },
    ],
    specifications: ['689 cc CP2', '73.4 PS Power', '67 Nm Torque', '188 kg Kerb Weight', 'Dual Channel ABS'],
    catalogue: {
      market: 'IN',
      category: 'Sport Bikes',
      published: true,
      available: true,
      variants: [
        'Standard (Team Yamaha Blue)',
        'Performance Black Edition',
        'World GP 60th Anniversary Edition',
      ],
      colors: [
        'Team Yamaha Blue',
        'Performance Black',
        'Intensity White',
      ],
      specifications: [
        { section: 'Engine', label: 'Engine Type', value: '689cc liquid-cooled, 4-stroke, DOHC, 4-valve CP2 inline 2-cylinder' },
        { section: 'Engine', label: 'Displacement', value: '689 cc' },
        { section: 'Engine', label: 'Bore x Stroke', value: '80.0 mm x 68.6 mm' },
        { section: 'Engine', label: 'Compression Ratio', value: '11.5 : 1' },
        { section: 'Engine', label: 'Maximum Power', value: '54.0 kW (73.4 PS) @ 8,750 rpm' },
        { section: 'Engine', label: 'Maximum Torque', value: '67.0 Nm @ 6,500 rpm' },
        { section: 'Engine', label: 'Fuel System', value: 'Electronic Fuel Injection' },
        { section: 'Engine', label: 'Transmission', value: 'Constant Mesh 6-speed with Assist & Slipper Clutch' },
        { section: 'Dimensions', label: 'Overall Dimensions (L x W x H)', value: '2,070 mm x 705 mm x 1,160 mm' },
        { section: 'Dimensions', label: 'Seat Height', value: '835 mm' },
        { section: 'Dimensions', label: 'Wheelbase', value: '1,395 mm' },
        { section: 'Dimensions', label: 'Ground Clearance', value: '135 mm' },
        { section: 'Dimensions', label: 'Kerb Weight', value: '188 kg' },
        { section: 'Dimensions', label: 'Fuel Tank Capacity', value: '13.0 Litres' },
        { section: 'Brakes and tyres', label: 'Front Brake', value: 'Dual 298 mm hydraulic discs with Brembo radial master cylinder' },
        { section: 'Brakes and tyres', label: 'Rear Brake', value: 'Single 245 mm hydraulic disc' },
        { section: 'Brakes and tyres', label: 'Braking System', value: 'Dual Channel ABS' },
        { section: 'Brakes and tyres', label: 'Front Tyre', value: '120/70ZR17M/C (58W) Tubeless Radial' },
        { section: 'Brakes and tyres', label: 'Rear Tyre', value: '180/55ZR17M/C (73W) Tubeless Radial' },
        { section: 'Brakes and tyres', label: 'Front Suspension', value: '41 mm inverted KYB telescopic fork, fully adjustable' },
        { section: 'Brakes and tyres', label: 'Rear Suspension', value: 'Linked-type Monocross with adjustable preload and rebound' },
        { section: 'Features', label: 'Chassis Type', value: 'Lightweight high-tensile steel diamond frame' },
        { section: 'Features', label: 'Instrument Cluster', value: 'High-contrast inverted LCD digital cockpit display' },
        { section: 'Features', label: 'Lighting', value: 'Bi-functional LED center projector with twin LED position lights' },
        { section: 'Features', label: 'Clutch', value: 'Assist & Slipper (A&S) Clutch with optional Quick Shifter (QSS)' },
      ],
      prices: [
        {
          variant: 'Standard (Team Yamaha Blue)',
          city: 'Chennai',
          exShowroom: 1000000,
          onRoad: 1140000,
          source: 'Vathilai Motors Showroom',
          checkedAt: '2026-11-14',
          estimated: true,
        },
        {
          variant: 'Performance Black Edition',
          city: 'Chennai',
          exShowroom: 1000000,
          onRoad: 1140000,
          source: 'Vathilai Motors Showroom',
          checkedAt: '2026-11-14',
          estimated: true,
        },
        {
          variant: 'World GP 60th Anniversary Edition',
          city: 'Chennai',
          exShowroom: 1050000,
          onRoad: 1195000,
          source: 'Vathilai Motors Showroom',
          checkedAt: '2026-11-14',
          estimated: true,
        },
      ],
      gallery: [
        '/imgs/2.%20Yamaha%20YZF-R7.webp',
        '/imgs/f1.png',
        '/imgs/f2.png',
        '/imgs/f3.png',
      ],
      officialSourceUrl: 'https://www.yamaha-motor-india.com',
      priceNote: 'Introductory Chennai showroom quotation. RTO registration, mandatory third-party insurance, and road safety taxes included in estimated on-road pricing.',
    },
  },
  {
    id: 'mt-09',
    model: 'MT-09',
    category: 'HYPER NAKED / TORQUE',
    heading: ['MT-', '09'],
    description: 'A thrilling naked-bike attitude powered by a torque-rich CP3 engine and nimble handling.',
    cta: 'EXPLORE THE MT-09',
    signature: ['TORQUE', 'ATTITUDE', 'CONTROL'],
    image: '/imgs/3.%20Yamaha%20MT-09.webp',
    features: [
      { title: 'CP3 Engine', description: 'Instant, distinctive triple-cylinder torque.' },
      { title: 'Agile Handling', description: 'Light-footed response in every turn.' },
      { title: 'Bold Naked Design', description: 'Stripped back, unmistakably MT.' },
    ],
    specifications: ['Triple character', 'Agile response', 'Direct control', 'Hyper naked DNA'],
  },
  {
    id: 'xs-r900',
    model: 'XSR900',
    category: 'SPORT HERITAGE / ICONIC',
    heading: ['XSR', '900'],
    description: 'Timeless Sport Heritage styling meets modern triple-cylinder performance and precision.',
    cta: 'EXPLORE THE XSR900',
    signature: ['HERITAGE', 'CRAFT', 'PERFORMANCE'],
    image: '/imgs/6.%20Yamaha%20XSR900.webp',
    features: [
      { title: 'Sport Heritage', description: 'Classic inspiration, modern detail.' },
      { title: 'CP3 Performance', description: 'Exciting power with character.' },
      { title: 'Refined Chassis', description: 'Confident control on the open road.' },
    ],
    specifications: ['Heritage style', 'Triple character', 'Refined response', 'Sport heritage DNA'],
  },
  {
    id: 'r15m',
    model: 'R15M',
    category: 'SUPERSPORT / EVERYDAY',
    heading: ['R15', 'M'],
    description: 'A sharp, lightweight supersport that brings R-Series design and precision to every ride.',
    cta: 'EXPLORE THE R15M',
    signature: ['R-SERIES', 'AGILITY', 'FOCUS'],
    image: '/imgs/Yamaha%20R15M.webp',
    features: [
      { title: 'R-Series Styling', description: 'Inspired by Yamaha supersport icons.' },
      { title: 'Lightweight Handling', description: 'Easy, precise response.' },
      { title: 'Everyday Performance', description: 'Sporting excitement for every road.' },
    ],
    specifications: ['R-Series style', 'Lightweight feel', 'Everyday agility', 'Supersport DNA'],
  },
  {
    id: 'tenere-700',
    model: 'Ténéré 700',
    category: 'ADVENTURE / ALL TERRAIN',
    heading: ['TÉNÉRÉ', '700'],
    description: 'Go beyond the expected with rally-inspired capability and confidence on every terrain.',
    cta: 'EXPLORE THE TÉNÉRÉ 700',
    signature: ['ADVENTURE', 'ENDURANCE', 'FREEDOM'],
    image: '/imgs/Yamaha%20T%C3%A9n%C3%A9r%C3%A9%20700.webp',
    features: [
      { title: 'Rally-Bred Spirit', description: 'Ready for the long way around.' },
      { title: 'All-Terrain Control', description: 'Confidence on and off the road.' },
      { title: 'Adventure Ready', description: 'Built to take you further.' },
    ],
    specifications: ['Rally spirit', 'All-terrain poise', 'Long-range freedom', 'Adventure DNA'],
  },
  {
    id: 'tracer-9-gt',
    model: 'TRACER 9 GT',
    category: 'SPORT TOURING / GRAND TOURING',
    heading: ['TRACER', '9 GT'],
    description: 'Long-distance comfort and versatile sport performance come together in a premium tourer.',
    cta: 'EXPLORE THE TRACER 9 GT',
    signature: ['DISTANCE', 'COMFORT', 'FREEDOM'],
    image: '/imgs/Yamaha%20TRACER%209%20GT.webp',
    features: [
      { title: 'Sport Touring', description: 'Dynamic performance for the open road.' },
      { title: 'Touring Comfort', description: 'Made for longer days in the saddle.' },
      { title: 'Premium Versatility', description: 'Ready for the road ahead.' },
    ],
    specifications: ['Sport response', 'Touring comfort', 'Everyday versatility', 'Touring DNA'],
  },
];

export let defaultYamahaMotorcycle = yamahaMotorcycles[0];
export let yamahaAllMotorcycles = [
  ...yamahaMotorcycles.filter((m) => !yamahaIndiaCatalog.some((c) => c.id === m.id)),
  ...yamahaIndiaCatalog,
];

export function replaceYamahaMotorcycles(motorcycles) {
  if (!Array.isArray(motorcycles) || motorcycles.length === 0) {
    throw new Error('The public motorcycle catalog must contain at least one motorcycle.');
  }
  const homepageMotorcycles = motorcycles.filter((motorcycle) => motorcycle.catalogue?.market !== 'IN');
  if (homepageMotorcycles.length === 0) {
    throw new Error('The homepage motorcycle catalog must contain at least one motorcycle.');
  }
  yamahaMotorcycles = homepageMotorcycles;
  defaultYamahaMotorcycle = homepageMotorcycles[0];
  yamahaAllMotorcycles = [
    ...homepageMotorcycles,
    ...motorcycles.filter((motorcycle) => (
      motorcycle.catalogue?.market === 'IN'
      && !homepageMotorcycles.some((homepage) => homepage.id === motorcycle.id)
    )),
  ];
}

export function getYamahaMotorcycle(id) {
  if (!id) return defaultYamahaMotorcycle;
  const target = String(id).toLowerCase().trim();
  return (
    yamahaMotorcycles.find((motorcycle) => motorcycle.id.toLowerCase() === target)
    || yamahaIndiaCatalog.find((motorcycle) => motorcycle.id.toLowerCase() === target)
    || defaultYamahaMotorcycle
  );
}
