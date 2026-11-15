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
          const isConfigured = Boolean(p.url && p.url.trim() && p.url !== '#');
          return (
            <a
              href="/admin/social"
              onClick={onNavigate}
              className="admin-social-platform"
              key={p.platform || p.id}
              title={isConfigured ? `${p.name}: ${p.url}` : `${p.name}: Click to configure`}
            >
              <span className="admin-social-platform__mark" aria-hidden="true">
                {(p.platform || p.name || 'SO').slice(0, 2).toUpperCase()}
              </span>
              <span>
                <strong>{p.name}</strong>
                <small style={{ color: isConfigured ? '#10b981' : '#94a3b8' }}>
                  {isConfigured ? 'Connected' : 'Click to add URL'}
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
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(null);
  const [toast, setToast] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [profilesRes, postsRes] = await Promise.all([
        requestJson('/api/admin/social/profiles'),
        requestJson('/api/admin/social/posts'),
      ]);
      if (profilesRes?.profiles) setProfiles(profilesRes.profiles);
      if (postsRes?.posts) setPosts(postsRes.posts);
    } catch (e) {
      setToast(`Failed to load social data: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const updated = profiles.map((p) => (p.platform === editingProfile.platform ? editingProfile : p));
      await requestJson('/api/admin/social/profiles', { method: 'PUT', body: { profiles: updated } });
      setProfiles(updated);
      setEditingProfile(null);
      setToast('Social profile updated successfully in database.');
    } catch (err) {
      setToast(`Error saving profile: ${err.message}`);
    }
  };

  const statusCounts = useMemo(() => {
    const counts = { total: posts.length, draft: 0, scheduled: 0, published: 0, failed: 0 };
    posts.forEach((p) => {
      const s = (p.status || 'draft').toLowerCase();
      if (counts[s] !== undefined) counts[s]++;
    });
    return counts;
  }, [posts]);

  return (
    <>
      <SectionIntro
        eyebrow="CHANNELS / OVERVIEW"
        title="Social media operations"
        description="Monitor channel profiles, publishing schedules, and campaign posts. Changes sync to the database and public site."
        action={<a className="admin-button admin-button--primary" href="/admin/social/posts" onClick={onNavigate}>CREATE & MANAGE POSTS <span>↗</span></a>}
      />

      <StatusToast message={toast} onClose={() => setToast('')} />

      <section className="admin-metrics admin-metrics--social" aria-label="Social media post totals">
        <article className="admin-metric">
          <span>TOTAL POSTS</span>
          <strong>{statusCounts.total}</strong>
          <small>In database storage</small>
        </article>
        <article className="admin-metric">
          <span>PUBLISHED</span>
          <strong style={{ color: '#10b981' }}>{statusCounts.published}</strong>
          <small>Live on channels</small>
        </article>
        <article className="admin-metric">
          <span>SCHEDULED</span>
          <strong style={{ color: '#0284c7' }}>{statusCounts.scheduled}</strong>
          <small>Upcoming campaigns</small>
        </article>
        <article className="admin-metric">
          <span>DRAFTS</span>
          <strong>{statusCounts.draft}</strong>
          <small>In editorial prep</small>
        </article>
      </section>

      <section className="admin-panel admin-social-panel">
        <div className="admin-panel__heading">
          <div><span className="admin-eyebrow">CHANNELS</span><h3>Platform Profiles</h3></div>
          <span className="admin-panel__hint">{profiles.length} platforms registered</span>
        </div>
        <div className="admin-social-platforms">
          {profiles.map((p) => (
            <article className="admin-social-platform-card" key={p.platform || p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span className="admin-social-platform__mark" aria-hidden="true" style={{ fontSize: '14px', fontWeight: 700, background: '#0f172a', color: '#fff', padding: '8px 12px', borderRadius: '6px' }}>
                  {(p.platform || p.name).slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <strong style={{ fontSize: '15px', color: '#0f172a' }}>{p.name}</strong>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    {p.url && p.url !== '#' ? <a href={p.url} target="_blank" rel="noreferrer" style={{ color: '#0284c7' }}>{p.url}</a> : 'No URL configured'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className={`admin-status-tag ${p.url && p.url !== '#' ? 'is-published' : ''}`}>
                  {p.url && p.url !== '#' ? 'CONNECTED' : 'DISCONNECTED'}
                </span>
                <button type="button" className="admin-button" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => setEditingProfile({ ...p })}>
                  EDIT URL
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {editingProfile && (
        <div className="admin-modal" role="dialog" aria-modal="true">
          <div className="admin-modal__card" style={{ maxWidth: 500 }}>
            <div className="admin-modal__heading">
              <div><span className="admin-eyebrow">UPDATE CHANNEL</span><h3>Configure {editingProfile.name}</h3></div>
              <button type="button" className="admin-modal__close" onClick={() => setEditingProfile(null)}>✕</button>
            </div>
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
              <label className="admin-demo-field">
                <span>Profile / Page URL *</span>
                <input required type="url" value={editingProfile.url || ''} onChange={(e) => setEditingProfile({ ...editingProfile, url: e.target.value })} placeholder="https://..." />
              </label>
              <label className="admin-demo-field">
                <span>Display Handle</span>
                <input value={editingProfile.handle || ''} onChange={(e) => setEditingProfile({ ...editingProfile, handle: e.target.value })} placeholder="@vathilaimotors" />
              </label>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button type="button" className="admin-button" onClick={() => setEditingProfile(null)}>CANCEL</button>
                <button type="submit" className="admin-button admin-button--primary">SAVE URL</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// -------------------------------------------------------------
// 3. SOCIAL POSTS (/admin/social/posts)
// -------------------------------------------------------------
export function SocialPosts({ selectedPlatform, onSelectPlatform }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState('');

  const platforms = [
    { id: 'all', name: 'All platforms', mark: 'ALL' },
    { id: 'instagram', name: 'Instagram', mark: 'IG' },
    { id: 'facebook', name: 'Facebook', mark: 'FB' },
    { id: 'youtube', name: 'YouTube', mark: 'YT' },
    { id: 'x', name: 'X', mark: 'X' },
    { id: 'linkedin', name: 'LinkedIn', mark: 'in' },
  ];

  const loadPosts = async () => {
    try {
      setLoading(true);
      const res = await requestJson('/api/admin/social/posts');
      if (res?.posts) setPosts(res.posts);
    } catch (err) {
      setToast(`Failed to load posts: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPosts(); }, []);

  const filteredPosts = useMemo(() => {
    if (!selectedPlatform || selectedPlatform === 'all') return posts;
    return posts.filter((p) => (p.platform || '').toLowerCase() === selectedPlatform.toLowerCase());
  }, [posts, selectedPlatform]);

  const handleSavePost = async (e) => {
    e.preventDefault();
    try {
      const isNew = !editingPost.id;
      const url = isNew ? '/api/admin/social/posts' : `/api/admin/social/posts/${editingPost.id}`;
      const method = isNew ? 'POST' : 'PUT';
      const res = await requestJson(url, { method, body: editingPost });
      setToast(`Post ${isNew ? 'created' : 'updated'} successfully in database.`);
      setEditingPost(null);
      loadPosts();
    } catch (err) {
      setToast(`Error saving post: ${err.message}`);
    }
  };

  const handleDeletePost = async (id) => {
    if (!window.confirm('Are you sure you want to delete this social post?')) return;
    try {
      await requestJson(`/api/admin/social/posts/${id}`, { method: 'DELETE' });
      setToast('Post deleted from database.');
      loadPosts();
    } catch (err) {
      setToast(`Error deleting post: ${err.message}`);
    }
  };

  const handleMediaUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const uploaded = await uploadMediaBinary(file);
      setEditingPost((prev) => ({ ...prev, mediaUrl: uploaded.url }));
      setToast(`Uploaded ${file.name}`);
    } catch (err) {
      setToast(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <SectionIntro
        eyebrow="SOCIAL / CONTENT"
        title="Social post manager"
        description="Create, schedule, and review social marketing posts across Instagram, Facebook, YouTube, X, and LinkedIn."
        action={
          <button
            className="admin-button admin-button--primary"
            type="button"
            onClick={() => setEditingPost({
              platform: selectedPlatform && selectedPlatform !== 'all' ? selectedPlatform : 'instagram',
              title: '',
              caption: '',
              mediaUrl: '',
              status: 'draft',
              scheduledDate: new Date().toISOString().slice(0, 16),
            })}
          >
            CREATE POST <span>＋</span>
          </button>
        }
      />

      <StatusToast message={toast} onClose={() => setToast('')} />

      <section className="admin-panel admin-social-panel">
        <div className="admin-panel__heading">
          <div><span className="admin-eyebrow">CHANNEL FILTER</span><h3>Choose a platform</h3></div>
          <span className="admin-panel__hint">{filteredPosts.length} posts listed</span>
        </div>
        <div className="admin-platform-filter" role="group" aria-label="Filter social posts by platform">
          {platforms.map((platform) => (
            <button
              type="button"
              className={`admin-platform-filter__button${selectedPlatform === platform.id ? ' is-active' : ''}`}
              aria-pressed={selectedPlatform === platform.id}
              key={platform.id}
              onClick={() => onSelectPlatform(platform.id)}
            >
              <span aria-hidden="true">{platform.mark}</span>{platform.name}
            </button>
          ))}
        </div>

        <div className="admin-table-scroll" style={{ marginTop: '20px' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Platform</th>
                <th>Post Title & Caption</th>
                <th>Media Preview</th>
                <th>Scheduled / Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.map((post) => (
                <tr key={post.id}>
                  <td>
                    <span className="admin-status-tag" style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 700 }}>
                      {(post.platform || 'General').toUpperCase()}
                    </span>
                  </td>
                  <td style={{ maxWidth: 300 }}>
                    <strong>{post.title}</strong>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {post.caption}
                    </p>
                  </td>
                  <td>
                    {post.mediaUrl ? (
                      <img src={post.mediaUrl} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4, border: '1px solid #cbd5e1' }} />
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '12px' }}>No media</span>
                    )}
                  </td>
                  <td>
                    <small>{post.scheduledDate ? new Date(post.scheduledDate).toLocaleString() : 'Immediate'}</small>
                  </td>
                  <td>
                    <span className={`admin-status-tag ${post.status === 'published' ? 'is-published' : ''}`}>
                      {(post.status || 'draft').toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button type="button" className="admin-text-button" onClick={() => setEditingPost({ ...post })}>EDIT</button>
                      <button type="button" className="admin-text-button admin-text-button--danger" onClick={() => handleDeletePost(post.id)}>DELETE</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPosts.length === 0 && (
                <tr><td colSpan="6" className="admin-table__empty">No posts found for this platform. Click "CREATE POST" to add one.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {editingPost && (
        <div className="admin-modal" role="dialog" aria-modal="true">
          <div className="admin-modal__card" style={{ maxWidth: 600 }}>
            <div className="admin-modal__heading">
              <div><span className="admin-eyebrow">POST EDITOR</span><h3>{editingPost.id ? 'Edit Social Post' : 'Create New Post'}</h3></div>
              <button type="button" className="admin-modal__close" onClick={() => setEditingPost(null)}>✕</button>
            </div>
            <form onSubmit={handleSavePost} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label className="admin-demo-field">
                  <span>Platform *</span>
                  <select value={editingPost.platform || 'instagram'} onChange={(e) => setEditingPost({ ...editingPost, platform: e.target.value })}>
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="youtube">YouTube</option>
                    <option value="x">X / Twitter</option>
                    <option value="linkedin">LinkedIn</option>
                  </select>
                </label>
                <label className="admin-demo-field">
                  <span>Publish Status *</span>
                  <select value={editingPost.status || 'draft'} onChange={(e) => setEditingPost({ ...editingPost, status: e.target.value })}>
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="published">Published</option>
                    <option value="failed">Failed</option>
                  </select>
                </label>
              </div>
              <label className="admin-demo-field">
                <span>Post Title / Headline *</span>
                <input required value={editingPost.title || ''} onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })} placeholder="e.g. Pure Racing DNA — Yamaha R15M Delivery" />
              </label>
              <label className="admin-demo-field">
                <span>Caption / Text Content *</span>
                <textarea required rows="4" value={editingPost.caption || ''} onChange={(e) => setEditingPost({ ...editingPost, caption: e.target.value })} placeholder="Write your post caption, tags and hashtags here..." />
              </label>
              <label className="admin-demo-field">
                <span>Scheduled Date & Time</span>
                <input type="datetime-local" value={editingPost.scheduledDate ? editingPost.scheduledDate.slice(0, 16) : ''} onChange={(e) => setEditingPost({ ...editingPost, scheduledDate: e.target.value })} />
              </label>
              <div className="admin-catalogue-section">
                <span className="admin-eyebrow">POST MEDIA (IMAGE / VIDEO)</span>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '6px' }}>
                  <input style={{ flex: 1 }} value={editingPost.mediaUrl || ''} onChange={(e) => setEditingPost({ ...editingPost, mediaUrl: e.target.value })} placeholder="/imgs/uploads/... or external URL" />
                  <label className="admin-button" style={{ cursor: 'pointer', padding: '8px 14px', fontSize: '12px' }}>
                    {uploading ? 'UPLOADING…' : 'UPLOAD FILE'}
                    <input type="file" accept="image/*,video/*" style={{ display: 'none' }} disabled={uploading} onChange={handleMediaUpload} />
                  </label>
                </div>
                {editingPost.mediaUrl && (
                  <div style={{ marginTop: '10px' }}>
                    <img src={editingPost.mediaUrl} alt="" style={{ maxHeight: 120, borderRadius: 6, border: '1px solid #e2e8f0' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button type="button" className="admin-button" onClick={() => setEditingPost(null)}>CANCEL</button>
                <button type="submit" className="admin-button admin-button--primary">SAVE TO DATABASE</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// -------------------------------------------------------------
// 4. CONTACT & ENQUIRIES (/admin/enquiries)
// -------------------------------------------------------------
export function ContactEnquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
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

  const loadEnquiries = async () => {
    try {
      setLoading(true);
      const res = await requestJson('/api/admin/enquiries');
      if (res?.enquiries) setEnquiries(res.enquiries);
    } catch (err) {
      setToast(`Failed to load enquiries: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEnquiries(); }, []);

  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((item) => {
      const matchStatus = statusFilter === 'all' || item.status === statusFilter;
      const q = search.trim().toLowerCase();
      const matchSearch = !q ||
        (item.reference || '').toLowerCase().includes(q) ||
        (item.customer?.name || item.name || '').toLowerCase().includes(q) ||
        (item.customer?.email || item.email || '').toLowerCase().includes(q) ||
        (item.customer?.phone || item.phone || '').toLowerCase().includes(q) ||
        (item.motorcycle?.model || item.model || '').toLowerCase().includes(q) ||
        (item.message || '').toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [enquiries, search, statusFilter]);

  const updateStatus = async (ref, newStatus) => {
    try {
      await requestJson(`/api/admin/enquiries/${encodeURIComponent(ref)}/status`, {
        method: 'PUT',
        body: { status: newStatus },
      });
      setToast(`Enquiry ${ref} updated to ${newStatus}`);
      setEnquiries((prev) => prev.map((e) => (e.reference === ref ? { ...e, status: newStatus } : e)));
      if (selectedEnquiry && selectedEnquiry.reference === ref) {
        setSelectedEnquiry((prev) => ({ ...prev, status: newStatus }));
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
      setEnquiries((prev) => prev.map((e) => (e.reference === ref ? { ...e, notes: notesDraft } : e)));
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
        { label: 'Reference', key: 'reference' },
        { label: 'Name', getter: (r) => r.customer?.name || r.name || '' },
        { label: 'Phone', getter: (r) => r.customer?.phone || r.phone || '' },
        { label: 'Email', getter: (r) => r.customer?.email || r.email || '' },
        { label: 'Model', getter: (r) => r.motorcycle?.model || r.model || '' },
        { label: 'City', getter: (r) => r.customer?.city || r.city || '' },
        { label: 'Status', key: 'status' },
        { label: 'Date', key: 'createdAt' },
        { label: 'Message', key: 'message' },
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

        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <label className="admin-search" style={{ flex: 1, minWidth: 240 }}>
            <span className="sr-only">Search enquiries</span>
            <input
              placeholder="Search reference, customer name, phone, model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="follow-up">Follow-up</option>
            <option value="converted">Converted</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Customer</th>
                <th>Motorcycle</th>
                <th>City / Date</th>
                <th>Status</th>
                <th>Staff Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEnquiries.map((item) => {
                const ref = item.reference || item.id;
                const name = item.customer?.name || item.name || 'Anonymous';
                const phone = item.customer?.phone || item.phone || '';
                const email = item.customer?.email || item.email || '';
                const bike = item.motorcycle?.model || item.model || 'General Inquiry';
                const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—';
                const status = item.status || 'new';

                return (
                  <tr key={ref}>
                    <td><code>{ref}</code></td>
                    <td>
                      <strong>{name}</strong>
                      {phone && <small style={{ display: 'block' }}><a href={`tel:${phone}`}>{phone}</a></small>}
                      {email && <small style={{ display: 'block', color: '#64748b' }}>{email}</small>}
                    </td>
                    <td><strong>{bike}</strong></td>
                    <td>
                      <div>{item.customer?.city || item.city || 'Salem'}</div>
                      <small style={{ color: '#64748b' }}>{date}</small>
                    </td>
                    <td>
                      <select
                        className="admin-booking-status"
                        value={status}
                        onChange={(e) => updateStatus(ref, e.target.value)}
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="follow-up">Follow-up</option>
                        <option value="converted">Converted</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td style={{ maxWidth: 200, fontSize: '12px', color: '#475569' }}>
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
                <tr><td colSpan="7" className="admin-table__empty">No customer enquiries found matching criteria.</td></tr>
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
                <h3 id="enquiry-details-title">{selectedEnquiry.customer?.name || selectedEnquiry.name || selectedEnquiry.reference || 'Customer enquiry'}</h3>
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
              {(selectedEnquiry.customer?.phone || selectedEnquiry.phone) && (
                <>
                  <a
                    href={`tel:${selectedEnquiry.customer?.phone || selectedEnquiry.phone}`}
                    className="admin-button admin-button--primary admin-button--sm"
                  >
                    CALL
                  </a>
                  <a
                    href={`https://wa.me/91${(selectedEnquiry.customer?.phone || selectedEnquiry.phone).replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${selectedEnquiry.customer?.name || selectedEnquiry.name}, this is Vathilai Motors following up on your enquiry for ${selectedEnquiry.motorcycle?.model || selectedEnquiry.model || 'Yamaha motorcycle'}.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin-button admin-button--secondary admin-button--sm"
                  >
                    WHATSAPP
                  </a>
                </>
              )}
              {(selectedEnquiry.customer?.email || selectedEnquiry.email) && (
                <a
                  href={`mailto:${selectedEnquiry.customer?.email || selectedEnquiry.email}?subject=${encodeURIComponent(`Vathilai Motors — Enquiry for ${selectedEnquiry.motorcycle?.model || selectedEnquiry.model || 'Yamaha motorcycle'}`)}`}
                  className="admin-button admin-button--secondary admin-button--sm"
                >
                  EMAIL
                </a>
              )}
            </div>

            <iframe
              className="admin-enquiry-details-frame"
              title={`Enquiry details for ${selectedEnquiry.customer?.name || selectedEnquiry.name || 'customer'}`}
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
              <button
                type="button"
                className="admin-button admin-button--secondary admin-button--sm"
                onClick={() => saveNotes(selectedEnquiry.reference)}
              >
                SAVE STAFF NOTES
              </button>
            </div>

            <div className="admin-enquiry-modal-actions">
              <button type="button" className="admin-text-button admin-text-button--danger" onClick={() => deleteEnquiry(selectedEnquiry.reference)}>
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
// 6. GALLERY MANAGEMENT (/admin/gallery)
// -------------------------------------------------------------
export function GalleryManagement() {
  const [items, setItems] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedGalleryItem, setSelectedGalleryItem] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!selectedGalleryItem) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setSelectedGalleryItem(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedGalleryItem]);

  const loadGallery = async () => {
    try {
      setLoading(true);
      const res = await requestJson('/api/admin/gallery');
      if (res?.items) setItems(res.items);
    } catch (err) {
      setToast(`Failed to load gallery: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadGallery(); }, []);

  const filteredItems = useMemo(() => {
    if (categoryFilter === 'all') return items;
    return items.filter((item) => (item.category || '').toLowerCase() === categoryFilter.toLowerCase());
  }, [items, categoryFilter]);

  const handleSaveItem = async (e) => {
    e.preventDefault();
    try {
      const isNew = !editingItem.id;
      const url = isNew ? '/api/admin/gallery' : `/api/admin/gallery/${editingItem.id}`;
      const method = isNew ? 'POST' : 'PUT';
      await requestJson(url, { method, body: editingItem });
      setToast(`Gallery item ${isNew ? 'added' : 'updated'}.`);
      setEditingItem(null);
      loadGallery();
    } catch (err) {
      setToast(`Error saving gallery item: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this image from the gallery?')) return;
    try {
      await requestJson(`/api/admin/gallery/${id}`, { method: 'DELETE' });
      setToast('Gallery item removed.');
      loadGallery();
    } catch (err) {
      setToast(`Error deleting item: ${err.message}`);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const uploaded = await uploadMediaBinary(file);
      setEditingItem((prev) => ({
        ...prev,
        imageUrl: uploaded.url,
        title: prev?.title || file.name.replace(/\.[^/.]+$/, ''),
      }));
      setToast(`Uploaded ${file.name}`);
    } catch (err) {
      setToast(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <SectionIntro
        eyebrow="WEBSITE / ASSET LIBRARY"
        title="Gallery Management"
        description="Organize showroom photography, track events, and customer delivery moments stored in database."
        action={
          <button
            className="admin-button admin-button--primary"
            type="button"
            onClick={() => setEditingItem({
              title: '',
              category: 'Showroom',
              imageUrl: '',
              caption: '',
              featured: false,
            })}
          >
            ADD TO GALLERY <span>＋</span>
          </button>
        }
      />

      <StatusToast message={toast} onClose={() => setToast('')} />

      <section className="admin-panel admin-gallery-panel">
        <div className="admin-panel__heading">
          <div><span className="admin-eyebrow">GALLERY INVENTORY</span><h3>Image Assets</h3></div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['all', 'Showroom', 'Events', 'Deliveries', 'Service'].map((cat) => (
              <button
                key={cat}
                type="button"
                className={`admin-platform-filter__button ${categoryFilter === cat.toLowerCase() || (cat === 'all' && categoryFilter === 'all') ? 'is-active' : ''}`}
                onClick={() => setCategoryFilter(cat === 'all' ? 'all' : cat.toLowerCase())}
                style={{ padding: '4px 10px', fontSize: '12px' }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginTop: '16px' }}>
          {filteredItems.map((item) => (
            <article key={item.id} style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative', height: 160, background: '#0f172a' }}>
                <img src={item.imageUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.src = '/imgs/f1.png'; }} />
                <span className="admin-status-tag" style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.7)', color: '#fff' }}>
                  {item.category}
                </span>
                {item.featured && (
                  <span className="admin-status-tag is-published" style={{ position: 'absolute', top: 8, right: 8 }}>
                    FEATURED
                  </span>
                )}
              </div>
              <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <strong style={{ fontSize: '14px', display: 'block', color: '#0f172a' }}>{item.title}</strong>
                  {item.caption && <small style={{ color: '#64748b', display: 'block', marginTop: '4px' }}>{item.caption}</small>}
                </div>
                <div className="admin-gallery-card-actions">
                  <button type="button" className="admin-button admin-button--secondary admin-button--sm" onClick={() => setSelectedGalleryItem(item)} aria-label={`View ${item.title || 'gallery image'}`}>
                    View
                  </button>
                  <button type="button" className="admin-text-button" onClick={() => setEditingItem({ ...item })}>EDIT</button>
                  <button type="button" className="admin-text-button admin-text-button--danger" onClick={() => handleDelete(item.id)}>DELETE</button>
                </div>
              </div>
            </article>
          ))}
          {filteredItems.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '32px', textAlign: 'center', color: '#64748b' }}>
              No images found in this category. Click "ADD TO GALLERY" to add images.
            </div>
          )}
        </div>
      </section>

      {selectedGalleryItem && (
        <div
          className="admin-modal"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedGalleryItem(null);
          }}
        >
          <section
            className="admin-modal__card admin-gallery-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="gallery-details-title"
          >
            <div className="admin-modal__heading">
              <div>
                <span className="admin-eyebrow">GALLERY IMAGE</span>
                <h3 id="gallery-details-title">{selectedGalleryItem.title || 'Gallery image details'}</h3>
              </div>
              <button
                type="button"
                className="admin-modal__close"
                onClick={() => setSelectedGalleryItem(null)}
                aria-label="Close gallery details"
                autoFocus
              >
                ✕
              </button>
            </div>
            <iframe
              className="admin-gallery-details-frame"
              title={`Gallery details for ${selectedGalleryItem.title || 'image'}`}
              sandbox=""
              srcDoc={createGalleryDetailsDocument(selectedGalleryItem)}
            />
          </section>
        </div>
      )}

      {editingItem && (
        <div className="admin-modal" role="dialog" aria-modal="true">
          <div className="admin-modal__card" style={{ maxWidth: 540 }}>
            <div className="admin-modal__heading">
              <div><span className="admin-eyebrow">GALLERY ASSET</span><h3>{editingItem.id ? 'Edit Gallery Item' : 'Add Image to Gallery'}</h3></div>
              <button type="button" className="admin-modal__close" onClick={() => setEditingItem(null)}>✕</button>
            </div>
            <form onSubmit={handleSaveItem} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
              <label className="admin-demo-field">
                <span>Title *</span>
                <input required value={editingItem.title || ''} onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })} placeholder="e.g. Salem Showroom Display" />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label className="admin-demo-field">
                  <span>Category</span>
                  <select value={editingItem.category || 'Showroom'} onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}>
                    <option value="Showroom">Showroom</option>
                    <option value="Events">Events</option>
                    <option value="Deliveries">Deliveries</option>
                    <option value="Service">Service</option>
                  </select>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', paddingTop: '24px' }}>
                  <input type="checkbox" checked={editingItem.featured || false} onChange={(e) => setEditingItem({ ...editingItem, featured: e.target.checked })} />
                  <span>Featured image</span>
                </label>
              </div>
              <div className="admin-catalogue-section">
                <span className="admin-eyebrow">IMAGE FILE OR URL *</span>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <input required style={{ flex: 1 }} value={editingItem.imageUrl || ''} onChange={(e) => setEditingItem({ ...editingItem, imageUrl: e.target.value })} placeholder="/imgs/... or https://..." />
                  <label className="admin-button" style={{ cursor: 'pointer', padding: '8px 14px', fontSize: '12px' }}>
                    {uploading ? 'UPLOADING…' : 'UPLOAD'}
                    <input type="file" accept="image/*" style={{ display: 'none' }} disabled={uploading} onChange={handleFileUpload} />
                  </label>
                </div>
              </div>
              <label className="admin-demo-field">
                <span>Caption</span>
                <input value={editingItem.caption || ''} onChange={(e) => setEditingItem({ ...editingItem, caption: e.target.value })} placeholder="Optional description..." />
              </label>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button type="button" className="admin-button" onClick={() => setEditingItem(null)}>CANCEL</button>
                <button type="submit" className="admin-button admin-button--primary">SAVE IMAGE</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// -------------------------------------------------------------
// 7. WEBSITE CONTENT (/admin/content)
// -------------------------------------------------------------
export function WebsiteContent() {
  const [contentItems, setContentItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingContent, setEditingContent] = useState(null);
  const [selectedContent, setSelectedContent] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!selectedContent) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setSelectedContent(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedContent]);

  const loadContent = async () => {
    try {
      setLoading(true);
      const res = await requestJson('/api/admin/content');
      if (res?.content) setContentItems(res.content);
    } catch (err) {
      setToast(`Failed to load content: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadContent(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await requestJson(`/api/admin/content/${encodeURIComponent(editingContent.key)}`, {
        method: 'PUT',
        body: { value: editingContent.value, label: editingContent.label, section: editingContent.section },
      });
      setToast(`Saved content for "${editingContent.label || editingContent.key}".`);
      setEditingContent(null);
      loadContent();
    } catch (err) {
      setToast(`Error saving content: ${err.message}`);
    }
  };

  return (
    <>
      <SectionIntro
        eyebrow="WEBSITE / PUBLISHING"
        title="Website Content Management"
        description="Edit public website headlines, promotional copy, dealership announcements, and contact information directly in the database."
      />

      <StatusToast message={toast} onClose={() => setToast('')} />

      <section className="admin-panel admin-table-panel">
        <div className="admin-panel__heading">
          <div><span className="admin-eyebrow">DATABASE CONTENT STRINGS</span><h3>Public Content Blocks</h3></div>
          <span className="admin-panel__hint">{contentItems.length} editable blocks</span>
        </div>

        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Section</th>
                <th>Label / Key</th>
                <th>Current Value</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contentItems.map((item) => (
                <tr key={item.key}>
                  <td><span className="admin-status-tag">{item.section || 'General'}</span></td>
                  <td>
                    <strong>{item.label || item.key}</strong>
                    <code style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>{item.key}</code>
                  </td>
                  <td style={{ maxWidth: 400 }}>
                    <p style={{ margin: 0, fontSize: '13px', color: '#1e293b' }}>{item.value}</p>
                  </td>
                  <td>
                    <div className="admin-booking-actions">
                      <button
                        type="button"
                        className="admin-button admin-button--secondary admin-button--sm"
                        onClick={() => setSelectedContent(item)}
                        aria-label={`View ${item.label || item.key}`}
                      >
                        View
                      </button>
                      <button
                        type="button"
                        className="admin-button admin-button--secondary admin-button--sm"
                        onClick={() => setEditingContent({ ...item })}
                      >
                        EDIT TEXT
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selectedContent && (
        <div
          className="admin-modal"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedContent(null);
          }}
        >
          <section
            className="admin-modal__card admin-content-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="content-details-title"
          >
            <div className="admin-modal__heading">
              <div>
                <span className="admin-eyebrow">WEBSITE CONTENT</span>
                <h3 id="content-details-title">{selectedContent.label || selectedContent.key}</h3>
              </div>
              <button
                type="button"
                className="admin-modal__close"
                onClick={() => setSelectedContent(null)}
                aria-label="Close content details"
                autoFocus
              >
                ✕
              </button>
            </div>
            <iframe
              className="admin-content-details-frame"
              title={`Website content details for ${selectedContent.label || selectedContent.key}`}
              sandbox=""
              srcDoc={createWebsiteContentDetailsDocument(selectedContent)}
            />
          </section>
        </div>
      )}

      {editingContent && (
        <div className="admin-modal" role="dialog" aria-modal="true">
          <div className="admin-modal__card" style={{ maxWidth: 560 }}>
            <div className="admin-modal__heading">
              <div><span className="admin-eyebrow">EDIT CONTENT</span><h3>{editingContent.label || editingContent.key}</h3></div>
              <button type="button" className="admin-modal__close" onClick={() => setEditingContent(null)}>✕</button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
              <label className="admin-demo-field">
                <span>Field Label</span>
                <input value={editingContent.label || ''} onChange={(e) => setEditingContent({ ...editingContent, label: e.target.value })} />
              </label>
              <label className="admin-demo-field">
                <span>Content Value *</span>
                <textarea required rows="5" value={editingContent.value || ''} onChange={(e) => setEditingContent({ ...editingContent, value: e.target.value })} />
              </label>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button type="button" className="admin-button" onClick={() => setEditingContent(null)}>CANCEL</button>
                <button type="submit" className="admin-button admin-button--primary">SAVE TO DATABASE</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// -------------------------------------------------------------
// 8. HOME PAGE EDITOR (/admin/home-page)
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
      image: '/imgs/f1.png',
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
                <img src={slide.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.src = '/imgs/f1.png'; }} />
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
// 9. WEBSITE SECTIONS (/admin/sections)
// -------------------------------------------------------------
export function WebsiteSections() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!selectedSection) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setSelectedSection(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedSection]);

  const loadSections = async () => {
    try {
      setLoading(true);
      const res = await requestJson('/api/admin/sections');
      if (res?.sections) setSections(res.sections);
    } catch (err) {
      setToast(`Failed to load sections: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSections(); }, []);

  const toggleSection = async (sec) => {
    try {
      const updated = { ...sec, enabled: !sec.enabled };
      await requestJson(`/api/admin/sections/${sec.id}`, { method: 'PUT', body: updated });
      setSections((prev) => prev.map((s) => (s.id === sec.id ? updated : s)));
      setToast(`Section "${sec.title}" ${updated.enabled ? 'enabled' : 'hidden'}.`);
    } catch (err) {
      setToast(`Failed to toggle section: ${err.message}`);
    }
  };

  return (
    <>
      <SectionIntro
        eyebrow="WEBSITE / LAYOUT"
        title="Website Sections & Components"
        description="Enable or disable homepage modules, showroom highlights, service promotions, and customer reviews."
      />

      <StatusToast message={toast} onClose={() => setToast('')} />

      <section className="admin-panel admin-table-panel">
        <div className="admin-panel__heading">
          <div><span className="admin-eyebrow">SECTIONS</span><h3>Page Modules</h3></div>
          <span className="admin-panel__hint">{sections.length} registered sections</span>
        </div>

        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Section Title</th>
                <th>Order</th>
                <th>Description</th>
                <th>Visibility</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sections.map((sec) => (
                <tr key={sec.id}>
                  <td><strong>{sec.title}</strong></td>
                  <td><code>{sec.order ?? 1}</code></td>
                  <td style={{ color: '#64748b', fontSize: '13px' }}>{sec.subtitle || 'Active section'}</td>
                  <td>
                    <span className={`admin-status-tag ${sec.enabled ? 'is-published' : ''}`}>
                      {sec.enabled ? 'VISIBLE' : 'HIDDEN'}
                    </span>
                  </td>
                  <td>
                    <div className="admin-booking-actions">
                      <button
                        type="button"
                        className="admin-button admin-button--secondary admin-button--sm"
                        onClick={() => setSelectedSection(sec)}
                        aria-label={`View ${sec.title} section`}
                      >
                        View
                      </button>
                      <button
                        type="button"
                        className="admin-button admin-button--secondary admin-button--sm"
                        onClick={() => toggleSection(sec)}
                      >
                        {sec.enabled ? 'HIDE SECTION' : 'SHOW SECTION'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selectedSection && (
        <div
          className="admin-modal"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedSection(null);
          }}
        >
          <section
            className="admin-modal__card admin-website-section-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="website-section-details-title"
          >
            <div className="admin-modal__heading">
              <div>
                <span className="admin-eyebrow">WEBSITE SECTION</span>
                <h3 id="website-section-details-title">{selectedSection.title || 'Section details'}</h3>
              </div>
              <button type="button" className="admin-modal__close" onClick={() => setSelectedSection(null)} aria-label="Close section details" autoFocus>✕</button>
            </div>
            <iframe
              className="admin-website-section-details-frame"
              title={`Website section details for ${selectedSection.title || 'section'}`}
              sandbox=""
              srcDoc={createWebsiteSectionDetailsDocument(selectedSection)}
            />
          </section>
        </div>
      )}
    </>
  );
}

// -------------------------------------------------------------
// 10. MEDIA LIBRARY (/admin/media)
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
                    <img src={mediaUrl} alt={m.altText || filename} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.src = '/imgs/f1.png'; }} />
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
    name: user?.name || 'Vathilai Motors Administrator',
    email: user?.email || 'admin@vathilaimotors.com',
    phone: '+91 98765 43210',
    role: 'Super Administrator',
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
      ogImage: '/imgs/f1.png',
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
export function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
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

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const isNew = !editingUser.id;
      const url = isNew ? '/api/admin/users' : `/api/admin/users/${editingUser.id}`;
      const method = isNew ? 'POST' : 'PUT';
      await requestJson(url, { method, body: editingUser });
      setToast(`User ${isNew ? 'created' : 'updated'}.`);
      setEditingUser(null);
      loadUsers();
    } catch (err) {
      setToast(`Error saving user: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this administrator account?')) return;
    try {
      await requestJson(`/api/admin/users/${id}`, { method: 'DELETE' });
      setToast('User deleted.');
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
            onClick={() => setEditingUser({ name: '', email: '', role: 'Editor', status: 'Active' })}
          >
            ADD USER <span>＋</span>
          </button>
        }
      />

      <StatusToast message={toast} onClose={() => setToast('')} />

      <section className="admin-panel admin-table-panel">
        <div className="admin-panel__heading">
          <div><span className="admin-eyebrow">PORTAL ACCESS</span><h3>Authorized Accounts</h3></div>
          <span className="admin-panel__hint">{users.length} accounts</span>
        </div>

        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td><strong>{u.name}</strong></td>
                  <td><code>{u.email}</code></td>
                  <td><span className="admin-status-tag" style={{ background: '#f1f5f9', color: '#0f172a' }}>{u.role}</span></td>
                  <td><span className="admin-status-tag is-published">{u.status || 'Active'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button type="button" className="admin-text-button" onClick={() => setEditingUser({ ...u })}>EDIT</button>
                      <button type="button" className="admin-text-button admin-text-button--danger" onClick={() => handleDelete(u.id)}>DELETE</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {editingUser && (
        <div className="admin-modal" role="dialog" aria-modal="true">
          <div className="admin-modal__card" style={{ maxWidth: 480 }}>
            <div className="admin-modal__heading">
              <div><span className="admin-eyebrow">ACCOUNT</span><h3>{editingUser.id ? 'Edit User' : 'Add New Administrator'}</h3></div>
              <button type="button" className="admin-modal__close" onClick={() => setEditingUser(null)}>✕</button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
              <label className="admin-demo-field">
                <span>Full Name *</span>
                <input required value={editingUser.name || ''} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} />
              </label>
              <label className="admin-demo-field">
                <span>Email Address *</span>
                <input required type="email" value={editingUser.email || ''} onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })} />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label className="admin-demo-field">
                  <span>Role</span>
                  <select value={editingUser.role || 'Editor'} onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}>
                    <option value="Super Admin">Super Admin</option>
                    <option value="Editor">Editor</option>
                    <option value="Support">Support</option>
                  </select>
                </label>
                <label className="admin-demo-field">
                  <span>Status</span>
                  <select value={editingUser.status || 'Active'} onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}>
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button type="button" className="admin-button" onClick={() => setEditingUser(null)}>CANCEL</button>
                <button type="submit" className="admin-button admin-button--primary">SAVE USER</button>
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
        thumbnailUrl: editingVideo.thumbnailUrl || '/imgs/f1.png',
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
