import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptsDir = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = resolve(scriptsDir, '..');
const distDir = join(projectRoot, 'dist');
const indexPath = join(distDir, 'index.html');

async function generateStaticRoutes() {
  console.log('[postbuild] Reading index.html from:', indexPath);
  const rawHtml = await readFile(indexPath, 'utf8');

  const routeConfigs = [
    {
      slug: 'privacy-policy',
      title: 'Privacy Policy | Vathilai Motors – Authorised Yamaha Dealership',
      desc: 'Official Privacy Policy for Vathilai Motors, Authorised Yamaha Dealership in Batlagundu. Customer data collection, protection, WhatsApp communications, and privacy rights.',
    },
    {
      slug: 'terms',
      title: 'Terms & Conditions | Vathilai Motors – Authorised Yamaha Dealership',
      desc: 'Official Terms & Conditions for Vathilai Motors, Authorised Yamaha Dealership. Motorcycle pricing, booking guidelines, test rides, and dealership policies.',
    },
    {
      slug: 'data-deletion',
      title: 'Data Deletion Instructions | Vathilai Motors – Authorised Yamaha Dealership',
      desc: 'User Data Deletion Instructions and customer record erasure requests for Vathilai Motors, Authorised Yamaha Dealership.',
    },
    { slug: 'bikes' },
    { slug: 'services' },
    { slug: 'book-now' },
    { slug: 'book-us' },
    { slug: 'motorcycle-details' },
    {
      slug: 'admin',
      title: 'Admin Portal | Vathilai Motors Dealership Management',
      desc: 'Authorised Dealership Administration Portal for Vathilai Motors Yamaha.',
    },
    { slug: 'admin/bookings' },
    { slug: 'admin/enquiries' },
    { slug: 'admin/motorcycles' },
    { slug: 'admin/service-videos' },
    { slug: 'admin/social' },
    { slug: 'admin/reviews' },
    { slug: 'admin/home-page' },
    { slug: 'admin/media' },
    { slug: 'admin/analytics' },
    { slug: 'admin/profile' },
    { slug: 'admin/seo' },
    { slug: 'admin/users' },
    { slug: 'admin/activity' },
    { slug: 'admin/settings' },
  ];

  for (const item of routeConfigs) {
    const targetDir = join(distDir, item.slug);
    await mkdir(targetDir, { recursive: true });
    let customHtml = rawHtml;
    if (item.title) {
      customHtml = customHtml.replace(/<title>.*?<\/title>/i, `<title>${item.title}</title>`);
    }
    if (item.desc) {
      customHtml = customHtml.replace(/<meta name="description" content=".*?" \/>/i, `<meta name="description" content="${item.desc}" />`);
    }
    const outputPath = join(targetDir, 'index.html');
    await writeFile(outputPath, customHtml, 'utf8');
    console.log(`[postbuild] Generated static SPA entry: /${item.slug}/index.html`);
  }
}

generateStaticRoutes()
  .then(() => {
    console.log('[postbuild] All static SPA routes generated successfully!');
  })
  .catch((err) => {
    console.error('[postbuild] Failed to generate static routes:', err);
    process.exit(1);
  });
