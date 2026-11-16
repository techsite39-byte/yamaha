import React, { useEffect, useState } from 'react';
import './YamahaLegalPage.css';

function YamahaDataDeletion({ onNavigate }) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [requestType, setRequestType] = useState('full_deletion');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Data Deletion Instructions | Vathilai Motors – Authorised Yamaha Dealership';
  }, []);

  const handleLink = (event, path) => {
    if (onNavigate) {
      event.preventDefault();
      onNavigate(path);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatusMessage(null);

    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setStatusMessage({
        type: 'error',
        text: 'Please enter a valid 10-digit mobile number associated with your enquiry or booking.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/public/data-deletion-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: cleanPhone,
          email: email.trim(),
          requestType,
          reason: reason.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Unable to submit deletion request. Please call our dealership directly.');
      }

      setStatusMessage({
        type: 'success',
        referenceId: data.referenceId || `DEL-${Date.now().toString().slice(-6)}`,
        text: `Your data deletion request has been submitted successfully. Our privacy team will verify and purge the associated customer records within 30 days.`,
      });
      setFullName('');
      setPhone('');
      setEmail('');
      setReason('');
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'An error occurred while submitting your request. Please call us at 081444 45566.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="yamaha-legal-page" id="top">
      <div className="yamaha-legal-shell">
        {/* Header */}
        <header className="yamaha-legal-header">
          <div className="yamaha-legal-eyebrow">User Privacy &amp; Data Rights</div>
          <h1 className="yamaha-legal-title">Data Deletion Instructions</h1>
          <div className="yamaha-legal-meta">
            <span className="yamaha-legal-badge">
              <span className="yamaha-legal-badge-dot" />
              Customer Erasure Mechanism
            </span>
            <span>Entity: <strong>Vathilai Motors</strong></span>
            <span>Policy Version: <strong>2026.1</strong></span>
            <span>Last Updated: <strong>November 16, 2026</strong></span>
          </div>
        </header>

        {/* Quick Jump Navigation */}
        <nav className="yamaha-legal-toc" aria-label="Table of contents">
          <p className="yamaha-legal-toc-title">Guide Contents</p>
          <ul className="yamaha-legal-toc-grid">
            <li>
              <a href="#overview" className="yamaha-legal-toc-link">
                <span className="yamaha-legal-toc-num">01.</span> Deletion Overview
              </a>
            </li>
            <li>
              <a href="#eligible" className="yamaha-legal-toc-link">
                <span className="yamaha-legal-toc-num">02.</span> Eligible Data Categories
              </a>
            </li>
            <li>
              <a href="#online-form" className="yamaha-legal-toc-link">
                <span className="yamaha-legal-toc-num">03.</span> Submit Online Request
              </a>
            </li>
            <li>
              <a href="#channels" className="yamaha-legal-toc-link">
                <span className="yamaha-legal-toc-num">04.</span> Alternative Channels
              </a>
            </li>
            <li>
              <a href="#exceptions" className="yamaha-legal-toc-link">
                <span className="yamaha-legal-toc-num">05.</span> Statutory Exceptions
              </a>
            </li>
            <li>
              <a href="#timeline" className="yamaha-legal-toc-link">
                <span className="yamaha-legal-toc-num">06.</span> Processing Timeline (SLA)
              </a>
            </li>
          </ul>
        </nav>

        {/* Content Body */}
        <div className="yamaha-legal-content">
          {/* Section 1 */}
          <section id="overview" className="yamaha-legal-section">
            <div className="yamaha-legal-section-header">
              <span className="yamaha-legal-section-num">01</span>
              <h2 className="yamaha-legal-section-title">Data Deletion Overview &amp; Compliance</h2>
            </div>
            <p className="yamaha-legal-prose">
              At <strong>Vathilai Motors</strong>, we respect your right to control your personal digital footprint. In accordance with Indian digital data protection standards and platform requirements (including Meta, Facebook Lead Ads, and WhatsApp Business API Data Deletion Callback requirements), this page provides explicit instructions on how you can request the permanent removal of your personal information from our digital records.
            </p>
            <p className="yamaha-legal-prose">
              Whether you submitted an enquiry about a Yamaha YZF-R15, booked a test ride for an MT-15 V2, or received automated notifications through WhatsApp, you have the right to request that your personal contact records be expunged from our marketing and enquiry databases.
            </p>
          </section>

          {/* Section 2 */}
          <section id="eligible" className="yamaha-legal-section">
            <div className="yamaha-legal-section-header">
              <span className="yamaha-legal-section-num">02</span>
              <h2 className="yamaha-legal-section-title">Data Categories Eligible for Erasure</h2>
            </div>
            <p className="yamaha-legal-prose">
              Upon receiving a verified deletion request, Vathilai Motors will permanently erase or anonymize the following data elements:
            </p>
            <div className="yamaha-legal-grid">
              <div className="yamaha-legal-grid-item">
                <div className="yamaha-legal-grid-label">Enquiries &amp; Quotes</div>
                <div className="yamaha-legal-grid-value">Your name, phone number, email address, city, and motorcycle model preference submitted through website enquiry forms.</div>
              </div>
              <div className="yamaha-legal-grid-item">
                <div className="yamaha-legal-grid-label">WhatsApp Notification Logs</div>
                <div className="yamaha-legal-grid-value">Transactional notification history, message delivery statuses, and phone numbers stored for automated messaging updates.</div>
              </div>
              <div className="yamaha-legal-grid-item">
                <div className="yamaha-legal-grid-label">Showroom Bookings</div>
                <div className="yamaha-legal-grid-value">Test ride scheduling records, preferred showroom time slots, and non-invoiced vehicle reservation enquiries.</div>
              </div>
              <div className="yamaha-legal-grid-item">
                <div className="yamaha-legal-grid-label">Customer Service Logs</div>
                <div className="yamaha-legal-grid-value">Correspondence history, customer support tickets, and feedback submissions stored in digital records.</div>
              </div>
            </div>
          </section>

          {/* Section 3: Online Form */}
          <section id="online-form" className="yamaha-legal-section">
            <div className="yamaha-legal-section-header">
              <span className="yamaha-legal-section-num">03</span>
              <h2 className="yamaha-legal-section-title">Submit an Online Data Deletion Request</h2>
            </div>
            <p className="yamaha-legal-prose">
              Complete the self-service request form below to lodge an official deletion ticket directly with our dealership privacy administrator:
            </p>

            <div className="yamaha-deletion-form-card">
              <h3 className="yamaha-deletion-form-title">Customer Data Deletion Form</h3>
              <p className="yamaha-deletion-form-sub">
                Please provide the phone number and email address you used when submitting enquiries or bookings with Vathilai Motors.
              </p>

              <form onSubmit={handleSubmit} className="yamaha-deletion-form">
                <div className="yamaha-deletion-field">
                  <label htmlFor="del-fullname">Full Name <span>*</span></label>
                  <input
                    id="del-fullname"
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="yamaha-deletion-input"
                  />
                </div>

                <div className="yamaha-deletion-field">
                  <label htmlFor="del-phone">Registered Mobile Number <span>*</span></label>
                  <input
                    id="del-phone"
                    type="tel"
                    required
                    placeholder="e.g. 9876543210 (10 digits)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="yamaha-deletion-input"
                  />
                </div>

                <div className="yamaha-deletion-field">
                  <label htmlFor="del-email">Email Address</label>
                  <input
                    id="del-email"
                    type="email"
                    placeholder="name@example.com (if provided earlier)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="yamaha-deletion-input"
                  />
                </div>

                <div className="yamaha-deletion-field">
                  <label htmlFor="del-type">Scope of Erasure <span>*</span></label>
                  <select
                    id="del-type"
                    value={requestType}
                    onChange={(e) => setRequestType(e.target.value)}
                    className="yamaha-deletion-select"
                  >
                    <option value="full_deletion">Complete Deletion (All enquiries, bookings &amp; contact logs)</option>
                    <option value="whatsapp_optout">WhatsApp &amp; SMS Opt-Out Only (Stop messaging)</option>
                    <option value="enquiry_records">Enquiry History Only (Retain service profile if vehicle purchased)</option>
                  </select>
                </div>

                <div className="yamaha-deletion-field">
                  <label htmlFor="del-reason">Optional Reason / Notes</label>
                  <textarea
                    id="del-reason"
                    rows="3"
                    placeholder="Additional context or specific models you enquired about..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="yamaha-deletion-textarea"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="yamaha-deletion-submit"
                >
                  {isSubmitting ? 'Submitting Request...' : 'Submit Deletion Request'}
                </button>
              </form>

              {statusMessage && (
                <div
                  className={`yamaha-deletion-status yamaha-deletion-status--${statusMessage.type}`}
                  role="alert"
                >
                  {statusMessage.referenceId && (
                    <div style={{ marginBottom: 6, fontWeight: 700 }}>
                      Reference Ticket ID: {statusMessage.referenceId}
                    </div>
                  )}
                  {statusMessage.text}
                </div>
              )}
            </div>
          </section>

          {/* Section 4 */}
          <section id="channels" className="yamaha-legal-section">
            <div className="yamaha-legal-section-header">
              <span className="yamaha-legal-section-num">04</span>
              <h2 className="yamaha-legal-section-title">Alternative Deletion Channels</h2>
            </div>
            <p className="yamaha-legal-prose">
              If you prefer not to use the web form, you can submit your erasure request through any of the following authorized channels:
            </p>
            <ul className="yamaha-legal-list">
              <li>
                <strong>By Telephone:</strong> Call our customer desk at <strong>081444 45566</strong> (Monday to Saturday, 9:00 AM to 8:00 PM) and state that you wish to remove your customer record.
              </li>
              <li>
                <strong>By WhatsApp:</strong> Reply &ldquo;DELETE MY DATA&rdquo; or &ldquo;STOP&rdquo; on any official Vathilai Motors WhatsApp notification thread sent to your registered mobile number.
              </li>
              <li>
                <strong>In Person at the Showroom:</strong> Visit our customer reception desk at Parimalam Theatre Complex, Main Road, Batlagundu, Dindigul – 624202.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section id="exceptions" className="yamaha-legal-section">
            <div className="yamaha-legal-section-header">
              <span className="yamaha-legal-section-num">05</span>
              <h2 className="yamaha-legal-section-title">Statutory &amp; Regulatory Exceptions</h2>
            </div>
            <div className="yamaha-legal-card">
              <div className="yamaha-legal-card-title">Important Legal Notice on Invoiced Purchases</div>
              <p>
                Please note that if you have purchased a motorcycle from Vathilai Motors, certain records cannot be deleted immediately upon request. Indian commercial law, Goods &amp; Services Tax (GST) rules, and Motor Vehicles Act provisions mandate that dealerships retain official sale invoices, chassis/engine vehicle numbers, and RTO registration documentation for statutory audit periods.
              </p>
            </div>
            <p className="yamaha-legal-prose">
              Even in such cases, your marketing preferences, promotional contacts, and non-statutory digital enquiry logs will be completely purged from our active communication queues.
            </p>
          </section>

          {/* Section 6 */}
          <section id="timeline" className="yamaha-legal-section">
            <div className="yamaha-legal-section-header">
              <span className="yamaha-legal-section-num">06</span>
              <h2 className="yamaha-legal-section-title">Processing Timeline &amp; SLA</h2>
            </div>
            <p className="yamaha-legal-prose">
              Our data protection workflow follows strict service level agreements:
            </p>
            <div className="yamaha-legal-grid">
              <div className="yamaha-legal-grid-item">
                <div className="yamaha-legal-grid-label">Acknowledgment</div>
                <div className="yamaha-legal-grid-value">Within 48 hours of submission with a unique tracking Reference ID.</div>
              </div>
              <div className="yamaha-legal-grid-item">
                <div className="yamaha-legal-grid-label">Verification</div>
                <div className="yamaha-legal-grid-value">Identity verification via SMS / WhatsApp call to prevent unauthorized third-party erasure.</div>
              </div>
              <div className="yamaha-legal-grid-item">
                <div className="yamaha-legal-grid-label">Final Purge</div>
                <div className="yamaha-legal-grid-value">Permanent deletion completed within a maximum of 30 calendar days.</div>
              </div>
            </div>

            <div className="yamaha-legal-contact-box">
              <div>
                <h3 className="yamaha-legal-contact-name">Vathilai Motors</h3>
                <div className="yamaha-legal-contact-sub">Data Privacy &amp; Customer Support</div>
                <p className="yamaha-legal-contact-details">
                  Parimalam Theatre Complex, Main Road, Opp. Union Office Madurai,<br />
                  Batlagundu, Dindigul District, Tamil Nadu – 624202.<br /><br />
                  <strong>Direct Helpline:</strong> 081444 45566<br />
                  <strong>Portal URL:</strong> https://www.vathilaimotors.com/
                </p>
              </div>
              <div className="yamaha-legal-contact-actions">
                <a href="tel:08144445566" className="yamaha-legal-btn">
                  Call Helpline
                </a>
                <a href="/privacy-policy" onClick={(e) => handleLink(e, '/privacy-policy')} className="yamaha-legal-btn yamaha-legal-btn--outline">
                  Privacy Policy
                </a>
              </div>
            </div>
          </section>
        </div>

        {/* Footer Crosslinks */}
        <div className="yamaha-legal-crosslinks">
          <nav className="yamaha-legal-crosslinks-nav" aria-label="Related Legal Links">
            <a href="/privacy-policy" onClick={(e) => handleLink(e, '/privacy-policy')} className="yamaha-legal-crosslink">
              Privacy Policy <span>→</span>
            </a>
            <a href="/terms" onClick={(e) => handleLink(e, '/terms')} className="yamaha-legal-crosslink">
              Terms &amp; Conditions <span>→</span>
            </a>
          </nav>
          <a href="/" onClick={(e) => handleLink(e, '/')} className="yamaha-legal-backhome">
            ← Return to Vathilai Motors Home
          </a>
        </div>
      </div>
    </main>
  );
}

export default YamahaDataDeletion;
