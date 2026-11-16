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
import {
  setMongoDatabaseReference,
  serviceVideosStore,
  socialProfilesStore,
  socialPostsStore,
  reviewsStore,
  galleryStore,
  websiteContentStore,
  homePageStore,
  websiteSectionsStore,
  mediaLibraryStore,
  seoSettingsStore,
  usersStore,
  siteSettingsStore,
  activityStore,
  logAdminActivity,
} from './adminStores.js';
import { projectAdminOverview } from './adminOverview.js';
import {
  normalizeWhatsAppNumber,
  formatBookingWhatsAppText,
  sendWhatsAppMessage,
  verifyWhatsAppWebhookChallenge,
  parseWhatsAppWebhookPayload,
  shouldUpdateStatus,
} from './whatsappService.js';
import {
  setAuthMongoDatabase,
  verifyAdminCredentials,
  createAdminSession,
  getAdminSession,
  revokeAdminSession,
  generatePasswordResetCode,
  resetAdminPassword,
  listAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
} from './authService.js';
import {
  sendPasswordResetEmail,
  isSmtpConfigured,
  getSmtpStatus,
  verifySmtpConnection,
} from './emailService.js';

const serverDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(serverDirectory, '..');
const publicDirectory = join(projectRoot, 'public');
const distributionDirectory = join(projectRoot, 'dist');
const motorcycleCatalogPath = join(serverDirectory, 'data', 'motorcycles.json');
const bookingsPath = join(serverDirectory, 'data', 'bookings.json');
let motorcycleMutationQueue = Promise.resolve();
let bookingMutationQueue = Promise.resolve();
dotenv.config({ path: join(serverDirectory, '.env') });
dotenv.config({ path: join(serverDirectory, 'data', '.env') });
const mongoUri = process.env.MONGODB_URI?.trim();
const mongoDatabaseName = process.env.MONGODB_DATABASE?.trim() || 'yamaha';
let mongoClient;
let mongoDatabase;
const production = process.env.NODE_ENV === 'production';
const development = process.env.NODE_ENV === 'development' || !production;
const isStandaloneExecution = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

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
    if (error.code === 'ENOENT') {
      await writeMotorcycleCatalog(yamahaAllMotorcycles);
      return yamahaAllMotorcycles;
    }
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

function isDummyOrMockBooking(booking) {
  if (!booking || typeof booking !== 'object') return true;
  const email = String(booking.email || booking.customer?.email || '').trim().toLowerCase();
  const name = String(booking.customerName || booking.customer?.name || booking.name || '').trim().toLowerCase();
  const requestId = String(booking.requestId || '').trim().toLowerCase();
  if (email.endsWith('@example.com') || email.includes('example.com')) return true;
  if (requestId.startsWith('test-') || requestId.startsWith('demo-')) return true;
  if (name === 'vikram chandran' || name === 'priya sundaram') return true;
  return false;
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
      const reference = createBookingReference(bookings);
      const record = {
        ...fields,
        reference,
        enquiryId: reference,
        enquiryStatus: 'new',
        status: 'new',
        source: fields.source || (fields.type === 'enquiry' ? 'motorcycle-details' : 'booking'),
        customerName: fields.customerName || fields.customer?.name,
        mobileNumber: fields.mobileNumber || fields.customer?.phone,
        email: fields.email || fields.customer?.email,
        city: fields.city || fields.customer?.city,
        preferredContactMethod: fields.preferredContactMethod || fields.customer?.preferredContactMethod || 'Call',
        message: fields.message || fields.customer?.message || '',
        motorcycleModel: fields.motorcycleModel || fields.model,
        motorcycleVariant: fields.motorcycleVariant || fields.variant,
        motorcycleCategory: fields.motorcycleCategory || fields.category || 'Sport',
        motorcycleId: fields.motorcycleId,
        slug: fields.slug,
        consentAt: createdAt,
        whatsappStatus: 'NOT_SENT',
        whatsappMessageId: null,
        whatsappRecipient: fields.customer?.phone || fields.mobileNumber || fields.phone || null,
        whatsappSentAt: null,
        whatsappDeliveredAt: null,
        whatsappReadAt: null,
        whatsappFailedAt: null,
        whatsappError: null,
        createdAt,
        updatedAt: createdAt,
      };
      bookings.unshift(record);
      return record;
    });
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const createdAt = new Date().toISOString();
    const reference = createBookingReference([]);
    const record = {
      ...fields,
      reference,
      enquiryId: reference,
      enquiryStatus: 'new',
      status: 'new',
      source: fields.source || (fields.type === 'enquiry' ? 'motorcycle-details' : 'booking'),
      customerName: fields.customerName || fields.customer?.name,
      mobileNumber: fields.mobileNumber || fields.customer?.phone,
      email: fields.email || fields.customer?.email,
      city: fields.city || fields.customer?.city,
      preferredContactMethod: fields.preferredContactMethod || fields.customer?.preferredContactMethod || 'Call',
      message: fields.message || fields.customer?.message || '',
      motorcycleModel: fields.motorcycleModel || fields.model,
      motorcycleVariant: fields.motorcycleVariant || fields.variant,
      motorcycleCategory: fields.motorcycleCategory || fields.category || 'Sport',
      motorcycleId: fields.motorcycleId,
      slug: fields.slug,
      consentAt: createdAt,
      whatsappStatus: 'NOT_SENT',
      whatsappMessageId: null,
      whatsappRecipient: fields.customer?.phone || fields.mobileNumber || fields.phone || null,
      whatsappSentAt: null,
      whatsappDeliveredAt: null,
      whatsappReadAt: null,
      whatsappFailedAt: null,
      whatsappError: null,
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

async function setBookingStatus(reference, status, notes) {
  const validStatuses = ['new', 'contacted', 'confirmed', 'cancelled', 'follow-up', 'converted'];
  if (!validStatuses.includes(status)) {
    throw apiError('Choose a valid booking status.', 400, 'invalid_booking_status');
  }
  const collection = getBookingCollection();
  if (collection) {
    const updateDoc = {
      status,
      enquiryStatus: status,
      updatedAt: new Date().toISOString(),
    };
    if (notes !== undefined) updateDoc.notes = typeof notes === 'string' ? notes.trim() : '';
    await collection.updateOne(
      { reference },
      { $set: updateDoc },
    );
    const booking = await collection.findOne({ reference });
    if (!booking) throw apiError('Booking not found.', 404, 'booking_not_found');
    await logAdminActivity('STATUS_CHANGE', `Booking: ${reference}`, `Status changed to ${status}`);
    return bookingFromDocument(booking);
  }

  return mutateBookings((bookings) => {
    const current = bookings.find((item) => item.reference === reference);
    if (!current) throw apiError('Booking not found.', 404, 'booking_not_found');
    current.status = status;
    current.enquiryStatus = status;
    if (notes !== undefined) current.notes = typeof notes === 'string' ? notes.trim() : '';
    current.updatedAt = new Date().toISOString();
    logAdminActivity('STATUS_CHANGE', `Booking: ${reference}`, `Status changed to ${status}`);
    return current;
  });
}

async function updateBookingDetails(reference, updates) {
  const collection = getBookingCollection();
  if (collection) {
    const existing = await collection.findOne({ reference });
    if (!existing) throw apiError('Booking not found.', 404, 'booking_not_found');
    const updated = {
      ...existing,
      ...updates,
      customer: { ...(existing.customer || {}), ...(updates.customer || {}) },
      updatedAt: new Date().toISOString(),
    };
    await collection.replaceOne({ reference }, updated);
    await logAdminActivity('UPDATE', `Booking: ${reference}`, `Updated details`);
    return bookingFromDocument(updated);
  }

  return mutateBookings((bookings) => {
    const index = bookings.findIndex((item) => item.reference === reference);
    if (index < 0) throw apiError('Booking not found.', 404, 'booking_not_found');
    const existing = bookings[index];
    const updated = {
      ...existing,
      ...updates,
      customer: { ...(existing.customer || {}), ...(updates.customer || {}) },
      updatedAt: new Date().toISOString(),
    };
    bookings[index] = updated;
    logAdminActivity('UPDATE', `Booking: ${reference}`, `Updated details`);
    return updated;
  });
}

async function deleteBookingRecord(reference) {
  const collection = getBookingCollection();
  if (collection) {
    const res = await collection.deleteOne({ reference });
    if (res.deletedCount === 0) throw apiError('Booking not found.', 404, 'booking_not_found');
    await logAdminActivity('DELETE', `Booking: ${reference}`, 'Deleted booking record');
    return true;
  }

  return mutateBookings((bookings) => {
    const index = bookings.findIndex((item) => item.reference === reference);
    if (index < 0) throw apiError('Booking not found.', 404, 'booking_not_found');
    bookings.splice(index, 1);
    logAdminActivity('DELETE', `Booking: ${reference}`, 'Deleted booking record');
    return true;
  });
}

async function updateBookingWhatsAppFields(reference, updates) {
  const collection = getBookingCollection();
  const updateDoc = {
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  if (collection) {
    await collection.updateOne({ reference }, { $set: updateDoc });
    const doc = await collection.findOne({ reference });
    return doc ? bookingFromDocument(doc) : null;
  }

  return mutateBookings((bookings) => {
    const booking = bookings.find((item) => item.reference === reference);
    if (!booking) return null;
    Object.assign(booking, updateDoc);
    return booking;
  });
}

async function updateBookingWhatsAppDelivery({ messageId, status, timestamp, error }) {
  if (!messageId) return null;
  const collection = getBookingCollection();
  const now = new Date().toISOString();
  const eventTime = timestamp || now;

  if (collection) {
    const existing = await collection.findOne({ whatsappMessageId: messageId });
    if (!existing) {
      console.warn(`[WhatsApp Webhook] No booking found for message ID: ${messageId}`);
      return null;
    }

    if (!shouldUpdateStatus(existing.whatsappStatus, status)) {
      console.log(`[WhatsApp Webhook] Ignored regressive status update ${status} for existing ${existing.whatsappStatus} (${existing.reference})`);
      return bookingFromDocument(existing);
    }

    const setDoc = {
      whatsappStatus: status,
      updatedAt: now,
    };

    if (status === 'SENT') {
      setDoc.whatsappSentAt = eventTime;
    } else if (status === 'DELIVERED') {
      setDoc.whatsappDeliveredAt = eventTime;
    } else if (status === 'READ') {
      setDoc.whatsappReadAt = eventTime;
    } else if (status === 'FAILED') {
      setDoc.whatsappFailedAt = eventTime;
      if (error) setDoc.whatsappError = error;
    }

    await collection.updateOne({ whatsappMessageId: messageId }, { $set: setDoc });
    const updated = await collection.findOne({ whatsappMessageId: messageId });
    return updated ? bookingFromDocument(updated) : null;
  }

  return mutateBookings((bookings) => {
    const booking = bookings.find((b) => b.whatsappMessageId === messageId);
    if (!booking) return null;

    if (!shouldUpdateStatus(booking.whatsappStatus, status)) {
      return booking;
    }

    booking.whatsappStatus = status;
    booking.updatedAt = now;

    if (status === 'SENT') {
      booking.whatsappSentAt = eventTime;
    } else if (status === 'DELIVERED') {
      booking.whatsappDeliveredAt = eventTime;
    } else if (status === 'READ') {
      booking.whatsappReadAt = eventTime;
    } else if (status === 'FAILED') {
      booking.whatsappFailedAt = eventTime;
      if (error) booking.whatsappError = error;
    }

    return booking;
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
    if (production && isStandaloneExecution) throw new Error('MONGODB_URI must be configured before starting in production.');
    console.warn('MongoDB is not configured; local development is using JSON-file storage.');
    return;
  }

  mongoClient = new MongoClient(mongoUri);
  try {
    await mongoClient.connect();
    const database = mongoClient.db(mongoDatabaseName);
    const motorcycles = database.collection('motorcycles');
    const bookings = database.collection('bookings');
    await Promise.all([
      motorcycles.createIndex({ position: 1 }),
      bookings.createIndex({ requestId: 1 }, { unique: true }),
      bookings.createIndex({ reference: 1 }, { unique: true }),
      bookings.createIndex({ createdAt: -1 }),
    ]);

    // Purge legacy dummy / test seed records so only real customer records appear in database
    try {
      await bookings.deleteMany({
        $or: [
          { 'customer.name': { $in: ['Vikram Chandran', 'Priya Sundaram'] } },
          { customerName: { $in: ['Vikram Chandran', 'Priya Sundaram'] } },
          { 'customer.email': /example\.com$/i },
          { email: /example\.com$/i },
          { requestId: /^test-/i },
          { requestId: /^demo-/i },
        ],
      });
    } catch (cleanupErr) {
      console.warn('Could not purge legacy seed records from MongoDB:', cleanupErr.message);
    }

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
      const seedBookings = (await readBookingsFile()).filter((b) => !isDummyOrMockBooking(b));
      if (seedBookings.length > 0) await bookings.insertMany(seedBookings, { session });
    });

    mongoDatabase = database;
    setMongoDatabaseReference(database);
    setAuthMongoDatabase(database);
  } catch (error) {
    await mongoClient.close();
    mongoClient = undefined;
    throw error;
  }
}

function validateBookingInput(input, motorcycles) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw apiError('A booking enquiry is required.', 400, 'invalid_booking');
  }

  const motorcycleId = typeof input.motorcycleId === 'string' && input.motorcycleId.trim()
    ? input.motorcycleId.trim()
    : (typeof input.motorcycleModel === 'string' && input.motorcycleModel.trim()
        ? input.motorcycleModel.trim()
        : (typeof input.model === 'string' && input.model.trim() ? input.model.trim() : ''));
  const requestId = typeof input.requestId === 'string' && /^[A-Za-z0-9-]{16,80}$/.test(input.requestId.trim())
    ? input.requestId.trim()
    : `req-${Date.now()}-${randomBytes(8).toString('hex')}`;
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
      || (input.motorcycleModel && item.model.toLowerCase() === input.motorcycleModel.toLowerCase())
    ));
  }
  if (!motorcycle?.catalogue) {
    if (input.enquiry && motorcycle) {
      motorcycle.catalogue = {
        market: 'IN',
        category: motorcycle.category || 'Sport Bikes',
        published: true,
        available: true,
        variants: ['Standard'],
        colors: ['Racing Blue', 'Black'],
      };
    } else if (input.enquiry) {
      motorcycle = {
        id: motorcycleId || 'enquiry-motorcycle',
        model: input.motorcycleModel || input.model || 'Yamaha Motorcycle',
        category: input.motorcycleCategory || input.category || 'Sport',
        catalogue: {
          market: 'IN',
          category: input.motorcycleCategory || input.category || 'Sport',
          published: true,
          available: true,
          variants: [input.motorcycleVariant || input.variant || 'Standard'],
          colors: ['Standard'],
        },
      };
    } else {
      throw apiError('This motorcycle is not currently accepting booking enquiries.', 404, 'motorcycle_unavailable');
    }
  } else if (!input.enquiry && (
    motorcycle.catalogue.market !== 'IN'
    || motorcycle.catalogue.published !== true
    || motorcycle.catalogue.available !== true
  )) {
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

  const customerInput = (input.customer && typeof input.customer === 'object' && !Array.isArray(input.customer))
    ? input.customer
    : input;
  const name = typeof customerInput.name === 'string' ? customerInput.name.trim() : (typeof input.customerName === 'string' ? input.customerName.trim() : '');
  const phone = typeof customerInput.phone === 'string' ? customerInput.phone.trim() : (typeof input.mobileNumber === 'string' ? input.mobileNumber.trim() : (typeof input.phone === 'string' ? input.phone.trim() : ''));
  const rawEmail = typeof customerInput.email === 'string' ? customerInput.email.trim().toLowerCase() : (typeof input.email === 'string' ? input.email.trim().toLowerCase() : '');
  const rawCity = typeof customerInput.city === 'string'
    ? customerInput.city.trim()
    : (typeof input.city === 'string' ? input.city.trim() : '');
  const city = rawCity || (input.enquiry ? '' : 'Batlagundu');
  const state = typeof customerInput.state === 'string' && customerInput.state.trim() ? customerInput.state.trim() : 'Tamil Nadu';
  const dealership = typeof customerInput.dealership === 'string' && customerInput.dealership.trim()
    ? customerInput.dealership.trim()
    : (typeof input.dealership === 'string' && input.dealership.trim() ? input.dealership.trim() : 'Vathilai Motors — Authorised Yamaha Dealer, Batlagundu');
  const appointmentDate = typeof input.appointmentDate === 'string' && input.appointmentDate.trim()
    ? input.appointmentDate.trim()
    : (typeof customerInput.appointmentDate === 'string' && customerInput.appointmentDate.trim() ? customerInput.appointmentDate.trim() : new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const appointmentTime = typeof input.appointmentTime === 'string' && input.appointmentTime.trim()
    ? input.appointmentTime.trim()
    : (typeof customerInput.appointmentTime === 'string' && customerInput.appointmentTime.trim() ? customerInput.appointmentTime.trim() : '10:00 AM – 12:00 PM (Morning Slot)');
  const message = typeof customerInput.message === 'string' ? customerInput.message.trim() : (typeof input.message === 'string' ? input.message.trim() : '');
  const preferredContactMethod = typeof customerInput.preferredContactMethod === 'string'
    ? customerInput.preferredContactMethod.trim()
    : (typeof input.preferredContactMethod === 'string' ? input.preferredContactMethod.trim() : (typeof input.contactMethod === 'string' ? input.contactMethod.trim() : 'Call'));

  if (name.length < 2 || name.length > 100 || /[\u0000-\u001f\u007f]/.test(name)) {
    throw apiError('Enter a valid name (2 to 100 characters).', 400, 'invalid_booking');
  }
  const normalizedPhone = phone.replace(/[\s-]/g, '');
  if (!/^(?:\+?91)?[6-9]\d{9}$/.test(normalizedPhone)) {
    throw apiError('Enter a valid Indian mobile number.', 400, 'invalid_booking');
  }
  const email = rawEmail || (input.enquiry ? '' : `${normalizedPhone}@vathilaimotors.in`);
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw apiError('Enter a valid email address.', 400, 'invalid_booking');
  }
  if (!city || city.length < 2 || city.length > 80 || /[\u0000-\u001f\u007f]/.test(city)) {
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

  const source = typeof input.source === 'string' && input.source.trim()
    ? input.source.trim()
    : (input.enquiry ? 'motorcycle-details' : 'booking');

  return {
    requestId,
    type: input.enquiry ? 'enquiry' : 'booking',
    source,
    enquiryStatus: 'new',
    customerName: name,
    mobileNumber: normalizedPhone,
    email,
    city,
    preferredContactMethod,
    message,
    motorcycleModel: motorcycle.model,
    motorcycleVariant: variant,
    motorcycleCategory: motorcycle.category || catalogue.category || 'Sport',
    motorcycleId: motorcycle.id,
    slug: motorcycleSlug(motorcycle.model),
    model: motorcycle.model,
    variant,
    color,
    appointmentDate,
    appointmentTime,
    dealership,
    customer: { name, phone: normalizedPhone, email, city, state, dealership, message, preferredContactMethod },
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
  const market = typeof input.market === 'string' && input.market.trim() ? input.market.trim().toUpperCase() : 'IN';
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
    const list = Array.isArray(value) ? value : [];
    if (list.length > maximumItems) {
      throw apiError(`${label} must contain no more than ${maximumItems} entries.`, 400, 'invalid_catalogue');
    }
    return list.map((item) => {
      if (typeof item !== 'string' || !item.trim() || item.trim().length > maximumLength) {
        throw apiError(`${label} entries must be non-empty and at most ${maximumLength} characters.`, 400, 'invalid_catalogue');
      }
      return item.trim();
    });
  };

  const variants = validateStringList(input.variants, 'Variants', 30, 100);
  const colors = validateStringList(input.colors, 'Colours', 50, 80);
  const rawSpecifications = Array.isArray(input.specifications) ? input.specifications : [];
  if (rawSpecifications.length > 100) {
    throw apiError('Specifications must contain no more than 100 entries.', 400, 'invalid_catalogue');
  }
  const specifications = rawSpecifications.map((row) => {
    const section = typeof row?.section === 'string' ? row.section.trim() : '';
    const label = typeof row?.label === 'string' ? row.label.trim() : '';
    const value = typeof row?.value === 'string' ? row.value.trim() : '';
    if (!section || section.length > 80 || !label || label.length > 100 || !value || value.length > 300) {
      throw apiError('Each specification requires a section, label, and value.', 400, 'invalid_catalogue');
    }
    return { section, label, value };
  });

  const rawPrices = Array.isArray(input.prices) ? input.prices : [];
  if (rawPrices.length > 50) {
    throw apiError('Prices must contain no more than 50 entries.', 400, 'invalid_catalogue');
  }
  const prices = rawPrices.map((row) => {
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

  const rawGallery = Array.isArray(input.gallery) ? input.gallery : [];
  if (rawGallery.length > 30) {
    throw apiError('Gallery must contain no more than 30 images.', 400, 'invalid_catalogue');
  }
  const gallery = rawGallery.map((image) => {
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

  const priceNote = typeof input.priceNote === 'string' ? input.priceNote.trim() : '';
  if (priceNote.length > 1000) {
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

const allowAdminFallback = development || process.env.ENABLE_LOCAL_ADMIN === 'true' || process.env.DISABLE_AUTH0 === 'true';

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
} else if (production && isStandaloneExecution && !allowAdminFallback) {
  throw new Error('Auth0 must be configured before starting the admin API in production (or set ENABLE_LOCAL_ADMIN=true).');
}

if (production && isStandaloneExecution && !existsSync(join(distributionDirectory, 'index.html'))) {
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
app.use(express.json({ limit: '10mb' }));

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

function extractAdminToken(request) {
  const authHeader = request.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const customHeader = request.headers['x-admin-token'];
  if (customHeader) return String(customHeader).trim();
  const rawCookie = request.headers.cookie;
  if (!rawCookie) return null;
  const match = rawCookie.match(/(?:^|;\s*)vathilai_admin_session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

app.get('/api/admin/session', async (request, response) => {
  const token = extractAdminToken(request);
  if (token) {
    const session = await getAdminSession(token);
    if (session) {
      return response.json({
        authenticated: true,
        isAdmin: true,
        user: session.user,
      });
    }
  }

  if (authConfigured && request.oidc?.isAuthenticated()) {
    const user = request.oidc.user;
    const isAdmin = Boolean(user?.sub && allowedSubjects.has(user.sub));
    return response.json({
      authenticated: true,
      isAdmin,
      user: isAdmin
        ? { name: user.name ?? user.email ?? 'Administrator', email: user.email, role: 'Super Admin' }
        : undefined,
    });
  }

  return response.json({
    authenticated: false,
    isAdmin: false,
  });
});

app.post('/api/admin/login', async (request, response) => {
  try {
    const { email, password, rememberMe } = request.body || {};
    if (!email || !password) {
      return response.status(400).json({ code: 'missing_credentials', message: 'Email and password are required.' });
    }

    let verifiedUser;
    try {
      verifiedUser = await verifyAdminCredentials(email, password);
    } catch (authErr) {
      return response.status(403).json({
        code: authErr.code || 'account_suspended',
        message: authErr.message || 'Account access error.',
      });
    }

    if (!verifiedUser) {
      return response.status(401).json({
        code: 'invalid_credentials',
        message: 'Invalid email or password. Please verify your credentials.',
      });
    }

    const session = await createAdminSession(verifiedUser, { rememberMe: Boolean(rememberMe) });
    const maxAge = rememberMe ? 30 * 24 * 3600 : 24 * 3600;

    response.setHeader('Set-Cookie', [
      `vathilai_admin_session=${encodeURIComponent(session.token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${production ? '; Secure' : ''}`,
    ]);

    await logAdminActivity('LOGIN', `Admin: ${verifiedUser.name}`, `Logged in successfully as ${verifiedUser.email}`);

    return response.json({
      success: true,
      token: session.token,
      user: session.user,
    });
  } catch (err) {
    console.error('Login error:', err);
    return response.status(500).json({ code: 'server_error', message: err.message || 'Login failed.' });
  }
});

app.post('/api/admin/logout', async (request, response) => {
  const token = extractAdminToken(request);
  if (token) {
    await revokeAdminSession(token);
  }
  response.setHeader('Set-Cookie', [
    `vathilai_admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${production ? '; Secure' : ''}`,
  ]);
  return response.json({ success: true, message: 'Logged out successfully.' });
});

app.post('/api/admin/forgot-password', async (request, response) => {
  try {
    const { email } = request.body || {};
    if (!email) {
      return response.status(400).json({ code: 'missing_email', message: 'Email address is required.' });
    }
    const result = await generatePasswordResetCode(email);
    console.log(`[Admin Password Reset] Code for ${result.email}: ${result.code}`);

    let emailSent = false;
    let emailError = null;

    if (isSmtpConfigured()) {
      try {
        await sendPasswordResetEmail({
          to: result.email,
          code: result.code,
          name: 'Sanjay',
          expiresMinutes: 15,
        });
        emailSent = true;
        await logAdminActivity('SECURITY', `Password Reset Email Sent: ${result.email}`, `Dispatched 6-digit verification code via SMTP`);
      } catch (err) {
        emailError = err.message || 'SMTP dispatch failed';
        console.error(`[Admin Password Reset] Failed to send email via SMTP to ${result.email}:`, emailError);
      }
    }

    if (emailSent) {
      return response.json({
        success: true,
        emailSent: true,
        email: result.email,
        message: `A 6-digit verification code has been dispatched to ${result.email}. Please check your inbox and spam folder.`,
      });
    }

    // SMTP not configured or failed to dispatch:
    // In development / testing, provide code in response payload so administrator is not locked out
    return response.json({
      success: true,
      emailSent: false,
      email: result.email,
      code: result.code,
      emailError,
      message: isSmtpConfigured()
        ? `SMTP send failed (${emailError}). Temporary verification code logged: ${result.code}`
        : `Verification code generated. Configure SMTP in server/.env to dispatch real emails to ${result.email}.`,
    });
  } catch (err) {
    return response.status(404).json({ code: 'not_found', message: err.message });
  }
});

app.get('/api/admin/smtp/status', (request, response) => {
  return response.json(getSmtpStatus());
});

app.post('/api/admin/smtp/verify', async (request, response) => {
  const result = await verifySmtpConnection();
  return response.json(result);
});

app.post('/api/admin/reset-password', async (request, response) => {
  try {
    const { email, code, newPassword } = request.body || {};
    if (!email || !code || !newPassword) {
      return response.status(400).json({ code: 'missing_fields', message: 'Email, verification code, and new password are required.' });
    }
    await resetAdminPassword(email, code, newPassword);
    await logAdminActivity('SECURITY', `Password Reset: ${email}`, `Admin password was successfully updated`);
    return response.json({
      success: true,
      message: 'Password successfully updated. You can now log in with your new password.',
    });
  } catch (err) {
    return response.status(400).json({ code: 'reset_failed', message: err.message });
  }
});

async function requireAdmin(request, response, next) {
  const token = extractAdminToken(request);
  if (token) {
    const session = await getAdminSession(token);
    if (session) {
      request.adminUser = session.user;
      return next();
    }
  }

  if (authConfigured && request.oidc?.isAuthenticated()) {
    const subject = request.oidc.user?.sub;
    if (subject && allowedSubjects.has(subject)) {
      request.adminUser = request.oidc.user;
      return next();
    }
  }

  return response.status(401).json({ code: 'authentication_required', message: 'Please log in to continue.' });
}

app.use('/api/admin', (request, response, next) => {
  const publicAuthPaths = ['/session', '/login', '/logout', '/forgot-password', '/reset-password', '/smtp/status'];
  if (publicAuthPaths.includes(request.path)) {
    return next();
  }
  return requireAdmin(request, response, next);
});

app.get('/api/public/motorcycles', async (request, response, next) => {
  try {
    return response.json({ motorcycles: await readMotorcycleCatalog() });
  } catch (error) {
    return next(error);
  }
});

// WhatsApp Webhook challenge verification for Meta WhatsApp Cloud API
app.get(['/api/public/whatsapp/webhook', '/api/whatsapp/webhook'], (request, response) => {
  const result = verifyWhatsAppWebhookChallenge(request.query);
  if (result.verified) {
    console.log('[WhatsApp Webhook] Challenge verified successfully.');
    return response.status(200).send(result.challenge);
  }
  console.warn('[WhatsApp Webhook] Verification failed:', result.error);
  return response.status(403).json({ error: result.error || 'Verification challenge failed.' });
});

// WhatsApp Webhook status event receiver for Meta / external status callbacks
app.post(['/api/public/whatsapp/webhook', '/api/whatsapp/webhook'], async (request, response, next) => {
  try {
    const events = parseWhatsAppWebhookPayload(request.body);
    console.log(`[WhatsApp Webhook] Received ${events.length} status event(s).`);

    const updated = [];
    for (const evt of events) {
      const res = await updateBookingWhatsAppDelivery(evt);
      if (res) {
        updated.push({
          reference: res.reference,
          status: res.whatsappStatus,
          messageId: evt.messageId,
        });
        console.log(`[WhatsApp Webhook] Booking ${res.reference} updated to ${res.whatsappStatus} (MsgID: ${evt.messageId})`);
      }
    }

    return response.status(200).json({
      success: true,
      processed: events.length,
      updated,
    });
  } catch (error) {
    console.error('[WhatsApp Webhook] Error processing webhook event:', error);
    return next(error);
  }
});

async function dispatchAutomaticWhatsAppNotification(booking) {
  try {
    const result = await sendWhatsAppMessage({ booking });
    const updateFields = {
      whatsappStatus: result.status,
      whatsappRecipient: result.recipient,
      whatsappMessageId: result.messageId || null,
      whatsappSentAt: result.sentAt || null,
      whatsappFailedAt: result.failedAt || null,
      whatsappError: result.error || null,
    };
    await updateBookingWhatsAppFields(booking.reference, updateFields).catch((err) => {
      console.warn(`[WhatsApp Backend] Could not persist status: ${err.message}`);
    });
    console.log(`[WhatsApp Backend] Notification result for ${booking.reference}: ${result.status} (Recipient: ${result.recipient})`);
    return result;
  } catch (err) {
    console.error(`[WhatsApp Backend] Error in dispatchAutomaticWhatsAppNotification: ${err.message}`);
    return { success: false, error: err.message };
  }
}

app.post(['/api/public/bookings', '/api/public/enquiries'], async (request, response, next) => {
  try {
    const motorcycles = await readMotorcycleCatalog();
    const isEnquiry = request.path.endsWith('/enquiries') || Boolean(request.body.enquiry);
    const source = request.body.source || (isEnquiry ? 'motorcycle-details' : 'booking');
    const fields = validateBookingInput({
      ...request.body,
      enquiry: isEnquiry,
      source,
    }, motorcycles);
    const booking = await createBooking(fields);

    // Automatically dispatch notification from the backend without client browser redirection
    dispatchAutomaticWhatsAppNotification(booking).catch(() => {});

    return response.status(201).json({
      success: true,
      reference: booking.reference,
      enquiryId: booking.reference,
      message: 'Your enquiry has been successfully submitted to Vathilai Motors. Our dealership team will contact you shortly.',
      booking,
      enquiry: booking,
    });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/admin/overview', async (request, response, next) => {
  try {
    const readSource = async (name, read) => {
      try {
        const value = await read();
        if (!Array.isArray(value)) throw new Error('Expected an array result.');
        return { ok: true, value };
      } catch {
        console.warn(`Admin overview source unavailable (${name}).`);
        return { ok: false };
      }
    };
    const sourceEntries = await Promise.all([
      ['motorcycles', () => readMotorcycleCatalog()],
      ['bookings', () => readBookings()],
      ['serviceVideos', () => serviceVideosStore.read()],
      ['socialPosts', () => socialPostsStore.read()],
      ['reviews', () => reviewsStore.read()],
      ['gallery', () => galleryStore.read()],
      ['media', () => mediaLibraryStore.read()],
      ['activity', () => activityStore.read()],
    ].map(async ([name, read]) => [name, await readSource(name, read)]));
    const sources = Object.fromEntries(sourceEntries);

    const overview = projectAdminOverview(sources);
    const bookingRecords = overview.sourceStatus.bookings === 'available' ? sources.bookings.value : null;
    const contacts = bookingRecords
      ? new Set(bookingRecords.map((record) => record.customer?.phone || record.customer?.email || record.phone || record.email).filter(Boolean))
      : null;
    return response.json({
      apiAvailable: true,
      source: mongoDatabase ? 'mongodb' : 'json',
      databaseConnected: Boolean(mongoDatabase),
      database: {
        connected: Boolean(mongoDatabase),
        provider: mongoDatabase ? 'MongoDB' : 'Local JSON files',
        mode: mongoDatabase ? 'mongodb' : 'json-fallback',
      },
      databaseType: mongoDatabase ? 'MongoDB' : 'Local JSON files',
      mediaStorageConnected: null,
      analyticsConnected: null,
      authConfigured,
      totalCustomers: contacts?.size ?? null,
      totalServices: overview.totalServiceVideos,
      totalRevenue: null,
      totalGallery: overview.sourceStatus.gallery === 'available' ? sources.gallery.value.length : null,
      totalMedia: overview.sourceStatus.media === 'available' ? sources.media.value.length : null,
      websitePages: ['/', '/services', '/motorcycle-details', '/bikes', '/bike-details', '/book-us'],
      ...overview,
    });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/admin/analytics', async (request, response, next) => {
  try {
    const readSource = async (name, read) => {
      try {
        const value = await read();
        if (!Array.isArray(value)) throw new Error('Expected an array result.');
        return { ok: true, value };
      } catch {
        console.warn(`Admin analytics source unavailable (${name}).`);
        return { ok: false };
      }
    };
    const sourceEntries = await Promise.all([
      ['motorcycles', () => readMotorcycleCatalog()],
      ['bookings', () => readBookings()],
      ['serviceVideos', () => serviceVideosStore.read()],
      ['socialPosts', () => socialPostsStore.read()],
      ['reviews', () => reviewsStore.read()],
      ['gallery', () => galleryStore.read()],
      ['media', () => mediaLibraryStore.read()],
      ['activity', () => activityStore.read()],
    ].map(async ([name, read]) => [name, await readSource(name, read)]));
    const sources = Object.fromEntries(sourceEntries);
    const overview = projectAdminOverview(sources);
    const allBookings = overview.sourceStatus.bookings === 'available' ? sources.bookings.value : null;
    const modelInterest = {};
    for (const item of allBookings ?? []) {
      const name = item.model || item.motorcycleId;
      if (name) modelInterest[name] = (modelInterest[name] || 0) + 1;
    }

    const popularModels = Object.entries(modelInterest).map(([model, count]) => ({ model, count })).sort((a, b) => b.count - a.count);

    return response.json({
      ...overview,
      apiAvailable: true,
      source: mongoDatabase ? 'mongodb' : 'json',
      databaseConnected: Boolean(mongoDatabase),
      database: {
        connected: Boolean(mongoDatabase),
        provider: mongoDatabase ? 'MongoDB' : 'Local JSON files',
        mode: mongoDatabase ? 'mongodb' : 'json-fallback',
      },
      totalInteractions: allBookings?.length ?? null,
      modelInterest: allBookings ? popularModels : null,
      popularModels: allBookings ? popularModels : null,
      metrics: {
        totalMotorcycles: overview.totalMotorcycles,
        motorcyclesInCatalog: overview.totalMotorcycles,
        totalBookings: overview.totalBookings,
        totalEnquiries: overview.totalEnquiries,
        totalInteractions: allBookings?.length ?? null,
        conversionRate: null,
      },
      recentActivityCount: overview.recentActivity?.length ?? null,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/admin/motorcycles', async (request, response, next) => {
  try {
    const motorcycles = await readMotorcycleCatalog();
    return response.json({
      source: mongoDatabase ? 'mongodb' : 'server-database-engine',
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
        specifications: fields.catalogue?.specifications || [],
      };
      motorcycles.push(record);
      return record;
    });
    await logAdminActivity('CREATE', `Motorcycle: ${motorcycle.model}`, 'Added to catalogue');
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
    await logAdminActivity('UPDATE', `Motorcycle: ${motorcycle.model}`, 'Updated catalogue specifications and pricing');
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
    await logAdminActivity('DELETE', `Motorcycle: ${request.params.id}`, 'Removed from catalogue');
    return response.status(204).end();
  } catch (error) {
    return next(error);
  }
});

app.post(
  '/api/admin/motorcycles/:id/images',
  express.raw({ type: ['image/webp', 'image/jpeg', 'image/png'], limit: '10mb' }),
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
      const publicPath = `/imgs/catalog/uploads/${filename}`;
      await logAdminActivity('UPLOAD', `Motorcycle Image: ${filename}`, `Uploaded image for ${motorcycle.model}`);
      return response.status(201).json({ imagePath: publicPath, url: publicPath });
    } catch (error) {
      return next(error);
    }
  },
);

// --- Bookings ---
app.get('/api/admin/bookings', async (request, response, next) => {
  try {
    const rawBookings = await readBookings();
    const validStatuses = ['NOT_SENT', 'QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED'];
    const bookings = rawBookings
      .filter((b) => b.type !== 'enquiry' && !isDummyOrMockBooking(b))
      .map((b) => {
        let rawWa = String(b.whatsappStatus || '').toUpperCase();
        if (!validStatuses.includes(rawWa)) {
          rawWa = b.whatsappMessageId ? 'SENT' : 'NOT_SENT';
        }
        return {
          ...b,
          whatsappStatus: rawWa,
        };
      });
    return response.json({
      source: mongoDatabase ? 'mongodb' : 'server-database-engine',
      editable: true,
      bookings,
      all: bookings,
    });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/admin/bookings', async (request, response, next) => {
  try {
    const motorcycles = await readMotorcycleCatalog();
    const fields = validateBookingInput(request.body, motorcycles);
    const booking = await createBooking(fields);
    await logAdminActivity('CREATE', `Booking: ${booking.reference}`, `Created booking for ${booking.customer?.name}`);
    return response.status(201).json({ booking });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/admin/bookings/:reference', async (request, response, next) => {
  try {
    const bookings = await readBookings();
    const booking = bookings.find((b) => b.reference === request.params.reference);
    if (!booking) throw apiError('Booking not found.', 404, 'booking_not_found');
    return response.json({ booking });
  } catch (error) {
    return next(error);
  }
});

app.put('/api/admin/bookings/:reference', async (request, response, next) => {
  try {
    const booking = await updateBookingDetails(request.params.reference, request.body);
    return response.json({ booking });
  } catch (error) {
    return next(error);
  }
});

app.delete('/api/admin/bookings/:reference', async (request, response, next) => {
  try {
    await deleteBookingRecord(request.params.reference);
    return response.status(204).end();
  } catch (error) {
    return next(error);
  }
});

app.post(['/api/admin/bookings/:reference/whatsapp-send', '/api/admin/enquiries/:reference/whatsapp-send'], async (request, response, next) => {
  try {
    const reference = request.params.reference;
    const bookings = await readBookings();
    const booking = bookings.find((b) => b.reference === reference);
    if (!booking) throw apiError('Booking not found.', 404, 'booking_not_found');

    const result = await sendWhatsAppMessage({
      booking,
      customPhone: request.body?.phone,
      customMessage: request.body?.message,
    });

    const updateFields = {
      whatsappStatus: result.status,
      whatsappRecipient: result.recipient,
      whatsappMessageId: result.messageId || booking.whatsappMessageId || null,
      whatsappSentAt: result.sentAt || booking.whatsappSentAt || null,
      whatsappFailedAt: result.failedAt || null,
      whatsappError: result.error || null,
    };

    const updatedBooking = await updateBookingWhatsAppFields(reference, updateFields);

    if (result.success) {
      await logAdminActivity('WHATSAPP_SEND', `Booking: ${reference}`, `Dispatched WhatsApp message to ${result.recipient} (MsgID: ${result.messageId})`);
      return response.json({
        success: true,
        message: 'WhatsApp message accepted by provider.',
        booking: updatedBooking,
        delivery: result,
      });
    }

    await logAdminActivity('WHATSAPP_FAILED', `Booking: ${reference}`, `WhatsApp dispatch failed: ${result.error}`);
    return response.status(400).json({
      success: false,
      message: result.error || 'WhatsApp message dispatch failed.',
      booking: updatedBooking,
      delivery: result,
    });
  } catch (error) {
    return next(error);
  }
});

app.put(['/api/admin/bookings/:reference/status', '/api/admin/enquiries/:reference/status'], async (request, response, next) => {
  try {
    const status = typeof request.body?.status === 'string' ? request.body.status.trim() : '';
    const notes = typeof request.body?.notes === 'string' ? request.body.notes.trim() : undefined;
    const booking = await setBookingStatus(request.params.reference, status, notes);
    return response.json({ booking });
  } catch (error) {
    return next(error);
  }
});

app.patch(['/api/admin/bookings/:reference/status', '/api/admin/enquiries/:reference/status'], async (request, response, next) => {
  try {
    const status = typeof request.body?.status === 'string' ? request.body.status.trim() : '';
    const notes = typeof request.body?.notes === 'string' ? request.body.notes.trim() : undefined;
    const booking = await setBookingStatus(request.params.reference, status, notes);
    return response.json({ booking });
  } catch (error) {
    return next(error);
  }
});

// --- Enquiries ---
app.get('/api/admin/enquiries', async (request, response, next) => {
  try {
    const allBookings = await readBookings();
    const sourceParam = typeof request.query.source === 'string' ? request.query.source.trim() : '';
    const statusParam = typeof request.query.status === 'string' ? request.query.status.trim() : '';

    const formatted = allBookings
      .filter((b) => b.type !== 'booking' && b.source !== 'booking')
      .filter((b) => !isDummyOrMockBooking(b))
      .map((b) => {
        const source = b.source || 'motorcycle-details';
      const customerName = b.customerName || b.customer?.name || b.name || '';
      const mobileNumber = b.mobileNumber || b.customer?.phone || b.phone || '';
      const email = b.email || b.customer?.email || '';
      const city = b.city || b.customer?.city || '';
      const model = b.motorcycleModel || b.model || '';
      const variant = b.motorcycleVariant || b.variant || '';
      const category = b.motorcycleCategory || b.category || '';
      const preferredContactMethod = b.preferredContactMethod || b.customer?.preferredContactMethod || 'Call';
      const message = b.message || b.customer?.message || '';
      const status = b.enquiryStatus || b.status || 'new';

      return {
        ...b,
        enquiryId: b.enquiryId || b.reference,
        customerName,
        mobileNumber,
        email,
        city,
        motorcycleModel: model,
        motorcycleVariant: variant,
        motorcycleCategory: category,
        preferredContactMethod,
        message,
        source,
        enquiryStatus: status,
        status,
      };
    });

    // Default: return all customer enquiries (both motorcycle-details, general-contact, and explicit enquiries)
    // Strictly keep enquiries only (no bookings and no mock data)
    let filtered = formatted;
    if (sourceParam && sourceParam !== 'all') {
      filtered = formatted.filter((b) => b.source === sourceParam);
    }

    if (statusParam && statusParam !== 'all') {
      filtered = filtered.filter((b) => b.status === statusParam || b.enquiryStatus === statusParam);
    }

    return response.json({
      source: mongoDatabase ? 'mongodb' : 'server-database-engine',
      editable: true,
      enquiries: filtered,
      all: formatted,
    });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/admin/enquiries', async (request, response, next) => {
  try {
    const motorcycles = await readMotorcycleCatalog();
    const fields = validateBookingInput({ ...request.body, enquiry: true }, motorcycles);
    const enquiry = await createBooking(fields);
    await logAdminActivity('CREATE', `Enquiry: ${enquiry.reference}`, `New enquiry from ${enquiry.customer?.name}`);
    return response.status(201).json({ enquiry });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/admin/enquiries/:reference', async (request, response, next) => {
  try {
    const allBookings = await readBookings();
    const enquiry = allBookings.find((b) => b.reference === request.params.reference);
    if (!enquiry) throw apiError('Enquiry not found.', 404, 'enquiry_not_found');
    return response.json({ enquiry });
  } catch (error) {
    return next(error);
  }
});

app.put('/api/admin/enquiries/:reference', async (request, response, next) => {
  try {
    const enquiry = await updateBookingDetails(request.params.reference, request.body);
    return response.json({ enquiry });
  } catch (error) {
    return next(error);
  }
});

app.delete('/api/admin/enquiries/:reference', async (request, response, next) => {
  try {
    await deleteBookingRecord(request.params.reference);
    return response.status(204).end();
  } catch (error) {
    return next(error);
  }
});

// --- Service Videos ---
app.get('/api/admin/service-videos', async (request, response, next) => {
  try {
    const rawVideos = await serviceVideosStore.read();
    const videos = rawVideos.map((v) => ({
      ...v,
      path: v.mediaUrl || v.path,
      mediaUrl: v.mediaUrl || v.path,
      filename: v.fileName || v.filename,
      fileName: v.fileName || v.filename,
    }));
    return response.json({
      source: mongoDatabase ? 'mongodb' : 'server-database-engine',
      editable: true,
      videos,
    });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/admin/service-videos', async (request, response, next) => {
  try {
    const { title, fileName, filename, mediaUrl, path, thumbnailUrl, order, description, status } = request.body || {};
    const effectiveMediaUrl = (mediaUrl || path || '').trim();
    if (!title || !effectiveMediaUrl) throw apiError('Title and media URL are required.', 400, 'invalid_video');
    const effectiveFileName = (fileName || filename || title.toLowerCase().replace(/[^a-z0-9]/g, '-') + '.mp4').trim();
    const newVideo = {
      id: `video-${Date.now()}-${randomBytes(3).toString('hex')}`,
      title: title.trim(),
      fileName: effectiveFileName,
      filename: effectiveFileName,
      mediaUrl: effectiveMediaUrl,
      path: effectiveMediaUrl,
      thumbnailUrl: thumbnailUrl?.trim() || '/imgs/f1.png',
      order: Number(order) || 1,
      status: status || 'published',
      description: description?.trim() || '',
      sizeBytes: Number(request.body.sizeBytes) || 3000000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await serviceVideosStore.mutate((videos) => {
      videos.push(newVideo);
      videos.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
    });
    await logAdminActivity('CREATE', `Service Video: ${newVideo.title}`, 'Added workshop service video');
    return response.status(201).json({ video: newVideo });
  } catch (error) {
    return next(error);
  }
});

app.put('/api/admin/service-videos/:id', async (request, response, next) => {
  try {
    let updated;
    await serviceVideosStore.mutate((videos) => {
      const index = videos.findIndex((v) => v.id === request.params.id);
      if (index < 0) throw apiError('Service video not found.', 404, 'video_not_found');
      updated = {
        ...videos[index],
        ...request.body,
        id: videos[index].id,
        updatedAt: new Date().toISOString(),
      };
      videos[index] = updated;
      videos.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
    });
    await logAdminActivity('UPDATE', `Service Video: ${updated.title}`, 'Updated video details');
    return response.json({ video: updated });
  } catch (error) {
    return next(error);
  }
});

app.delete('/api/admin/service-videos/:id', async (request, response, next) => {
  try {
    await serviceVideosStore.mutate((videos) => {
      const index = videos.findIndex((v) => v.id === request.params.id);
      if (index < 0) throw apiError('Service video not found.', 404, 'video_not_found');
      videos.splice(index, 1);
    });
    await logAdminActivity('DELETE', `Service Video: ${request.params.id}`, 'Removed video');
    return response.status(204).end();
  } catch (error) {
    return next(error);
  }
});

// --- Social Profiles & Posts ---
app.get('/api/admin/social/profiles', async (request, response, next) => {
  try {
    const profiles = await socialProfilesStore.read();
    return response.json({ profiles });
  } catch (error) {
    return next(error);
  }
});

app.put('/api/admin/social/profiles', async (request, response, next) => {
  try {
    const { profiles: updatedProfiles, profile } = request.body || {};
    let resultList = [];
    if (Array.isArray(updatedProfiles)) {
      await socialProfilesStore.mutate((profiles) => {
        updatedProfiles.forEach((up) => {
          const idx = profiles.findIndex((p) => p.id === up.id || p.platform?.toLowerCase() === up.platform?.toLowerCase());
          if (idx >= 0) {
            profiles[idx] = { ...profiles[idx], ...up, updatedAt: new Date().toISOString() };
          } else if (up.platform) {
            profiles.push({
              id: up.id || `soc-${up.platform.toLowerCase().replace(/\s+/g, '-')}`,
              platform: up.platform,
              profileUrl: up.profileUrl || up.url || '',
              handle: up.handle || '',
              status: up.status || 'connected',
              showInFooter: up.showInFooter !== false,
              displayOrder: up.displayOrder || (profiles.length + 1),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        });
        resultList = [...profiles];
      });
      const ig = resultList.find((p) => p.platform?.toLowerCase() === 'instagram');
      if (ig?.profileUrl) {
        await siteSettingsStore.mutate((settings) => { settings.instagramUrl = ig.profileUrl; });
      }
      await logAdminActivity('UPDATE', 'Social Profiles', 'Updated platform profiles and footer visibility');
      return response.json({ profiles: resultList });
    }

    if (profile && (profile.id || profile.platform)) {
      let updated;
      await socialProfilesStore.mutate((profiles) => {
        const idx = profiles.findIndex((p) => p.id === profile.id || p.platform?.toLowerCase() === profile.platform?.toLowerCase());
        if (idx >= 0) {
          updated = { ...profiles[idx], ...profile, updatedAt: new Date().toISOString() };
          profiles[idx] = updated;
        } else {
          updated = {
            id: profile.id || `soc-${profile.platform.toLowerCase().replace(/\s+/g, '-')}`,
            platform: profile.platform,
            profileUrl: profile.profileUrl || profile.url || '',
            handle: profile.handle || '',
            status: profile.status || 'connected',
            showInFooter: profile.showInFooter !== false,
            displayOrder: profile.displayOrder || (profiles.length + 1),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          profiles.push(updated);
        }
      });
      if (updated.platform?.toLowerCase() === 'instagram' && updated.profileUrl) {
        await siteSettingsStore.mutate((settings) => { settings.instagramUrl = updated.profileUrl; });
      }
      await logAdminActivity('UPDATE', `Social Profile: ${updated.platform}`, 'Updated profile details');
      return response.json({ profile: updated });
    }

    throw apiError('Provide valid social profile payload.', 400, 'invalid_payload');
  } catch (error) {
    return next(error);
  }
});

app.put('/api/admin/social/profiles/:id', async (request, response, next) => {
  try {
    let updated;
    await socialProfilesStore.mutate((profiles) => {
      const index = profiles.findIndex((p) => p.id === request.params.id || p.platform?.toLowerCase() === request.params.id.toLowerCase());
      if (index < 0) throw apiError('Profile not found.', 404, 'profile_not_found');
      updated = {
        ...profiles[index],
        ...request.body,
        id: profiles[index].id,
        updatedAt: new Date().toISOString(),
      };
      profiles[index] = updated;
    });
    if (updated.platform?.toLowerCase() === 'instagram' && updated.profileUrl) {
      await siteSettingsStore.mutate((settings) => { settings.instagramUrl = updated.profileUrl; });
    }
    await logAdminActivity('UPDATE', `Social Profile: ${updated.platform}`, `Updated URL and visibility (${updated.status})`);
    return response.json({ profile: updated });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/admin/social/posts', async (request, response, next) => {
  try {
    const posts = await socialPostsStore.read();
    return response.json({ posts });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/admin/social/posts', async (request, response, next) => {
  try {
    const { platform, caption, description, mediaUrl, postUrl, scheduledAt, status, displayOrder } = request.body || {};
    if (!platform || !caption) throw apiError('Platform and caption are required.', 400, 'invalid_post');
    const newPost = {
      id: `post-${Date.now()}-${randomBytes(3).toString('hex')}`,
      platform,
      caption: caption.trim(),
      description: description?.trim() || '',
      mediaUrl: mediaUrl?.trim() || '',
      postUrl: postUrl?.trim() || '',
      scheduledAt: scheduledAt || '',
      status: status || 'published',
      displayOrder: Number(displayOrder) || 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await socialPostsStore.mutate((posts) => {
      posts.unshift(newPost);
    });
    await logAdminActivity('CREATE', `Social Post: ${newPost.platform}`, 'Created social media post');
    return response.status(201).json({ post: newPost });
  } catch (error) {
    return next(error);
  }
});

app.put('/api/admin/social/posts/:id', async (request, response, next) => {
  try {
    let updated;
    await socialPostsStore.mutate((posts) => {
      const index = posts.findIndex((p) => p.id === request.params.id);
      if (index < 0) throw apiError('Post not found.', 404, 'post_not_found');
      updated = {
        ...posts[index],
        ...request.body,
        id: posts[index].id,
        updatedAt: new Date().toISOString(),
      };
      posts[index] = updated;
    });
    await logAdminActivity('UPDATE', `Social Post: ${updated.platform}`, 'Updated post details');
    return response.json({ post: updated });
  } catch (error) {
    return next(error);
  }
});

app.delete('/api/admin/social/posts/:id', async (request, response, next) => {
  try {
    await socialPostsStore.mutate((posts) => {
      const index = posts.findIndex((p) => p.id === request.params.id);
      if (index < 0) throw apiError('Post not found.', 404, 'post_not_found');
      posts.splice(index, 1);
    });
    await logAdminActivity('DELETE', `Social Post: ${request.params.id}`, 'Deleted post');
    return response.status(204).end();
  } catch (error) {
    return next(error);
  }
});

// --- Customer Reviews ---
app.get('/api/admin/reviews', async (request, response, next) => {
  try {
    const rawReviews = await reviewsStore.read();
    const reviews = rawReviews.map((r) => ({
      ...r,
      name: r.customerName || r.name,
      customerName: r.customerName || r.name,
      comment: r.review || r.comment,
      review: r.review || r.comment,
      bikeModel: r.model || r.bikeModel,
      model: r.model || r.bikeModel,
      photo: r.imageUrl || r.photo,
      imageUrl: r.imageUrl || r.photo,
      published: r.published !== undefined ? r.published : (r.status === 'published'),
    }));
    return response.json({ reviews });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/admin/reviews', async (request, response, next) => {
  try {
    const { customerName, name, model, bikeModel, rating, review, comment, imageUrl, photo, status, published, city, displayOrder } = request.body || {};
    const effectiveName = (customerName || name || '').trim();
    const effectiveReview = (review || comment || '').trim();
    if (!effectiveName || !effectiveReview) throw apiError('Customer name and review text are required.', 400, 'invalid_review');
    const effectiveModel = (model || bikeModel || 'Yamaha Motorcycle').trim();
    const effectivePhoto = (imageUrl || photo || '/bikevid/ezgif-frame-076.webp').trim();
    const effectiveStatus = status || (published === false ? 'draft' : 'published');
    const effectivePublished = published !== undefined ? published : (effectiveStatus === 'published');

    const newReview = {
      id: `rev-${Date.now()}-${randomBytes(3).toString('hex')}`,
      customerName: effectiveName,
      name: effectiveName,
      model: effectiveModel,
      bikeModel: effectiveModel,
      rating: Math.min(5, Math.max(1, Number(rating) || 5)),
      review: effectiveReview,
      comment: effectiveReview,
      imageUrl: effectivePhoto,
      photo: effectivePhoto,
      city: city || 'Salem',
      status: effectiveStatus,
      published: effectivePublished,
      displayOrder: Number(displayOrder) || 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await reviewsStore.mutate((reviews) => {
      reviews.unshift(newReview);
    });
    await logAdminActivity('CREATE', `Customer Review: ${newReview.customerName}`, `Added review for ${newReview.model}`);
    return response.status(201).json({ review: newReview });
  } catch (error) {
    return next(error);
  }
});

app.put('/api/admin/reviews/:id', async (request, response, next) => {
  try {
    let updated;
    await reviewsStore.mutate((reviews) => {
      const index = reviews.findIndex((r) => r.id === request.params.id);
      if (index < 0) throw apiError('Review not found.', 404, 'review_not_found');
      updated = {
        ...reviews[index],
        ...request.body,
        id: reviews[index].id,
        updatedAt: new Date().toISOString(),
      };
      reviews[index] = updated;
    });
    await logAdminActivity('UPDATE', `Customer Review: ${updated.customerName}`, 'Updated review details');
    return response.json({ review: updated });
  } catch (error) {
    return next(error);
  }
});

app.delete('/api/admin/reviews/:id', async (request, response, next) => {
  try {
    await reviewsStore.mutate((reviews) => {
      const index = reviews.findIndex((r) => r.id === request.params.id);
      if (index < 0) throw apiError('Review not found.', 404, 'review_not_found');
      reviews.splice(index, 1);
    });
    await logAdminActivity('DELETE', `Review: ${request.params.id}`, 'Removed customer review');
    return response.status(204).end();
  } catch (error) {
    return next(error);
  }
});

// --- Gallery Management ---
app.get('/api/admin/gallery', async (request, response, next) => {
  try {
    const rawGallery = await galleryStore.read();
    const gallery = rawGallery.map((g) => ({
      ...g,
      imageUrl: g.mediaUrl || g.imageUrl || g.url,
      mediaUrl: g.mediaUrl || g.imageUrl || g.url,
    }));
    return response.json({ gallery, items: gallery });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/admin/gallery', async (request, response, next) => {
  try {
    const { title, category, mediaType, mediaUrl, imageUrl, url, altText, description, caption, status, displayOrder, featured } = request.body || {};
    const effectiveUrl = (mediaUrl || imageUrl || url || '').trim();
    if (!title || !effectiveUrl) throw apiError('Title and media URL are required.', 400, 'invalid_gallery_item');
    const newItem = {
      id: `gal-${Date.now()}-${randomBytes(3).toString('hex')}`,
      title: title.trim(),
      category: category || 'Showroom',
      mediaType: mediaType || 'image',
      mediaUrl: effectiveUrl,
      imageUrl: effectiveUrl,
      altText: altText?.trim() || title.trim(),
      description: (description || caption || '').trim(),
      caption: (description || caption || '').trim(),
      featured: Boolean(featured),
      status: status || 'published',
      displayOrder: Number(displayOrder) || 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await galleryStore.mutate((items) => {
      items.unshift(newItem);
    });
    await logAdminActivity('CREATE', `Gallery: ${newItem.title}`, 'Added gallery media');
    return response.status(201).json({ item: newItem });
  } catch (error) {
    return next(error);
  }
});

app.put('/api/admin/gallery/:id', async (request, response, next) => {
  try {
    let updated;
    await galleryStore.mutate((items) => {
      const index = items.findIndex((g) => g.id === request.params.id);
      if (index < 0) throw apiError('Gallery item not found.', 404, 'gallery_not_found');
      updated = {
        ...items[index],
        ...request.body,
        id: items[index].id,
        updatedAt: new Date().toISOString(),
      };
      items[index] = updated;
    });
    await logAdminActivity('UPDATE', `Gallery: ${updated.title}`, 'Updated gallery item');
    return response.json({ item: updated });
  } catch (error) {
    return next(error);
  }
});

app.delete('/api/admin/gallery/:id', async (request, response, next) => {
  try {
    await galleryStore.mutate((items) => {
      const index = items.findIndex((g) => g.id === request.params.id);
      if (index < 0) throw apiError('Gallery item not found.', 404, 'gallery_not_found');
      items.splice(index, 1);
    });
    await logAdminActivity('DELETE', `Gallery: ${request.params.id}`, 'Removed gallery item');
    return response.status(204).end();
  } catch (error) {
    return next(error);
  }
});

// --- Website Content ---
app.get('/api/admin/content', async (request, response, next) => {
  try {
    const content = await websiteContentStore.read();
    return response.json({ content });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/admin/content', async (request, response, next) => {
  try {
    const { key, title, section, body, imageUrl, ctaText, ctaLink, status } = request.body || {};
    if (!title || !body) throw apiError('Title and body text are required.', 400, 'invalid_content');
    const newContent = {
      id: `cnt-${Date.now()}-${randomBytes(3).toString('hex')}`,
      key: key?.trim() || `content-${Date.now()}`,
      title: title.trim(),
      section: section || 'General',
      body: body.trim(),
      imageUrl: imageUrl?.trim() || '',
      ctaText: ctaText?.trim() || '',
      ctaLink: ctaLink?.trim() || '',
      status: status || 'published',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await websiteContentStore.mutate((items) => {
      items.unshift(newContent);
    });
    await logAdminActivity('CREATE', `Content: ${newContent.title}`, 'Added content block');
    return response.status(201).json({ content: newContent });
  } catch (error) {
    return next(error);
  }
});

app.put('/api/admin/content/:id', async (request, response, next) => {
  try {
    let updated;
    await websiteContentStore.mutate((items) => {
      const index = items.findIndex((c) => c.id === request.params.id);
      if (index < 0) throw apiError('Content block not found.', 404, 'content_not_found');
      updated = {
        ...items[index],
        ...request.body,
        id: items[index].id,
        updatedAt: new Date().toISOString(),
      };
      items[index] = updated;
    });
    await logAdminActivity('UPDATE', `Content: ${updated.title}`, 'Updated content text and links');
    return response.json({ content: updated });
  } catch (error) {
    return next(error);
  }
});

app.delete('/api/admin/content/:id', async (request, response, next) => {
  try {
    await websiteContentStore.mutate((items) => {
      const index = items.findIndex((c) => c.id === request.params.id);
      if (index < 0) throw apiError('Content not found.', 404, 'content_not_found');
      items.splice(index, 1);
    });
    await logAdminActivity('DELETE', `Content: ${request.params.id}`, 'Removed content block');
    return response.status(204).end();
  } catch (error) {
    return next(error);
  }
});

// --- Home Page Settings ---
app.get('/api/admin/home-page', async (request, response, next) => {
  try {
    const homePage = await homePageStore.read();
    return response.json({ homePage });
  } catch (error) {
    return next(error);
  }
});

app.put('/api/admin/home-page', async (request, response, next) => {
  try {
    let updated;
    await homePageStore.mutate((current) => {
      updated = {
        ...current,
        ...request.body,
        updatedAt: new Date().toISOString(),
      };
      return updated;
    });
    await logAdminActivity('UPDATE', 'Home Page Settings', 'Saved hero slider slides and settings');
    return response.json({ homePage: updated });
  } catch (error) {
    return next(error);
  }
});

// --- Website Sections ---
app.get('/api/admin/sections', async (request, response, next) => {
  try {
    const sections = await websiteSectionsStore.read();
    return response.json({ sections });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/admin/sections', async (request, response, next) => {
  try {
    const { title, subtitle, placement, content, imageUrl, status, displayOrder } = request.body || {};
    if (!title) throw apiError('Section title is required.', 400, 'invalid_section');
    const newSection = {
      id: `sec-${Date.now()}-${randomBytes(3).toString('hex')}`,
      sectionKey: title.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      title: title.trim(),
      subtitle: subtitle?.trim() || '',
      placement: placement || 'Homepage',
      content: content?.trim() || '',
      imageUrl: imageUrl?.trim() || '',
      status: status || 'active',
      displayOrder: Number(displayOrder) || 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await websiteSectionsStore.mutate((sections) => {
      sections.push(newSection);
      sections.sort((a, b) => (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0));
    });
    await logAdminActivity('CREATE', `Website Section: ${newSection.title}`, 'Created section');
    return response.status(201).json({ section: newSection });
  } catch (error) {
    return next(error);
  }
});

app.put('/api/admin/sections/:id', async (request, response, next) => {
  try {
    let updated;
    await websiteSectionsStore.mutate((sections) => {
      const index = sections.findIndex((s) => s.id === request.params.id);
      if (index < 0) throw apiError('Section not found.', 404, 'section_not_found');
      updated = {
        ...sections[index],
        ...request.body,
        id: sections[index].id,
        updatedAt: new Date().toISOString(),
      };
      sections[index] = updated;
      sections.sort((a, b) => (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0));
    });
    await logAdminActivity('UPDATE', `Website Section: ${updated.title}`, 'Updated section content');
    return response.json({ section: updated });
  } catch (error) {
    return next(error);
  }
});

app.delete('/api/admin/sections/:id', async (request, response, next) => {
  try {
    await websiteSectionsStore.mutate((sections) => {
      const index = sections.findIndex((s) => s.id === request.params.id);
      if (index < 0) throw apiError('Section not found.', 404, 'section_not_found');
      sections.splice(index, 1);
    });
    await logAdminActivity('DELETE', `Website Section: ${request.params.id}`, 'Removed section');
    return response.status(204).end();
  } catch (error) {
    return next(error);
  }
});

// --- Media Library & Uploads ---
app.get('/api/admin/media', async (request, response, next) => {
  try {
    const media = await mediaLibraryStore.read();
    return response.json({ media });
  } catch (error) {
    return next(error);
  }
});

app.post(
  '/api/admin/media/upload',
  express.raw({ limit: '50mb', type: '*/*' }),
  async (request, response, next) => {
    try {
      if (!Buffer.isBuffer(request.body) || request.body.length === 0) {
        throw apiError('Upload a non-empty media file.', 400, 'invalid_upload');
      }

      const buffer = request.body;
      let mimeType = request.get('content-type')?.split(';')[0].trim().toLowerCase() || '';
      let extension = 'bin';
      let mediaType = 'image';

      if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))) {
        mimeType = 'image/png';
        extension = 'png';
        mediaType = 'image';
      } else if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        mimeType = 'image/jpeg';
        extension = 'jpg';
        mediaType = 'image';
      } else if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
        mimeType = 'image/webp';
        extension = 'webp';
        mediaType = 'image';
      } else if (buffer.length >= 6 && (buffer.toString('ascii', 0, 6) === 'GIF87a' || buffer.toString('ascii', 0, 6) === 'GIF89a')) {
        mimeType = 'image/gif';
        extension = 'gif';
        mediaType = 'image';
      } else if (buffer.length >= 8 && buffer.toString('ascii', 4, 8) === 'ftyp') {
        mimeType = 'video/mp4';
        extension = 'mp4';
        mediaType = 'video';
      } else if (buffer.length >= 4 && buffer.subarray(0, 4).equals(Buffer.from('1a45dfa3', 'hex'))) {
        mimeType = 'video/webm';
        extension = 'webm';
        mediaType = 'video';
      } else if (mimeType.includes('svg')) {
        mimeType = 'image/svg+xml';
        extension = 'svg';
        mediaType = 'image';
      } else {
        throw apiError('Unsupported media format. Upload PNG, JPEG, WebP, GIF, SVG or MP4/WebM.', 400, 'unsupported_media');
      }

      const rawName = request.get('x-file-name') ? decodeURIComponent(request.get('x-file-name')) : `upload-${Date.now()}.${extension}`;
      const originalName = rawName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const subDir = mediaType === 'video' ? 'videos' : 'imgs';
      const uploadDir = join(publicDirectory, subDir, 'uploads');
      await mkdir(uploadDir, { recursive: true });

      const safeBase = originalName.slice(0, 24).replace(/\.[^.]+$/, '');
      const filename = `${safeBase}-${Date.now()}-${randomBytes(3).toString('hex')}.${extension}`;
      const destination = join(uploadDir, filename);

      await writeFile(destination, buffer, { flag: 'wx', mode: 0o644 });
      const publicPath = `/${subDir}/uploads/${filename}`;

      const mediaRecord = {
        id: `med-${Date.now()}-${randomBytes(3).toString('hex')}`,
        fileName: filename,
        originalName,
        filePath: publicPath,
        mediaType,
        mimeType,
        sizeBytes: buffer.length,
        category: mediaType === 'video' ? 'Workshop' : 'General',
        altText: originalName,
        createdAt: new Date().toISOString(),
      };

      await mediaLibraryStore.mutate((items) => {
        items.unshift(mediaRecord);
      });

      await logAdminActivity('UPLOAD', `Media: ${filename}`, `Uploaded ${mediaType} (${(buffer.length / 1024).toFixed(0)} KB)`);

      return response.status(201).json({
        id: mediaRecord.id,
        fileName: filename,
        filePath: publicPath,
        url: publicPath,
        mediaType,
        mimeType,
        sizeBytes: buffer.length,
      });
    } catch (error) {
      return next(error);
    }
  }
);

app.delete('/api/admin/media/:id', async (request, response, next) => {
  try {
    await mediaLibraryStore.mutate((items) => {
      const index = items.findIndex((m) => m.id === request.params.id);
      if (index < 0) throw apiError('Media not found.', 404, 'media_not_found');
      items.splice(index, 1);
    });
    await logAdminActivity('DELETE', `Media: ${request.params.id}`, 'Removed media item');
    return response.status(204).end();
  } catch (error) {
    return next(error);
  }
});

// --- SEO Settings ---
app.get('/api/admin/seo', async (request, response, next) => {
  try {
    const seo = await seoSettingsStore.read();
    return response.json({ seo });
  } catch (error) {
    return next(error);
  }
});

app.put('/api/admin/seo/:id', async (request, response, next) => {
  try {
    let updated;
    await seoSettingsStore.mutate((items) => {
      const index = items.findIndex((s) => s.id === request.params.id);
      if (index < 0) throw apiError('SEO record not found.', 404, 'seo_not_found');
      updated = {
        ...items[index],
        ...request.body,
        id: items[index].id,
        updatedAt: new Date().toISOString(),
      };
      items[index] = updated;
    });
    await logAdminActivity('UPDATE', `SEO: ${updated.page}`, 'Updated meta tags and canonical URLs');
    return response.json({ seo: updated });
  } catch (error) {
    return next(error);
  }
});

// --- Users & Roles ---
app.get('/api/admin/users', async (request, response, next) => {
  try {
    const users = await listAdminUsers();
    return response.json({ users });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/admin/users', async (request, response, next) => {
  try {
    const { name, email, password, role, status } = request.body || {};
    const newUser = await createAdminUser({ name, email, password, role, status });
    await logAdminActivity('CREATE', `User: ${newUser.name}`, `Added administrator (${newUser.role})`);
    return response.status(201).json({ user: newUser });
  } catch (error) {
    return response.status(400).json({ code: 'user_create_failed', message: error.message });
  }
});

app.put('/api/admin/users/:id', async (request, response, next) => {
  try {
    const updated = await updateAdminUser(request.params.id, request.body || {});
    await logAdminActivity('UPDATE', `User: ${updated.name}`, `Updated administrator details/role`);
    return response.json({ user: updated });
  } catch (error) {
    return response.status(400).json({ code: 'user_update_failed', message: error.message });
  }
});

app.delete('/api/admin/users/:id', async (request, response, next) => {
  try {
    const currentUserId = request.adminUser?.id || request.adminUser?.email;
    await deleteAdminUser(request.params.id, currentUserId);
    await logAdminActivity('DELETE', `User: ${request.params.id}`, 'Removed administrator account');
    return response.status(204).end();
  } catch (error) {
    return response.status(400).json({ code: 'user_delete_failed', message: error.message });
  }
});

// --- Activity Logs ---
app.get('/api/admin/activity', async (request, response, next) => {
  try {
    const activity = await activityStore.read();
    return response.json({ activity, activities: activity });
  } catch (error) {
    return next(error);
  }
});

app.delete('/api/admin/activity', async (request, response, next) => {
  try {
    await activityStore.mutate(() => []);
    return response.status(204).end();
  } catch (error) {
    return next(error);
  }
});

// --- Site Settings ---
app.get('/api/admin/settings', async (request, response, next) => {
  try {
    const settings = await siteSettingsStore.read();
    return response.json({ settings });
  } catch (error) {
    return next(error);
  }
});

app.put('/api/admin/settings', async (request, response, next) => {
  try {
    let updated;
    await siteSettingsStore.mutate((current) => {
      updated = {
        ...current,
        ...request.body,
        updatedAt: new Date().toISOString(),
      };
      return updated;
    });
    await logAdminActivity('UPDATE', 'Site Settings', 'Saved dealership contact info and operating hours');
    return response.json({ settings: updated });
  } catch (error) {
    return next(error);
  }
});

// --- Admin Profile ---
app.get('/api/admin/profile', (request, response) => {
  const current = request.adminUser || {};
  return response.json({
    user: {
      name: current.name || 'Sanjay',
      email: current.email || 'yourssanjay63@gmail.com',
      role: current.role || 'Super Admin',
      dealership: 'Vathilai Motors — Batlagundu',
      accessType: authConfigured ? 'Auth0 Production' : 'Verified Dealership Admin',
    },
  });
});

app.put('/api/admin/profile', async (request, response, next) => {
  try {
    const { name, email } = request.body || {};
    await logAdminActivity('UPDATE', 'Admin Profile', `Updated profile for ${name || 'Administrator'}`);
    return response.json({
      user: {
        name: name || 'Vathilai Motors Administrator',
        email: email || 'admin@vathilaimotors.com',
        role: 'Super Admin',
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return next(error);
  }
});

// --- Public Synchronized Endpoints ---
app.get('/api/public/reviews', async (request, response, next) => {
  try {
    const rawReviews = await reviewsStore.read();
    const reviews = rawReviews
      .filter((r) => r.status === 'published' || r.published === true)
      .map((r) => ({
        ...r,
        name: r.customerName || r.name,
        customerName: r.customerName || r.name,
        comment: r.review || r.comment,
        review: r.review || r.comment,
        bikeModel: r.model || r.bikeModel,
        model: r.model || r.bikeModel,
        photo: r.imageUrl || r.photo,
        imageUrl: r.imageUrl || r.photo,
        published: true,
      }));
    return response.json({ reviews });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/public/service-videos', async (request, response, next) => {
  try {
    const videos = await serviceVideosStore.read();
    return response.json({ videos: videos.filter((v) => v.status === 'published') });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/public/home-page', async (request, response, next) => {
  try {
    const homePage = await homePageStore.read();
    return response.json({ homePage });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/public/social-profiles', async (request, response, next) => {
  try {
    const rawProfiles = await socialProfilesStore.read();
    const active = rawProfiles.filter((p) => {
      const isVisible = p.status === 'connected' || p.status === 'active' || p.status === 'published';
      const notHidden = p.status !== 'hidden' && p.status !== 'disconnected' && p.showInFooter !== false;
      const hasUrl = Boolean((p.profileUrl || p.url) && (p.profileUrl || p.url) !== '#');
      return isVisible && notHidden && hasUrl;
    });
    return response.json({ profiles: active });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/public/settings', async (request, response, next) => {
  try {
    const [settings, rawProfiles] = await Promise.all([
      siteSettingsStore.read(),
      socialProfilesStore.read(),
    ]);
    const activeProfiles = rawProfiles.filter((p) => {
      const isVisible = p.status === 'connected' || p.status === 'active' || p.status === 'published';
      const notHidden = p.status !== 'hidden' && p.status !== 'disconnected' && p.showInFooter !== false;
      const hasUrl = Boolean((p.profileUrl || p.url) && (p.profileUrl || p.url) !== '#');
      return isVisible && notHidden && hasUrl;
    });
    return response.json({
      settings: {
        dealershipName: settings.dealershipName || settings.showroomName,
        tagline: settings.tagline,
        brandDescription: settings.brandDescription,
        phone: settings.phone,
        email: settings.email,
        whatsapp: settings.whatsapp,
        whatsappVerified: settings.whatsappVerified,
        address: settings.address,
        instagramUrl: settings.instagramUrl,
        socialProfiles: activeProfiles,
        businessCategory: settings.businessCategory,
        locality: settings.locality,
        postalCode: settings.postalCode,
        operatingHours: settings.operatingHours || settings.hours,
        googleRating: settings.googleRating,
        googleReviewCount: settings.googleReviewCount,
        googleRatingVerified: settings.googleRatingVerified,
        googleRatingSource: settings.googleRatingSource,
      },
    });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/public/gallery', async (request, response, next) => {
  try {
    const gallery = await galleryStore.read();
    return response.json({ gallery: gallery.filter((g) => g.status === 'published') });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/public/data-deletion-request', async (request, response, next) => {
  try {
    const { fullName, phone, email, requestType, reason } = request.body || {};
    const cleanPhone = String(phone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      return response.status(400).json({
        code: 'invalid_phone',
        message: 'A valid 10-digit mobile number is required to locate customer records.',
      });
    }

    const referenceId = `DEL-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      await logAdminActivity(
        'CUSTOMER_DATA_DELETION_REQUEST',
        `Phone: ${cleanPhone}`,
        JSON.stringify({
          referenceId,
          fullName: fullName ? String(fullName).trim() : 'Anonymous',
          phone: cleanPhone,
          email: email ? String(email).trim().toLowerCase() : undefined,
          requestType: requestType || 'full_deletion',
          reason: reason ? String(reason).trim().slice(0, 500) : undefined,
          status: 'pending_verification',
          submittedAt: new Date().toISOString(),
        }),
        'Public Web Portal'
      );
    } catch (logErr) {
      console.warn('Could not log data deletion activity:', logErr.message);
    }

    return response.status(200).json({
      success: true,
      referenceId,
      message: 'Your data deletion request has been registered and is queued for verification and processing within 30 days.',
      status: 'pending',
    });
  } catch (error) {
    return next(error);
  }
});

app.use('/api', (request, response) => {
  response.status(404).json({ code: 'api_route_not_found' });
});

if (!production && process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  app.get('/', (request, response, next) => {
    if (existsSync(join(distributionDirectory, 'index.html'))) {
      return response.sendFile(join(distributionDirectory, 'index.html'), (error) => {
        if (error) next(error);
      });
    }
    return response.status(200).send('Yamaha admin API is running.');
  });
}

if (production || existsSync(join(distributionDirectory, 'index.html'))) {
  app.use(express.static(distributionDirectory, { index: false }));
  app.use((request, response, next) => {
    if (!['GET', 'HEAD'].includes(request.method)) {
      return response.status(404).json({ code: 'route_not_found' });
    }
    const distIndex = join(distributionDirectory, 'index.html');
    if (existsSync(distIndex)) {
      return response.sendFile(distIndex, (error) => {
        if (error) next(error);
      });
    }
    return next();
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
const host = process.env.HOST ?? (production ? '0.0.0.0' : '127.0.0.1');
export {
  app,
  initializeMongoDatabase,
  createBooking,
  validateBookingInput,
  setBookingStatus,
  readBookings,
  readMotorcycleCatalog,
};

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  initializeMongoDatabase()
    .then(() => {
      app.listen(port, host, () => {
        if (authConfigured) {
          console.info(`Auth0 admin API listening on http://${host}:${port}.`);
        } else if (allowAdminFallback) {
          console.warn(`Admin API started with local administration enabled on http://${host}:${port}.`);
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
