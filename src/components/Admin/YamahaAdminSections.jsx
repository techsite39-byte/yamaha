import { useState, useEffect, useMemo, useRef } from 'react';
import { requestJson, uploadMediaBinary, downloadCsv } from './adminApi.js';
import {
  createEnquiryDetailsDocument,
  createGalleryDetailsDocument,
  createHomeSlideDetailsDocument,
  createMediaDetailsDocument,
  createReviewDetailsDocument,
  createVideoDetailsDocument,
  createWebsiteContentDetailsDocument,
  createWebsiteSectionDetailsDocument,
} from './customerDetailsDocument.js';
import { defaultBusinessSettings } from '../Yamaha/businessConfig.js';

export function SectionIntro({ eyebrow, title, description, action }) {
  return (
    <header className="admin-page-header admin-section-intro">
      <div className="admin-page-header__meta">
        {eyebrow && <span className="admin-eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="admin-page-header__actions admin-section-intro__action">{action}</div>}
    </header>
  );
}

function StatusToast({ message, type = 'success', onClose }) {
  if (!message) return null;
  return (
    <div className={`admin-toast admin-toast--${type}`} role="status">
      <span>{message}</span>
      {onClose && <button type="button" onClick={onClose} aria-label="Close notification">✕</button>}
    </div>
  );
}

// -------------------------------------------------------------
// 1. SOCIAL PLATFORM SUMMARY (Dashboard Widget)
// -------------------------------------------------------------
export function SocialPlatformIcon({ platform, size = 18 }) {
  const p = String(platform || '').toLowerCase();
  if (p.includes('instagram')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    );
  }
  if (p.includes('facebook')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    );
  }
  if (p.includes('youtube')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    );
  }
  if (p.includes('x') || p.includes('twitter')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }
  if (p.includes('whatsapp')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    );
  }
  if (p.includes('linkedin')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" x2="22" y1="12" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

export function SocialPlatformSummary({ onNavigate }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    requestJson('/api/admin/social/profiles')
      .then((data) => { if (active && data?.profiles) setProfiles(data.profiles); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <article className="admin-panel admin-social-summary">
      <div className="admin-panel__heading">
        <div><span className="admin-eyebrow">CHANNELS</span><h3>Social platform profiles</h3></div>
        <a href="/admin/social" onClick={onNavigate} className="admin-panel__hint">Manage channels ↗</a>
      </div>
      <div className="admin-social-platforms admin-social-platforms--compact">
        {profiles.map((p) => {
          const name = p.platform || p.name || 'Channel';
          const url = p.profileUrl || p.url || '';
          const isConfigured = Boolean(url && url.trim() && url !== '#');
          const isVisible = (p.status === 'connected' || p.status === 'active') && p.showInFooter !== false && isConfigured;
          return (
            <a
              href="/admin/social"
              onClick={onNavigate}
              className="admin-social-platform"
              key={p.id || name}
              title={isConfigured ? `${name}: ${url}` : `${name}: Click to configure`}
            >
              <span className={`admin-social-platform__mark admin-social-platform__mark--${name.toLowerCase().replace(/[\s()]/g, '')}`} aria-hidden="true">
                <SocialPlatformIcon platform={name} size={16} />
              </span>
              <span>
                <strong>{name}</strong>
                <small style={{ color: isVisible ? '#10b981' : (isConfigured ? '#64748b' : '#f59e0b') }}>
                  {isVisible ? 'Visible in Footer' : (isConfigured ? 'Hidden' : 'Add Link')}
                </small>
              </span>
            </a>
          );
        })}
      </div>
      <p className="admin-panel__footnote">Configured profile links are synced live with the public website footer and contact channels.</p>
    </article>
  );
}

// -------------------------------------------------------------
// 2. SOCIAL MEDIA DASHBOARD (/admin/social)
// -------------------------------------------------------------
export function SocialMediaDashboard({ onNavigate }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [toast, setToast] = useState('');
  const [savingId, setSavingId] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const profilesRes = await requestJson('/api/admin/social/profiles');
      if (profilesRes?.profiles) setProfiles(profilesRes.profiles);
    } catch (e) {
      setToast(`Failed to load social data: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Quick 1-click toggle for showing/hiding in website footer
  const handleToggleFooterVisibility = async (p) => {
    const isCurrentlyVisible = (p.status === 'connected' || p.status === 'active') && p.showInFooter !== false;
    const newStatus = isCurrentlyVisible ? 'hidden' : 'connected';
    const newShowInFooter = !isCurrentlyVisible;
    const updated = {
      ...p,
      status: newStatus,
      showInFooter: newShowInFooter,
      updatedAt: new Date().toISOString(),
    };

    setSavingId(p.id);
    try {
      await requestJson(`/api/admin/social/profiles/${encodeURIComponent(p.id)}`, {
        method: 'PUT',
        body: updated,
      });
      setProfiles((prev) => prev.map((item) => (item.id === p.id ? updated : item)));
      setToast(`${p.platform || p.name} is now ${newShowInFooter ? 'VISIBLE in website footer' : 'HIDDEN from website footer'}.`);
    } catch (err) {
      setToast(`Failed to update visibility: ${err.message}`);
    } finally {
      setSavingId('');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editingProfile) return;
    const isNew = isAddingNew;
    const cleanUrl = (editingProfile.profileUrl || editingProfile.url || '').trim();
    if (!cleanUrl) {
      setToast('Please provide a valid profile link.');
      return;
    }

    const payload = {
      ...editingProfile,
      platform: editingProfile.platform || editingProfile.name || 'Social',
      profileUrl: cleanUrl,
      handle: (editingProfile.handle || '').trim(),
      status: editingProfile.showInFooter !== false ? 'connected' : 'hidden',
      showInFooter: editingProfile.showInFooter !== false,
      notes: (editingProfile.notes || '').trim(),
      updatedAt: new Date().toISOString(),
    };

    try {
      if (isNew) {
        payload.id = payload.id || `soc-${payload.platform.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        payload.createdAt = new Date().toISOString();
        await requestJson('/api/admin/social/profiles', {
          method: 'PUT',
          body: { profiles: [...profiles, payload] },
        });
        setProfiles((prev) => [...prev, payload]);
        setToast(`Channel ${payload.platform} added successfully. Live on website footer!`);
      } else {
        await requestJson(`/api/admin/social/profiles/${encodeURIComponent(payload.id)}`, {
          method: 'PUT',
          body: payload,
        });
        setProfiles((prev) => prev.map((item) => (item.id === payload.id ? payload : item)));
        setToast(`${payload.platform} updated successfully. Changes reflected on website footer!`);
      }
      setEditingProfile(null);
      setIsAddingNew(false);
    } catch (err) {
      setToast(`Error saving channel: ${err.message}`);
    }
  };

  const statusCounts = useMemo(() => {
    const totalChannels = profiles.length;
    const visibleChannels = profiles.filter((p) => {
      const url = p.profileUrl || p.url;
      return (p.status === 'connected' || p.status === 'active') && p.showInFooter !== false && url && url !== '#';
    }).length;
    const hiddenChannels = totalChannels - visibleChannels;
    const configuredLinks = profiles.filter((p) => {
      const url = p.profileUrl || p.url;
      return url && url !== '#' && !url.includes('example.com');
    }).length;
    return { totalChannels, visibleChannels, hiddenChannels, configuredLinks };
  }, [profiles]);

  return (
    <>
      <SectionIntro
        eyebrow="CHANNELS / OVERVIEW"
        title="Social Media & Footer Channels"
        description="Configure dealership social media profiles, public website footer links, and marketing campaign visibility. Any change or toggle here reflects live across the entire website."
        action={
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="admin-button admin-button--primary"
              onClick={() => {
                setIsAddingNew(true);
                setEditingProfile({
                  platform: '',
                  profileUrl: '',
                  handle: '',
                  status: 'connected',
                  showInFooter: true,
                  notes: '',
                });
              }}
            >
              + ADD CHANNEL
            </button>
          </div>
        }
      />

      <StatusToast message={toast} onClose={() => setToast('')} />

      {/* Top Metrics Row */}
      <section className="admin-metrics admin-metrics--social" aria-label="Social media channel totals">
        <article className="admin-metric">
          <span>TOTAL CHANNELS</span>
          <strong>{statusCounts.totalChannels}</strong>
          <small>Registered platforms</small>
        </article>
        <article className="admin-metric">
          <span>VISIBLE IN FOOTER</span>
          <strong style={{ color: '#10b981' }}>{statusCounts.visibleChannels}</strong>
          <small>Active on website footer</small>
        </article>
        <article className="admin-metric">
          <span>HIDDEN FROM FOOTER</span>
          <strong style={{ color: '#64748b' }}>{statusCounts.hiddenChannels}</strong>
          <small>Offline or draft channels</small>
        </article>
        <article className="admin-metric">
          <span>DESTINATION LINKS</span>
          <strong style={{ color: '#0284c7' }}>{statusCounts.configuredLinks}</strong>
          <small>Configured direct URLs</small>
        </article>
      </section>

      {/* Modern, User-Friendly Platform Profiles Card Grid */}
      <section className="admin-panel admin-social-panel">
        <div className="admin-panel__heading">
          <div>
            <span className="admin-eyebrow">FOOTER & MARKETING INTEGRATION</span>
            <h3>Platform Channels & Footer Visibility</h3>
          </div>
          <span className="admin-panel__hint">
            {statusCounts.visibleChannels} of {profiles.length} showing in footer
          </span>
        </div>

        <div className="admin-social-cards-grid">
          {profiles.map((p) => {
            const platform = p.platform || p.name || 'Social';
            const url = p.profileUrl || p.url || '';
            const handle = p.handle || '';
            const hasUrl = Boolean(url && url.trim() && url !== '#');
            const isVisibleInFooter = (p.status === 'connected' || p.status === 'active') && p.showInFooter !== false && hasUrl;
            const isSaving = savingId === p.id;

            return (
              <article
                className={`admin-social-channel-card ${isVisibleInFooter ? 'is-visible' : 'is-hidden'}`}
                key={p.id || platform}
              >
                {/* Header: Platform Mark, Name, Status Badge */}
                <div className="admin-social-card__top">
                  <div className="admin-social-card__brand">
                    <span className={`admin-social-card__icon-box admin-social-card__icon-box--${platform.toLowerCase().replace(/[\s()]/g, '')}`}>
                      <SocialPlatformIcon platform={platform} size={22} />
                    </span>
                    <div>
                      <h4 className="admin-social-card__title">{platform}</h4>
                      {handle ? (
                        <span className="admin-social-card__handle">{handle}</span>
                      ) : (
                        <span className="admin-social-card__handle" style={{ color: '#94a3b8' }}>No handle</span>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isVisibleInFooter ? (
                      <span className="admin-status-badge admin-status-badge--live" title="Active on public footer">
                        ✓ VISIBLE IN FOOTER
                      </span>
                    ) : (
                      <span className="admin-status-badge admin-status-badge--muted" title="Hidden from public footer">
                        {hasUrl ? 'HIDDEN FROM FOOTER' : 'NO LINK SET'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Profile URL Link */}
                <div className="admin-social-card__url-box">
                  <span className="admin-social-card__url-label">DESTINATION LINK:</span>
                  {hasUrl ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-social-card__url-link"
                      title={url}
                    >
                      <span>{url}</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                  ) : (
                    <span className="admin-social-card__url-empty">No profile link configured yet</span>
                  )}
                </div>

                {/* Notes or description if any */}
                {p.notes && (
                  <p className="admin-social-card__notes">
                    {p.notes}
                  </p>
                )}

                {/* Card Action Buttons */}
                <div className="admin-social-card__actions">
                  {/* Toggle Visibility */}
                  <button
                    type="button"
                    className={`admin-button admin-button--sm ${isVisibleInFooter ? 'admin-button--secondary' : 'admin-button--primary'}`}
                    disabled={isSaving || !hasUrl}
                    onClick={() => handleToggleFooterVisibility(p)}
                    title={!hasUrl ? 'Please configure a URL first' : (isVisibleInFooter ? 'Hide from footer' : 'Show in footer')}
                  >
                    {isSaving ? 'Updating...' : (isVisibleInFooter ? '👁 Hide from Footer' : '✓ Show in Footer')}
                  </button>

                  {/* Edit Channel Details */}
                  <button
                    type="button"
                    className="admin-button admin-button--secondary admin-button--sm"
                    onClick={() => {
                      setIsAddingNew(false);
                      setEditingProfile({
                        ...p,
                        platform,
                        profileUrl: url,
                        handle,
                        showInFooter: p.showInFooter !== false,
                      });
                    }}
                  >
                    Configure
                  </button>

                  {/* Test link */}
                  {hasUrl && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-text-button"
                      style={{ fontSize: '12px', padding: '4px 6px' }}
                    >
                      Test Link ↗
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Modal for Editing / Adding Social Channel */}
      {editingProfile && (
        <div className="admin-modal" role="dialog" aria-modal="true" onMouseDown={(e) => { if (e.target === e.currentTarget) setEditingProfile(null); }}>
          <div className="admin-modal__card" style={{ maxWidth: 540 }}>
            <div className="admin-modal__heading">
              <div>
                <span className="admin-eyebrow">{isAddingNew ? 'ADD NEW CHANNEL' : 'CONFIGURE CHANNEL'}</span>
                <h3>{editingProfile.platform || 'Social Channel'}</h3>
              </div>
              <button type="button" className="admin-modal__close" onClick={() => setEditingProfile(null)} aria-label="Close modal">✕</button>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <label className="admin-demo-field">
                <span>Platform Name *</span>
                <input
                  required
                  type="text"
                  value={editingProfile.platform || ''}
                  onChange={(e) => setEditingProfile({ ...editingProfile, platform: e.target.value })}
                  placeholder="e.g. Instagram, Facebook, YouTube, WhatsApp"
                  disabled={!isAddingNew}
                />
              </label>

              <label className="admin-demo-field">
                <span>Profile / Page Direct URL *</span>
                <input
                  required
                  type="url"
                  value={editingProfile.profileUrl || editingProfile.url || ''}
                  onChange={(e) => setEditingProfile({ ...editingProfile, profileUrl: e.target.value, url: e.target.value })}
                  placeholder="https://www.instagram.com/vathilaimotors/"
                />
                <small style={{ color: '#64748b', fontSize: '11px', marginTop: '3px' }}>
                  Visitors will be directed to this link when clicking the social icon in the website footer.
                </small>
              </label>

              <label className="admin-demo-field">
                <span>Display Username or Handle</span>
                <input
                  type="text"
                  value={editingProfile.handle || ''}
                  onChange={(e) => setEditingProfile({ ...editingProfile, handle: e.target.value })}
                  placeholder="@vathilaimotors or 081444 45566"
                />
              </label>

              {/* Show in Footer Toggle Box */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '14px', color: '#0f172a' }}>
                    Show in Website Footer
                  </strong>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    When checked, the {editingProfile.platform || 'platform'} icon will appear in the footer.
                  </span>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={editingProfile.showInFooter !== false}
                    onChange={(e) => setEditingProfile({ ...editingProfile, showInFooter: e.target.checked })}
                    style={{ width: '20px', height: '20px', accentColor: '#0284c7', cursor: 'pointer' }}
                  />
                </label>
              </div>

              <label className="admin-demo-field">
                <span>Channel Description / Staff Notes</span>
                <textarea
                  rows="2"
                  value={editingProfile.notes || ''}
                  onChange={(e) => setEditingProfile({ ...editingProfile, notes: e.target.value })}
                  placeholder="e.g. Official deliveries and rider photos..."
                />
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" className="admin-button admin-button--secondary" onClick={() => setEditingProfile(null)}>
                  Cancel
                </button>
                <button type="submit" className="admin-button admin-button--primary">
                  Save &amp; Sync to Footer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}


// -------------------------------------------------------------
// 3. CONTACT & ENQUIRIES (/admin/enquiries)
// -------------------------------------------------------------
export function ContactEnquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!selectedEnquiry) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setSelectedEnquiry(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedEnquiry]);

  const isDummyRecord = (item) => {
    if (!item) return true;
    const email = String(item.email || item.customer?.email || '').toLowerCase();
    const name = String(item.customerName || item.customer?.name || item.name || '').toLowerCase();
    const reqId = String(item.requestId || '').toLowerCase();
    return email.includes('example.com') || reqId.startsWith('test-') || reqId.startsWith('demo-') || name === 'vikram chandran' || name === 'priya sundaram';
  };

  const loadEnquiries = async () => {
    try {
      setLoading(true);
      const res = await requestJson('/api/admin/enquiries?source=all');
      const list = Array.isArray(res?.enquiries) ? res.enquiries : (Array.isArray(res?.all) ? res.all : []);
      // Strictly exclude any booking records and dummy/mock data
      const realEnquiries = list.filter((item) => {
        if (item.source === 'booking' || item.type === 'booking') return false;
        if (isDummyRecord(item)) return false;
        return true;
      });
      setEnquiries(realEnquiries);
    } catch (err) {
      setToast(`Failed to load enquiries: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEnquiries(); }, []);

  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((item) => {
      // 1. Strictly exclude bookings from the Contact & Enquiries page
      if (item.source === 'booking' || item.type === 'booking') return false;

      // 2. Strictly exclude dummy/mock seed records
      if (isDummyRecord(item)) return false;

      const itemStatus = item.enquiryStatus || item.status || 'new';
      const itemSource = item.source || 'motorcycle-details';

      const matchStatus = statusFilter === 'all' || itemStatus === statusFilter;
      const matchSource = sourceFilter === 'all' ||
        (sourceFilter === 'motorcycle-details' && (itemSource === 'motorcycle-details' || (!item.source && item.type === 'enquiry'))) ||
        (sourceFilter === 'general-contact' && itemSource === 'general-contact');

      const q = search.trim().toLowerCase();
      const matchSearch = !q ||
        (item.reference || item.enquiryId || '').toLowerCase().includes(q) ||
        (item.customer?.name || item.customerName || item.name || '').toLowerCase().includes(q) ||
        (item.customer?.email || item.email || '').toLowerCase().includes(q) ||
        (item.customer?.phone || item.mobileNumber || item.phone || '').toLowerCase().includes(q) ||
        (item.motorcycle?.model || item.motorcycleModel || item.model || '').toLowerCase().includes(q) ||
        (item.city || item.customer?.city || '').toLowerCase().includes(q) ||
        (item.message || item.customer?.message || '').toLowerCase().includes(q);

      return matchStatus && matchSource && matchSearch;
    });
  }, [enquiries, search, statusFilter, sourceFilter]);

  const updateStatus = async (ref, newStatus) => {
    try {
      await requestJson(`/api/admin/enquiries/${encodeURIComponent(ref)}/status`, {
        method: 'PUT',
        body: { status: newStatus },
      });
      setToast(`Enquiry ${ref} updated to ${newStatus}`);
      setEnquiries((prev) => prev.map((e) => ((e.reference === ref || e.enquiryId === ref) ? { ...e, status: newStatus, enquiryStatus: newStatus } : e)));
      if (selectedEnquiry && (selectedEnquiry.reference === ref || selectedEnquiry.enquiryId === ref)) {
        setSelectedEnquiry((prev) => ({ ...prev, status: newStatus, enquiryStatus: newStatus }));
      }
    } catch (err) {
      setToast(`Failed to update status: ${err.message}`);
    }
  };

  const saveNotes = async (ref) => {
    try {
      await requestJson(`/api/admin/enquiries/${encodeURIComponent(ref)}/status`, {
        method: 'PUT',
        body: { notes: notesDraft },
      });
      setToast('Staff notes saved successfully.');
      setEnquiries((prev) => prev.map((e) => ((e.reference === ref || e.enquiryId === ref) ? { ...e, notes: notesDraft } : e)));
      if (selectedEnquiry) {
        setSelectedEnquiry((prev) => ({ ...prev, notes: notesDraft }));
      }
    } catch (err) {
      setToast(`Failed to save notes: ${err.message}`);
    }
  };

  const deleteEnquiry = async (ref) => {
    if (!window.confirm(`Permanently delete enquiry record ${ref}?`)) return;
    try {
      await requestJson(`/api/admin/enquiries/${encodeURIComponent(ref)}`, { method: 'DELETE' });
      setToast(`Enquiry ${ref} deleted.`);
      setSelectedEnquiry(null);
      loadEnquiries();
    } catch (err) {
      setToast(`Failed to delete enquiry: ${err.message}`);
    }
  };

  const handleExportCsv = () => {
    downloadCsv(
      `vathilai_enquiries_${new Date().toISOString().slice(0, 10)}.csv`,
      filteredEnquiries,
      [
        { label: 'Reference / Enquiry ID', getter: (r) => r.enquiryId || r.reference || '' },
        { label: 'Name', getter: (r) => r.customerName || r.customer?.name || r.name || '' },
        { label: 'Mobile Number', getter: (r) => r.mobileNumber || r.customer?.phone || r.phone || '' },
        { label: 'Email', getter: (r) => r.email || r.customer?.email || '' },
        { label: 'City', getter: (r) => r.city || r.customer?.city || '' },
        { label: 'Motorcycle Model', getter: (r) => r.motorcycleModel || r.motorcycle?.model || r.model || '' },
        { label: 'Variant', getter: (r) => r.motorcycleVariant || r.variant || '' },
        { label: 'Preferred Contact Method', getter: (r) => r.preferredContactMethod || r.customer?.preferredContactMethod || 'Call' },
        { label: 'Enquiry Source', getter: (r) => r.source || 'motorcycle-details' },
        { label: 'Status', getter: (r) => r.enquiryStatus || r.status || 'new' },
        { label: 'Date', key: 'createdAt' },
        { label: 'Message', getter: (r) => r.message || r.customer?.message || '' },
        { label: 'Staff Notes', key: 'notes' },
      ]
    );
  };

  return (
    <>
      <SectionIntro
        eyebrow="CUSTOMER INBOX / LEADS"
        title="Contact & Customer Enquiries"
        description="All motorcycle enquiries, test ride requests, and website contact submissions collected from the live public site."
        action={
          <button className="admin-button admin-button--primary" type="button" onClick={handleExportCsv} disabled={filteredEnquiries.length === 0}>
            EXPORT CSV ({filteredEnquiries.length})
          </button>
        }
      />

      <StatusToast message={toast} onClose={() => setToast('')} />

      <section className="admin-panel admin-table-panel">
        <div className="admin-panel__heading">
          <div><span className="admin-eyebrow">DATABASE INBOX</span><h3>Enquiry Records</h3></div>
          <span className="admin-panel__hint">{filteredEnquiries.length} of {enquiries.length} total</span>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <label className="admin-search" style={{ flex: 1, minWidth: 240 }}>
            <span className="sr-only">Search enquiries</span>
            <input
              placeholder="Search reference, customer name, phone, model, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff' }}
              aria-label="Filter by enquiry source"
            >
              <option value="all">All Enquiries</option>
              <option value="motorcycle-details">Motorcycle Details</option>
              <option value="general-contact">General Contact</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff' }}
              aria-label="Filter by enquiry status"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="confirmed">Confirmed</option>
              <option value="converted">Converted</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Reference ID</th>
                <th>Customer</th>
                <th>Motorcycle Model</th>
                <th>City / Contact</th>
                <th>Source</th>
                <th>Status</th>
                <th>Staff Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEnquiries.map((item) => {
                const ref = item.enquiryId || item.reference || item.id;
                const name = item.customerName || item.customer?.name || item.name || 'Customer';
                const phone = item.mobileNumber || item.customer?.phone || item.phone || '';
                const email = item.email || item.customer?.email || '';
                const bike = item.motorcycleModel || item.motorcycle?.model || item.model || 'Yamaha Motorcycle';
                const city = item.city || item.customer?.city || 'Batlagundu';
                const contactMethod = item.preferredContactMethod || item.customer?.preferredContactMethod || 'Call';
                const source = item.source || (item.type === 'booking' ? 'booking' : 'motorcycle-details');
                const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—';
                const status = item.enquiryStatus || item.status || 'new';

                return (
                  <tr key={ref}>
                    <td>
                      <code>{ref}</code>
                      <small style={{ display: 'block', color: '#64748b' }}>{date}</small>
                    </td>
                    <td>
                      <strong>{name}</strong>
                      {phone && <small style={{ display: 'block' }}><a href={`tel:${phone}`}>{phone}</a></small>}
                      {email && <small style={{ display: 'block', color: '#64748b' }}>{email}</small>}
                    </td>
                    <td>
                      <strong>{bike}</strong>
                      {item.motorcycleVariant && <small style={{ display: 'block', color: '#64748b' }}>{item.motorcycleVariant}</small>}
                    </td>
                    <td>
                      <div>{city}</div>
                      <small style={{ color: '#0369a1', fontWeight: 600 }}>Via {contactMethod}</small>
                    </td>
                    <td>
                      <span
                        className="admin-badge"
                        style={{
                          fontSize: '11px',
                          textTransform: 'uppercase',
                          background: source === 'motorcycle-details' ? '#eff6ff' : (source === 'booking' ? '#f0fdf4' : '#f8fafc'),
                          color: source === 'motorcycle-details' ? '#1d4ed8' : (source === 'booking' ? '#15803d' : '#475569'),
                          borderColor: source === 'motorcycle-details' ? '#bfdbfe' : (source === 'booking' ? '#bbf7d0' : '#e2e8f0'),
                        }}
                      >
                        {source === 'motorcycle-details' ? 'Motorcycle Details' : (source === 'booking' ? 'Booking' : 'General Contact')}
                      </span>
                    </td>
                    <td>
                      <select
                        className="admin-booking-status"
                        value={status}
                        onChange={(e) => updateStatus(ref, e.target.value)}
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="converted">Converted</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td style={{ maxWidth: 180, fontSize: '12px', color: '#475569' }}>
                      {item.notes ? item.notes : <span style={{ color: '#94a3b8' }}>None</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          className="admin-button admin-button--secondary admin-button--sm"
                          onClick={() => {
                            setSelectedEnquiry(item);
                            setNotesDraft(item.notes || '');
                          }}
                          aria-label={`View enquiry ${ref}`}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          className="admin-text-button admin-text-button--danger"
                          style={{ fontSize: '11px' }}
                          onClick={() => deleteEnquiry(ref)}
                        >
                          DELETE
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredEnquiries.length === 0 && (
                <tr><td colSpan="8" className="admin-table__empty">No customer enquiries found matching criteria.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedEnquiry && (
        <div
          className="admin-modal"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedEnquiry(null);
          }}
        >
          <section
            className="admin-modal__card admin-enquiry-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="enquiry-details-title"
          >
            <div className="admin-modal__heading">
              <div>
                <span className="admin-eyebrow">ENQUIRY DETAILS</span>
                <h3 id="enquiry-details-title">{selectedEnquiry.customerName || selectedEnquiry.customer?.name || selectedEnquiry.name || selectedEnquiry.reference || 'Customer enquiry'}</h3>
              </div>
              <button
                type="button"
                className="admin-modal__close"
                onClick={() => setSelectedEnquiry(null)}
                aria-label="Close enquiry details"
                autoFocus
              >
                ✕
              </button>
            </div>

            <div className="admin-enquiry-contact-actions">
              {(selectedEnquiry.mobileNumber || selectedEnquiry.customer?.phone || selectedEnquiry.phone) && (
                <>
                  <a
                    href={`tel:${selectedEnquiry.mobileNumber || selectedEnquiry.customer?.phone || selectedEnquiry.phone}`}
                    className="admin-button admin-button--primary admin-button--sm"
                  >
                    CALL CUSTOMER
                  </a>
                  <a
                    href={`https://wa.me/91${String(selectedEnquiry.mobileNumber || selectedEnquiry.customer?.phone || selectedEnquiry.phone).replace(/\D/g, '').replace(/^0+/, '').replace(/^91/, '')}?text=${encodeURIComponent(`Hello ${selectedEnquiry.customerName || selectedEnquiry.customer?.name || selectedEnquiry.name || 'Customer'}, thank you for contacting Vathilai Motors regarding the ${selectedEnquiry.motorcycleModel || selectedEnquiry.motorcycle?.model || selectedEnquiry.model || 'Yamaha motorcycle'}. Our team is ready to assist you.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin-button admin-button--secondary admin-button--sm"
                    style={{ background: '#25D366', color: '#fff', borderColor: '#25D366' }}
                  >
                    WHATSAPP
                  </a>
                </>
              )}
              {(selectedEnquiry.email || selectedEnquiry.customer?.email) && (
                <a
                  href={`mailto:${selectedEnquiry.email || selectedEnquiry.customer?.email}?subject=${encodeURIComponent(`Vathilai Motors — Enquiry for ${selectedEnquiry.motorcycleModel || selectedEnquiry.motorcycle?.model || selectedEnquiry.model || 'Yamaha Motorcycle'}`)}`}
                  className="admin-button admin-button--secondary admin-button--sm"
                >
                  EMAIL
                </a>
              )}
            </div>

            <iframe
              className="admin-enquiry-details-frame"
              title={`Enquiry details for ${selectedEnquiry.customerName || selectedEnquiry.customer?.name || selectedEnquiry.name || 'customer'}`}
              sandbox=""
              srcDoc={createEnquiryDetailsDocument(selectedEnquiry)}
            />

            <div className="admin-enquiry-notes">
              <label className="admin-demo-field">
                <span>Internal Staff Follow-up Notes</span>
                <textarea
                  rows="3"
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  placeholder="Record staff call notes, customer requirements, quotation details..."
                />
              </label>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  type="button"
                  className="admin-button admin-button--primary admin-button--sm"
                  onClick={() => saveNotes(selectedEnquiry.enquiryId || selectedEnquiry.reference)}
                >
                  Save Notes
                </button>
              </div>
            </div>

            <div className="admin-enquiry-modal-actions" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button type="button" className="admin-text-button admin-text-button--danger" onClick={() => deleteEnquiry(selectedEnquiry.enquiryId || selectedEnquiry.reference)}>
                DELETE ENQUIRY
              </button>
              <button type="button" className="admin-button admin-button--secondary admin-button--sm" onClick={() => setSelectedEnquiry(null)}>
                CLOSE
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

// -------------------------------------------------------------
// 5. CUSTOMER REVIEWS (/admin/reviews)
// -------------------------------------------------------------
export function CustomerReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingReview, setEditingReview] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!selectedReview) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setSelectedReview(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedReview]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const res = await requestJson('/api/admin/reviews');
      if (res?.reviews) setReviews(res.reviews);
    } catch (err) {
      setToast(`Failed to load reviews: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReviews(); }, []);

  const handleSaveReview = async (e) => {
    e.preventDefault();
    try {
      const isNew = !editingReview.id;
      const url = isNew ? '/api/admin/reviews' : `/api/admin/reviews/${editingReview.id}`;
      const method = isNew ? 'POST' : 'PUT';
      await requestJson(url, { method, body: editingReview });
      setToast(`Review ${isNew ? 'added' : 'updated'} successfully.`);
      setEditingReview(null);
      loadReviews();
    } catch (err) {
      setToast(`Error saving review: ${err.message}`);
    }
  };

  const togglePublished = async (review) => {
    try {
      const updated = { ...review, published: !review.published };
      await requestJson(`/api/admin/reviews/${review.id}`, { method: 'PUT', body: updated });
      setToast(`Review ${updated.published ? 'published' : 'hidden'} on public site.`);
      setReviews((prev) => prev.map((r) => (r.id === review.id ? updated : r)));
    } catch (err) {
      setToast(`Failed to update review: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer review from the database?')) return;
    try {
      await requestJson(`/api/admin/reviews/${id}`, { method: 'DELETE' });
      setToast('Review deleted.');
      loadReviews();
    } catch (err) {
      setToast(`Error deleting review: ${err.message}`);
    }
  };

  return (
    <>
      <SectionIntro
        eyebrow="CUSTOMER CARE / FEEDBACK"
        title="Customer Reviews & Testimonials"
        description="Manage verified customer reviews displayed on the website. Moderate, edit, or publish rider feedback."
        action={
          <button
            className="admin-button admin-button--primary"
            type="button"
            onClick={() => setEditingReview({
              name: '',
              rating: 5,
              comment: '',
              bikeModel: 'Yamaha YZF-R15 V4',
              city: 'Salem',
              published: true,
              date: new Date().toISOString().slice(0, 10),
            })}
          >
            ADD REVIEW <span>＋</span>
          </button>
        }
      />

      <StatusToast message={toast} onClose={() => setToast('')} />

      <section className="admin-panel admin-table-panel">
        <div className="admin-panel__heading">
          <div><span className="admin-eyebrow">REVIEWS INVENTORY</span><h3>Published & Pending Testimonials</h3></div>
          <span className="admin-panel__hint">{reviews.length} reviews</span>
        </div>

        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Rating</th>
                <th>Motorcycle & City</th>
                <th>Review Comment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((rev) => {
                const customerName = rev.customerName || rev.name || 'Customer';
                const bikeModel = rev.model || rev.bikeModel || 'Yamaha Motorcycle';
                const comment = rev.review || rev.comment || '';
                const isPublished = rev.published ?? (rev.status === 'published');

                return (
                  <tr key={rev.id}>
                    <td><strong>{customerName}</strong></td>
                    <td>
                      <span style={{ color: '#eab308', fontSize: '15px' }}>
                        {'★'.repeat(rev.rating || 5)}{'☆'.repeat(5 - (rev.rating || 5))}
                      </span>
                    </td>
                    <td>
                      <div>{bikeModel}</div>
                      <small style={{ color: '#64748b' }}>{rev.city || 'Tamil Nadu'}</small>
                    </td>
                    <td style={{ maxWidth: 300 }}>
                      <p style={{ margin: 0, fontSize: '13px', color: '#334155' }}>"{comment}"</p>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`admin-status-tag ${isPublished ? 'is-published' : ''}`}
                        style={{ cursor: 'pointer', border: 'none' }}
                        onClick={() => togglePublished(rev)}
                        title="Click to toggle publish status"
                      >
                        {isPublished ? 'PUBLISHED' : 'HIDDEN'}
                      </button>
                    </td>
                    <td>
                      <div className="admin-booking-actions">
                        <button
                          type="button"
                          className="admin-button admin-button--secondary admin-button--sm"
                          onClick={() => setSelectedReview({ ...rev, name: customerName, bikeModel, comment, published: isPublished })}
                          aria-label={`View review by ${customerName}`}
                        >
                          View
                        </button>
                        <button type="button" className="admin-text-button" onClick={() => setEditingReview({ ...rev, name: customerName, bikeModel, comment, published: isPublished })}>EDIT</button>
                        <button type="button" className="admin-text-button admin-text-button--danger" onClick={() => handleDelete(rev.id)}>DELETE</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {reviews.length === 0 && (
                <tr><td colSpan="6" className="admin-table__empty">No customer reviews yet. Click "ADD REVIEW" to create one.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedReview && (
        <div
          className="admin-modal"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedReview(null);
          }}
        >
          <section
            className="admin-modal__card admin-review-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-details-title"
          >
            <div className="admin-modal__heading">
              <div>
                <span className="admin-eyebrow">CUSTOMER REVIEW</span>
                <h3 id="review-details-title">{selectedReview.customerName || selectedReview.name || 'Customer review'}</h3>
              </div>
              <button
                type="button"
                className="admin-modal__close"
                onClick={() => setSelectedReview(null)}
                aria-label="Close review details"
                autoFocus
              >
                ✕
              </button>
            </div>
            <iframe
              className="admin-review-details-frame"
              title={`Review details by ${selectedReview.customerName || selectedReview.name || 'customer'}`}
              sandbox=""
              srcDoc={createReviewDetailsDocument(selectedReview)}
            />
          </section>
        </div>
      )}

      {editingReview && (
        <div className="admin-modal" role="dialog" aria-modal="true">
          <div className="admin-modal__card" style={{ maxWidth: 540 }}>
            <div className="admin-modal__heading">
              <div><span className="admin-eyebrow">REVIEW FORM</span><h3>{editingReview.id ? 'Edit Review' : 'Add Customer Review'}</h3></div>
              <button type="button" className="admin-modal__close" onClick={() => setEditingReview(null)}>✕</button>
            </div>
            <form onSubmit={handleSaveReview} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label className="admin-demo-field">
                  <span>Customer Name *</span>
                  <input required value={editingReview.name || ''} onChange={(e) => setEditingReview({ ...editingReview, name: e.target.value })} />
                </label>
                <label className="admin-demo-field">
                  <span>Rating (1-5) *</span>
                  <select value={editingReview.rating || 5} onChange={(e) => setEditingReview({ ...editingReview, rating: Number(e.target.value) })}>
                    <option value="5">★★★★★ (5 Stars)</option>
                    <option value="4">★★★★☆ (4 Stars)</option>
                    <option value="3">★★★☆☆ (3 Stars)</option>
                    <option value="2">★★☆☆☆ (2 Stars)</option>
                    <option value="1">★☆☆☆☆ (1 Star)</option>
                  </select>
                </label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label className="admin-demo-field">
                  <span>Motorcycle Model</span>
                  <input value={editingReview.bikeModel || ''} onChange={(e) => setEditingReview({ ...editingReview, bikeModel: e.target.value })} />
                </label>
                <label className="admin-demo-field">
                  <span>City / Location</span>
                  <input value={editingReview.city || ''} onChange={(e) => setEditingReview({ ...editingReview, city: e.target.value })} />
                </label>
              </div>
              <label className="admin-demo-field">
                <span>Testimonial Comment *</span>
                <textarea required rows="4" value={editingReview.comment || ''} onChange={(e) => setEditingReview({ ...editingReview, comment: e.target.value })} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={editingReview.published ?? true} onChange={(e) => setEditingReview({ ...editingReview, published: e.target.checked })} />
                <span>Publish immediately on public website</span>
              </label>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button type="button" className="admin-button" onClick={() => setEditingReview(null)}>CANCEL</button>
                <button type="submit" className="admin-button admin-button--primary">SAVE REVIEW</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}



// -------------------------------------------------------------
// 5. HOME PAGE EDITOR (/admin/home-page)
// -------------------------------------------------------------
export function HomePageEditor() {
  const [homeConfig, setHomeConfig] = useState({
    slides: [],
    rotationIntervalMs: 3000,
    ctas: {},
  });
  const [loading, setLoading] = useState(true);
  const [uploadingSlideIndex, setUploadingSlideIndex] = useState(null);
  const [selectedSlide, setSelectedSlide] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!selectedSlide) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setSelectedSlide(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedSlide]);

  const loadHomePage = async () => {
    try {
      setLoading(true);
      const res = await requestJson('/api/admin/home-page');
      if (res?.homePage) setHomeConfig(res.homePage);
    } catch (err) {
      setToast(`Failed to load homepage configuration: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadHomePage(); }, []);

  const saveConfiguration = async (updatedConfig) => {
    try {
      await requestJson('/api/admin/home-page', {
        method: 'PUT',
        body: updatedConfig || homeConfig,
      });
      setToast('Homepage configuration saved to database and live on website.');
    } catch (err) {
      setToast(`Error saving home configuration: ${err.message}`);
    }
  };

  const updateSlide = (index, field, value) => {
    const newSlides = [...homeConfig.slides];
    newSlides[index] = { ...newSlides[index], [field]: value };
    const updated = { ...homeConfig, slides: newSlides };
    setHomeConfig(updated);
  };

  const handleSlideUpload = async (index, file) => {
    if (!file) return;
    try {
      setUploadingSlideIndex(index);
      const uploaded = await uploadMediaBinary(file);
      updateSlide(index, 'image', uploaded.url);
      setToast(`Uploaded slide image: ${file.name}`);
    } catch (err) {
      setToast(`Slide upload failed: ${err.message}`);
    } finally {
      setUploadingSlideIndex(null);
    }
  };

  const addSlide = () => {
    const newSlide = {
      image: '/imgs/archive/f1.webp',
      title: 'Yamaha Performance',
      subtitle: 'Engineered for pure exhilaration',
      link: '/bikes',
    };
    const updated = { ...homeConfig, slides: [...homeConfig.slides, newSlide] };
    setHomeConfig(updated);
  };

  const removeSlide = (index) => {
    const newSlides = homeConfig.slides.filter((_, i) => i !== index);
    const updated = { ...homeConfig, slides: newSlides };
    setHomeConfig(updated);
  };

  return (
    <>
      <SectionIntro
        eyebrow="WEBSITE / HOMEPAGE"
        title="Home Page Hero & Banners"
        description="Configure homepage hero slider images, auto-rotation timing (default 3 seconds), titles, and calls-to-action."
        action={
          <button className="admin-button admin-button--primary" type="button" onClick={() => saveConfiguration()}>
            SAVE CHANGES <span>✓</span>
          </button>
        }
      />

      <StatusToast message={toast} onClose={() => setToast('')} />

      <section className="admin-panel">
        <div className="admin-panel__heading">
          <div><span className="admin-eyebrow">SLIDER CONFIGURATION</span><h3>Hero Banner Slides</h3></div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Rotation (ms):</span>
              <input
                type="number"
                min="1000"
                step="500"
                style={{ width: 80, padding: '4px 8px' }}
                value={homeConfig.rotationIntervalMs || 3000}
                onChange={(e) => setHomeConfig({ ...homeConfig, rotationIntervalMs: Number(e.target.value) })}
              />
            </label>
            <button type="button" className="admin-button" onClick={addSlide}>ADD SLIDE ＋</button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
          {homeConfig.slides?.map((slide, idx) => (
            <div
              key={idx}
              style={{
                display: 'grid',
                gridTemplateColumns: '180px 1fr auto',
                gap: '16px',
                padding: '16px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                alignItems: 'center',
              }}
            >
              <div style={{ position: 'relative', height: 100, borderRadius: 6, overflow: 'hidden', background: '#0f172a' }}>
                <img src={slide.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.src = '/imgs/archive/f1.webp'; }} />
                <span style={{ position: 'absolute', bottom: 4, left: 4, background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '11px', padding: '2px 6px', borderRadius: 4 }}>
                  Slide {idx + 1}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label className="admin-demo-field">
                  <span>Image Path / URL</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input style={{ flex: 1 }} value={slide.image || ''} onChange={(e) => updateSlide(idx, 'image', e.target.value)} />
                    <label className="admin-button" style={{ cursor: 'pointer', padding: '6px 10px', fontSize: '11px' }}>
                      {uploadingSlideIndex === idx ? '…' : 'UPLOAD'}
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleSlideUpload(idx, e.target.files?.[0])} />
                    </label>
                  </div>
                </label>
                <label className="admin-demo-field">
                  <span>Slide Headline</span>
                  <input value={slide.title || ''} onChange={(e) => updateSlide(idx, 'title', e.target.value)} />
                </label>
                <label className="admin-demo-field">
                  <span>Subtitle / Tagline</span>
                  <input value={slide.subtitle || ''} onChange={(e) => updateSlide(idx, 'subtitle', e.target.value)} />
                </label>
                <label className="admin-demo-field">
                  <span>Button Link</span>
                  <input value={slide.link || ''} onChange={(e) => updateSlide(idx, 'link', e.target.value)} />
                </label>
              </div>

              <div className="admin-home-slide-actions">
                <button
                  type="button"
                  className="admin-button admin-button--secondary admin-button--sm"
                  onClick={() => setSelectedSlide({ ...slide, slideNumber: idx + 1 })}
                  aria-label={`View homepage slide ${idx + 1}`}
                >
                  View
                </button>
                <button
                  type="button"
                  className="admin-text-button admin-text-button--danger"
                  onClick={() => removeSlide(idx)}
                  title="Remove slide"
                >
                  REMOVE
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {selectedSlide && (
        <div
          className="admin-modal"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedSlide(null);
          }}
        >
          <section
            className="admin-modal__card admin-home-slide-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="home-slide-details-title"
          >
            <div className="admin-modal__heading">
              <div>
                <span className="admin-eyebrow">HOMEPAGE SLIDE</span>
                <h3 id="home-slide-details-title">{selectedSlide.title || `Slide ${selectedSlide.slideNumber}`}</h3>
              </div>
              <button type="button" className="admin-modal__close" onClick={() => setSelectedSlide(null)} aria-label="Close slide details" autoFocus>✕</button>
            </div>
            <iframe
              className="admin-home-slide-details-frame"
              title={`Homepage slide ${selectedSlide.slideNumber} details`}
              sandbox=""
              srcDoc={createHomeSlideDetailsDocument(selectedSlide)}
            />
          </section>
        </div>
      )}
    </>
  );
}


// -------------------------------------------------------------
// 6. MEDIA LIBRARY (/admin/media)
// -------------------------------------------------------------
export function MediaLibrary() {
  const [media, setMedia] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!selectedMedia) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setSelectedMedia(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedMedia]);

  const loadMedia = async () => {
    try {
      setLoading(true);
      const res = await requestJson('/api/admin/media');
      if (res?.media) setMedia(res.media);
    } catch (err) {
      setToast(`Failed to load media: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMedia(); }, []);

  const filteredMedia = useMemo(() => {
    if (filter === 'all') return media;
    if (filter === 'images') return media.filter((m) => {
      const type = m.type || m.mimeType || m.mediaType || '';
      return type === 'image' || type.startsWith('image/');
    });
    if (filter === 'videos') return media.filter((m) => {
      const type = m.type || m.mimeType || m.mediaType || '';
      return type === 'video' || type.startsWith('video/');
    });
    return media;
  }, [media, filter]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const uploaded = await uploadMediaBinary(file);
      setToast(`Uploaded ${file.name} successfully to ${uploaded.url}`);
      loadMedia();
    } catch (err) {
      setToast(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const copyUrl = (url) => {
    navigator.clipboard.writeText(url);
    setToast(`Copied URL: ${url}`);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this media file?')) return;
    try {
      await requestJson(`/api/admin/media/${id}`, { method: 'DELETE' });
      setToast('Media file removed.');
      loadMedia();
    } catch (err) {
      setToast(`Error deleting file: ${err.message}`);
    }
  };

  return (
    <>
      <SectionIntro
        eyebrow="ASSETS / STORAGE"
        title="Media Library"
        description="Upload and manage motorcycle imagery, promotional videos, and dealership documents stored locally in the server storage."
        action={
          <label className="admin-button admin-button--primary" style={{ cursor: 'pointer' }}>
            {uploading ? 'UPLOADING…' : 'UPLOAD NEW MEDIA ＋'}
            <input type="file" accept="image/*,video/*" style={{ display: 'none' }} disabled={uploading} onChange={handleUpload} />
          </label>
        }
      />

      <StatusToast message={toast} onClose={() => setToast('')} />

      <section className="admin-panel">
        <div className="admin-panel__heading">
          <div><span className="admin-eyebrow">STORAGE ASSETS</span><h3>Uploaded Files</h3></div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['all', 'images', 'videos'].map((f) => (
              <button
                key={f}
                type="button"
                className={`admin-platform-filter__button ${filter === f ? 'is-active' : ''}`}
                style={{ padding: '4px 10px', fontSize: '12px' }}
                onClick={() => setFilter(f)}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
          {filteredMedia.map((m) => {
            const type = m.type || m.mimeType || m.mediaType || '';
            const isVideo = type === 'video' || type.startsWith('video/');
            const mediaUrl = m.url || m.filePath || m.fileUrl || '';
            const filename = m.filename || m.fileName || m.originalName || 'Unnamed file';
            return (
              <div key={m.id} style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: 130, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  {isVideo ? (
                    <video src={mediaUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                  ) : (
                    <img src={mediaUrl} alt={m.altText || filename} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.src = '/imgs/archive/f1.webp'; }} />
                  )}
                  <span style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: 4 }}>
                    {isVideo ? 'VIDEO' : 'IMAGE'}
                  </span>
                </div>
                <div style={{ padding: '10px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <strong style={{ fontSize: '13px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={filename}>
                      {filename}
                    </strong>
                    <code style={{ fontSize: '11px', color: '#64748b' }}>{mediaUrl}</code>
                  </div>
                  <div className="admin-media-card-actions">
                    <button type="button" className="admin-button admin-button--secondary admin-button--sm" onClick={() => setSelectedMedia(m)} aria-label={`View ${filename}`}>
                      View
                    </button>
                    <button type="button" className="admin-text-button" onClick={() => copyUrl(mediaUrl)} disabled={!mediaUrl}>COPY URL</button>
                    <button type="button" className="admin-text-button admin-text-button--danger" onClick={() => handleDelete(m.id)}>DELETE</button>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredMedia.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '32px', textAlign: 'center', color: '#64748b' }}>
              No media files found in this category. Click "UPLOAD NEW MEDIA" to upload photos or videos.
            </div>
          )}
        </div>
      </section>

      {selectedMedia && (
        <div
          className="admin-modal"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedMedia(null);
          }}
        >
          <section
            className="admin-modal__card admin-media-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="media-details-title"
          >
            <div className="admin-modal__heading">
              <div>
                <span className="admin-eyebrow">MEDIA DETAILS</span>
                <h3 id="media-details-title">{selectedMedia.filename || selectedMedia.fileName || selectedMedia.originalName || 'Media file'}</h3>
              </div>
              <button
                type="button"
                className="admin-modal__close"
                onClick={() => setSelectedMedia(null)}
                aria-label="Close media details"
                autoFocus
              >
                ✕
              </button>
            </div>
            <iframe
              className="admin-media-details-frame"
              title={`Media details for ${selectedMedia.filename || selectedMedia.fileName || selectedMedia.originalName || 'file'}`}
              sandbox=""
              srcDoc={createMediaDetailsDocument(selectedMedia)}
            />
          </section>
        </div>
      )}
    </>
  );
}

// -------------------------------------------------------------
// 11. ADMIN ANALYTICS (/admin/analytics)
// -------------------------------------------------------------
export function AdminAnalytics({ overview }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    requestJson('/api/admin/analytics')
      .then((data) => { if (active) setAnalytics(data); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const metrics = [
    { label: 'Total bookings', value: analytics?.totalBookings ?? overview?.totalBookings, note: 'Confirmed API count' },
    { label: 'Enquiries', value: analytics?.totalEnquiries ?? overview?.totalEnquiries, note: 'Confirmed API count' },
    { label: 'Motorcycles', value: analytics?.totalMotorcycles ?? overview?.totalMotorcycles, note: 'Confirmed API count' },
  ];

  return (
    <>
      <SectionIntro
        eyebrow="REPORTING / INTELLIGENCE"
        title="Dealership Analytics & Performance"
        description="Analytics from records returned by the admin API."
      />

      {error && <div className="admin-state admin-state--error" role="alert">Could not load analytics: {error}</div>}
      {loading && <div className="admin-state" role="status">Loading analytics…</div>}
      <section className="admin-metrics" aria-label="Available admin metrics">
        {metrics.map((metric) => (
          <article className="admin-metric" key={metric.label}>
            <span>{metric.label}</span><strong>{metric.value == null ? 'Not reported' : metric.value}</strong><small>{metric.note}</small>
          </article>
        ))}
      </section>

      <section className="admin-grid">
        <article className="admin-panel admin-content-chart">
          <div className="admin-panel__heading">
            <div><span className="admin-eyebrow">DEMAND</span><h3>Top Motorcycle Interest</h3></div>
            <span className="admin-panel__hint">From API-returned customer requests</span>
          </div>
          <div className="admin-bars">
            {analytics?.popularModels?.map((item) => {
              const maxCount = Math.max(1, ...analytics.popularModels.map((model) => model.count));
              return (
                <div className="admin-bar-row" key={item.model}>
                  <span style={{ minWidth: 120 }}>{item.model}</span>
                  <div className="admin-bar-track">
                    <i className="is-blue" style={{ width: `${(item.count / maxCount) * 100}%` }} />
                  </div>
                  <strong>{item.count} records</strong>
                </div>
              );
            })}
            {!loading && !error && analytics?.popularModels?.length === 0 && <p className="admin-table__empty">No model interest records yet.</p>}
            {!loading && !error && !analytics?.popularModels && <p className="admin-table__empty">Model interest not reported.</p>}
          </div>
        </article>

        <article className="admin-panel admin-system-panel">
          <div className="admin-panel__heading">
            <div><span className="admin-eyebrow">DATABASE STATS</span><h3>Live Persistence Status</h3></div>
          </div>
          <ul className="admin-status-list">
            <li><span>Database mode</span><strong>{overview?.database?.provider || 'Status unavailable'}</strong></li>
            <li><span>Bookings</span><strong>{analytics?.totalBookings ?? 'Not reported'}</strong></li>
            <li><span>Enquiries</span><strong>{analytics?.totalEnquiries ?? 'Not reported'}</strong></li>
            <li><span>Motorcycle catalog</span><strong>{analytics?.totalMotorcycles ?? 'Not reported'}</strong></li>
            <li><span>API state</span><strong>{analytics?.sourceStatus ? 'Available' : 'Status unavailable'}</strong></li>
          </ul>
        </article>
      </section>
    </>
  );
}

// -------------------------------------------------------------
// 12. ADMIN PROFILE SETTINGS (/admin/profile)
// -------------------------------------------------------------
export function AdminProfileSettings({ user, developmentAccess = false }) {
  const [profile, setProfile] = useState({
    name: user?.name || 'Sanjay',
    email: user?.email || 'yourssanjay63@gmail.com',
    phone: '081444 45566',
    role: user?.role || 'Super Admin',
  });
  const [toast, setToast] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    setToast('Administrator profile updated in session.');
  };

  return (
    <>
      <SectionIntro
        eyebrow="ACCOUNT / SECURITY"
        title="Admin Profile & Session"
        description="Manage your dealership administrator credentials, active session security, and contact email."
      />

      <StatusToast message={toast} onClose={() => setToast('')} />

      <section className="admin-panel admin-profile-panel">
        <div className="admin-panel__heading">
          <div><span className="admin-eyebrow">ACTIVE CREDENTIALS</span><h3>Administrator Profile</h3></div>
          <span className="admin-status-tag is-published">VERIFIED SUPER ADMIN</span>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: 600, marginTop: '16px' }}>
          <label className="admin-demo-field">
            <span>Admin Display Name *</span>
            <input required value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
          </label>
          <label className="admin-demo-field">
            <span>Primary Contact Email *</span>
            <input required type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
          </label>
          <label className="admin-demo-field">
            <span>Direct Phone / Mobile</span>
            <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
          </label>
          <label className="admin-demo-field">
            <span>System Role</span>
            <input disabled value={profile.role} />
          </label>
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button type="submit" className="admin-button admin-button--primary">UPDATE PROFILE</button>
          </div>
        </form>
      </section>
    </>
  );
}

// -------------------------------------------------------------
// 13. SEO SETTINGS (/admin/seo)
// -------------------------------------------------------------
export function SeoSettings() {
  const [seoList, setSeoList] = useState([]);
  const [selectedPage, setSelectedPage] = useState('home');
  const [toast, setToast] = useState('');

  const loadSeo = async () => {
    try {
      const res = await requestJson('/api/admin/seo');
      if (res?.seo) setSeoList(res.seo);
    } catch (err) {
      setToast(`Failed to load SEO settings: ${err.message}`);
    }
  };

  useEffect(() => { loadSeo(); }, []);

  const currentPageSeo = useMemo(() => {
    return seoList.find((s) => s.page === selectedPage) || {
      page: selectedPage,
      title: 'Vathilai Motors | Authorized Yamaha Dealership',
      description: 'Experience Yamaha pure racing DNA at Vathilai Motors. Book test rides, configure motorcycles, and explore service support in Salem, Tamil Nadu.',
      keywords: 'Yamaha, Vathilai Motors, R15, MT15, FZ, Salem, Dealership',
      ogImage: '/imgs/archive/f1.webp',
    };
  }, [seoList, selectedPage]);

  const [formDraft, setFormDraft] = useState(currentPageSeo);
  useEffect(() => { setFormDraft(currentPageSeo); }, [currentPageSeo]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await requestJson(`/api/admin/seo/${selectedPage}`, { method: 'PUT', body: formDraft });
      setToast(`SEO metadata saved for "${selectedPage}" page.`);
      loadSeo();
    } catch (err) {
      setToast(`Error saving SEO: ${err.message}`);
    }
  };

  return (
    <>
      <SectionIntro
        eyebrow="CONFIGURATION / DISCOVERY"
        title="SEO & Metadata Settings"
        description="Configure search engine titles, meta descriptions, open graph social cards, and indexing keywords for public pages."
      />

      <StatusToast message={toast} onClose={() => setToast('')} />

      <section className="admin-panel">
        <div className="admin-panel__heading">
          <div><span className="admin-eyebrow">PAGE SELECTION</span><h3>Select Page to Optimize</h3></div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['home', 'bikes', 'services', 'book-us', 'about'].map((page) => (
              <button
                key={page}
                type="button"
                className={`admin-platform-filter__button ${selectedPage === page ? 'is-active' : ''}`}
                style={{ padding: '6px 14px', fontSize: '13px' }}
                onClick={() => setSelectedPage(page)}
              >
                /{page === 'home' ? '' : page}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', marginTop: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <label className="admin-demo-field">
              <span>Meta Title *</span>
              <input required maxLength="70" value={formDraft.title || ''} onChange={(e) => setFormDraft({ ...formDraft, title: e.target.value })} />
              <small style={{ color: '#64748b' }}>{formDraft.title?.length || 0} / 70 characters</small>
            </label>
            <label className="admin-demo-field">
              <span>Meta Description *</span>
              <textarea required rows="4" maxLength="160" value={formDraft.description || ''} onChange={(e) => setFormDraft({ ...formDraft, description: e.target.value })} />
              <small style={{ color: '#64748b' }}>{formDraft.description?.length || 0} / 160 characters</small>
            </label>
            <label className="admin-demo-field">
              <span>Keywords (comma separated)</span>
              <input value={formDraft.keywords || ''} onChange={(e) => setFormDraft({ ...formDraft, keywords: e.target.value })} />
            </label>
            <label className="admin-demo-field">
              <span>Social Share Image (OG Image)</span>
              <input value={formDraft.ogImage || ''} onChange={(e) => setFormDraft({ ...formDraft, ogImage: e.target.value })} />
            </label>
            <div>
              <button type="submit" className="admin-button admin-button--primary">SAVE SEO SETTINGS</button>
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <strong style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
              Google Search Result Snippet Preview
            </strong>
            <div style={{ fontFamily: 'arial, sans-serif' }}>
              <div style={{ fontSize: '12px', color: '#202124' }}>https://vathilaimotors.com › {selectedPage === 'home' ? '' : selectedPage}</div>
              <div style={{ fontSize: '18px', color: '#1a0dab', marginTop: '2px', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {formDraft.title || 'Page Title'}
              </div>
              <div style={{ fontSize: '13px', color: '#4d5156', marginTop: '4px', lineHeight: 1.4 }}>
                {formDraft.description || 'Page description will appear here...'}
              </div>
            </div>
          </div>
        </form>
      </section>
    </>
  );
}

// -------------------------------------------------------------
// 14. USERS & ROLES (/admin/users)
// -------------------------------------------------------------
export function UsersManagement({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const loadUsers = async () => {
    try {
      const res = await requestJson('/api/admin/users');
      if (res?.users) setUsers(res.users);
    } catch (err) {
      setToast(`Failed to load users: ${err.message}`);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleOpenAdd = () => {
    setShowPassword(false);
    setEditingUser({
      name: '',
      email: '',
      password: '',
      role: 'Admin',
      status: 'Active',
    });
  };

  const handleOpenEdit = (u) => {
    setShowPassword(false);
    setEditingUser({
      ...u,
      password: '', // Blank by default when editing
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    const isNew = !editingUser.id;
    if (isNew && (!editingUser.password || editingUser.password.length < 6)) {
      setToast('Password is required and must be at least 6 characters.');
      return;
    }
    if (!isNew && editingUser.password && editingUser.password.length < 6) {
      setToast('New password must be at least 6 characters.');
      return;
    }

    setSaving(true);
    try {
      const url = isNew ? '/api/admin/users' : `/api/admin/users/${editingUser.id}`;
      const method = isNew ? 'POST' : 'PUT';
      const body = {
        name: editingUser.name.trim(),
        email: editingUser.email.trim(),
        role: editingUser.role,
        status: editingUser.status,
      };
      if (editingUser.password) {
        body.password = editingUser.password;
      }

      await requestJson(url, { method, body });
      setToast(`Administrator account ${isNew ? 'created' : 'updated'} successfully.`);
      setEditingUser(null);
      await loadUsers();
    } catch (err) {
      setToast(`Error saving administrator: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u) => {
    if (u.email?.toLowerCase() === 'yourssanjay63@gmail.com') {
      alert('The primary Super Administrator account cannot be deleted.');
      return;
    }
    if (!window.confirm(`Permanently remove administrator account for "${u.name}" (${u.email})? They will immediately lose admin portal access.`)) {
      return;
    }
    try {
      await requestJson(`/api/admin/users/${u.id}`, { method: 'DELETE' });
      setToast('Administrator account removed.');
      loadUsers();
    } catch (err) {
      setToast(`Error deleting user: ${err.message}`);
    }
  };

  return (
    <>
      <SectionIntro
        eyebrow="SECURITY / ACCESS"
        title="Users & Role Management"
        description="Manage authorized dealership personnel, staff roles (Super Admin, Editor, Support), and active portal accounts."
        action={
          <button
            className="admin-button admin-button--primary"
            type="button"
            onClick={handleOpenAdd}
          >
            ADD USER <span>＋</span>
          </button>
        }
      />

      <StatusToast message={toast} onClose={() => setToast('')} />

      <section className="admin-panel admin-table-panel">
        <div className="admin-panel__heading">
          <div><span className="admin-eyebrow">PORTAL ACCESS</span><h3>Authorized Accounts</h3></div>
          <span className="admin-panel__hint">{users.length} {users.length === 1 ? 'account' : 'accounts'}</span>
        </div>

        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Administrator</th>
                <th>Email Address</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isPrimary = u.email?.toLowerCase() === 'yourssanjay63@gmail.com';
                const isSuspended = u.status?.toLowerCase() === 'suspended';
                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: isPrimary ? '#0879D1' : '#0F172A',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '700',
                          fontSize: '13px',
                          flexShrink: 0,
                        }}>
                          {(u.name || 'A').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong>{u.name}</strong>
                          {isPrimary && (
                            <span style={{ marginLeft: '6px', fontSize: '10px', background: 'rgba(8, 121, 209, 0.15)', color: '#0879D1', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                              PRIMARY SUPER ADMIN
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td><code>{u.email}</code></td>
                    <td>
                      <span className="admin-status-tag" style={{
                        background: u.role === 'Super Admin' ? '#0F172A' : u.role === 'Admin' ? '#E0F2FE' : '#F1F5F9',
                        color: u.role === 'Super Admin' ? '#38BDF8' : u.role === 'Admin' ? '#0369A1' : '#334155',
                        border: u.role === 'Super Admin' ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                        fontWeight: '600',
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-status-tag ${isSuspended ? 'is-rejected' : 'is-published'}`}>
                        {isSuspended ? '● Suspended' : '● Active'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" className="admin-text-button" onClick={() => handleOpenEdit(u)}>
                          EDIT
                        </button>
                        {!isPrimary ? (
                          <button type="button" className="admin-text-button admin-text-button--danger" onClick={() => handleDelete(u)}>
                            DELETE
                          </button>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', padding: '4px 6px' }}>Locked</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan="5" className="admin-table__empty">No administrator accounts found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {editingUser && (
        <div className="admin-modal" role="dialog" aria-modal="true">
          <div className="admin-modal__card" style={{ maxWidth: 500 }}>
            <div className="admin-modal__heading">
              <div>
                <span className="admin-eyebrow">PORTAL ACCESS</span>
                <h3>{editingUser.id ? `Edit Administrator: ${editingUser.name || 'User'}` : 'Add New Administrator'}</h3>
              </div>
              <button type="button" className="admin-modal__close" onClick={() => setEditingUser(null)} disabled={saving}>✕</button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
              <label className="admin-demo-field">
                <span>Full Name *</span>
                <input
                  required
                  placeholder="e.g. Sanjay, Rajesh Kumar"
                  value={editingUser.name || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  disabled={saving}
                />
              </label>

              <label className="admin-demo-field">
                <span>Email Address *</span>
                <input
                  required
                  type="email"
                  placeholder="admin@dealership.com"
                  value={editingUser.email || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  disabled={saving}
                />
              </label>

              <label className="admin-demo-field">
                <span>
                  {editingUser.id ? 'Change Password (optional)' : 'Login Password *'}
                </span>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    required={!editingUser.id}
                    type={showPassword ? 'text' : 'password'}
                    placeholder={editingUser.id ? 'Leave blank to keep existing password' : 'At least 6 characters (e.g. admin123#)'}
                    value={editingUser.password || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                    disabled={saving}
                    style={{ width: '100%', paddingRight: '48px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      background: 'none',
                      border: 'none',
                      color: '#0879D1',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: '700',
                    }}
                    tabIndex={-1}
                  >
                    {showPassword ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
                <small style={{ color: '#64748b', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                  {editingUser.id
                    ? 'Only fill this if you want to change this administrator’s password.'
                    : 'The user will use this email & password to sign in to /admin.'}
                </small>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label className="admin-demo-field">
                  <span>Portal Role</span>
                  <select
                    value={editingUser.role || 'Admin'}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    disabled={saving}
                  >
                    <option value="Super Admin">Super Admin</option>
                    <option value="Admin">Admin</option>
                    <option value="Editor">Editor</option>
                    <option value="Support">Support</option>
                  </select>
                </label>
                <label className="admin-demo-field">
                  <span>Account Status</span>
                  <select
                    value={editingUser.status || 'Active'}
                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                    disabled={saving}
                  >
                    <option value="Active">Active (Permit Login)</option>
                    <option value="Suspended">Suspended (Block Login)</option>
                  </select>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button type="button" className="admin-button" onClick={() => setEditingUser(null)} disabled={saving}>CANCEL</button>
                <button type="submit" className="admin-button admin-button--primary" disabled={saving}>
                  {saving ? 'SAVING…' : editingUser.id ? 'UPDATE ADMINISTRATOR' : 'CREATE ADMINISTRATOR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// -------------------------------------------------------------
// 15. ACTIVITY LOGS (/admin/activity)
// -------------------------------------------------------------
export function ActivityLogs() {
  const [activities, setActivities] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await requestJson('/api/admin/activity');
      if (res?.activities) setActivities(res.activities);
    } catch (err) {
      setToast(`Failed to load activity logs: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLogs(); }, []);

  const filteredLogs = useMemo(() => {
    if (!search.trim()) return activities;
    const q = search.trim().toLowerCase();
    return activities.filter((act) =>
      (act.action || '').toLowerCase().includes(q) ||
      (act.target || '').toLowerCase().includes(q) ||
      (act.user?.name || act.user || '').toLowerCase().includes(q) ||
      JSON.stringify(act.details || '').toLowerCase().includes(q)
    );
  }, [activities, search]);

  const clearLogs = async () => {
    if (!window.confirm('Clear all audit logs?')) return;
    try {
      await requestJson('/api/admin/activity', { method: 'DELETE' });
      setToast('Audit logs cleared.');
      loadLogs();
    } catch (err) {
      setToast(`Error clearing logs: ${err.message}`);
    }
  };

  return (
    <>
      <SectionIntro
        eyebrow="AUDIT / COMPLIANCE"
        title="Admin Activity Logs"
        description="Persistent audit trail of all administrative actions, catalog updates, booking status changes, and file uploads."
        action={
          <button className="admin-button" type="button" onClick={clearLogs} disabled={activities.length === 0}>
            CLEAR LOGS
          </button>
        }
      />

      <StatusToast message={toast} onClose={() => setToast('')} />

      <section className="admin-panel admin-table-panel">
        <div className="admin-panel__heading">
          <div><span className="admin-eyebrow">AUDIT TRAIL</span><h3>Recorded Admin Actions</h3></div>
          <span className="admin-panel__hint">{filteredLogs.length} events</span>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label className="admin-search" style={{ width: '100%' }}>
            <span className="sr-only">Search logs</span>
            <input placeholder="Filter by action, user, or target..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
        </div>

        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Administrator</th>
                <th>Action</th>
                <th>Target</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((act) => (
                <tr key={act.id}>
                  <td><small>{act.timestamp ? new Date(act.timestamp).toLocaleString() : '—'}</small></td>
                  <td><strong>{act.user?.name || act.user || 'Administrator'}</strong></td>
                  <td>
                    <span className="admin-status-tag" style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 600 }}>
                      {act.action}
                    </span>
                  </td>
                  <td><code>{act.target}</code></td>
                  <td style={{ maxWidth: 300, fontSize: '12px', color: '#475569' }}>
                    {typeof act.details === 'object' ? JSON.stringify(act.details) : act.details}
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr><td colSpan="5" className="admin-table__empty">No activity logs recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

// -------------------------------------------------------------
// 16. SITE SETTINGS (/admin/settings)
// -------------------------------------------------------------
export function SiteSettings() {
  const [settings, setSettings] = useState({
    ...defaultBusinessSettings,
    hours: defaultBusinessSettings.operatingHours,
    bookingSlots: '10:00 AM, 12:00 PM, 2:00 PM, 4:00 PM, 6:00 PM',
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await requestJson('/api/admin/settings');
      if (res?.settings) {
        const saved = res.settings;
        setSettings({
          ...defaultBusinessSettings,
          ...saved,
          dealershipName: saved.dealershipName || saved.showroomName || defaultBusinessSettings.dealershipName,
          hours: saved.operatingHours || saved.hours || '',
          bookingSlots: saved.bookingSlots || '10:00 AM, 12:00 PM, 2:00 PM, 4:00 PM, 6:00 PM',
        });
      }
    } catch (err) {
      setToast(`Failed to load settings: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSettings(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await requestJson('/api/admin/settings', {
        method: 'PUT',
        body: {
          ...settings,
          whatsappVerified: Boolean(settings.whatsapp?.trim() && settings.whatsappVerified),
          operatingHours: settings.hours.trim(),
        },
      });
      setToast('Dealership contact settings saved to database and live on public site.');
    } catch (err) {
      setToast(`Error saving settings: ${err.message}`);
    }
  };

  return (
    <>
      <SectionIntro
        eyebrow="CONFIGURATION / DEALERSHIP"
        title="Dealership Contact & Showroom Settings"
        description="Manage the business details displayed across the public website. WhatsApp actions and Google rating are shown only when their verification controls are enabled."
      />

      <StatusToast message={toast} onClose={() => setToast('')} />

      <section className="admin-panel">
        <div className="admin-panel__heading">
          <div><span className="admin-eyebrow">DEALERSHIP DETAILS</span><h3>Official Information</h3></div>
        </div>

        <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
          <label className="admin-demo-field admin-demo-field--wide" style={{ gridColumn: '1 / -1' }}>
            <span>Business Name *</span>
            <input required value={settings.dealershipName || ''} onChange={(e) => setSettings({ ...settings, dealershipName: e.target.value })} />
          </label>
          <label className="admin-demo-field">
            <span>Official Phone Line *</span>
            <input required value={settings.phone || ''} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} />
          </label>
          <label className="admin-demo-field">
            <span>WhatsApp Number (optional)</span>
            <input type="tel" placeholder="Include country code, e.g. +91…" value={settings.whatsapp || ''} onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })} />
            <span>
              <input
                type="checkbox"
                checked={Boolean(settings.whatsappVerified && settings.whatsapp)}
                onChange={(e) => setSettings({ ...settings, whatsappVerified: e.target.checked })}
              /> Verified WhatsApp number
            </span>
          </label>
          <label className="admin-demo-field">
            <span>Business Email (optional)</span>
            <input type="email" value={settings.email || ''} onChange={(e) => setSettings({ ...settings, email: e.target.value })} />
          </label>
          <label className="admin-demo-field">
            <span>Instagram Profile URL *</span>
            <input required type="url" value={settings.instagramUrl || ''} onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })} />
          </label>
          <label className="admin-demo-field">
            <span>Business Category *</span>
            <input required value={settings.businessCategory || ''} onChange={(e) => setSettings({ ...settings, businessCategory: e.target.value })} />
          </label>
          <label className="admin-demo-field">
            <span>City / District *</span>
            <input required value={settings.locality || ''} onChange={(e) => setSettings({ ...settings, locality: e.target.value })} />
          </label>
          <label className="admin-demo-field">
            <span>State / Postal Code *</span>
            <input required value={settings.postalCode || ''} onChange={(e) => setSettings({ ...settings, postalCode: e.target.value })} />
          </label>
          <label className="admin-demo-field">
            <span>Showroom Hours (optional)</span>
            <input value={settings.hours || ''} onChange={(e) => setSettings({ ...settings, hours: e.target.value })} />
          </label>
          <label className="admin-demo-field admin-demo-field--wide" style={{ gridColumn: '1 / -1' }}>
            <span>Brand Description *</span>
            <textarea required rows="2" value={settings.brandDescription || ''} onChange={(e) => setSettings({ ...settings, brandDescription: e.target.value })} />
          </label>
          <label className="admin-demo-field admin-demo-field--wide" style={{ gridColumn: '1 / -1' }}>
            <span>Physical Address *</span>
            <textarea required rows="2" value={settings.address || ''} onChange={(e) => setSettings({ ...settings, address: e.target.value })} />
          </label>
          <label className="admin-demo-field">
            <span>Google Rating (1–5)</span>
            <input type="number" min="1" max="5" step="0.1" value={settings.googleRating ?? ''} onChange={(e) => setSettings({ ...settings, googleRating: e.target.value })} />
          </label>
          <label className="admin-demo-field">
            <span>Google Review Count</span>
            <input type="number" min="0" step="1" value={settings.googleReviewCount ?? ''} onChange={(e) => setSettings({ ...settings, googleReviewCount: e.target.value })} />
            <span>
              <input
                type="checkbox"
                checked={Boolean(settings.googleRatingVerified)}
                onChange={(e) => setSettings({ ...settings, googleRatingVerified: e.target.checked })}
              /> Verified on Google Business Profile
            </span>
          </label>
          <label className="admin-demo-field admin-demo-field--wide" style={{ gridColumn: '1 / -1' }}>
            <span>Test Ride Time Slots (comma-separated)</span>
            <input value={settings.bookingSlots || ''} onChange={(e) => setSettings({ ...settings, bookingSlots: e.target.value })} />
          </label>
          <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
            <button type="submit" className="admin-button admin-button--primary">SAVE DEALERSHIP SETTINGS</button>
          </div>
        </form>
      </section>
    </>
  );
}

// -------------------------------------------------------------
// 17. SERVICE VIDEOS MANAGEMENT (/admin/service-videos)
// -------------------------------------------------------------
export function ServiceVideosManagement({ videos = [], query = '', onReload }) {
  const [editingVideo, setEditingVideo] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!selectedVideo) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setSelectedVideo(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedVideo]);

  const filteredVideos = useMemo(() => {
    const q = query.trim().toLowerCase();
    return videos.filter((v) =>
      !q ||
      (v.title || v.filename || '').toLowerCase().includes(q) ||
      (v.path || '').toLowerCase().includes(q) ||
      (v.category || '').toLowerCase().includes(q)
    );
  }, [videos, query]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const isNew = !editingVideo.id;
      const url = isNew ? '/api/admin/service-videos' : `/api/admin/service-videos/${editingVideo.id}`;
      const method = isNew ? 'POST' : 'PUT';
      const payload = {
        ...editingVideo,
        mediaUrl: editingVideo.path || editingVideo.mediaUrl,
        path: editingVideo.path || editingVideo.mediaUrl,
        thumbnailUrl: editingVideo.thumbnailUrl || '/imgs/archive/f1.webp',
        status: editingVideo.status || 'published',
      };
      await requestJson(url, { method, body: payload });
      setToast(`Service video ${isNew ? 'added' : 'updated'}.`);
      setEditingVideo(null);
      if (onReload) onReload();
    } catch (err) {
      setToast(`Error saving video: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this service video from catalog?')) return;
    try {
      await requestJson(`/api/admin/service-videos/${id}`, { method: 'DELETE' });
      setToast('Video deleted.');
      if (onReload) onReload();
    } catch (err) {
      setToast(`Error deleting video: ${err.message}`);
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const uploaded = await uploadMediaBinary(file);
      setEditingVideo((prev) => ({
        ...prev,
        path: uploaded.url,
        title: prev?.title || file.name.replace(/\.[^/.]+$/, ''),
        filename: file.name,
      }));
      setToast(`Uploaded video: ${file.name}`);
    } catch (err) {
      setToast(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <SectionIntro
        eyebrow="SERVICES / WORKSHOP"
        title="Service & Maintenance Videos"
        description="Manage high-definition maintenance tutorials, periodic service walkthroughs, and genuine parts explanations shown on the public Services page."
        action={
          <button
            className="admin-button admin-button--primary"
            type="button"
            onClick={() => setEditingVideo({
              title: '',
              path: '',
              order: videos.length + 1,
              category: 'Maintenance',
              duration: '3:45',
              description: '',
            })}
          >
            ADD SERVICE VIDEO <span>＋</span>
          </button>
        }
      />

      <StatusToast message={toast} onClose={() => setToast('')} />

      <section className="admin-video-grid" aria-label="Service video records">
        {filteredVideos.map((video) => (
          <article className="admin-video-card" key={video.id || video.filename}>
            <div className="admin-video-card__preview" style={{ position: 'relative' }}>
              <video src={video.mediaUrl || video.path} controls muted playsInline preload="metadata" />
              <span className="admin-video-order">{String(video.order || 1).padStart(2, '0')}</span>
            </div>
            <div className="admin-video-card__details">
              <div>
                <strong>{video.title || video.filename}</strong>
                <span>{video.duration || 'Video'}</span>
              </div>
              <code>{video.path}</code>
              <div className="admin-video-card__actions">
                <button type="button" className="admin-button admin-button--secondary admin-button--sm" onClick={() => setSelectedVideo(video)} aria-label={`View ${video.title || video.filename || 'service video'}`}>
                  View
                </button>
                <button type="button" className="admin-text-button" onClick={() => setEditingVideo({ ...video })}>EDIT</button>
                <button type="button" className="admin-text-button admin-text-button--danger" onClick={() => handleDelete(video.id)}>DELETE</button>
              </div>
            </div>
          </article>
        ))}
        {filteredVideos.length === 0 && (
          <p className="admin-panel admin-video-empty">No service videos found matching search.</p>
        )}
      </section>

      {selectedVideo && (
        <div
          className="admin-modal"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedVideo(null);
          }}
        >
          <section
            className="admin-modal__card admin-video-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="video-details-title"
          >
            <div className="admin-modal__heading">
              <div>
                <span className="admin-eyebrow">SERVICE VIDEO</span>
                <h3 id="video-details-title">{selectedVideo.title || selectedVideo.filename || 'Video details'}</h3>
              </div>
              <button
                type="button"
                className="admin-modal__close"
                onClick={() => setSelectedVideo(null)}
                aria-label="Close video details"
                autoFocus
              >
                ✕
              </button>
            </div>
            <iframe
              className="admin-video-details-frame"
              title={`Service video details for ${selectedVideo.title || selectedVideo.filename || 'video'}`}
              sandbox=""
              srcDoc={createVideoDetailsDocument(selectedVideo)}
            />
          </section>
        </div>
      )}

      {editingVideo && (
        <div className="admin-modal" role="dialog" aria-modal="true">
          <div className="admin-modal__card" style={{ maxWidth: 540 }}>
            <div className="admin-modal__heading">
              <div><span className="admin-eyebrow">VIDEO RECORD</span><h3>{editingVideo.id ? 'Edit Service Video' : 'Add New Service Video'}</h3></div>
              <button type="button" className="admin-modal__close" onClick={() => setEditingVideo(null)}>✕</button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
              <label className="admin-demo-field">
                <span>Video Title *</span>
                <input required value={editingVideo.title || ''} onChange={(e) => setEditingVideo({ ...editingVideo, title: e.target.value })} placeholder="e.g. Periodic Maintenance & Oil Change" />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label className="admin-demo-field">
                  <span>Category</span>
                  <select value={editingVideo.category || 'Maintenance'} onChange={(e) => setEditingVideo({ ...editingVideo, category: e.target.value })}>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Periodic Service">Periodic Service</option>
                    <option value="Engine Care">Engine Care</option>
                    <option value="Braking Systems">Braking Systems</option>
                  </select>
                </label>
                <label className="admin-demo-field">
                  <span>Display Order</span>
                  <input type="number" min="1" value={editingVideo.order || 1} onChange={(e) => setEditingVideo({ ...editingVideo, order: Number(e.target.value) })} />
                </label>
              </div>
              <div className="admin-catalogue-section">
                <span className="admin-eyebrow">VIDEO PATH OR UPLOAD *</span>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <input required style={{ flex: 1 }} value={editingVideo.path || ''} onChange={(e) => setEditingVideo({ ...editingVideo, path: e.target.value })} placeholder="/videos/... or https://..." />
                  <label className="admin-button" style={{ cursor: 'pointer', padding: '8px 14px', fontSize: '12px' }}>
                    {uploading ? 'UPLOADING…' : 'UPLOAD'}
                    <input type="file" accept="video/*" style={{ display: 'none' }} disabled={uploading} onChange={handleVideoUpload} />
                  </label>
                </div>
              </div>
              <label className="admin-demo-field">
                <span>Description</span>
                <textarea rows="3" value={editingVideo.description || ''} onChange={(e) => setEditingVideo({ ...editingVideo, description: e.target.value })} placeholder="Walkthrough summary..." />
              </label>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button type="button" className="admin-button" onClick={() => setEditingVideo(null)}>CANCEL</button>
                <button type="submit" className="admin-button admin-button--primary">SAVE VIDEO</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
