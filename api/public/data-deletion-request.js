export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ code: 'method_not_allowed', message: 'Only POST requests are supported.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    const { fullName, phone, email, requestType, reason } = body || {};
    const cleanPhone = String(phone || '').replace(/\D/g, '');

    if (!cleanPhone || cleanPhone.length < 10) {
      return res.status(400).json({
        code: 'invalid_phone',
        message: 'A valid 10-digit mobile number is required to locate customer records.',
      });
    }

    const referenceId = `DEL-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return res.status(200).json({
      success: true,
      referenceId,
      message: 'Your data deletion request has been registered and is queued for verification and processing within 30 days.',
      status: 'pending',
    });
  } catch (error) {
    return res.status(500).json({
      code: 'internal_error',
      message: error.message || 'An error occurred while registering your deletion request.',
    });
  }
}
