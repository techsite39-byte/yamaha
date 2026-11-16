import { useEffect, useMemo, useState } from 'react';
import './YamahaAdmin.css';
import { demoCollectionByPath, navigation, pageTitles } from './adminNavigation.js';
import {
  demoCollections,
  mutateDemoCollection,
  readDemoCollection,
  readDemoStorageStatus,
  resetDemoData,
  subscribeToDemoChanges,
} from './adminDemoProvider.js';

function useDemoCollection(collectionKey) {
  const [records, setRecords] = useState(() => readDemoCollection(collectionKey));
  useEffect(() => {
    setRecords(readDemoCollection(collectionKey));
    return subscribeToDemoChanges(() => setRecords(readDemoCollection(collectionKey)));
  }, [collectionKey]);
  return records;
}

function DemoMark() {
  return (
    <svg viewBox="0 0 42 42" aria-hidden="true">
      <circle cx="21" cy="21" r="18" />
      <path d="M11 9.5 21 25l10-15.5v13c0 6-4.3 10-10 10s-10-4-10-10zM21 25V7" />
      <path d="M8 16h26" />
    </svg>
  );
}

function DemoBanner({ onReset }) {
  const [storageStatus, setStorageStatus] = useState(() => {
    readDemoCollection('motorcycles');
    return readDemoStorageStatus();
  });
  useEffect(() => subscribeToDemoChanges(() => setStorageStatus(readDemoStorageStatus())), []);
  return (
    <aside className="admin-demo-banner" role="status">
      <span className="admin-demo-banner__signal" aria-hidden="true" />
      <div>
        <strong>DEMO MODE – DATA NOT SAVED</strong>
        <span>Sample records only. Stored in {storageStatus.mode}; never sent to the API or public website. {storageStatus.warning}</span>
      </div>
      <button className="admin-demo-banner__reset" type="button" onClick={onReset}>RESET DEMO DATA</button>
    </aside>
  );
}

function DemoIntro({ eyebrow, title, description, action }) {
  return (
    <section className="admin-section-intro">
      <div><span className="admin-eyebrow">{eyebrow}</span><h2>{title}</h2><p>{description}</p></div>
      {action}
    </section>
  );
}

function DemoDashboard({ onNavigate }) {
  const motorcycles = useDemoCollection('motorcycles');
  const serviceVideos = useDemoCollection('serviceVideos');
  const socialPosts = useDemoCollection('socialPosts');
  const enquiries = useDemoCollection('enquiries');
  const activity = useDemoCollection('activity');
  const metrics = [
    { label: 'DEMO MOTORCYCLES', value: motorcycles.length, note: 'Isolated sample records', path: '/admin/motorcycles' },
    { label: 'SERVICE VIDEO PREVIEWS', value: serviceVideos.length, note: 'Existing local files', path: '/admin/service-videos' },
    { label: 'DEMO SOCIAL CHANNELS', value: 6, note: 'Footer links configured', path: '/admin/social' },
    { label: 'DEMO ENQUIRIES', value: enquiries.length, note: 'Fictional example.com records', path: '/admin/enquiries' },
  ];

  return (
    <>
      <section className="admin-welcome">
        <div>
          <span className="admin-eyebrow">YAMAHA / DEVELOPMENT SANDBOX</span>
          <h2>Command <em>center.</em></h2>
          <p>Explore admin workflows with sample records. Demo edits never update public Yamaha content or call the backend.</p>
        </div>
        <span className="admin-readonly-badge"><i /> DEVELOPMENT DEMO</span>
      </section>
      <section className="admin-metrics admin-metrics--social" aria-label="Demo dashboard totals">
        {metrics.map((metric) => (
          <a className="admin-metric admin-demo-metric" href={metric.path} onClick={(event) => onNavigate(event, metric.path)} key={metric.label}>
            <span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.note}</small>
          </a>
        ))}
      </section>
      <section className="admin-grid">
        <article className="admin-panel">
          <div className="admin-panel__heading">
            <div><span className="admin-eyebrow">WORKSPACE</span><h3>Try a management workflow</h3></div>
            <span className="admin-panel__hint">Demo CRUD enabled</span>
          </div>
          <div className="admin-quick-links">
            {[
              ['Manage social channels', '/admin/social'],
              ['Review customer enquiries', '/admin/enquiries'],
              ['Browse media library', '/admin/media'],
              ['Manage demo users and roles', '/admin/users'],
            ].map(([label, path]) => (
              <a href={path} onClick={(event) => onNavigate(event, path)} key={path}>{label}<span>↗</span></a>
            ))}
          </div>
          <p className="admin-panel__footnote">Create, edit, delete, filter, sort, preview, and reset sample records. Publishing, uploads, social APIs, and permissions are simulated only.</p>
        </article>
        <article className="admin-panel">
          <div className="admin-panel__heading">
            <div><span className="admin-eyebrow">DEMO ACTIVITY</span><h3>Recent sandbox actions</h3></div>
            <a className="admin-panel__hint" href="/admin/activity" onClick={(event) => onNavigate(event, '/admin/activity')}>View log ↗</a>
          </div>
          <div className="admin-demo-activity">
            {activity.slice(0, 3).map((entry) => (
              <div key={entry.id}><strong>{entry.action}</strong><span>{entry.timestamp} · {entry.actor}</span></div>
            ))}
          </div>
          <p className="admin-panel__footnote">This activity list is temporary demo state, not an audit or security log.</p>
        </article>
      </section>
    </>
  );
}

function DemoAnalytics() {
  const data = useDemoCollection('analytics');
  const motorcycles = useDemoCollection('motorcycles');
  const posts = useDemoCollection('socialPosts');
  const enquiries = useDemoCollection('enquiries');
  const metrics = [
    ['Motorcycles', motorcycles.length],
    ['Social posts', posts.length],
    ['Enquiries', enquiries.length],
    ['Visitors (sample)', data.find((item) => item.key === 'visitors')?.value ?? 0],
  ];
  return (
    <>
      <DemoIntro eyebrow="REPORTING / SAMPLE DATA" title="Analytics" description="All values are generated from the demo seed. They are not live traffic or production business metrics." />
      <section className="admin-metrics admin-metrics--social" aria-label="Demo analytics">
        {metrics.map(([label, value]) => <article className="admin-metric" key={label}><span>{label.toUpperCase()}</span><strong>{value}</strong><small>Demo sample</small></article>)}
      </section>
      <DemoCollectionPage collectionKey="analytics" title="Demo analytics records" />
    </>
  );
}

function previewKind(value, record, config) {
  const mediaType = String(record.mediaType ?? '').toLowerCase();
  if (mediaType === 'video' || /\.mp4($|\?)/i.test(value)) return 'video';
  if (config.fields.find((field) => field.key === config.mediaField)?.type === 'media') return 'image';
  return null;
}

function DemoCell({ value, record, config, columnKey }) {
  if (value == null || value === '') return <span className="admin-demo-muted">—</span>;
  if (config.mediaField === columnKey) {
    const kind = previewKind(String(value), record, config);
    if (kind === 'video') {
      return <video className="admin-demo-thumb" src={value} controls muted playsInline preload="none" aria-label={`Demo preview: ${record.title ?? record.fileName ?? value}`} />;
    }
    if (kind === 'image' && String(value).startsWith('/')) {
      return <img className="admin-demo-thumb" src={value} alt={record.altText || record.title || record.fileName || 'Demo media preview'} loading="lazy" />;
    }
  }
  if (typeof value === 'string' && value.length > 72) return <span title={value}>{value.slice(0, 68)}…</span>;
  return String(value);
}

function DemoRecordDialog({ config, initialRecord, onClose, onSave }) {
  const [draft, setDraft] = useState(() => initialRecord ? { ...initialRecord } : Object.fromEntries(config.fields.map((field) => [field.key, field.type === 'select' ? field.options[0] : ''])));
  const [error, setError] = useState('');
  const [filePreview, setFilePreview] = useState('');

  useEffect(() => {
    if (!filePreview) return undefined;
    return () => URL.revokeObjectURL(filePreview);
  }, [filePreview]);

  const setField = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      setError('Choose an image or video file to preview.');
      return;
    }
    setError('');
    setFilePreview(URL.createObjectURL(file));
    setField('_selectedFileName', file.name);
  };
  const submit = (event) => {
    event.preventDefault();
    const missing = config.fields.find((field) => field.required && !String(draft[field.key] ?? '').trim());
    if (missing) {
      setError(`${missing.label} is required.`);
      return;
    }
    for (const field of config.fields.filter((item) => item.type === 'url')) {
      const value = String(draft[field.key] ?? '').trim();
      if (value && !value.startsWith('/') && !/^https?:\/\//i.test(value)) {
        setError(`${field.label} must start with http://, https://, or /.`);
        return;
      }
    }
    onSave(draft);
  };

  return (
    <div className="admin-demo-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="admin-demo-modal" role="dialog" aria-modal="true" aria-labelledby="admin-demo-form-title">
        <div className="admin-panel__heading">
          <div><span className="admin-eyebrow">TEMPORARY DEMO RECORD</span><h3 id="admin-demo-form-title">{initialRecord ? 'Edit record' : 'Create record'}</h3></div>
          <button type="button" className="admin-icon-button" onClick={onClose} aria-label="Close form">×</button>
        </div>
        <p className="admin-panel__footnote">Changes remain in the development demo store only. They are not sent to the server or published.</p>
        <form className="admin-demo-form" onSubmit={submit}>
          {config.fields.map((field) => (
            <label className={`admin-demo-field${field.type === 'textarea' ? ' admin-demo-field--wide' : ''}`} key={field.key}>
              <span>{field.label}{field.required && <i aria-hidden="true"> *</i>}</span>
              {field.type === 'textarea'
                ? <textarea required={field.required} rows="3" value={draft[field.key] ?? ''} onChange={(event) => setField(field.key, event.target.value)} />
                : field.type === 'select'
                  ? <select required={field.required} value={draft[field.key] ?? ''} onChange={(event) => setField(field.key, event.target.value)}>{field.options.map((option) => <option key={option}>{option}</option>)}</select>
                  : <input required={field.required} min={field.min} max={field.max} type={field.type === 'media' ? 'text' : field.type ?? 'text'} value={draft[field.key] ?? ''} onChange={(event) => setField(field.key, event.target.value)} />}
              {field.type === 'media' && (
                <span className="admin-demo-file-control">
                  <input type="file" accept="image/*,video/*" onChange={handleFile} aria-label={`Choose a temporary preview for ${field.label}`} />
                  <small>Preview only. This file is not uploaded or saved.</small>
                  {(filePreview || draft[field.key]) && (
                    (filePreview ? /\.(mp4|webm|mov)$/i.test(draft._selectedFileName ?? '') : /\.(mp4|webm|mov)(?:$|\?)/i.test(draft[field.key] ?? ''))
                      ? <video className="admin-demo-upload-preview" src={filePreview || draft[field.key]} controls muted playsInline aria-label="Temporary demo video preview" />
                      : <img className="admin-demo-upload-preview" src={filePreview || draft[field.key]} alt="Temporary demo media preview" />
                  )}
                  {draft._selectedFileName && <small>Selected for preview: {draft._selectedFileName}</small>}
                </span>
              )}
            </label>
          ))}
          {error && <p className="admin-demo-form-error" role="alert">{error}</p>}
          <div className="admin-demo-form__actions">
            <button type="button" className="admin-button" onClick={onClose}>CANCEL</button>
            <button type="submit" className="admin-button admin-button--primary">SAVE DEMO RECORD</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function DemoCollectionPage({ collectionKey, title }) {
  const config = demoCollections[collectionKey];
  const records = useDemoCollection(collectionKey);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortKey, setSortKey] = useState(config.columns[0]);
  const [sortDirection, setSortDirection] = useState('asc');
  const [dialogRecord, setDialogRecord] = useState(undefined);
  const [notice, setNotice] = useState('');
  const statusOptions = config.statusField
    ? ['All', ...new Set(records.map((record) => record[config.statusField]).filter(Boolean))]
    : [];
  const visibleRecords = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return records
      .filter((record) => statusFilter === 'All' || !config.statusField || record[config.statusField] === statusFilter)
      .filter((record) => !normalized || Object.values(record).some((value) => String(value ?? '').toLowerCase().includes(normalized)))
      .sort((left, right) => {
        const field = config.fields.find((item) => item.key === sortKey);
        if (field?.type === 'number') {
          return (Number(left[sortKey] ?? 0) - Number(right[sortKey] ?? 0)) * (sortDirection === 'asc' ? 1 : -1);
        }
        return String(left[sortKey] ?? '').localeCompare(String(right[sortKey] ?? ''), undefined, { numeric: true, sensitivity: 'base' })
          * (sortDirection === 'asc' ? 1 : -1);
      });
  }, [records, statusFilter, config.statusField, query, sortKey, sortDirection]);

  useEffect(() => {
    if (!notice) return undefined;
    const timeout = window.setTimeout(() => setNotice(''), 3500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const save = (draft) => {
    const action = draft.id ? 'update' : 'create';
    const persistence = mutateDemoCollection(collectionKey, action, draft);
    setDialogRecord(undefined);
    setNotice(`${action === 'create' ? 'Created' : 'Updated'} in ${persistence} only.`);
  };
  const remove = (record) => {
    if (!window.confirm(`Delete “${record[config.fields[0].key]}” from demo data? This cannot be undone before reset.`)) return;
    const persistence = mutateDemoCollection(collectionKey, 'delete', record.id);
    setNotice(`Deleted from ${persistence} only.`);
  };
  const toggleSort = (field) => {
    if (sortKey === field) setSortDirection((direction) => direction === 'asc' ? 'desc' : 'asc');
    else {
      setSortKey(field);
      setSortDirection('asc');
    }
  };

  return (
    <>
      <DemoIntro
        eyebrow="DEVELOPMENT / DEMO DATA"
        title={title ?? config.title}
        description={config.description}
        action={!config.readOnly && <button className="admin-button admin-button--primary" type="button" onClick={() => setDialogRecord(null)}>CREATE RECORD <span>＋</span></button>}
      />
      <section className="admin-panel admin-demo-collection">
        <div className="admin-demo-toolbar">
          <label className="admin-search">
            <span className="sr-only">Search {title ?? config.title}</span>
            <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" /><path d="m13 13 4 4" /></svg>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search demo records" />
          </label>
          {config.statusField && (
            <label className="admin-demo-filter">
              <span>Status</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>{statusOptions.map((option) => <option key={option}>{option}</option>)}</select>
            </label>
          )}
          <span className="admin-panel__hint">{visibleRecords.length} of {records.length} demo records</span>
        </div>
        {collectionKey === 'socialPosts' && (
          <div className="admin-demo-integration-note" role="note">Post status changes are simulated. No upload, schedule, or platform publishing occurs.</div>
        )}
        {['gallery', 'mediaLibrary', 'reviews', 'homePage', 'serviceVideos'].includes(collectionKey) && (
          <div className="admin-demo-integration-note" role="note">File selection only creates a temporary local preview; actual uploads and public changes are disabled.</div>
        )}
        <div className="admin-table-scroll">
          <table className="admin-table admin-demo-table">
            <thead>
              <tr>
                {config.columns.map((column) => (
                  <th key={column} aria-sort={sortKey === column ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                    <button className="admin-sort-button" type="button" onClick={() => toggleSort(column)}>{column.replace(/[A-Z]/g, (letter) => ` ${letter}`).replace(/^./, (letter) => letter.toUpperCase())}<span>{sortKey === column ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ' ↕'}</span></button>
                  </th>
                ))}
                {!config.readOnly && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {visibleRecords.map((record) => (
                <tr key={record.id}>
                  {config.columns.map((column) => (
                    <td key={column}>
                      {column === config.statusField
                        ? <span className={`admin-status-tag admin-demo-status admin-demo-status--${String(record[column]).toLowerCase().replace(/[^a-z]+/g, '-')}`}>{record[column]}</span>
                        : <DemoCell value={record[column]} record={record} config={config} columnKey={column} />}
                    </td>
                  ))}
                  {!config.readOnly && (
                    <td>
                      <div className="admin-demo-row-actions">
                        <button className="admin-text-button" type="button" onClick={() => setDialogRecord(record)}>EDIT</button>
                        <button className="admin-text-button admin-text-button--danger" type="button" onClick={() => remove(record)}>DELETE</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {visibleRecords.length === 0 && <tr><td className="admin-table__empty" colSpan={config.columns.length + (config.readOnly ? 0 : 1)}>No demo records match the current search or filter.</td></tr>}
            </tbody>
          </table>
        </div>
        {config.readOnly && <p className="admin-panel__footnote">Activity entries in this demo are temporary examples, not an audit log.</p>}
      </section>
      {notice && <div className="admin-demo-toast" role="status">{notice}</div>}
      {dialogRecord !== undefined && <DemoRecordDialog config={config} initialRecord={dialogRecord} onClose={() => setDialogRecord(undefined)} onSave={save} />}
    </>
  );
}

function AdminDemoMode({ onSwitchToApi }) {
  const [pathname, setPathname] = useState(window.location.pathname.replace(/\/+$/, '') || '/admin');
  const [resetNotice, setResetNotice] = useState('');
  const pageTitle = pageTitles.get(pathname) ?? 'Admin Demo';
  const group = navigation.find((item) => item.path === pathname)?.group ?? 'Configuration';
  const groups = [...new Set(navigation.map((item) => item.group))];
  const collectionKey = demoCollectionByPath.get(pathname);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `Admin / ${pageTitle} / Demo | Yamaha`;
    return () => { document.title = previousTitle; };
  }, [pageTitle]);

  useEffect(() => {
    const updatePath = () => setPathname(window.location.pathname.replace(/\/+$/, '') || '/admin');
    window.addEventListener('popstate', updatePath);
    return () => window.removeEventListener('popstate', updatePath);
  }, []);

  const navigate = (event, path) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    window.history.pushState({}, '', path);
    setPathname(path);
    window.scrollTo(0, 0);
  };
  const reset = () => {
    if (!window.confirm('Reset all admin demo records to their sample values?')) return;
    resetDemoData();
    setResetNotice('Demo records have been reset to their sample values.');
    window.setTimeout(() => setResetNotice(''), 3500);
  };

  return (
    <main className="yamaha-admin admin-demo-mode">
      <DemoBanner onReset={reset} />
      <aside className="admin-sidebar">
        <a className="admin-brand" href="/" aria-label="Return to Yamaha website"><DemoMark /><span>YAMAHA <small>ADMINISTRATION / DEMO</small></span></a>
        <div className="admin-side-rule" />
        <nav className="admin-nav" aria-label="Admin demo navigation">
          {groups.map((itemGroup) => (
            <div className="admin-nav-group" key={itemGroup}>
              <span className="admin-nav-group__label">{itemGroup}</span>
              {navigation.filter((item) => item.group === itemGroup).map((item) => (
                <a
                  className={`admin-nav-link${pathname === item.path ? ' is-active' : ''}`}
                  href={item.path}
                  key={item.path}
                  aria-current={pathname === item.path ? 'page' : undefined}
                  onClick={(event) => navigate(event, item.path)}
                >
                  <span className="admin-nav-link__icon" aria-hidden="true">{item.icon.slice(0, 1).toUpperCase()}</span>
                  <span>{item.label}</span>
                  <span className="admin-nav-link__lock" title="Development sample data">DEMO</span>
                </a>
              ))}
            </div>
          ))}
        </nav>
        <div className="admin-sidebar__bottom"><a href="/" className="admin-back-link">← View public website</a><span>NO API / NO AUTHENTICATION</span></div>
      </aside>
      <section className="admin-main">
        <header className="admin-topbar">
          <div className="admin-breadcrumb"><span>YAMAHA</span><i>/</i><strong>{pageTitle}</strong></div>
          <div className="admin-account">
            <span className="admin-account__status"><i /> DEVELOPMENT DEMO</span>
            <span className="admin-account__name">Demo Administrator</span>
            {onSwitchToApi && (
              <button
                type="button"
                className="admin-logout"
                style={{ cursor: 'pointer', background: 'transparent' }}
                onClick={onSwitchToApi}
                title="Connect to live API server"
              >
                LIVE API
              </button>
            )}
            <a href="/" className="admin-logout">EXIT DEMO</a>
          </div>
        </header>
        <div className="admin-page">
          <div className="admin-page-heading">
            <div><span className="admin-eyebrow">{group.toUpperCase()} / SANDBOX</span><h1>{pageTitle}</h1></div>
          </div>
          {resetNotice && <div className="admin-demo-toast" role="status">{resetNotice}</div>}
          {pathname === '/admin'
            ? <DemoDashboard onNavigate={navigate} />
            : pathname === '/admin/analytics'
              ? <DemoAnalytics />
              : collectionKey
                ? <DemoCollectionPage collectionKey={collectionKey} title={demoCollections[collectionKey].title} />
                : <section className="admin-panel admin-module-notice"><span className="admin-eyebrow">DEMO ROUTE</span><h2>No admin screen is registered.</h2><p>Choose an existing admin section from the sidebar.</p></section>}
        </div>
      </section>
    </main>
  );
}

export default AdminDemoMode;
