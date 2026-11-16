import React, { useEffect } from 'react';
import './YamahaLegalPage.css';

function YamahaTerms({ onNavigate }) {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Terms & Conditions | Vathilai Motors – Authorised Yamaha Dealership';
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
          <div className="yamaha-legal-eyebrow">Dealership Legal Terms</div>
          <h1 className="yamaha-legal-title">Terms &amp; Conditions</h1>
          <div className="yamaha-legal-meta">
            <span className="yamaha-legal-badge">
              <span className="yamaha-legal-badge-dot" />
              Customer Terms of Service
            </span>
            <span>Entity: <strong>Vathilai Motors</strong></span>
            <span>Effective Date: <strong>November 1, 2026</strong></span>
            <span>Last Updated: <strong>November 16, 2026</strong></span>
          </div>
        </header>

        {/* Quick Jump Navigation */}
        <nav className="yamaha-legal-toc" aria-label="Table of contents">
          <p className="yamaha-legal-toc-title">Terms Sections</p>
          <ul className="yamaha-legal-toc-grid">
            <li>
              <a href="#acceptance" className="yamaha-legal-toc-link">
                <span className="yamaha-legal-toc-num">01.</span> Agreement to Terms
              </a>
            </li>
            <li>
              <a href="#dealership" className="yamaha-legal-toc-link">
                <span className="yamaha-legal-toc-num">02.</span> Dealership Role &amp; Status
              </a>
            </li>
            <li>
              <a href="#pricing" className="yamaha-legal-toc-link">
                <span className="yamaha-legal-toc-num">03.</span> Motorcycle Pricing &amp; Specs
              </a>
            </li>
            <li>
              <a href="#booking" className="yamaha-legal-toc-link">
                <span className="yamaha-legal-toc-num">04.</span> Booking &amp; Test Rides
              </a>
            </li>
            <li>
              <a href="#communication" className="yamaha-legal-toc-link">
                <span className="yamaha-legal-toc-num">05.</span> WhatsApp &amp; Contact Consent
              </a>
            </li>
            <li>
              <a href="#ip" className="yamaha-legal-toc-link">
                <span className="yamaha-legal-toc-num">06.</span> Trademarks &amp; Copyright
              </a>
            </li>
            <li>
              <a href="#liability" className="yamaha-legal-toc-link">
                <span className="yamaha-legal-toc-num">07.</span> Liability &amp; Disclaimers
              </a>
            </li>
            <li>
              <a href="#jurisdiction" className="yamaha-legal-toc-link">
                <span className="yamaha-legal-toc-num">08.</span> Governing Law &amp; Jurisdiction
              </a>
            </li>
          </ul>
        </nav>

        {/* Terms Body */}
        <div className="yamaha-legal-content">
          {/* Section 1 */}
          <section id="acceptance" className="yamaha-legal-section">
            <div className="yamaha-legal-section-header">
              <span className="yamaha-legal-section-num">01</span>
              <h2 className="yamaha-legal-section-title">Agreement to Terms</h2>
            </div>
            <p className="yamaha-legal-prose">
              Welcome to the official website of <strong>Vathilai Motors</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), an authorised Yamaha motorcycle dealership situated in Batlagundu, Tamil Nadu, operating at{' '}
              <a href="https://www.vathilaimotors.com/" style={{ color: '#38bdf8' }}>https://www.vathilaimotors.com/</a>.
            </p>
            <p className="yamaha-legal-prose">
              By accessing, browsing, submitting online enquiries, requesting test rides, or utilizing booking facilities on this website, you agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree with any part of these terms, please refrain from submitting information or using our online services.
            </p>
          </section>

          {/* Section 2 */}
          <section id="dealership" className="yamaha-legal-section">
            <div className="yamaha-legal-section-header">
              <span className="yamaha-legal-section-num">02</span>
              <h2 className="yamaha-legal-section-title">Dealership Role &amp; Operations</h2>
            </div>
            <p className="yamaha-legal-prose">
              Vathilai Motors is an independent, authorized dealership of India Yamaha Motor Pvt. Ltd. (IYM). We specialize in retail distribution of genuine Yamaha two-wheelers, authorized maintenance and servicing, genuine spare parts, and authorized accessories in Batlagundu and surrounding regions of Dindigul District.
            </p>
            <p className="yamaha-legal-prose">
              All commercial vehicle purchases, formal invoice issuances, RTO registrations, and vehicle handovers occur exclusively at our physical showroom premises under applicable motor vehicle sales laws in India.
            </p>
          </section>

          {/* Section 3 */}
          <section id="pricing" className="yamaha-legal-section">
            <div className="yamaha-legal-section-header">
              <span className="yamaha-legal-section-num">03</span>
              <h2 className="yamaha-legal-section-title">Motorcycle Specifications &amp; Pricing Disclaimers</h2>
            </div>
            <p className="yamaha-legal-prose">
              While we make every effort to ensure motorcycle specifications, engine displacements, fuel efficiency indicators, colour editions, and pricing figures on this website are current and accurate, the following conditions apply:
            </p>
            <ul className="yamaha-legal-list">
              <li>
                <strong>Indicative Pricing:</strong> Ex-showroom and estimated on-road prices displayed on the website are provided for initial customer reference. Final on-road prices vary based on state road taxes (Tamil Nadu RTO charges), mandatory third-party insurance tariffs, registration fees, municipal levies, and optional customer accessories.
              </li>
              <li>
                <strong>Manufacturer Revisions:</strong> Specifications, features, graphics, and prices are subject to change without prior notice at the sole discretion of Yamaha Motor India.
              </li>
              <li>
                <strong>Colour &amp; Visual Representation:</strong> Product photography and 3D renderings may differ slightly from actual showroom paint finishes due to monitor calibration and photography lighting conditions.
              </li>
              <li>
                <strong>Formal Quotation:</strong> A formal, written proforma invoice provided by our showroom sales executives at the Batlagundu dealership serves as the definitive pricing document for vehicle transactions and loan approvals.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section id="booking" className="yamaha-legal-section">
            <div className="yamaha-legal-section-header">
              <span className="yamaha-legal-section-num">04</span>
              <h2 className="yamaha-legal-section-title">Showroom Booking &amp; Test Ride Regulations</h2>
            </div>
            <p className="yamaha-legal-prose">
              Our website provides convenient tools to request test rides and register booking enquiries for new Yamaha motorcycles. Participation in these services is governed by the following safety and legal requirements:
            </p>
            <ul className="yamaha-legal-list">
              <li>
                <strong>Valid Driving License:</strong> A valid Indian two-wheeler driving license (with gear) is mandatory before participating in any motorcycle test ride at our showroom. Learners licenses (LLR) may be subject to dealership discretion and safety supervisor presence.
              </li>
              <li>
                <strong>Mandatory Safety Gear:</strong> Riders must wear an approved full-face or safety helmet during all test rides. Dealership staff reserve the right to decline or terminate a test ride if safety standards are violated or if weather conditions pose road risks.
              </li>
              <li>
                <strong>Booking Intent:</strong> Online booking submissions register your allocation priority with our showroom. Booking confirmations and delivery timelines are subject to model availability from the manufacturer.
              </li>
              <li>
                <strong>Token &amp; Cancellation:</strong> Any booking advance paid in person or through authorized dealership payment links is documented with an official receipt. In the event of booking cancellation prior to vehicle invoicing, refunds are processed according to dealership commercial policies and bank clearance timelines.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section id="communication" className="yamaha-legal-section">
            <div className="yamaha-legal-section-header">
              <span className="yamaha-legal-section-num">05</span>
              <h2 className="yamaha-legal-section-title">Communication &amp; Messaging Consent</h2>
            </div>
            <div className="yamaha-legal-card">
              <div className="yamaha-legal-card-title">Customer Notification Agreement</div>
              <p>
                By providing your mobile telephone number on enquiry or booking forms, you expressly consent to receive transactional voice calls, SMS alerts, and WhatsApp Business updates from Vathilai Motors representatives regarding your enquiry, test ride timing, quotation breakdowns, and scheduled vehicle servicing.
              </p>
            </div>
            <p className="yamaha-legal-prose">
              You may opt out of promotional updates or digital messaging at any time by contacting our support team or replying &ldquo;STOP&rdquo; on the WhatsApp notification thread. Essential statutory and transactional vehicle records will still be preserved as required by law.
            </p>
          </section>

          {/* Section 6 */}
          <section id="ip" className="yamaha-legal-section">
            <div className="yamaha-legal-section-header">
              <span className="yamaha-legal-section-num">06</span>
              <h2 className="yamaha-legal-section-title">Intellectual Property &amp; Brand Trademarks</h2>
            </div>
            <p className="yamaha-legal-prose">
              All manufacturer brand marks, including &ldquo;YAMAHA&rdquo;, the Tuning Fork emblem, &ldquo;Revs Your Heart&rdquo;, &ldquo;YZF-R15&rdquo;, &ldquo;MT-15&rdquo;, &ldquo;FZ&rdquo;, &ldquo;Aerox&rdquo;, and associated technical terminology are registered trademarks of <strong>Yamaha Motor Co., Ltd. (Japan)</strong> and <strong>India Yamaha Motor Pvt. Ltd.</strong>, utilized here under authorized dealership franchise agreements for dealer retail operations.
            </p>
            <p className="yamaha-legal-prose">
              The digital architecture, website layout, dealership graphics, text content, and interactive features on vathilaimotors.com are the intellectual property of Vathilai Motors. Unauthorized copying, scraping, reproduction, or redistribution is strictly prohibited without written authorization.
            </p>
          </section>

          {/* Section 7 */}
          <section id="liability" className="yamaha-legal-section">
            <div className="yamaha-legal-section-header">
              <span className="yamaha-legal-section-num">07</span>
              <h2 className="yamaha-legal-section-title">Limitation of Liability &amp; Disclaimers</h2>
            </div>
            <p className="yamaha-legal-prose">
              The website is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. While Vathilai Motors takes reasonable precautions to ensure uninterrupted digital service:
            </p>
            <ul className="yamaha-legal-list">
              <li>We do not warrant that server functions will be completely error-free or uninterrupted during external telecommunications carrier failures or maintenance windows.</li>
              <li>Vathilai Motors shall not be held liable for indirect, incidental, or consequential damages resulting from reliance on website informational estimates prior to showroom physical confirmation.</li>
              <li>Vehicle warranties are provided directly by India Yamaha Motor Pvt. Ltd. in accordance with the official manufacturer warranty handbook provided with every new motorcycle.</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section id="jurisdiction" className="yamaha-legal-section">
            <div className="yamaha-legal-section-header">
              <span className="yamaha-legal-section-num">08</span>
              <h2 className="yamaha-legal-section-title">Governing Law &amp; Jurisdiction</h2>
            </div>
            <p className="yamaha-legal-prose">
              These Terms and Conditions shall be governed by and construed in accordance with the laws of the Republic of India. Any legal dispute, claim, or difference arising out of or related to these terms, dealership transactions, or use of this website shall be subject to the exclusive jurisdiction of the competent courts in <strong>Batlagundu / Dindigul District, Tamil Nadu, India</strong>.
            </p>

            <div className="yamaha-legal-contact-box">
              <div>
                <h3 className="yamaha-legal-contact-name">Vathilai Motors</h3>
                <div className="yamaha-legal-contact-sub">Authorised Yamaha Dealership</div>
                <p className="yamaha-legal-contact-details">
                  Parimalam Theatre Complex, Main Road, Opp. Union Office Madurai,<br />
                  Batlagundu, Dindigul District, Tamil Nadu – 624202.<br /><br />
                  <strong>Phone:</strong> 081444 45566<br />
                  <strong>Online Inquiries:</strong> https://www.vathilaimotors.com/
                </p>
              </div>
              <div className="yamaha-legal-contact-actions">
                <a href="tel:08144445566" className="yamaha-legal-btn">
                  Contact Showroom
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
            <a href="/data-deletion" onClick={(e) => handleLink(e, '/data-deletion')} className="yamaha-legal-crosslink">
              Data Deletion Requests <span>→</span>
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

export default YamahaTerms;
