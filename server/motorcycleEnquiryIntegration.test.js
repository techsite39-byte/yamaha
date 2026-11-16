import assert from 'node:assert/strict';
import { test } from 'node:test';

process.env.NODE_ENV = 'development';
for (const key of [
  'AUTH0_BASE_URL',
  'AUTH0_ISSUER_BASE_URL',
  'AUTH0_CLIENT_ID',
  'AUTH0_CLIENT_SECRET',
  'AUTH0_SECRET',
  'ADMIN_ALLOWED_SUBJECTS',
]) {
  delete process.env[key];
}

const {
  validateBookingInput,
  createBooking,
  setBookingStatus,
  readBookings,
  readMotorcycleCatalog,
} = await import('./index.js');

test('Motorcycle Details Enquiry: Input Validation', async () => {
  const motorcycles = await readMotorcycleCatalog();

  // 1. Missing customer name throws 400
  assert.throws(
    () => {
      validateBookingInput(
        {
          customerName: '',
          mobileNumber: '9841234567',
          email: 'test@example.com',
          city: 'Batlagundu',
          motorcycleModel: 'Yamaha MT-15 V2',
          enquiry: true,
        },
        motorcycles
      );
    },
    (err) => err.status === 400 && /name/i.test(err.message)
  );

  // 2. Invalid phone format throws 400
  assert.throws(
    () => {
      validateBookingInput(
        {
          customerName: 'Karthik Raja',
          mobileNumber: '12345',
          email: 'test@example.com',
          city: 'Batlagundu',
          motorcycleModel: 'Yamaha MT-15 V2',
          enquiry: true,
        },
        motorcycles
      );
    },
    (err) => err.status === 400 && /phone|mobile/i.test(err.message)
  );

  // 3. Invalid email format throws 400
  assert.throws(
    () => {
      validateBookingInput(
        {
          customerName: 'Karthik Raja',
          mobileNumber: '9841234567',
          email: 'invalid-email-address',
          city: 'Batlagundu',
          motorcycleModel: 'Yamaha MT-15 V2',
          enquiry: true,
        },
        motorcycles
      );
    },
    (err) => err.status === 400 && /email/i.test(err.message)
  );

  // 4. Missing city throws 400
  assert.throws(
    () => {
      validateBookingInput(
        {
          customerName: 'Karthik Raja',
          mobileNumber: '9841234567',
          email: 'test@example.com',
          city: '',
          motorcycleModel: 'Yamaha MT-15 V2',
          enquiry: true,
        },
        motorcycles
      );
    },
    (err) => err.status === 400 && /city/i.test(err.message)
  );

  // 5. Valid input normalizes properly
  const validated = validateBookingInput(
    {
      customerName: '  Karthik Raja  ',
      mobileNumber: '+91 98412 34567',
      email: '  Karthik.Raja@Example.COM  ',
      city: '  Batlagundu  ',
      preferredContactMethod: 'WhatsApp',
      message: 'Need on-road price in Batlagundu.',
      motorcycleModel: 'Yamaha MT-15 Version 2.0',
      motorcycleVariant: 'Metallic Black',
      source: 'motorcycle-details',
      enquiry: true,
    },
    motorcycles
  );

  assert.equal(validated.customerName, 'Karthik Raja');
  assert.equal(validated.mobileNumber.replace(/^\+91/, ''), '9841234567');
  assert.equal(validated.email, 'karthik.raja@example.com');
  assert.equal(validated.city, 'Batlagundu');
  assert.equal(validated.preferredContactMethod, 'WhatsApp');
  assert.equal(validated.message, 'Need on-road price in Batlagundu.');
  assert.equal(validated.source, 'motorcycle-details');
  assert.equal(validated.type, 'enquiry');
  assert.ok(validated.requestId);
});

test('Motorcycle Details Enquiry: Full Persistence of all 14 Fields and Status Lifecycle', async () => {
  const motorcycles = await readMotorcycleCatalog();

  const validated = validateBookingInput(
    {
      customerName: 'Kavitha S',
      mobileNumber: '9025335720',
      email: 'kavitha.s@gmail.com',
      city: 'Batlagundu',
      preferredContactMethod: 'Call',
      message: 'Looking for festival booking offers for Aerox 155.',
      motorcycleModel: 'Yamaha Aerox 155',
      motorcycleVariant: 'Racing Blue',
      motorcycleCategory: 'Maxi Sports Scooter',
      motorcycleId: 'yamaha-aerox-155',
      slug: 'yamaha-aerox-155',
      source: 'motorcycle-details',
      enquiry: true,
    },
    motorcycles
  );

  const enquiry = await createBooking(validated);

  // 1. Verify all 14 required fields
  assert.ok(enquiry.reference);
  assert.equal(enquiry.enquiryId, enquiry.reference);
  assert.equal(enquiry.customerName, 'Kavitha S');
  assert.equal(enquiry.mobileNumber, '9025335720');
  assert.equal(enquiry.email, 'kavitha.s@gmail.com');
  assert.equal(enquiry.city, 'Batlagundu');
  assert.equal(enquiry.preferredContactMethod, 'Call');
  assert.equal(enquiry.message, 'Looking for festival booking offers for Aerox 155.');
  assert.equal(enquiry.motorcycleModel, 'Yamaha Aerox 155');
  assert.equal(enquiry.motorcycleVariant, 'Racing Blue');
  assert.equal(enquiry.motorcycleCategory, 'Maxi Sports Scooter');
  assert.equal(enquiry.motorcycleId, 'yamaha-aerox-155');
  assert.equal(enquiry.slug, 'yamaha-aerox-155');
  assert.equal(enquiry.source, 'motorcycle-details');
  assert.equal(enquiry.enquiryStatus, 'new');

  // 2. Verify backward compatibility fields
  assert.equal(enquiry.customer.name, 'Kavitha S');
  assert.equal(enquiry.customer.phone, '9025335720');
  assert.equal(enquiry.customer.email, 'kavitha.s@gmail.com');
  assert.equal(enquiry.customer.city, 'Batlagundu');
  assert.equal(enquiry.status, 'new');

  // 3. Verify enquiry is persisted and queryable from store
  const allBookings = await readBookings();
  const persisted = allBookings.find((b) => b.reference === enquiry.reference);
  assert.ok(persisted, 'Created enquiry must be persisted in database store');
  assert.equal(persisted.customerName, 'Kavitha S');
  assert.equal(persisted.motorcycleModel, 'Yamaha Aerox 155');
  assert.equal(persisted.source, 'motorcycle-details');

  // 4. Verify Status Transitions: new -> contacted -> converted
  const updatedContacted = await setBookingStatus(enquiry.reference, 'contacted', 'Customer called back, interested in finance.');
  assert.equal(updatedContacted.status, 'contacted');
  assert.equal(updatedContacted.enquiryStatus, 'contacted');

  const updatedConverted = await setBookingStatus(enquiry.reference, 'converted', 'Customer booked delivery slot.');
  assert.equal(updatedConverted.status, 'converted');
  assert.equal(updatedConverted.enquiryStatus, 'converted');

  // 5. Verify invalid status is rejected
  await assert.rejects(
    async () => {
      await setBookingStatus(enquiry.reference, 'invalid_status_value');
    },
    (err) => err.status === 400
  );
});
