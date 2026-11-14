const socialPlatforms = [
  { id: 'instagram', name: 'Instagram', mark: 'IG' },
  { id: 'facebook', name: 'Facebook', mark: 'FB' },
  { id: 'youtube', name: 'YouTube', mark: 'YT' },
  { id: 'x', name: 'X', mark: 'X' },
  { id: 'linkedin', name: 'LinkedIn', mark: 'in' },
];

function SectionIntro({ eyebrow, title, description, action }) {
  return (
    <section className="admin-section-intro">
      <div>
        <span className="admin-eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {action}
    </section>
  );
}

function SetupNotice({ icon = 'SETUP', title, description, requirements }) {
  return (
    <section className="admin-setup-notice" role="note">
      <span className="admin-setup-notice__icon" aria-hidden="true">{icon}</span>
      <div>
        <span className="admin-eyebrow">FEATURE NOT CONNECTED</span>
        <h3>{title}</h3>
        <p>{description}</p>
        <ul>
          {requirements.map((requirement) => <li key={requirement}>{requirement}</li>)}
        </ul>
      </div>
    </section>
  );
}

export function SocialPlatformSummary({ onNavigate }) {
  return (
    <article className="admin-panel admin-social-summary">
      <div className="admin-panel__heading">
        <div><span className="admin-eyebrow">SOCIAL CHANNELS</span><h3>Platform profiles</h3></div>
        <a href="/admin/social" onClick={onNavigate} className="admin-panel__hint">View status ↗</a>
      </div>
      <div className="admin-social-platforms admin-social-platforms--compact">
        {socialPlatforms.map((platform) => (
          <a
            href="/admin/social"
            onClick={onNavigate}
            className="admin-social-platform"
            key={platform.id}
            aria-label={`${platform.name}: profile not configured`}
          >
            <span className="admin-social-platform__mark" aria-hidden="true">{platform.mark}</span>
            <span><strong>{platform.name}</strong><small>Profile not configured</small></span>
          </a>
        ))}
      </div>
      <p className="admin-panel__footnote">No external profile URLs are configured. Add them after persistent settings are provisioned.</p>
    </article>
  );
}

export function SocialMediaDashboard({ onNavigate }) {
  const metrics = ['Total posts', 'Draft', 'Scheduled', 'Published', 'Failed'];

  return (
    <>
      <SectionIntro
        eyebrow="SOCIAL / OVERVIEW"
        title="Social media operations"
        description="Monitor platform setup and publishing readiness. No posts, schedules, or activity are reported until real integrations and persistent storage are connected."
        action={<a className="admin-button" href="/admin/social/posts" onClick={onNavigate}>OPEN POST MANAGER <span>↗</span></a>}
      />
      <section className="admin-metrics admin-metrics--social" aria-label="Social media post totals">
        {metrics.map((metric) => (
          <article className="admin-metric admin-metric--status" key={metric}>
            <span>{metric.toUpperCase()}</span>
            <strong>Unavailable</strong>
            <small>Social post data is not connected</small>
          </article>
        ))}
      </section>
      <section className="admin-panel admin-social-panel">
        <div className="admin-panel__heading">
          <div><span className="admin-eyebrow">PLATFORM CONNECTIONS</span><h3>Profiles & publishing access</h3></div>
          <span className="admin-panel__hint">5 platforms / not integrated</span>
        </div>
        <div className="admin-social-platforms">
          {socialPlatforms.map((platform) => (
            <article className="admin-social-platform-card" key={platform.id}>
              <span className="admin-social-platform__mark" aria-hidden="true">{platform.mark}</span>
              <div><strong>{platform.name}</strong><small>Profile URL not configured</small></div>
              <span className="admin-status-tag">NOT CONNECTED</span>
            </article>
          ))}
        </div>
        <SetupNotice
          title="Social publishing is not configured."
          description="This dashboard does not connect to social networks or claim that a post was published. Creating drafts, scheduling, uploading media, and publishing are unavailable."
          requirements={[
            'Provision persistent storage for post records, drafts, and schedules.',
            'Select and configure each platform’s official API and OAuth credentials on the server.',
            'Choose media storage and define platform-specific upload, review, and publishing behavior.',
          ]}
        />
      </section>
      <section className="admin-panel admin-social-activity">
        <div className="admin-panel__heading">
          <div><span className="admin-eyebrow">RECENT ACTIVITY</span><h3>Publishing history</h3></div>
          <span className="admin-panel__hint">Unavailable</span>
        </div>
        <div className="admin-empty">
          <span className="admin-empty__mark" aria-hidden="true">—</span>
          <strong>No connected social activity source</strong>
          <p>Published, scheduled, and failed activity will only appear after platform APIs and storage are integrated.</p>
        </div>
      </section>
    </>
  );
}

export function SocialPosts({ selectedPlatform, onSelectPlatform }) {
  const platforms = [{ id: 'all', name: 'All platforms', mark: 'ALL' }, ...socialPlatforms];
  const selected = platforms.find((platform) => platform.id === selectedPlatform) ?? platforms[0];

  return (
    <>
      <SectionIntro
        eyebrow="SOCIAL / CONTENT"
        title="Social post manager"
        description="Organize posts by platform and review readiness. No post records are available because this project has no social database or platform API integrations."
        action={<button className="admin-button" type="button" disabled title="Requires persistent storage and a configured social platform API">CREATE POST</button>}
      />
      <section className="admin-panel admin-social-panel">
        <div className="admin-panel__heading">
          <div><span className="admin-eyebrow">CHANNEL FILTER</span><h3>Choose a platform</h3></div>
          <span className="admin-panel__hint">No post data connected</span>
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
        <div className="admin-post-empty" aria-live="polite">
          <span className="admin-post-empty__mark" aria-hidden="true">{selected.mark}</span>
          <div>
            <span className="admin-eyebrow">{selected.name.toUpperCase()}</span>
            <h3>No saved posts to preview</h3>
            <p>Captions, descriptions, URLs, media, and draft previews are not stored or managed by this application yet.</p>
          </div>
        </div>
        <div className="admin-social-status-legend" aria-label="Post status definitions">
          {['Draft', 'Scheduled', 'Published', 'Failed'].map((status) => (
            <span className="admin-social-status-legend__item" key={status}>
              <span className="admin-status-tag">{status.toUpperCase()}</span>
              <small>Requires a connected post record</small>
            </span>
          ))}
        </div>
      </section>
      <SetupNotice
        title="Post creation and management are disabled."
        description="This is a status-only interface; it does not store post content in local storage or report success for unavailable operations."
        requirements={[
          'Database-backed create, edit, delete, and status history.',
          'Secure platform authorization and scheduled-publishing workers.',
          'Object storage and media validation for image/video uploads.',
        ]}
      />
    </>
  );
}

export function ContactEnquiries() {
  return (
    <>
      <SectionIntro
        eyebrow="CUSTOMER CARE / INBOX"
        title="Contact & enquiries"
        description="The project currently has no enquiry API or persistent inbox. Customer data is not available in this admin portal."
        action={<button className="admin-button" type="button" disabled title="Requires an enquiry API and database">EXPORT ENQUIRIES</button>}
      />
      <section className="admin-panel admin-table-panel">
        <div className="admin-panel__heading">
          <div><span className="admin-eyebrow">CUSTOMER MESSAGES</span><h3>Enquiry inbox</h3></div>
          <span className="admin-readonly-badge"><i /> SOURCE NOT CONNECTED</span>
        </div>
        <div className="admin-disabled-filters">
          <label className="admin-search"><span className="sr-only">Search enquiries</span><input disabled placeholder="Search name, email or message" /></label>
          <label className="admin-disabled-select"><span className="sr-only">Filter enquiries by status</span><select disabled defaultValue=""><option value="">All statuses</option></select></label>
        </div>
        <div className="admin-empty admin-empty--large">
          <span className="admin-empty__mark" aria-hidden="true">—</span>
          <strong>No enquiry source is connected</strong>
          <p>Name, contact details, messages, and New / In Progress / Completed statuses are not available without an enquiry endpoint and database.</p>
        </div>
      </section>
      <SetupNotice
        title="Customer enquiries are not being collected here."
        description="No customer message data is exposed or fabricated. The public website has not been changed to add or redirect a contact form."
        requirements={['A reviewed and protected enquiry submission endpoint.', 'Persistent storage, retention policy, and access controls.', 'Server-side validation and anti-abuse protections.']}
      />
    </>
  );
}

export function CustomerReviews() {
  return (
    <>
      <SectionIntro
        eyebrow="CUSTOMER CARE / FEEDBACK"
        title="Customer reviews"
        description="Review management is unavailable until a review source and persistent content store are configured."
        action={<button className="admin-button" type="button" disabled title="Requires a review store">ADD REVIEW</button>}
      />
      <section className="admin-panel admin-review-empty">
        <div className="admin-panel__heading">
          <div><span className="admin-eyebrow">REVIEW INVENTORY</span><h3>Reviews & publication</h3></div>
          <span className="admin-panel__hint">Not connected</span>
        </div>
        <div className="admin-empty admin-empty--large">
          <span className="admin-empty__mark" aria-hidden="true">—</span>
          <strong>No review source is connected</strong>
          <p>There are no review records available to view, add, edit, delete, publish, hide, or attach images to.</p>
        </div>
      </section>
      <SetupNotice
        title="Review publishing is not enabled."
        description="No review records or customer content are created by this screen."
        requirements={['A database-backed review model and moderation history.', 'Media storage and image validation for review attachments.', 'An explicit public-site publishing flow and authorization rules.']}
      />
    </>
  );
}

export function GalleryManagement() {
  return (
    <>
      <SectionIntro
        eyebrow="WEBSITE / ASSET LIBRARY"
        title="Gallery management"
        description="Existing project assets remain untouched. This portal has no upload or gallery persistence service."
        action={<button className="admin-button" type="button" disabled title="Requires object storage and a media API">UPLOAD MEDIA</button>}
      />
      <section className="admin-panel admin-gallery-panel">
        <div className="admin-panel__heading">
          <div><span className="admin-eyebrow">MEDIA INVENTORY</span><h3>Gallery items</h3></div>
          <span className="admin-panel__hint">No managed gallery records</span>
        </div>
        <div className="admin-empty admin-empty--large">
          <span className="admin-empty__mark" aria-hidden="true">—</span>
          <strong>No gallery storage is connected</strong>
          <p>Upload, preview, categorization, edit, and delete operations require a configured media provider and persistent metadata store.</p>
        </div>
      </section>
      <SetupNotice
        title="Media uploads are disabled."
        description="This admin page does not write files to the application or pretend that an upload succeeded."
        requirements={['Select private or public object storage and configure server-side credentials.', 'Add file type, size, malware, and access validation.', 'Persist categories and media metadata in a database.']}
      />
    </>
  );
}

export function WebsiteContent() {
  return (
    <>
      <SectionIntro
        eyebrow="WEBSITE / PUBLISHING"
        title="Website content"
        description="Public content remains unchanged. The current website is source-file driven, so this portal cannot save or publish content edits."
      />
      <div className="admin-content-modules">
        {[
          ['Homepage banners', 'Banner images and text are not editable here.'],
          ['Homepage text & images', 'Current content remains in the existing application files.'],
          ['Promotional sections', 'No database-backed draft or publishing workflow is configured.'],
          ['Website social links', 'No profile URLs have been configured or saved.'],
        ].map(([title, description]) => (
          <article className="admin-panel admin-content-module" key={title}>
            <span className="admin-eyebrow">PUBLIC CONTENT / READ ONLY</span>
            <h3>{title}</h3>
            <p>{description}</p>
            <span className="admin-status-tag">EDITING UNAVAILABLE</span>
          </article>
        ))}
      </div>
      <SetupNotice
        title="Publishing is intentionally unavailable."
        description="No edit has been applied to the public site. A content store and an explicit review/publish workflow are required before changes can affect public pages."
        requirements={['Persistent content records and draft/published states.', 'Media storage for banner and promotional images.', 'Approval, audit, and rollback behavior before connecting public routes.']}
      />
    </>
  );
}

export function AdminAnalytics({ overview }) {
  const metrics = [
    { label: 'MOTORCYCLES', value: overview.totalMotorcycles, note: 'Static source records' },
    { label: 'SERVICE VIDEOS', value: overview.serviceVideoCount, note: 'Local public files' },
    { label: 'SOCIAL POSTS', value: 'Unavailable', note: 'No platform integration' },
    { label: 'ENQUIRIES', value: 'Unavailable', note: 'No enquiry API' },
    { label: 'ADMIN ACTIVITY', value: 'Unavailable', note: 'No audit event store' },
  ];

  return (
    <>
      <SectionIntro
        eyebrow="REPORTING / SOURCE DATA"
        title="Analytics"
        description="Only existing source inventories are measurable here. No visitor tracking, enquiry data, publishing history, or admin audit store is connected."
      />
      <section className="admin-metrics admin-metrics--social" aria-label="Available admin metrics">
        {metrics.map((metric) => (
          <article className="admin-metric admin-metric--status" key={metric.label}>
            <span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.note}</small>
          </article>
        ))}
      </section>
      <section className="admin-panel admin-analytics-panel">
        <div className="admin-panel__heading">
          <div><span className="admin-eyebrow">INVENTORY SNAPSHOT</span><h3>Verified project sources</h3></div>
          <span className="admin-panel__hint">Read only</span>
        </div>
        <ul className="admin-analytics-list">
          <li><span>Motorcycle records</span><strong>{overview.totalMotorcycles}</strong><small>Source: current project data</small></li>
          <li><span>Service video files</span><strong>{overview.serviceVideoCount}</strong><small>Source: public files in playback sequence</small></li>
          <li><span>Public routes</span><strong>{overview.websitePages.length}</strong><small>Source: current application routes</small></li>
          <li><span>Visitors, enquiries, social activity</span><strong>Unavailable</strong><small>No analytics or event data source</small></li>
        </ul>
      </section>
    </>
  );
}

export function AdminProfileSettings({ user, developmentAccess = false }) {
  return (
    <>
      <SectionIntro
        eyebrow={developmentAccess ? 'LOCAL DEVELOPMENT / IDENTITY' : 'ACCOUNT / IDENTITY'}
        title="Admin profile & settings"
        description={developmentAccess
          ? 'This local development session has no authenticated identity. Production administrator access is protected by Auth0.'
          : 'Your identity is verified by the existing Auth0 integration. Passwords are not stored or managed by this application.'}
      />
      <section className="admin-panel admin-profile-panel">
        <div className="admin-panel__heading">
          <div><span className="admin-eyebrow">{developmentAccess ? 'LOCAL DEVELOPER' : 'AUTHENTICATED ADMIN'}</span><h3>Account profile</h3></div>
          <span className="admin-readonly-badge"><i /> {developmentAccess ? 'DEVELOPMENT SESSION' : 'AUTH0 SESSION'}</span>
        </div>
        <dl className="admin-profile-list">
          <div><dt>Display name</dt><dd>{user?.name ?? 'Administrator'}</dd></div>
          <div><dt>Identity provider</dt><dd>{developmentAccess ? 'None (local only)' : 'Auth0'}</dd></div>
          <div><dt>Profile editing</dt><dd>{developmentAccess ? 'Not available' : 'Managed by the identity provider'}</dd></div>
          {!developmentAccess && <div><dt>Password changes</dt><dd>Use the Auth0 tenant’s configured account recovery flow</dd></div>}
        </dl>
        <p className="admin-panel__footnote">{developmentAccess
          ? 'This no-login session must not be used on a public deployment.'
          : 'This portal has no password-change endpoint and does not expose identity-provider credentials. Auth0 account-recovery behavior depends on tenant configuration.'}</p>
        {!developmentAccess && <a className="admin-button admin-button--primary" href="/logout">LOG OUT OF ADMIN <span>↗</span></a>}
      </section>
    </>
  );
}
