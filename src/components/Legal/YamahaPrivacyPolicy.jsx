import React, { useEffect } from 'react';
import './YamahaLegalPage.css';

function YamahaPrivacyPolicy({ onNavigate }) {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Privacy Policy | Vathilai Motors – Authorised Yamaha Dealership';
  }, []);

  const handleLink = (event, path) => {
    if (onNavigate) {
      event.preventDefault();
      onNavigate(path);
    }
  };

  return (
    <main className="yamaha-legal-page" id="top">
      <div className="yamaha-legal-shell">
        {/* Header */}
        <header className="yamaha-legal-header">
          <div className="yamaha-legal-eyebrow">Legal &amp; Privacy Documentation</div>
          <h1 className="yamaha-legal-title">Privacy Policy</h1>
          <div className="yamaha-legal-meta">
            <span className="yamaha-legal-badge">
              <span className="yamaha-legal-badge-dot" />
              Official Dealership Policy
            </span>
            <span>Entity: <strong>Vathilai Motors</strong></span>
            <span>Effective Date: <strong>November 1, 2026</strong></span>
            <span>Last Updated: <strong>November 16, 2026</strong></span>
          </div>
        </header>

        {/* Quick Jump Navigation */}
        <nav className="yamaha-legal-toc" aria-label="Table of contents">
          <p className="yamaha-legal-toc-title">Policy Sections</p>
          <ul className="yamaha-legal-toc-grid">
            <li>
              <a href="#scope" className="yamaha-legal-toc-link">
                <span className="yamaha-legal-toc-num">01.</span> Scope &amp; Applicability
              </a>
            </li>
            <li>
              <a href="#collection" className="yamaha-legal-toc-link">
                <span className="yamaha-legal-toc-num">02.</span> Information We Collect
              </a>
            </li>
            <li>
              <a href="#usage" className="yamaha-legal-toc-link">
                <span className="yamaha-legal-toc-num">03.</span> How We Use Your Data
              </a>
            </li>
            <li>
              <a href="#whatsapp" className="yamaha-legal-toc-link">
                <span className="yamaha-legal-toc-num">04.</span> WhatsApp &amp; SMS Alerts
              </a>
            </li>
            <li>
              <a href="#sharing" className="yamaha-legal-toc-link">
                <span className="yamaha-legal-toc-num">05.</span> Data Sharing &amp; Protection
              </a>
            </li>
            <li>
              <a href="#retention" className="yamaha-legal-toc-link">
                <span className="yamaha-legal-toc-num">06.</span> Data Retention &amp; Security
              </a>
            </li>
            <li>
              <a href="#rights" className="yamaha-legal-toc-link">
                <span className="yamaha-legal-toc-num">07.</span> Your Rights &amp; Erasure
              </a>
            </li>
            <li>
              <a href="#contact" className="yamaha-legal-toc-link">
                <span className="yamaha-legal-toc-num">08.</span> Dealership Contact Info
              </a>
            </li>
          </ul>
        </nav>

        {/* Policy Body */}
        <div className="yamaha-legal-content">
          {/* Section 1 */}
          <section id="scope" className="yamaha-legal-section">
            <div className="yamaha-legal-section-header">
              <span className="yamaha-legal-section-num">01</span>
              <h2 className="yamaha-legal-section-title">Scope &amp; Applicability</h2>
            </div>
            <p className="yamaha-legal-prose">
              This Privacy Policy applies to all visitors, prospective buyers, and registered customers interacting with{' '}
              <strong>Vathilai Motors</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), an authorised Yamaha motorcycle dealership located in Batlagundu, Dindigul District, Tamil Nadu, India, via our official website{' '}
              <a href="https://www.vathilaimotors.com/" style={{ color: '#38bdf8' }}>https://www.vathilaimotors.com/</a>, our showroom customer service desk, or associated digital communication channels.
            </p>
            <p className="yamaha-legal-prose">
              We respect your privacy and are committed to safeguarding personal data collected through digital enquiry forms, showroom test ride bookings, booking requests, and messaging notifications in accordance with applicable Indian information technology and privacy guidelines.
            </p>
          </section>

          {/* Section 2 */}
          <section id="collection" className="yamaha-legal-section">
            <div className="yamaha-legal-section-header">
              <span className="yamaha-legal-section-num">02</span>
              <h2 className="yamaha-legal-section-title">Information We Collect</h2>
            </div>
            <p className="yamaha-legal-prose">
              When you submit enquiries, book test rides, configure motorcycles, or contact our team, we collect only the necessary information required to fulfil your request:
            </p>
            <ul className="yamaha-legal-list">
              <li>
                <strong>Customer Contact Details:</strong> Full name, 10-digit mobile phone number, email address, and residential city/district.
              </li>
              <li>
                <strong>Motorcycle Preference &amp; Enquiry Details:</strong> Selected Yamaha motorcycle model (e.g. YZF-R15M, MT-15 V2, FZ-S FI, Aerox 155, RayZR), chosen colour edition, accessories, variant preference, and financing/exchange interest.
              </li>
              <li>
                <strong>Booking &amp; Appointment Details:</strong> Desired showroom visit date, preferred appointment time slot, test ride requests, and notes provided in enquiry forms.
              </li>
              <li>
                <strong>Digital Technical Identifiers:</strong> Non-personally identifiable technical information such as device type, browser specifications, and IP address collected automatically during secure server sessions to maintain site performance and prevent automated abuse.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section id="usage" className="yamaha-legal-section">
            <div className="yamaha-legal-section-header">
              <span className="yamaha-legal-section-num">03</span>
              <h2 className="yamaha-legal-section-title">How We Use Your Data</h2>
            </div>
            <p className="yamaha-legal-prose">
              Personal data collected through Vathilai Motors is strictly processed for legitimate dealership operational objectives:
            </p>
            <div className="yamaha-legal-grid">
              <div className="yamaha-legal-grid-item">
                <div className="yamaha-legal-grid-label">Sales &amp; Quotations</div>
                <div className="yamaha-legal-grid-value">Delivering verified ex-showroom and on-road price estimates, colour availability, and ongoing festive or regional schemes.</div>
              </div>
              <div className="yamaha-legal-grid-item">
                <div className="yamaha-legal-grid-label">Test Ride Management</div>
                <div className="yamaha-legal-grid-value">Scheduling and confirming showroom test rides, allocating demo motorcycles, and coordinating with dealership staff.</div>
              </div>
              <div className="yamaha-legal-grid-item">
                <div className="yamaha-legal-grid-label">Booking Coordination</div>
                <div className="yamaha-legal-grid-value">Facilitating vehicle documentation, loan pre-eligibility checks, and vehicle handover schedules at our Batlagundu showroom.</div>
              </div>
              <div className="yamaha-legal-grid-item">
                <div className="yamaha-legal-grid-label">Service &amp; Support</div>
                <div className="yamaha-legal-grid-value">Assisting with periodic scheduled maintenance, genuine Yamaha spare parts enquiries, and warranty claims.</div>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section id="whatsapp" className="yamaha-legal-section">
            <div className="yamaha-legal-section-header">
              <span className="yamaha-legal-section-num">04</span>
              <h2 className="yamaha-legal-section-title">WhatsApp &amp; Automated Notifications Policy</h2>
            </div>
            <div className="yamaha-legal-card yamaha-legal-card--whatsapp">
              <div className="yamaha-legal-card-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#25d366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
                <span>Automated WhatsApp &amp; SMS Transaction Notifications</span>
              </div>
              <p>
                When you initiate an enquiry or booking request on our website and provide your phone number, you authorize Vathilai Motors to transmit transactional updates, booking reference receipts, test ride appointment confirmations, and showroom assistance notifications via WhatsApp and SMS.
              </p>
            </div>
            <p className="yamaha-legal-prose">
              Our automated WhatsApp service operates under the following standards:
            </p>
            <ul className="yamaha-legal-list">
              <li>
                <strong>Transactional Integrity:</strong> Messages sent relate exclusively to customer-requested motorcycle purchases, bookings, service appointments, or dealership enquiry responses.
              </li>
              <li>
                <strong>No Spam Guarantee:</strong> We do not spam or send third-party advertising campaigns.
              </li>
              <li>
                <strong>Easy Opt-Out:</strong> You may opt out of automated WhatsApp communications at any time by replying &ldquo;STOP&rdquo; to the message thread, or by calling our dealership directly at 081444 45566.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section id="sharing" className="yamaha-legal-section">
            <div className="yamaha-legal-section-header">
              <span className="yamaha-legal-section-num">05</span>
              <h2 className="yamaha-legal-section-title">Data Sharing &amp; Protection</h2>
            </div>
            <p className="yamaha-legal-prose">
              <strong>We never sell, rent, lease, or trade your personal information</strong> to third-party marketing brokers or unrelated commercial entities. Customer data is handled strictly by authorized Vathilai Motors personnel.
            </p>
            <p className="yamaha-legal-prose">
              Data is shared strictly on a need-to-know basis under the following circumstances:
            </p>
            <ul className="yamaha-legal-list">
              <li>
                <strong>Official Manufacturer (Yamaha Motor India):</strong> For new vehicle warranty registration, manufacturer service campaigns, and formal customer satisfaction audits.
              </li>
              <li>
                <strong>Finance &amp; Insurance Partners:</strong> When you explicitly request two-wheeler loan assistance or comprehensive vehicle insurance quotes through our dealership.
              </li>
              <li>
                <strong>Statutory &amp; Regulatory Authorities:</strong> When required by Indian transport departments (RTO) for vehicle registration, road tax compliance, and lawful government directives.
              </li>
            </ul>
          </section>

          {/* Section 6 */}
          <section id="retention" className="yamaha-legal-section">
            <div className="yamaha-legal-section-header">
              <span className="yamaha-legal-section-num">06</span>
              <h2 className="yamaha-legal-section-title">Data Retention &amp; Security Measures</h2>
            </div>
            <p className="yamaha-legal-prose">
              Vathilai Motors implements industry-standard administrative, technical, and physical security measures to safeguard customer records:
            </p>
            <ul className="yamaha-legal-list">
              <li>
                <strong>Encrypted Communications:</strong> All online communications and form submissions utilize TLS/HTTPS 256-bit encryption.
              </li>
              <li>
                <strong>Restricted Staff Access:</strong> Dealership administrative access is protected with strict role-based authentication, audit logging, and credential verification.
              </li>
              <li>
                <strong>Retention Lifecycle:</strong> Routine website enquiries are kept for up to 12 months for customer service reference. Completed vehicle purchase records are archived according to statutory Indian commercial and tax record retention requirements.
              </li>
            </ul>
          </section>

          {/* Section 7 */}
          <section id="rights" className="yamaha-legal-section">
            <div className="yamaha-legal-section-header">
              <span className="yamaha-legal-section-num">07</span>
              <h2 className="yamaha-legal-section-title">Your Rights &amp; Data Deletion Requests</h2>
            </div>
            <p className="yamaha-legal-prose">
              You maintain full control over the personal information you share with Vathilai Motors:
            </p>
            <ul className="yamaha-legal-list">
              <li><strong>Right to Access:</strong> You may request a summary of the contact records and booking history held under your mobile number or email.</li>
              <li><strong>Right to Rectification:</strong> You may contact us at any time to correct outdated or inaccurate contact details.</li>
              <li><strong>Right to Erasure / Deletion:</strong> You have the right to request permanent deletion of your enquiry history, booking logs, and WhatsApp notification preferences from our active systems.</li>
            </ul>
            <div className="yamaha-legal-card">
              <div className="yamaha-legal-card-title">Need to request data erasure?</div>
              <p>
                Visit our dedicated{' '}
                <a href="/data-deletion" onClick={(e) => handleLink(e, '/data-deletion')} style={{ color: '#38bdf8', fontWeight: 'bold', textDecoration: 'underline' }}>
                  Data Deletion Instructions &amp; Request Page
                </a>{' '}
                to submit an online deletion request or learn how our team processes your erasure tickets.
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section id="contact" className="yamaha-legal-section">
            <div className="yamaha-legal-section-header">
              <span className="yamaha-legal-section-num">08</span>
              <h2 className="yamaha-legal-section-title">Dealership Contact &amp; Grievance Officer</h2>
            </div>
            <p className="yamaha-legal-prose">
              If you have any questions regarding this Privacy Policy, wish to exercise your data rights, or have privacy-related concerns, please reach out to our dealership management directly:
            </p>

            <div className="yamaha-legal-contact-box">
              <div>
                <h3 className="yamaha-legal-contact-name">Vathilai Motors</h3>
                <div className="yamaha-legal-contact-sub">Authorised Yamaha Motorcycle Dealership</div>
                <p className="yamaha-legal-contact-details">
                  <strong>Showroom Address:</strong><br />
                  Parimalam Theatre Complex, Main Road, Opp. Union Office Madurai,<br />
                  Batlagundu, Dindigul District, Tamil Nadu – 624202, India.<br /><br />
                  <strong>Direct Phone:</strong> 081444 45566<br />
                  <strong>Official Website:</strong> https://www.vathilaimotors.com/<br />
                  <strong>Operating Hours:</strong> Monday – Saturday: 9:00 AM – 8:00 PM | Sunday: 10:00 AM – 2:00 PM
                </p>
              </div>
              <div className="yamaha-legal-contact-actions">
                <a href="tel:08144445566" className="yamaha-legal-btn">
                  Call Dealership
                </a>
                <a href="/data-deletion" onClick={(e) => handleLink(e, '/data-deletion')} className="yamaha-legal-btn yamaha-legal-btn--outline">
                  Data Deletion
                </a>
              </div>
            </div>
          </section>
        </div>

        {/* Footer Crosslinks */}
        <div className="yamaha-legal-crosslinks">
          <nav className="yamaha-legal-crosslinks-nav" aria-label="Related Legal Links">
            <a href="/terms" onClick={(e) => handleLink(e, '/terms')} className="yamaha-legal-crosslink">
              Terms &amp; Conditions <span>→</span>
            </a>
            <a href="/data-deletion" onClick={(e) => handleLink(e, '/data-deletion')} className="yamaha-legal-crosslink">
              Data Deletion Instructions <span>→</span>
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

export default YamahaPrivacyPolicy;
