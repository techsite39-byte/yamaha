import dotenv from 'dotenv';
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, extname, join, resolve } from 'node:path';
import express from 'express';
import { auth } from 'express-openid-connect';
import helmet from 'helmet';
import { MongoClient } from 'mongodb';
import { yamahaAllMotorcycles } from '../src/components/Yamaha/yamahaMotorcycles.js';

const serverDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(serverDirectory, '..');
const publicDirectory = join(projectRoot, 'public');
const distributionDirectory = join(projectRoot, 'dist');
const motorcycleCatalogPath = join(serverDirectory, 'data', 'motorcycles.json');
const bookingsPath = join(serverDirectory, 'data', 'bookings.json');
let motorcycleMutationQueue = Promise.resolve();
let bookingMutationQueue = Promise.resolve();
dotenv.config({ path: join(serverDirectory, 'data', '.env') });
const mongoUri = process.env.MONGODB_URI?.trim();
const mongoDatabaseName = process.env.MONGODB_DATABASE?.trim() || 'yamaha';
let mongoClient;
let mongoDatabase;
const production = process.env.NODE_ENV === 'production';
const development = process.env.NODE_ENV === 'development';

function apiError(message, status, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

async function readMotorcycleCatalogFile() {
  let contents;
  try {
    contents = await readFile(motorcycleCatalogPath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return yamahaAllMotorcycles;
    throw error;
  }

  const motorcycles = JSON.parse(contents);
  if (!Array.isArray(motorcycles) || motorcycles.length === 0) {
    throw new Error('The saved motorcycle catalog must contain at least one record.');
  }
  return motorcycles;
}

function getMotorcycleCollection() {
  return mongoDatabase?.collection('motorcycles');
}

function getBookingCollection() {
  return mongoDatabase?.collection('bookings');
}

function motorcycleFromDocument({ _id, position, ...motorcycle }) {
  return motorcycle;
}

function bookingFromDocument({ _id, ...booking }) {
  return booking;
}

async function readMotorcycleCatalog() {
  const collection = getMotorcycleCollection();
  if (!collection) return readMotorcycleCatalogFile();

  const motorcycles = await collection.find().sort({ position: 1, _id: 1 }).toArray();
  return motorcycles.map(motorcycleFromDocument);
}

async function writeMotorcycleCatalog(motorcycles, session) {
  const collection = getMotorcycleCollection();
  if (collection) {
    await collection.deleteMany({}, session ? { session } : {});
    if (motorcycles.length > 0) {
      await collection.insertMany(motorcycles.map((motorcycle, position) => ({
        ...motorcycle,
        _id: motorcycle.id,
        position,
      })), session ? { session } : {});
    }
    return;
  }

  await mkdir(dirname(motorcycleCatalogPath), { recursive: true });
  const temporaryPath = `${motorcycleCatalogPath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(motorcycles, null, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  });
  await rename(temporaryPath, motorcycleCatalogPath);
}

function mutateMotorcycleCatalog(mutation) {
  const operation = motorcycleMutationQueue.then(async () => {
    const collection = getMotorcycleCollection();
    if (collection) {
      return withMongoTransaction(async (session) => {
        const motorcycles = (await collection.find({}, { session }).sort({ position: 1, _id: 1 }).toArray())
          .map(motorcycleFromDocument);
        const result = mutation(motorcycles);
        await writeMotorcycleCatalog(motorcycles, session);
        return result;
      });
    }

    const motorcycles = (await readMotorcycleCatalog()).map((motorcycle) => ({ ...motorcycle }));
    const result = mutation(motorcycles);
    await writeMotorcycleCatalog(motorcycles);
    return result;
  });
  motorcycleMutationQueue = operation.then(() => undefined, () => undefined);
  return operation;
}

async function readBookings() {
  const collection = getBookingCollection();
  if (collection) {
    return (await collection.find().sort({ createdAt: -1, reference: 1 }).toArray()).map(bookingFromDocument);
  }

  return readBookingsFile();
}

async function readBookingsFile() {
  let contents;
  try {
    contents = await readFile(bookingsPath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }

  const bookings = JSON.parse(contents);
  if (!Array.isArray(bookings)) throw new Error('The saved booking list must be an array.');
  return bookings;
}

async function writeBookings(bookings, session) {
  const collection = getBookingCollection();
  if (collection) {
    await collection.deleteMany({}, session ? { session } : {});
    if (bookings.length > 0) await collection.insertMany(bookings, session ? { session } : {});
    return;
  }

  await mkdir(dirname(bookingsPath), { recursive: true });
  const temporaryPath = `${bookingsPath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(bookings, null, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  });
  await rename(temporaryPath, bookingsPath);
}

function mutateBookings(mutation) {
  const operation = bookingMutationQueue.then(async () => {
    const bookings = await readBookings();
    const result = mutation(bookings);
    await writeBookings(bookings);
    return result;
  });
  bookingMutationQueue = operation.then(() => undefined, () => undefined);
  return operation;
}

async function createBooking(fields) {
  const collection = getBookingCollection();
  if (!collection) {
    return mutateBookings((bookings) => {
      const existing = bookings.find((item) => item.requestId === fields.requestId);
      if (existing) return existing;
      const createdAt = new Date().toISOString();
      const record = {
        ...fields,
        reference: createBookingReference(bookings),
        consentAt: createdAt,
        status: 'new',
        createdAt,
        updatedAt: createdAt,
      };
      bookings.unshift(record);
      return record;
    });
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const createdAt = new Date().toISOString();
    const record = {
      ...fields,
      reference: createBookingReference([]),
      consentAt: createdAt,
      status: 'new',
      createdAt,
      updatedAt: createdAt,
    };
    try {
      await collection.updateOne(
        { requestId: fields.requestId },
        { $setOnInsert: record },
        { upsert: true },
      );
    } catch (error) {
      const existing = await collection.findOne({ requestId: fields.requestId });
      if (existing) return bookingFromDocument(existing);
      if (error.code !== 11000 || attempt === 2) throw error;
      continue;
    }

    const saved = await collection.findOne({ requestId: fields.requestId });
    if (!saved) throw new Error('The saved booking enquiry could not be read.');
    return bookingFromDocument(saved);
  }

  throw new Error('A unique booking reference could not be created.');
}

async function setBookingStatus(reference, status) {
  const collection = getBookingCollection();
  if (collection) {
    await collection.updateOne(
      { reference },
      { $set: { status, updatedAt: new Date().toISOString() } },
    );
    const booking = await collection.findOne({ reference });
    if (!booking) throw apiError('Booking not found.', 404, 'booking_not_found');
    return bookingFromDocument(booking);
  }

  return mutateBookings((bookings) => {
    const current = bookings.find((item) => item.reference === reference);
    if (!current) throw apiError('Booking not found.', 404, 'booking_not_found');
    current.status = status;
    current.updatedAt = new Date().toISOString();
    return current;
  });
}

async function withMongoTransaction(operation) {
  const session = mongoClient.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      result = await operation(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}

async function initializeMongoDatabase() {
  if (!mongoUri) {
    if (production) throw new Error('MONGODB_URI must be configured before starting in production.');
    console.warn('MongoDB is not configured; local development is using JSON-file storage.');
    return;
  }

  mongoClient = new MongoClient(mongoUri);
  await mongoClient.connect();
  mongoDatabase = mongoClient.db(mongoDatabaseName);

  const motorcycles = getMotorcycleCollection();
  const bookings = getBookingCollection();
  await Promise.all([
    motorcycles.createIndex({ position: 1 }),
    bookings.createIndex({ requestId: 1 }, { unique: true }),
    bookings.createIndex({ reference: 1 }, { unique: true }),
    bookings.createIndex({ createdAt: -1 }),
  ]);

  await withMongoTransaction(async (session) => {
    if (await motorcycles.countDocuments({}, { session }) > 0) return;
    const seedMotorcycles = await readMotorcycleCatalogFile();
    await motorcycles.insertMany(seedMotorcycles.map((motorcycle, position) => ({
      ...motorcycle,
      _id: motorcycle.id,
      position,
    })), { session });
  });

  await withMongoTransaction(async (session) => {
    if (await bookings.countDocuments({}, { session }) > 0) return;
    const seedBookings = await readBookingsFile();
    if (seedBookings.length > 0) await bookings.insertMany(seedBookings, { session });
  });
}

function validateBookingInput(input, motorcycles) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw apiError('A booking enquiry is required.', 400, 'invalid_booking');
  }

  const motorcycleId = typeof input.motorcycleId === 'string' ? input.motorcycleId.trim() : '';
  const requestId = typeof input.requestId === 'string' ? input.requestId.trim() : '';
  if (!/^[A-Za-z0-9-]{16,80}$/.test(requestId)) {
    throw apiError('A valid booking request ID is required.', 400, 'invalid_booking');
  }
  const targetId = motorcycleId.toLowerCase();
  let motorcycle = motorcycles.find((item) => (
    item.id.toLowerCase() === targetId
    && item.catalogue?.market === 'IN'
    && item.catalogue.available
  ));
  if (!motorcycle) {
    motorcycle = motorcycles.find((item) => (
      motorcycleSlug(item.model).toLowerCase() === targetId
      && item.catalogue?.market === 'IN'
      && item.catalogue.available
    ));
  }
  if (!motorcycle) {
    const strippedTarget = targetId.replace(/[-_]india$/, '').replace(/^yamaha[-_\s]*/, '');
    motorcycle = motorcycles.find((item) => {
      if (item.catalogue?.market !== 'IN' || !item.catalogue.available) return false;
      const strippedId = item.id.toLowerCase().replace(/[-_]india$/, '').replace(/^yamaha[-_\s]*/, '');
      const strippedSlug = motorcycleSlug(item.model).toLowerCase().replace(/[-_]india$/, '').replace(/^yamaha[-_\s]*/, '');
      return strippedId === strippedTarget || strippedSlug === strippedTarget;
    });
  }
  if (!motorcycle) {
    motorcycle = motorcycles.find((item) => (
      item.id.toLowerCase() === targetId
      || motorcycleSlug(item.model).toLowerCase() === targetId
      || item.model.toLowerCase() === targetId
    ));
  }
  if (!motorcycle?.catalogue
    || motorcycle.catalogue.market !== 'IN'
    || motorcycle.catalogue.published !== true
    || motorcycle.catalogue.available !== true) {
    throw apiError('This motorcycle is not currently accepting booking enquiries.', 404, 'motorcycle_unavailable');
  }

  const catalogue = motorcycle.catalogue;
  let variant = typeof input.variant === 'string' ? input.variant.trim() : '';
  let color = typeof input.color === 'string' ? input.color.trim() : '';

  if (!variant && catalogue.variants?.length) {
    variant = catalogue.variants[0];
  }
  if (variant && catalogue.variants?.length && !catalogue.variants.includes(variant)) {
    const matchedVariant = catalogue.variants.find((v) => (
      v.toLowerCase().includes(variant.toLowerCase())
      || (variant.toLowerCase() === 'standard' && (v.toLowerCase().includes('std') || v.toLowerCase().includes('standard')))
    ));
    if (matchedVariant) {
      variant = matchedVariant;
    } else if (input.enquiry) {
      variant = catalogue.variants[0];
    } else {
      throw apiError('Choose a valid motorcycle variant.', 400, 'invalid_booking');
    }
  }

  if (!color && catalogue.colors?.length) {
    const variantColor = catalogue.colors.find((item) => variant.toLowerCase().endsWith(item.toLowerCase()));
    color = variantColor || catalogue.colors[0];
  }
  if (color && catalogue.colors?.length && !catalogue.colors.includes(color)) {
    throw apiError('Choose a valid motorcycle colour.', 400, 'invalid_booking');
  }

  const customerInput = input.customer;
  if (!customerInput || typeof customerInput !== 'object' || Array.isArray(customerInput)) {
    throw apiError('Customer contact details are required.', 400, 'invalid_booking');
  }
  const name = typeof customerInput.name === 'string' ? customerInput.name.trim() : '';
  const phone = typeof customerInput.phone === 'string' ? customerInput.phone.trim() : '';
  const email = typeof customerInput.email === 'string' ? customerInput.email.trim().toLowerCase() : '';
  const city = typeof customerInput.city === 'string' && customerInput.city.trim() ? customerInput.city.trim() : 'Chennai';
  const state = typeof customerInput.state === 'string' && customerInput.state.trim() ? customerInput.state.trim() : 'Tamil Nadu';
  const dealership = typeof customerInput.dealership === 'string' && customerInput.dealership.trim()
    ? customerInput.dealership.trim()
    : (typeof input.dealership === 'string' && input.dealership.trim() ? input.dealership.trim() : 'Vathilai Motors — Anna Salai, Chennai');
  const appointmentDate = typeof input.appointmentDate === 'string' && input.appointmentDate.trim()
    ? input.appointmentDate.trim()
    : (typeof customerInput.appointmentDate === 'string' && customerInput.appointmentDate.trim() ? customerInput.appointmentDate.trim() : new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const appointmentTime = typeof input.appointmentTime === 'string' && input.appointmentTime.trim()
    ? input.appointmentTime.trim()
    : (typeof customerInput.appointmentTime === 'string' && customerInput.appointmentTime.trim() ? customerInput.appointmentTime.trim() : '10:00 AM – 12:00 PM (Morning Slot)');
  const message = typeof customerInput.message === 'string' ? customerInput.message.trim() : '';
  const preferredContactMethod = typeof customerInput.preferredContactMethod === 'string'
    ? customerInput.preferredContactMethod.trim()
    : (typeof input.preferredContactMethod === 'string' ? input.preferredContactMethod.trim() : 'Phone Call');

  if (name.length < 2 || name.length > 100 || /[\u0000-\u001f\u007f]/.test(name)) {
    throw apiError('Enter a valid name (2 to 100 characters).', 400, 'invalid_booking');
  }
  const normalizedPhone = phone.replace(/[\s-]/g, '');
  if (!/^(?:\+?91)?[6-9]\d{9}$/.test(normalizedPhone)) {
    throw apiError('Enter a valid Indian mobile number.', 400, 'invalid_booking');
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw apiError('Enter a valid email address.', 400, 'invalid_booking');
  }
  if (city.length < 2 || city.length > 80 || /[\u0000-\u001f\u007f]/.test(city)) {
    throw apiError('Enter a valid city (2 to 80 characters).', 400, 'invalid_booking');
  }
  if (message.length > 1000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(message)) {
    throw apiError('Message must be at most 1000 characters.', 400, 'invalid_booking');
  }
  if (input.consent !== true && customerInput.consent !== true && input.enquiry !== true) {
    throw apiError('Consent is required before submitting this enquiry.', 400, 'consent_required');
  }

  const price = catalogue.prices?.find((item) => (variant ? item.variant === variant : true) && item.city === 'Chennai')
    ?? catalogue.prices?.[0];
  return {
    requestId,
    type: input.enquiry ? 'enquiry' : 'booking',
    motorcycleId: motorcycle.id,
    model: motorcycle.model,
    slug: motorcycleSlug(motorcycle.model),
    variant,
    color,
    appointmentDate,
    appointmentTime,
    dealership,
    customer: { name, phone, email, city, state, dealership, message, preferredContactMethod },
    priceSnapshot: price ? {
      variant: price.variant,
      city: price.city,
      exShowroom: price.exShowroom,
      onRoad: price.onRoad,
      source: price.source,
      sourceUrl: price.sourceUrl,
      checkedAt: price.checkedAt,
      estimated: price.estimated,
    } : null,
  };
}

function createBookingReference(bookings) {
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  let reference;
  do {
    reference = `VM${date}-${randomBytes(4).toString('hex').toUpperCase()}`;
  } while (bookings.some((booking) => booking.reference === reference));
  return reference;
}

function validateMotorcycleInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw apiError('A motorcycle object is required.', 400, 'invalid_motorcycle');
  }

  const model = typeof input.model === 'string' ? input.model.trim() : '';
  const category = typeof input.category === 'string' ? input.category.trim() : '';
  const description = typeof input.description === 'string' ? input.description.trim() : '';
  const image = typeof input.image === 'string' ? input.image.trim() : '';
  const cta = typeof input.cta === 'string' ? input.cta.trim() : '';

  if (!model || model.length > 80) {
    throw apiError('Model is required and must be at most 80 characters.', 400, 'invalid_motorcycle');
  }
  if (!category || category.length > 100) {
    throw apiError('Category is required and must be at most 100 characters.', 400, 'invalid_motorcycle');
  }
  if (!description || description.length > 2000) {
    throw apiError('Description is required and must be at most 2000 characters.', 400, 'invalid_motorcycle');
  }
  let decodedImage;
  try {
    decodedImage = decodeURIComponent(image);
  } catch {
    throw apiError('Image path must be a valid same-site public path.', 400, 'invalid_motorcycle');
  }
  if (!image.startsWith('/') || image.startsWith('//') || decodedImage.includes('\\') || decodedImage.split('/').includes('..')) {
    throw apiError('Image must be a same-site public path.', 400, 'invalid_motorcycle');
  }
  if (!cta || cta.length > 120) {
    throw apiError('Call-to-action is required and must be at most 120 characters.', 400, 'invalid_motorcycle');
  }

  const catalogue = input.catalogue === undefined ? undefined : validateCatalogueInput(input.catalogue);
  return {
    model,
    category,
    description,
    image,
    cta,
    ...(catalogue ? { catalogue } : {}),
  };
}

async function validatePublicMotorcycleImage(image) {
  let imagePath;
  try {
    imagePath = decodeURIComponent(image);
  } catch {
    throw apiError('Image path must be a valid same-site public path.', 400, 'invalid_motorcycle_image');
  }
  const filePath = resolve(publicDirectory, `.${imagePath}`);
  const extension = extname(filePath).toLowerCase();
  if (!['.avif', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp'].includes(extension)) {
    throw apiError('Image must reference an existing public image file.', 400, 'invalid_motorcycle_image');
  }

  let metadata;
  try {
    metadata = await stat(filePath);
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
      throw apiError('Image must reference an existing public image file.', 400, 'invalid_motorcycle_image');
    }
    throw error;
  }
  if (!metadata.isFile()) {
    throw apiError('Image must reference an existing public image file.', 400, 'invalid_motorcycle_image');
  }
}

function validateCatalogueInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw apiError('Catalogue metadata must be an object.', 400, 'invalid_catalogue');
  }

  const category = typeof input.category === 'string' ? input.category.trim() : '';
  const market = typeof input.market === 'string' ? input.market.trim().toUpperCase() : '';
  if (!['Sport Bikes', 'Street Bikes', 'Naked Bikes', 'Hybrid Bikes'].includes(category)) {
    throw apiError('Choose a valid India catalogue category.', 400, 'invalid_catalogue');
  }
  if (!/^[A-Z]{2}$/.test(market)) {
    throw apiError('Market must be a two-letter country code.', 400, 'invalid_catalogue');
  }
  if (typeof input.published !== 'boolean' || typeof input.available !== 'boolean') {
    throw apiError('Published and availability values must be selected.', 400, 'invalid_catalogue');
  }

  const validateStringList = (value, label, maximumItems, maximumLength) => {
    if (!Array.isArray(value) || value.length > maximumItems) {
      throw apiError(`${label} must contain no more than ${maximumItems} entries.`, 400, 'invalid_catalogue');
    }
    return value.map((item) => {
      if (typeof item !== 'string' || !item.trim() || item.trim().length > maximumLength) {
        throw apiError(`${label} entries must be non-empty and at most ${maximumLength} characters.`, 400, 'invalid_catalogue');
      }
      return item.trim();
    });
  };

  const variants = validateStringList(input.variants, 'Variants', 30, 100);
  const colors = validateStringList(input.colors, 'Colours', 50, 80);
  if (!Array.isArray(input.specifications) || input.specifications.length > 100) {
    throw apiError('Specifications must contain no more than 100 entries.', 400, 'invalid_catalogue');
  }
  const specifications = input.specifications.map((row) => {
    const section = typeof row?.section === 'string' ? row.section.trim() : '';
    const label = typeof row?.label === 'string' ? row.label.trim() : '';
    const value = typeof row?.value === 'string' ? row.value.trim() : '';
    if (!section || section.length > 80 || !label || label.length > 100 || !value || value.length > 300) {
      throw apiError('Each specification requires a section, label, and value.', 400, 'invalid_catalogue');
    }
    return { section, label, value };
  });

  if (!Array.isArray(input.prices) || input.prices.length > 50) {
    throw apiError('Prices must contain no more than 50 entries.', 400, 'invalid_catalogue');
  }
  const prices = input.prices.map((row) => {
    const variant = typeof row?.variant === 'string' ? row.variant.trim() : '';
    const city = typeof row?.city === 'string' ? row.city.trim() : '';
    const source = typeof row?.source === 'string' ? row.source.trim() : '';
    const sourceUrl = typeof row?.sourceUrl === 'string' ? row.sourceUrl.trim() : '';
    const checkedAt = typeof row?.checkedAt === 'string' ? row.checkedAt.trim() : '';
    const exShowroom = row?.exShowroom === null ? null : Number(row?.exShowroom);
    const onRoad = row?.onRoad === null ? null : Number(row?.onRoad);
    if (!variant || variant.length > 100 || !city || city.length > 80 || !source || source.length > 80) {
      throw apiError('Each price requires a variant, city, and source.', 400, 'invalid_catalogue');
    }
    if (![exShowroom, onRoad].every((amount) => amount === null || (Number.isSafeInteger(amount) && amount > 0 && amount <= 20000000))) {
      throw apiError('Prices must be positive whole-rupee amounts or unavailable.', 400, 'invalid_catalogue');
    }
    if (sourceUrl) {
      let parsedSourceUrl;
      try {
        parsedSourceUrl = new URL(sourceUrl);
      } catch {
        throw apiError('Price source must be a valid HTTPS URL.', 400, 'invalid_catalogue');
      }
      if (parsedSourceUrl.protocol !== 'https:') {
        throw apiError('Price source must be a valid HTTPS URL.', 400, 'invalid_catalogue');
      }
    }
    if (checkedAt && !/^\d{4}-\d{2}-\d{2}$/.test(checkedAt)) {
      throw apiError('Price source date must use YYYY-MM-DD format.', 400, 'invalid_catalogue');
    }
    if (typeof row?.estimated !== 'boolean') {
      throw apiError('Price estimate status must be selected.', 400, 'invalid_catalogue');
    }
    return { variant, city, exShowroom, onRoad, source, sourceUrl, checkedAt, estimated: row.estimated };
  });

  if (!Array.isArray(input.gallery) || input.gallery.length > 30) {
    throw apiError('Gallery must contain no more than 30 images.', 400, 'invalid_catalogue');
  }
  const gallery = input.gallery.map((image) => {
    if (typeof image !== 'string' || !image.trim()) {
      throw apiError('Gallery image paths must be non-empty public paths.', 400, 'invalid_catalogue');
    }
    const path = image.trim();
    let decodedPath;
    try {
      decodedPath = decodeURIComponent(path);
    } catch {
      throw apiError('Gallery image path must be a valid same-site public path.', 400, 'invalid_catalogue');
    }
    if (!path.startsWith('/') || path.startsWith('//') || decodedPath.includes('\\') || decodedPath.split('/').includes('..')) {
      throw apiError('Gallery images must use same-site public paths.', 400, 'invalid_catalogue');
    }
    return path;
  });

  const officialSourceUrl = typeof input.officialSourceUrl === 'string' ? input.officialSourceUrl.trim() : '';
  if (officialSourceUrl) {
    let parsedOfficialUrl;
    try {
      parsedOfficialUrl = new URL(officialSourceUrl);
    } catch {
      throw apiError('Official source must be a valid HTTPS URL.', 400, 'invalid_catalogue');
    }
    if (parsedOfficialUrl.protocol !== 'https:') {
      throw apiError('Official source must be a valid HTTPS URL.', 400, 'invalid_catalogue');
    }
  }

  const priceNote = input.priceNote === undefined
    ? undefined
    : typeof input.priceNote === 'string' ? input.priceNote.trim() : null;
  if (priceNote === null || priceNote.length > 1000) {
    throw apiError('Price notes must be at most 1000 characters.', 400, 'invalid_catalogue');
  }

  return {
    market,
    category,
    published: input.published,
    available: input.available,
    variants,
    colors,
    specifications,
    prices,
    gallery,
    officialSourceUrl,
    ...(priceNote !== undefined ? { priceNote } : {}),
  };
}

function motorcycleSlug(model) {
  return model.normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const authConfiguration = {
  baseURL: process.env.AUTH0_BASE_URL,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  secret: process.env.AUTH0_SECRET,
};
const authKeys = Object.keys(authConfiguration);
const suppliedAuthKeys = authKeys.filter((key) => authConfiguration[key]);
const authConfigured = suppliedAuthKeys.length === authKeys.length;
const allowedSubjects = new Set(
  (process.env.ADMIN_ALLOWED_SUBJECTS ?? '')
    .split(',')
    .map((subject) => subject.trim())
    .filter(Boolean),
);

if (suppliedAuthKeys.length > 0 && !authConfigured) {
  const missingKeys = authKeys.filter((key) => !authConfiguration[key]);
  throw new Error(`Auth0 configuration is incomplete. Missing settings: ${missingKeys.join(', ')}.`);
}

if (authConfigured) {
  if (authConfiguration.secret.length < 32) {
    throw new Error('AUTH0_SECRET must contain at least 32 characters.');
  }
  if (allowedSubjects.size === 0) {
    throw new Error('Set ADMIN_ALLOWED_SUBJECTS to one or more exact Auth0 user subject IDs.');
  }
  if (production && new URL(authConfiguration.baseURL).protocol !== 'https:') {
    throw new Error('AUTH0_BASE_URL must use HTTPS in production.');
  }
} else if (production) {
  throw new Error('Auth0 must be configured before starting the admin API in production.');
}

if (production && !existsSync(join(distributionDirectory, 'index.html'))) {
  throw new Error('Production build is missing. Run the Vite build before starting the server.');
}

const app = express();
app.disable('x-powered-by');
app.use(helmet({
  hsts: production ? { maxAge: 15552000, includeSubDomains: false } : false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      mediaSrc: ["'self'", 'blob:'],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'upgrade-insecure-requests': production ? [] : null,
    },
  },
}));
app.use(express.json({ limit: '32kb' }));

if (authConfigured) {
  app.use(auth({
    authRequired: false,
    auth0Logout: true,
    baseURL: authConfiguration.baseURL,
    clientID: authConfiguration.clientID,
    clientSecret: authConfiguration.clientSecret,
    issuerBaseURL: authConfiguration.issuerBaseURL,
    secret: authConfiguration.secret,
    authorizationParams: {
      response_type: 'code',
      scope: 'openid profile email',
    },
    routes: {
      login: false,
      postLogoutRedirect: '/admin',
    },
    session: {
      absoluteDuration: 8 * 60 * 60,
      rollingDuration: 60 * 60,
      cookie: {
        httpOnly: true,
        path: '/',
        sameSite: 'Lax',
        secure: production,
      },
    },
  }));
}

function getAdminReturnPath(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return '/admin';
  }

  const baseURL = new URL(authConfiguration.baseURL);
  const destination = new URL(value, baseURL);
  if (destination.origin !== baseURL.origin
    || (destination.pathname !== '/admin' && !destination.pathname.startsWith('/admin/'))) {
    return '/admin';
  }

  return `${destination.pathname}${destination.search}${destination.hash}`;
}

app.get('/login', (request, response, next) => {
  if (!authConfigured) {
    return response.status(503).json({ code: 'auth_not_configured' });
  }

  return request.oidc.login({
    returnTo: getAdminReturnPath(request.query.returnTo),
  }).catch(next);
});

app.use('/api', (request, response, next) => {
  response.set('Cache-Control', 'no-store');
  next();
});

app.get('/api/admin/session', (request, response) => {
  if (!authConfigured) {
    if (development) {
      return response.json({
        authenticated: true,
        isAdmin: true,
        developmentAccess: true,
        user: { name: 'Local Developer' },
      });
    }
    return response.status(503).json({
      code: 'auth_not_configured',
      message: 'Auth0 is not configured for this server.',
    });
  }

  const authenticated = request.oidc?.isAuthenticated() ?? false;
  if (!authenticated) {
    return response.json({ authenticated: false, isAdmin: false });
  }

  const user = request.oidc.user;
  const isAdmin = Boolean(user?.sub && allowedSubjects.has(user.sub));
  return response.json({
    authenticated: true,
    isAdmin,
    user: isAdmin
      ? { name: user.name ?? user.email ?? 'Administrator' }
      : undefined,
  });
});

function requireAdmin(request, response, next) {
  if (!authConfigured) {
    if (development) return next();
    return response.status(503).json({ code: 'auth_not_configured' });
  }

  if (!request.oidc?.isAuthenticated()) {
    return response.status(401).json({ code: 'authentication_required' });
  }

  const subject = request.oidc.user?.sub;
  if (!subject || !allowedSubjects.has(subject)) {
    return response.status(403).json({ code: 'admin_access_required' });
  }

  return next();
}

app.use('/api/admin', (request, response, next) => {
  if (request.path === '/session') return next();
  return requireAdmin(request, response, next);
});

app.get('/api/public/motorcycles', async (request, response, next) => {
  try {
    return response.json({ motorcycles: await readMotorcycleCatalog() });
  } catch (error) {
    return next(error);
  }
});

app.post(['/api/public/bookings', '/api/public/enquiries'], async (request, response, next) => {
  try {
    const motorcycles = await readMotorcycleCatalog();
    const fields = validateBookingInput(request.body, motorcycles);
    const booking = await createBooking(fields);
    return response.status(201).json({
      reference: booking.reference,
      message: 'Your booking enquiry has been received.',
      booking,
    });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/admin/overview', async (request, response, next) => {
  try {
    const [motorcycles, bookings] = await Promise.all([readMotorcycleCatalog(), readBookings()]);
    return response.json({
      source: mongoDatabase ? 'mongodb' : 'project-files',
      databaseConnected: Boolean(mongoDatabase),
      mediaStorageConnected: false,
      analyticsConnected: false,
      authConfigured,
      totalMotorcycles: motorcycles.length,
      totalBookings: bookings.length,
      websitePages: ['/', '/services', '/motorcycle-details', '/bikes', '/bike-details', '/book-now'],
      serviceVideoCount: 6,
    });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/admin/motorcycles', async (request, response, next) => {
  try {
    const motorcycles = await readMotorcycleCatalog();
    return response.json({
      source: mongoDatabase
        ? 'mongodb'
        : existsSync(motorcycleCatalogPath) ? 'server-data-file' : 'static-project-files',
      editable: true,
      motorcycles,
    });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/admin/motorcycles', async (request, response, next) => {
  try {
    const fields = validateMotorcycleInput(request.body);
    await validatePublicMotorcycleImage(fields.image);
    await Promise.all((fields.catalogue?.gallery ?? []).map(validatePublicMotorcycleImage));
    const motorcycle = await mutateMotorcycleCatalog((motorcycles) => {
      const id = motorcycleSlug(fields.model);
      if (!id) throw apiError('Model must contain letters or numbers.', 400, 'invalid_motorcycle');
      if (motorcycles.some((item) => item.id === id)) {
        throw apiError('A motorcycle with this model ID already exists.', 409, 'motorcycle_exists');
      }

      const words = fields.model.split(/\s+/);
      const splitAt = Math.max(1, Math.ceil(words.length / 2));
      const record = {
        id,
        ...fields,
        heading: [words.slice(0, splitAt).join(' '), words.slice(splitAt).join(' ')],
        signature: fields.category.split('/').map((item) => item.trim()).filter(Boolean).slice(0, 3),
        features: [{ title: fields.model, description: fields.description }],
        specifications: [],
      };
      motorcycles.push(record);
      return record;
    });
    return response.status(201).json({ motorcycle });
  } catch (error) {
    return next(error);
  }
});

app.put('/api/admin/motorcycles/:id', async (request, response, next) => {
  try {
    const fields = validateMotorcycleInput(request.body);
    await validatePublicMotorcycleImage(fields.image);
    await Promise.all((fields.catalogue?.gallery ?? []).map(validatePublicMotorcycleImage));
    const motorcycle = await mutateMotorcycleCatalog((motorcycles) => {
      const index = motorcycles.findIndex((item) => item.id === request.params.id);
      if (index < 0) throw apiError('Motorcycle not found.', 404, 'motorcycle_not_found');
      const words = fields.model.split(/\s+/);
      const splitAt = Math.max(1, Math.ceil(words.length / 2));
      const updated = {
        ...motorcycles[index],
        ...fields,
        ...(fields.catalogue ? {
          catalogue: {
            ...motorcycles[index].catalogue,
            ...fields.catalogue,
          },
        } : {}),
        heading: [words.slice(0, splitAt).join(' '), words.slice(splitAt).join(' ')],
      };
      motorcycles[index] = updated;
      return updated;
    });
    return response.json({ motorcycle });
  } catch (error) {
    return next(error);
  }
});

app.delete('/api/admin/motorcycles/:id', async (request, response, next) => {
  try {
    await mutateMotorcycleCatalog((motorcycles) => {
      const index = motorcycles.findIndex((item) => item.id === request.params.id);
      if (index < 0) throw apiError('Motorcycle not found.', 404, 'motorcycle_not_found');
      if (motorcycles.length === 1) {
        throw apiError('The public catalog must contain at least one motorcycle.', 409, 'last_motorcycle');
      }
      motorcycles.splice(index, 1);
      return undefined;
    });
    return response.status(204).end();
  } catch (error) {
    return next(error);
  }
});

app.post(
  '/api/admin/motorcycles/:id/images',
  express.raw({ type: ['image/webp', 'image/jpeg', 'image/png'], limit: '5mb' }),
  async (request, response, next) => {
    try {
      if (!Buffer.isBuffer(request.body) || request.body.length === 0) {
        throw apiError('Upload a non-empty WebP, JPEG, or PNG image.', 400, 'invalid_image_upload');
      }

      const contentType = request.get('content-type')?.split(';')[0].trim().toLowerCase();
      const buffer = request.body;
      const validPng = buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'));
      const validJpeg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
      const validWebp = buffer.length >= 12
        && buffer.toString('ascii', 0, 4) === 'RIFF'
        && buffer.toString('ascii', 8, 12) === 'WEBP';
      const imageType = validWebp
        ? { mime: 'image/webp', extension: 'webp' }
        : validJpeg
          ? { mime: 'image/jpeg', extension: 'jpg' }
          : validPng
            ? { mime: 'image/png', extension: 'png' }
            : null;
      if (!imageType || contentType !== imageType.mime) {
        throw apiError('The uploaded image content does not match its file type.', 400, 'invalid_image_upload');
      }

      const motorcycles = await readMotorcycleCatalog();
      const motorcycle = motorcycles.find((item) => item.id === request.params.id);
      if (!motorcycle) throw apiError('Motorcycle not found.', 404, 'motorcycle_not_found');

      const uploadDirectory = join(publicDirectory, 'imgs', 'catalog', 'uploads');
      await mkdir(uploadDirectory, { recursive: true });
      const filename = `${motorcycleSlug(motorcycle.model)}-${Date.now()}-${randomBytes(6).toString('hex')}.${imageType.extension}`;
      await writeFile(join(uploadDirectory, filename), buffer, { flag: 'wx', mode: 0o644 });
      return response.status(201).json({ imagePath: `/imgs/catalog/uploads/${filename}` });
    } catch (error) {
      return next(error);
    }
  },
);

app.get(['/api/admin/bookings', '/api/admin/enquiries'], async (request, response, next) => {
  try {
    const bookings = await readBookings();
    return response.json({
      source: mongoDatabase ? 'mongodb' : existsSync(bookingsPath) ? 'server-data-file' : 'empty',
      editable: true,
      bookings,
      enquiries: bookings,
    });
  } catch (error) {
    return next(error);
  }
});

async function updateBookingStatus(request, response, next) {
  try {
    const status = typeof request.body?.status === 'string' ? request.body.status.trim() : '';
    if (!['new', 'contacted', 'confirmed', 'cancelled'].includes(status)) {
      throw apiError('Choose a valid booking status.', 400, 'invalid_booking_status');
    }

    const booking = await setBookingStatus(request.params.reference, status);
    return response.json({ booking });
  } catch (error) {
    return next(error);
  }
}

app.put(['/api/admin/bookings/:reference/status', '/api/admin/enquiries/:reference/status'], updateBookingStatus);
app.patch(['/api/admin/bookings/:reference/status', '/api/admin/enquiries/:reference/status'], updateBookingStatus);

app.get('/api/admin/service-videos', async (request, response, next) => {
  try {
    const videos = await Promise.all(
      Array.from({ length: 6 }, async (_, index) => {
        const filename = `s${index + 1}.mp4`;
        const filePath = join(publicDirectory, filename);
        const metadata = await stat(filePath);
        return {
          filename,
          path: `/${filename}`,
          order: index + 1,
          sizeBytes: metadata.size,
          editable: false,
        };
      }),
    );
    return response.json({ source: 'public-files', editable: false, videos });
  } catch (error) {
    return next(error);
  }
});

app.use('/api', (request, response) => {
  response.status(404).json({ code: 'api_route_not_found' });
});

if (!production) {
  app.get('/', (request, response) => response.status(200).send('Yamaha admin API is running.'));
}

if (production) {
  app.use(express.static(distributionDirectory, { index: false }));
  app.use((request, response, next) => {
    if (!['GET', 'HEAD'].includes(request.method)) {
      return response.status(404).json({ code: 'route_not_found' });
    }
    return response.sendFile(join(distributionDirectory, 'index.html'), (error) => {
      if (error) next(error);
    });
  });
}

app.use((error, request, response, next) => {
  const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 500
    ? error.status
    : 500;
  if (status === 500) console.error('Unhandled admin server error:', error);
  if (response.headersSent) return next(error);
  return response.status(status).json({
    code: status === 500 ? 'internal_server_error' : error.code ?? 'request_failed',
    ...(status < 500 ? { message: error.message } : {}),
  });
});

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? '127.0.0.1';
export { app };

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  initializeMongoDatabase()
    .then(() => {
      app.listen(port, host, () => {
        if (authConfigured) {
          console.info(`Auth0 admin API listening on http://${host}:${port}.`);
        } else if (development) {
          console.warn('Admin API is using local development access. Do not expose it to the public internet.');
        } else {
          console.warn('Admin API started without Auth0; admin API access is disabled.');
        }
      });
    })
    .catch(async () => {
      console.error('MongoDB initialization failed. Check MONGODB_URI, database access, and network settings.');
      await mongoClient?.close();
      process.exitCode = 1;
    });
}
