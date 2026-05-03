const $ = (sel) => document.querySelector(sel)
const app = $('#app')

const state = {
  boot: null,
  discover: [],
  manual: [],
  requests: [],
  matches: [],
  conversations: [],
  nannies: [],
  alerts: [],
  admin: null,
  activeTab: 'Discover',
  activeScreen: 'Discover',
  selectedProfile: null,
  toast: '',
  loading: true,
  error: ''
}

const api = async (url, options = {}) => {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Something went wrong')
  return data
}

const iconFor = (avatar) => ({ fox: '🦊', bear: '🐻', owl: '🦉', rabbit: '🐰', panda: '🐼' }[avatar] || '🌈')
const planName = (p) => p === 'super_premium' ? 'Super Premium' : p?.[0]?.toUpperCase() + p?.slice(1)
const safe = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const toast = (msg) => { state.toast = msg; render(); setTimeout(() => { state.toast = ''; render() }, 2600) }

async function loadAll() {
  try {
    state.loading = true
    const [boot, disc, manual, reqs, nannies, alerts, admin] = await Promise.all([
      api('/api/bootstrap'), api('/api/discover'), api('/api/discover?mode=manual'), api('/api/requests'), api('/api/nannies'), api('/api/safety-alerts'), api('/api/admin/dashboard')
    ])
    state.boot = boot
    state.discover = disc.results
    state.manual = manual.results
    state.requests = reqs.requests
    state.nannies = nannies.nannies
    state.alerts = alerts.alerts
    state.admin = admin
    await refreshMatches()
  } catch (e) {
    state.error = e.message
  } finally {
    state.loading = false
    render()
  }
}

async function refreshMatches() {
  const [m, c] = await Promise.all([api('/api/matches'), api('/api/conversations')])
  state.matches = m.matches
  state.conversations = c.conversations
}

function setScreen(screen, tab = state.activeTab) {
  state.activeScreen = screen
  state.activeTab = tab
  render()
}

function shell(mobileHtml, workspaceHtml = '') {
  return `
    <section class="shell">
      <section class="mobile-frame" aria-label="Kyddos mobile app preview">
        ${header()}
        <section class="screen-scroll">${mobileHtml}</section>
        ${bottomNav()}
      </section>
      <aside class="workspace" aria-label="Developer handoff and admin workspace">
        ${workspaceHtml || desktopOverview()}
      </aside>
      ${state.toast ? `<div class="toast">${safe(state.toast)}</div>` : ''}
    </section>`
}

function header() {
  const sub = state.boot?.subscription
  return `<header class="app-header">
    <div class="device-status"><span>9:41</span><span><i class="fa-solid fa-signal"></i> <i class="fa-solid fa-wifi"></i> <i class="fa-solid fa-battery-three-quarters"></i></span></div>
    <div class="brand-row">
      <div class="brand-lockup">
        <div class="logo-mark"><i class="fa-solid fa-shield-heart"></i></div>
        <div><div class="logo-title">Kyddos</div><div class="logo-subtitle">Safer playdates, parent to parent</div></div>
      </div>
      <span class="badge gold"><i class="fa-solid fa-sparkles"></i>${planName(sub?.plan || 'free')}</span>
    </div>
  </header>`
}

function bottomNav() {
  const nav = [
    ['Discover', 'fa-compass'], ['Requests', 'fa-paper-plane'], ['Matches', 'fa-heart-circle-check'], ['Messages', 'fa-comments'], ['Menu', 'fa-bars']
  ]
  return `<nav class="bottom-nav" aria-label="Primary mobile navigation">
    ${nav.map(([name, icon]) => `<button class="nav-btn ${state.activeTab === name ? 'active' : ''}" onclick="setScreen('${name}','${name}')"><i class="fa-solid ${icon}"></i><span>${name}</span></button>`).join('')}
  </nav>`
}

function desktopOverview() {
  return `<div class="workspace-grid">
    <section>
      <div class="hero-card launch-hero">
        <span class="badge"><i class="fa-solid fa-wand-magic-sparkles"></i>Redesigned from the visual reference into a warmer parent-first brand</span>
        <h1>Playdates parents can feel good about.</h1>
        <p>A polished Kyddos V1 experience with verified parent discovery, soft premium color, friendly avatar-only child profiles, subscription/credit gates, Travel Mode, nanny beta, safety tooling, and admin oversight.</p>
        <div class="trust-row"><span><i class="fa-solid fa-user-shield"></i> Verified adults</span><span><i class="fa-solid fa-location-dot"></i> No child geolocation</span><span><i class="fa-solid fa-camera-slash"></i> No real child photos</span></div>
        <div class="btn-row">
          <button class="btn primary" onclick="setScreen('Welcome','Menu')">Preview onboarding</button>
          <button class="btn outline" onclick="setScreen('Discover','Discover')">Open Discover</button>
          <button class="btn outline" onclick="setScreen('Admin','Menu')">Admin dashboard</button>
        </div>
      </div>
      ${allScreensMatrix()}
    </section>
    <section>${adminPreview()}</section>
  </div>`
}

function allScreensMatrix() {
  const screens = state.boot?.screens || []
  return `<section class="card">
    <h2>Screen coverage</h2>
    <p>Every packet screen is represented with fields, buttons, validation notes, safety states, empty/loading/error examples, or admin/system states as applicable.</p>
    <div class="pill-list">${screens.map(s => `<button class="pill teal" onclick="setScreen('${s}','${['Discover','Requests','Matches','Messages'].includes(s) ? s : 'Menu'}')">${safe(s)}</button>`).join('')}</div>
  </section>`
}

function adminPreview() {
  const cards = state.admin?.cards || {}
  return `<section class="card">
    <div class="row-between"><h2>Admin dashboard</h2><span class="badge purple">Web admin</span></div>
    <div class="kpi-grid">
      ${Object.entries(cards).slice(0, 8).map(([k, v]) => `<div class="kpi"><strong>${safe(v)}</strong><span>${safe(k.replace(/[A-Z]/g, m => ' ' + m).trim())}</span></div>`).join('')}
    </div>
    <div class="safety-note" style="margin-top:12px"><i class="fa-solid fa-lock"></i> Admin message review is limited to reported or safety-flagged conversations only.</div>
  </section>`
}

function screenTitle(title, copy = '') {
  return `<div class="screen-heading"><span class="screen-kicker">Kyddos V1</span><h2>${safe(title)}</h2>${copy ? `<p>${safe(copy)}</p>` : ''}</div>`
}

function trustStrip() {
  return `<div class="trust-strip"><span><i class="fa-solid fa-circle-check"></i> Verified parents</span><span><i class="fa-solid fa-child-reaching"></i> Avatar-only kids</span><span><i class="fa-solid fa-comments"></i> Message after match</span></div>`
}

function heroVisual() {
  return `<div class="family-visual" aria-hidden="true"><div class="orbit one">🦊</div><div class="orbit two">🐻</div><div class="orbit three">🦉</div><div class="parent-bubble"><i class="fa-solid fa-shield-heart"></i><span>Family Fit</span></div></div>`
}

function render() {
  if (state.loading) {
    app.innerHTML = shell(`<div class="card"><div class="loading-shimmer" style="height:34px;width:70%"></div><br><div class="loading-shimmer"></div><br><div class="loading-shimmer" style="height:180px"></div></div>`)
    return
  }
  if (state.error) {
    app.innerHTML = shell(`<div class="state-box error-box"><h2>Network unavailable</h2><p>${safe(state.error)}</p><button class="btn primary" onclick="loadAll()">Try again</button></div>`)
    return
  }
  const route = {
    'Discover': discoverScreen,
    'Requests': requestsScreen,
    'Matches': matchesScreen,
    'Messages': messagesScreen,
    'Chat Thread': chatThreadScreen,
    'Menu': menuScreen,
    'Welcome': welcomeScreen,
    'How It Works': howScreen,
    'Safety First': safetyFirstScreen,
    'Sign Up': signUpScreen,
    'Login': loginScreen,
    'Email Verification': emailVerificationScreen,
    'Phone Verification': phoneVerificationScreen,
    'Identity Verification': identityVerificationScreen,
    'Approval Pending': approvalPendingScreen,
    'Parent Basics': parentBasicsScreen,
    'Hosting Preferences': hostingScreen,
    'Parent Style': parentStyleScreen,
    'Add Kydo': addKydoScreen,
    'Kydo Personality': kydoPersonalityScreen,
    'Kydo Interests': kydoInterestsScreen,
    'Kydo Safety / Comfort': kydoSafetyScreen,
    'Match Preferences': matchPrefsScreen,
    'Time Out Box': timeOutBoxScreen,
    'Profile Detail': profileDetailScreen,
    'Request Playdate': requestPlaydateScreen,
    'Incoming Request': incomingRequestScreen,
    'Match Confirmation': matchConfirmationScreen,
    'Manual Browse': manualBrowseScreen,
    'Travel Mode': travelModeScreen,
    'Nanny Beta Landing': nannyLandingScreen,
    'Nanny Profile Setup': nannySetupScreen,
    'Nanny Detail': nannyDetailScreen,
    'Public Safety Feed': safetyFeedScreen,
    'Subscription / Credits': subscriptionScreen,
    'Safety Center': safetyCenterScreen,
    'Settings': settingsScreen,
    'Admin': adminScreen,
    'Data Model': dataModelScreen
  }[state.activeScreen] || discoverScreen
  app.innerHTML = shell(route(), desktopOverview())
}

function welcomeScreen() {
  return `<section class="hero-card welcome-hero">
    <span class="badge"><i class="fa-solid fa-shield-heart"></i>Verified parents only</span>
    <h1>Find your kid’s next favorite playdate.</h1>
    <p>Kyddos helps parents meet compatible families nearby with request-based matching, avatar-only child profiles, and safety controls designed for real life.</p>
    ${heroVisual()}
    ${trustStrip()}
    <div class="btn-row"><button class="btn primary full" onclick="setScreen('How It Works','Menu')">Get Started</button><button class="btn outline full" onclick="setScreen('Login','Menu')">I already have an account</button></div>
    <div class="parent-quote">“A calmer way to build a village — without public kid photos, school info, or random messages.”</div>
  </section>`
}
function howScreen() { return `<section class="card story-card">${screenTitle('How It Works', 'A simple, parent-controlled path from profile to playdate.')}${steps(['Create a verified parent profile and avatar-only Kydo profile.', 'Review Family Fit cards ranked by age, interests, logistics, and safety preferences.', 'Send a Request Playdate, match mutually, then message to plan a public first meet.'])}<div class="btn-row"><button class="btn outline" onclick="setScreen('Welcome','Menu')">Back</button><button class="btn primary" onclick="setScreen('Safety First','Menu')">Continue</button></div></section>` }
function safetyFirstScreen() { return `<section class="card story-card">${screenTitle('Safety First', 'Designed to reassure cautious parents before they ever browse.')}<div class="safety-grid">${['Verified parents only','No child accounts','No real child photos','No school visibility','No child geolocation','Report + block controls'].map(x=>`<div><i class="fa-solid fa-check"></i><strong>${x}</strong></div>`).join('')}</div><p>This helps keep Kyddos safer for families. Sensitive preferences stay private, and admin message review is limited to reported or safety-flagged threads.</p><button class="btn primary full" onclick="setScreen('Sign Up','Menu')">Create a safer family profile</button></section>` }
function signUpScreen() { return formScreen('Sign Up', 'Create Account', ['First name', 'Last name', 'Email', 'Phone', 'Password', 'Confirm password', 'Referral code optional'], 'Role: Parent/Guardian or Nanny Beta. Terms and privacy acknowledgement required. Validation: valid email/phone, password minimum, terms required. Error states: email exists, weak password, invalid referral code, phone invalid.', 'Email Verification') }
function loginScreen() { return formScreen('Login', 'Sign In', ['Email or phone', 'Password'], 'Validation: required fields. Error states: wrong password, account pending, suspended, verification incomplete.', 'Discover', ['Forgot Password', 'Create Account']) }
function emailVerificationScreen() { return codeScreen('Email Verification', '6-digit email code', 'Email status updates to verified.', 'Phone Verification') }
function phoneVerificationScreen() { return codeScreen('Phone Verification', 'SMS code', 'Phone status updates to verified.', 'Identity Verification') }
function identityVerificationScreen() { return `<section class="card">${screenTitle('Identity Verification', 'This helps keep Kyddos safer for families.')}${checkList(['Consent to third-party verification', 'ID verification handoff', 'Live selfie/liveness handoff', 'Address/billing verification handoff'])}<p>We verify identity, but we do not sell your information. Kyddos stores vendor status, timestamp, reference ID, and admin-review flags — not raw documents where vendors can retain them.</p><div class="pill-list">${['Pending','Approved','Failed','Needs Manual Review'].map(x=>`<span class="pill">${x}</span>`).join('')}</div><div class="btn-row"><button class="btn primary" onclick="toast('Mock vendor verification started')">Start Verification</button><button class="btn outline" onclick="setScreen('Approval Pending','Menu')">Continue Later</button><button class="btn ghost" onclick="toast('Verification exists for safety and quality control, not friction.')">View Why We Ask</button></div></section>` }
function approvalPendingScreen() { const u=state.boot.currentUser; return `<section class="card">${screenTitle('Approval Pending', 'You can complete your profile while approval finishes, but browsing and requests unlock after approval.')} ${checkList([`Email verified: ${u.email_verified?'Yes':'No'}`,`Phone verified: ${u.phone_verified?'Yes':'No'}`,`Identity vendor: ${u.vendor.identity}`,`Address/billing: ${u.vendor.address || 'pending'}`,`Registry: ${u.vendor.registry || 'pending'}`])}<div class="btn-row"><button class="btn primary" onclick="setScreen('Parent Basics','Menu')">Complete Profile</button><button class="btn outline" onclick="toast('Support placeholder opened')">Contact Support</button></div></section>` }

function parentBasicsScreen() { return formScreen('Parent Basics', 'Next', ['Display first name', 'City / general area', 'Family type', 'Seeking: one playmate, play group, village, peer circle', 'Parent style'], 'Validation: display name, city, and seeking type required. Acceptance: parent profile core created.', 'Hosting Preferences') }
function hostingScreen() { return formScreen('Hosting Preferences', 'Next', ['We can host / prefer hosted / public venues / all fine', 'Indoor / outdoor / both', 'Outdoor amenities', 'Number of children comfortable hosting', 'Pets summary', 'Pool / trampoline safety disclosure'], 'Hosting summary feeds matching and profile display.', 'Parent Style') }
function parentStyleScreen() { return formScreen('Parent Style', 'Next', ['Laid back', 'Highly involved', 'Responsible', 'Fun', 'Quiet supervision', 'Small talk', 'Join play', 'Build parent friendships'], 'Parent compatibility data saved.', 'Add Kydo') }
function addKydoScreen() { return formScreen('Add Kydo', 'Create Avatar & Next', ['Child nickname', 'DOB or age band', 'Gender identity / preference field', 'Avatar builder', 'Optional keyword collage'], 'Validation: nickname, age band, avatar required. Error: age outside allowed range, incomplete avatar. Child public profile uses avatar, not a real photo.', 'Kydo Personality') }
function kydoPersonalityScreen() { return formScreen('Kydo Personality', 'Next', ['Introvert / Extrovert / Depends', 'Kydo type: Backyardigan, Indoorsy, Sportsy, Outdoorsy, Gamer, Artsy Creative, Pretend Play, Dance Party, Action Figures & Dolls, Fashion, Builder/Maker'], 'Personality factors feed match scoring.', 'Kydo Interests') }
function kydoInterestsScreen() { return `<section class="card">${screenTitle('Kydo Interests', 'Select top interests. Super Premium can select up to 7.')}<div class="pill-list">${['STEM','outdoor play','dolls/action figures','sensory play','running/yelling','video games','swimming','Legos','dancing','biking','fishing','board games','arts/crafts','reading','pretend play'].map(x=>`<button class="pill">${x}</button>`).join('')}</div><div class="notice" style="margin:14px 0">Upgrade prompt: Add more interests with Super Premium.</div><button class="btn primary full" onclick="setScreen('Kydo Safety / Comfort','Menu')">Next</button></section>` }
function kydoSafetyScreen() { return formScreen('Kydo Safety / Comfort', 'Next', ['Allergies', 'Pet comfort', 'Special considerations', 'Screen-time preference', 'Approved content rating', 'Grown-up language tolerance'], 'Privacy note: safety details are private and only used for matching unless a parent chooses to share after a match.', 'Match Preferences') }
function matchPrefsScreen() { return formScreen('Match Preferences', 'Save Preferences', ['Distance radius: 1–25 miles', 'Preferred first meet: public venue, we host, they host, flexible', 'Child age range', 'Match threshold: Exact / Recommended / Partial / Any Match'], 'Validation: radius and threshold required. Acceptance: discovery feed generated.', 'Time Out Box') }
function timeOutBoxScreen() { return `<section class="card">${screenTitle('Time Out Box', 'Private Super Premium preference feature. Never publicly visible.')}<div class="notice">Free locked. Premium preview. Super Premium full access.</div>${formFields(['Private deal-breakers','Discussion boundaries','Home safety boundaries','Lifestyle boundaries','Firearm comfort preferences','Substance exposure preferences'])}<div class="btn-row"><button class="btn primary" onclick="toast('Private filters saved')">Save</button><button class="btn coral" onclick="setScreen('Subscription / Credits','Menu')">Upgrade</button><button class="btn outline" onclick="setScreen('Discover','Discover')">Skip</button></div></section>` }

function discoverScreen() {
  const rows = state.discover
  if (!rows.length) return `<section>${screenTitle('Discover', 'Building matches')}${emptyNoMatches()}</section>`
  return `<section class="discover-stack">
    <div class="discover-hero"><span class="badge"><i class="fa-solid fa-heart-circle-check"></i>Recommended</span><h2>Families that fit your FLOW.</h2><p>Swipe-style discovery with parent-safe actions: Pass, Save, Request Playdate.</p></div>
    ${rows.map(profileCard).join('')}
  </section>`
}

function profileCard(row, manual = false) {
  const { user, parent, kydo, fit } = row
  const showScore = ['premium','super_premium'].includes(state.boot.subscription.plan)
  return `<article class="card discovery-card">
    ${manual ? `<div class="notice">Manual Browse — Below Your Current Match Threshold. Review Fit Details Before Requesting.</div>` : ''}
    <div class="match-photo-panel">
      <div class="avatar xl">${iconFor(kydo.avatar_id)}</div>
      <div class="fit-ring" style="--score:${fit.score}"><span>${showScore ? fit.score+'%' : fit.label.split(' ')[0]}</span></div>
      <div class="sparkle-dot"></div>
    </div>
    <div class="row-between profile-title-row">
      <div><h2>${safe(kydo.child_nickname)}</h2><p>${safe(kydo.age_band)} • ${safe(parent.city_area)} • ${fit.distance} mi away</p></div>
      <span class="badge"><i class="fa-solid fa-user-shield"></i>Verified</span>
    </div>
    <div class="pill-list" style="margin:12px 0"><span class="pill teal">${safe(fit.label)}</span><span class="pill">${safe(parent.hosting_preference)}</span><span class="pill">${safe(parent.seeking_type)}</span></div>
    <p><strong>Why this fit:</strong> ${safe(fit.sharedInterests.join(', ') || 'Review fit details')}. Parent style: ${safe(parent.parent_style.join(', '))}.</p>
    <div class="action-dock"><button class="circle-action" onclick="toast('Passed safely')"><i class="fa-solid fa-xmark"></i><span>Pass</span></button><button class="circle-action save" onclick="toast('Saved for later')"><i class="fa-regular fa-bookmark"></i><span>Save</span></button><button class="btn primary request-btn" onclick="selectProfile('${user.user_id}','Request Playdate')">Request Playdate</button><button class="circle-action" onclick="selectProfile('${user.user_id}','Profile Detail')"><i class="fa-solid fa-chevron-right"></i><span>Details</span></button></div>
  </article>`
}
window.selectProfile = async (userId, screen) => { state.selectedProfile = await api(`/api/profile/${userId}`); setScreen(screen, 'Discover') }

function profileDetailScreen() {
  const p = state.selectedProfile || state.discover[0]
  if (!p) return `<section class="state-box"><h2>No profile selected</h2><button class="btn primary" onclick="setScreen('Discover','Discover')">Back to Discover</button></section>`
  const { user, parent, kydo, fit } = p
  return `<section class="card profile-detail-card">
    <div class="match-photo-panel tall"><div class="avatar xl">${iconFor(kydo.avatar_id)}</div><div class="fit-ring" style="--score:${fit.score}"><span>${fit.score}%</span></div></div>
    <div class="row-between"><div><span class="screen-kicker">Public Kydo profile</span><h2>${safe(kydo.child_nickname)}</h2><p>${safe(kydo.age_band)} • ${safe(parent.city_area)} • ${fit.distance} miles away</p></div><span class="badge"><i class="fa-solid fa-shield"></i>${safe(user.verification_status)}</span></div>
    <div class="pill-list" style="margin:14px 0">${kydo.interests_top.map(i=>`<span class="pill teal">${safe(i)}</span>`).join('')}</div>
    <h3>Shared match points</h3><p>${safe(fit.sharedInterests.join(', ') || 'Limited overlap. Review partial fit highlights.')}</p>
    <h3>Fit breakdown</h3><div class="fit-bars">${Object.entries(fit.breakdown).map(([k,v])=>`<div><span>${safe(k)}</span><strong>${v}</strong><i style="width:${Math.min(100, Number(v)*3)}%"></i></div>`).join('')}</div>
    ${fit.mismatchHighlights.length ? `<div class="notice" style="margin-top:12px">${safe(fit.mismatchHighlights.join(' • '))}</div>` : ''}
    <div class="safety-note" style="margin:12px 0">Never shown before match: full address, real child photo, school, phone, Time Out Box answers, or raw verification data.</div>
    <div class="btn-row"><button class="btn primary" onclick="setScreen('Request Playdate','Discover')">Request Playdate</button><button class="btn outline" onclick="toast('Saved')">Save</button><button class="btn outline" onclick="setScreen('Discover','Discover')">Pass</button></div>
  </section>`
}

function requestPlaydateScreen() { return `<section class="card">${screenTitle('Request Playdate', 'Suggest a safe first meet.')} ${formFields(['Suggested first meet: park, indoor play place, YMCA, ice cream/bakery, other public venue, flexible', 'Optional message', 'Proposed date/time optional'])}<div class="notice">Validation: verified user required and request limit checked. If out of requests: upgrade or buy credits.</div><div class="btn-row"><button class="btn primary" onclick="sendRequest()">Send Request</button><button class="btn outline" onclick="setScreen('Discover','Discover')">Cancel</button></div></section>` }
window.sendRequest = async () => { const target = state.selectedProfile?.user?.user_id || state.discover[0]?.user?.user_id; try { const r = await api('/api/requests', { method:'POST', body: JSON.stringify({ receiver_user_id: target, suggested_meet_type:'Public park', message_preview:'Would you like to try a public park meetup?' }) }); toast(`Request delivered. ${r.remaining} monthly requests left.`); const reqs=await api('/api/requests'); state.requests=reqs.requests; setScreen('Requests','Requests') } catch(e){ toast(e.message) } }

function incomingRequestScreen() { const r = state.requests.find(x=>x.request_status==='incoming') || state.requests[0]; return requestDetail(r) }
function requestDetail(r) { if(!r) return `<section class="state-box"><h2>No request selected</h2></section>`; return `<section class="card">${screenTitle('Incoming Request', 'Review fit, safety badges, and suggested meet.')}<span class="badge gold">${safe(r.match_label)} • ${r.match_score}%</span><p>${safe(r.message_preview || 'No message included.')}</p><div class="pill-list"><span class="pill">${safe(r.suggested_meet_type)}</span><span class="pill"><i class="fa-solid fa-shield"></i> Safety badges</span><span class="pill">Shared interests</span></div><div class="btn-row" style="margin-top:14px"><button class="btn primary" onclick="acceptRequest('${r.request_id}')">Accept</button><button class="btn outline" onclick="updateRequest('${r.request_id}','declined')">Decline</button><button class="btn outline" onclick="updateRequest('${r.request_id}','saved')">Save for Later</button><button class="btn ghost" onclick="toast('Report flow opened')">Report</button></div></section>` }
window.acceptRequest = async (id) => { await updateRequest(id,'accepted',false); await refreshMatches(); setScreen('Match Confirmation','Matches') }
window.updateRequest = async (id,status,rerender=true) => { await api(`/api/requests/${id}`, { method:'PATCH', body:JSON.stringify({status}) }); state.requests=(await api('/api/requests')).requests; toast(`Request ${status}`); if(rerender) render() }
function matchConfirmationScreen() { return `<section class="hero-card"><span class="badge"><i class="fa-solid fa-heart"></i>Match</span><h1>It’s a Kyddos Match.</h1><p>You can now message this parent. Kyddos recommends public venues for first meetings.</p><div class="btn-row"><button class="btn primary" onclick="setScreen('Messages','Messages')">Say Hello</button><button class="btn outline" onclick="setScreen('Messages','Messages')">Plan Playdate</button><button class="btn ghost" onclick="setScreen('Discover','Discover')">Keep Discovering</button></div></section>` }

function requestsScreen() { return `<section>${screenTitle('Requests', 'Track incoming, sent, saved, expired, and declined requests.')}<div class="tab-row">${['Incoming','Sent','Saved','Expired','Declined'].map((t,i)=>`<button class="tab ${i===0?'active':''}">${t}</button>`).join('')}</div>${state.requests.length ? state.requests.map(r=>`<article class="card tight"><div class="row-between"><div><h3>${safe(r.match_label)} • ${r.match_score}%</h3><p>${safe(r.suggested_meet_type)} • ${safe(r.request_status)}</p></div><button class="btn primary" onclick="setScreen('Incoming Request','Requests')">View</button></div><div class="btn-row"><button class="btn outline" onclick="acceptRequest('${r.request_id}')">Accept</button><button class="btn outline" onclick="updateRequest('${r.request_id}','declined')">Decline</button><button class="btn ghost" onclick="updateRequest('${r.request_id}','cancelled')">Cancel</button><button class="btn ghost" onclick="toast('Reminder queued')">Remind</button></div></article>`).join('') : `<div class="state-box"><h2>No requests yet</h2><p>Saved and sent requests will appear here.</p></div>`}</section>` }
function matchesScreen() { return `<section>${screenTitle('Matches', 'Only mutual matches appear here.')} ${state.matches.length ? state.matches.map(m=>`<article class="card"><h2>Matched family</h2><p>Shared interests, Kydo avatar, and last contact are shown after acceptance.</p><div class="btn-row"><button class="btn primary" onclick="setScreen('Messages','Messages')">Message</button><button class="btn outline" onclick="setScreen('Messages','Messages')">Plan Playdate</button><button class="btn ghost" onclick="toast('Connection ended')">End Connection</button></div></article>`).join('') : `<div class="state-box"><h2>No matches yet</h2><p>Accept an incoming request or send a playdate request to create a match.</p><button class="btn primary" onclick="setScreen('Incoming Request','Requests')">Review incoming request</button></div>`}</section>` }
function messagesScreen() { return `<section>${screenTitle('Messages', 'Messaging opens only after mutual match.')}<div class="safety-note">For first meetings, Kyddos recommends public venues.</div>${state.conversations.length ? state.conversations.map(cv=>`<article class="card tight"><div class="row-between"><div><h3>Parent conversation</h3><p>${safe(cv.messages?.[0]?.body || 'No messages yet')} • unread 0 • playdate indicator ready</p></div><button class="btn primary" onclick="openChat('${cv.conversation_id}')">Open</button></div></article>`).join('') : `<div class="state-box"><h2>No messages yet</h2><p>Accept a request to start a post-match conversation. Free users are limited by active conversations, not blocked from all chat.</p></div>`}</section>` }
window.openChat = async (id) => { const data = await api(`/api/conversations/${id}/messages`); state.activeChat = { id, messages:data.messages }; state.activeScreen='Chat Thread'; state.activeTab='Messages'; render() }
function chatThreadScreen() { const chat=state.activeChat; return `<section class="card">${screenTitle('Chat Thread','Messages only after mutual match.')}<div class="safety-note">For first meetings, Kyddos recommends public venues.</div><div style="display:grid;gap:8px;margin:12px 0">${(chat?.messages||[]).map(m=>`<div class="pill ${m.sender_user_id==='u_parent'?'teal':''}" style="border-radius:16px;white-space:normal">${safe(m.body)}</div>`).join('') || '<p>No messages yet.</p>'}</div>${formFields(['Type message'])}<div class="btn-row"><button class="btn primary" onclick="sendMessage()">Send</button><button class="btn outline" onclick="toast('Suggested venue shared')">Suggested venue</button><button class="btn outline" onclick="toast('Availability shared')">Share availability</button><button class="btn ghost" onclick="reportConversation()">Report</button><button class="btn ghost" onclick="toast('Blocked user')">Block</button></div><p><small>Admin cannot casually read messages; report-triggered review only.</small></p></section>` }
window.sendMessage = async()=>{ if(!state.activeChat?.id) return; await api(`/api/conversations/${state.activeChat.id}/messages`,{method:'POST',body:JSON.stringify({body:'Hello! A public park meetup sounds good.'})}); await openChat(state.activeChat.id); toast('Message sent') }
window.reportConversation = async()=>{ if(!state.activeChat?.id) return; await api('/api/reports',{method:'POST',body:JSON.stringify({reported_user_id:'u_river',conversation_id:state.activeChat.id,reason:'Safety concern',details:'Review requested'})}); state.admin=await api('/api/admin/dashboard'); toast('Report sent to safety team') }

function manualBrowseScreen() { return `<section>${screenTitle('Manual Browse','Profiles below your threshold or outside recommended feed.')} ${state.manual.map(r=>profileCard(r,true)).join('') || emptyNoMatches()}</section>` }
function travelModeScreen() { return `<section class="card">${screenTitle('Travel Mode','Simple filter/add-on. No child location tracking.')} ${formFields(['Destination city/place','Trip start date','Trip end date','Child age band','Play interests','Preferred meet type'])}<div class="notice">Free: buy with credits. Premium: 1 active travel search/month. Super Premium: 3/month.</div><div class="btn-row"><button class="btn primary" onclick="startTravel()">Start Travel Mode</button><button class="btn outline" onclick="toast('5 credits would be used')">Use Credits</button><button class="btn coral" onclick="setScreen('Subscription / Credits','Menu')">Upgrade</button></div></section>` }
window.startTravel=async()=>{ try{const r=await api('/api/travel-mode',{method:'POST',body:JSON.stringify({destination:'San Diego',start_date:'2026-06-12',end_date:'2026-06-19',child_age_band:'6–8',play_interests:['parks'],preferred_meet_type:'public venue'})}); toast(`Travel search created for ${r.travelSearch.destination}`)}catch(e){toast(e.message)} }
function nannyLandingScreen(){return `<section class="card">${screenTitle('Nanny Beta','Limited beta listings with vendor/admin approval.')}<p>Browse approved nanny beta profiles, become a nanny, or buy intro credits. Hiring, payroll, taxes, and contracting are excluded from V1; show safety disclaimer only.</p><div class="btn-row"><button class="btn primary" onclick="setScreen('Nanny Detail','Menu')">Browse Nannies</button><button class="btn outline" onclick="setScreen('Nanny Profile Setup','Menu')">Become a Nanny</button><button class="btn coral" onclick="setScreen('Subscription / Credits','Menu')">Buy Intro Credits</button></div></section>`}
function nannySetupScreen(){return formScreen('Nanny Profile Setup','Submit for Review',['Display name','Profile photo','City/general area','Age','Experience summary','Availability','Part-time/full-time/on-call/as-needed','Family home/sitter home','Travel availability','Overnight availability','Transportation offered','Languages','Allergies/medical limitations','Hobbies/pastimes'],'Validation: required fields and verification required before visibility. Profile enters admin approval queue.','Nanny Beta Landing')}
function nannyDetailScreen(){const n=state.nannies[0]; return `<section class="card">${screenTitle('Nanny Detail','Approved beta listing.')}${n?`<img src="${n.profile_photo}" alt="Approved nanny avatar" style="width:92px;height:92px;border-radius:28px;background:#f2f2f2"><h2>${safe(n.display_name)}</h2><p>${safe(n.city_area)} • ${n.age} • ${safe(n.experience_summary)}</p><div class="pill-list"><span class="pill teal">Background ${n.background_check_status}</span><span class="pill teal">Driving ${n.driving_check_status}</span><span class="pill">${safe(n.service_type.join(', '))}</span></div>`:'<p>No approved nannies yet.</p>'}<div class="btn-row" style="margin-top:14px"><button class="btn primary" onclick="nannyIntro()">Send Intro Request</button><button class="btn outline" onclick="toast('Saved nanny')">Save</button><button class="btn ghost" onclick="toast('Report flow opened')">Report</button></div></section>`}
window.nannyIntro=async()=>{try{const r=await api('/api/nannies/intro',{method:'POST',body:JSON.stringify({nanny_profile_id:'n_1'})});toast(r.message)}catch(e){toast(e.message)}}
function safetyFeedScreen(){return `<section>${screenTitle('Public Safety Feed','Official/public Amber Alert or public safety feed by broad area only.')}${state.alerts.map(a=>`<article class="card tight"><span class="badge ${a.severity==='info'?'coral':'gray'}">${safe(a.type)}</span><h3>${safe(a.title)}</h3><p>${safe(a.area)} — ${safe(a.body)}</p><div class="btn-row"><button class="btn outline">View Details</button><button class="btn ghost">Dismiss</button><button class="btn ghost">Alert Settings</button></div></article>`).join('')}<div class="safety-note">No user-triggered emergency alerts. No child location tracking.</div></section>`}
function subscriptionScreen(){const sub=state.boot.subscription; const packs=[['5 credits','$4.99','$1.00'],['12 credits','$9.99','$0.83'],['30 credits','$19.99','$0.67'],['75 credits','$39.99','$0.53']]; return `<section>${screenTitle('Subscription / Credits','Helpful monetization, not punitive chat blocking.')}<div class="pricing-grid">${Object.entries(state.boot.planLimits).map(([p,l])=>`<article class="price-card ${p===sub.plan?'featured':''}"><span class="badge ${p===sub.plan?'gold':''}">${p===sub.plan?'Current plan':'Plan'}</span><h2>${planName(p)}</h2><p>${l.requestsMonthly} requests/mo • ${l.children} Kydo profiles • ${l.threshold}</p><button class="btn ${p===sub.plan?'outline':'primary'} full" onclick="subscribe('${p}')">${p===sub.plan?'Keep plan':'Upgrade'}</button></article>`).join('')}</div><div class="card"><div class="row-between"><h2>Credit packs</h2><span class="badge gold">${sub.credits_balance} credits</span></div>${packs.map(p=>`<div class="credit-row"><div><strong>${p[0]}</strong><p>${p[1]} • ${p[2]}/credit</p></div><button class="btn outline" onclick="buyCredits(${parseInt(p[0])})">Buy Credits</button></div>`).join('')}<div class="notice">Credit uses: 3 for extra 5 requests, 5 for Travel Mode, 6 for nanny intro, 5 for extra child profile, 4 for boost, 1 for extended manual-browse fit breakdown.</div><p><small>Required disclosure: price, renewal term, cancellation path, included features. Real purchases route through App Store / Play Store IAP where required.</small></p></div></section>`}
window.subscribe=async(plan)=>{const r=await api('/api/subscribe',{method:'POST',body:JSON.stringify({plan})});state.boot.subscription=r.subscription;toast(`Plan updated to ${planName(plan)}`);render()}
window.buyCredits=async(amount)=>{const r=await api('/api/credits',{method:'POST',body:JSON.stringify({amount})});state.boot.subscription=r.subscription;toast(`${amount} credits added`);render()}
function safetyCenterScreen(){return `<section class="card">${screenTitle('Safety Center','Manage trust and safety controls.')} ${checkList(['Verification status','Blocked users','Reported users','Safety tips','Privacy settings','Data controls','Contact support'])}<button class="btn primary" onclick="setScreen('Public Safety Feed','Menu')">Public safety feed</button></section>`}
function settingsScreen(){return `<section class="card">${screenTitle('Settings','Manage account safely.')} ${checkList(['Account','Notifications','Language','Phone number','Password','Privacy','Subscription','Support','Logout'])}</section>`}
function menuScreen(){return `<section>${screenTitle('Menu','Account, safety, subscription, and beta tools.')}<div class="menu-grid">${['Welcome','Parent Basics','Match Preferences','Time Out Box','Manual Browse','Travel Mode','Nanny Beta Landing','Public Safety Feed','Subscription / Credits','Safety Center','Settings','Admin','Data Model'].map((s,i)=>`<button class="menu-tile" onclick="setScreen('${s}','Menu')"><i class="fa-solid ${['fa-house','fa-user-pen','fa-sliders','fa-lock','fa-compass','fa-plane','fa-user-nurse','fa-bell','fa-gem','fa-shield-halved','fa-gear','fa-chart-line','fa-database'][i]}"></i><span>${s}</span></button>`).join('')}</div></section>`}

function adminScreen(){const a=state.admin;return `<section>${screenTitle('Admin Dashboard','Web-based internal dashboard with approval, verification, moderation, subscription, referral, and audit tools.')}<div class="admin-nav">${['Dashboard','User Approvals','Verification Status','Nanny Beta','Reports','Safety Alerts','Subscriptions / Credits','Referral Codes','Audit Log','Settings'].map(x=>`<button class="tab active">${x}</button>`).join('')}</div>${adminPreview()}<section class="card"><h2>Approval Queue Logic</h2>${checkList(a.approvalRules)}</section><section class="card"><h2>Vendor Status Mapping</h2><div class="pill-list">${Object.entries(a.vendorStatusMapping).map(([k,v])=>`<span class="pill">${k} → ${v}</span>`).join('')}</div></section><section class="card"><h2>Queues</h2><div class="table-wrap"><table><thead><tr><th>Queue</th><th>Count</th><th>Controls</th></tr></thead><tbody>${Object.entries(a.queues).filter(([k])=>k!=='auditLogs').map(([k,v])=>`<tr><td>${safe(k)}</td><td>${Array.isArray(v)?v.length:'—'}</td><td>Suspend / ban / reinstate / approve / review / credit adjust</td></tr>`).join('')}</tbody></table></div><div class="safety-note">${safe(a.messageReviewRule)}</div></section><section class="card"><h2>Audit Log</h2>${a.queues.auditLogs.slice(0,6).map(l=>`<p><strong>${safe(l.action)}</strong> — ${safe(l.target)}<br><small>${safe(l.created_at)} • ${safe(l.note)}</small></p>`).join('')}</section></section>`}
function dataModelScreen(){return `<section class="card">${screenTitle('Database / Data Model','Integration-ready D1 schema and in-memory demo data are included.')}<div class="pill-list">${['Users','Parent profiles','Kydo profiles','Match preferences','Match requests','Matches','Conversations/messages','Nanny beta profiles','Subscriptions','Credits ledger','Referrals','Reports','Blocks','Verification statuses','Admin audit logs'].map(x=>`<span class="pill teal">${x}</span>`).join('')}</div><div class="safety-note" style="margin-top:14px">Vendor placeholders store status/reference IDs only. Production requires real identity, liveness, address, registry, background, driving, payment, SMS/email, and official safety feed credentials.</div></section>`}

function formScreen(title, button, fields, note, next, secondary=[]) { return `<section class="card">${screenTitle(title)}${formFields(fields)}<div class="notice">${safe(note)}</div><div class="btn-row" style="margin-top:14px"><button class="btn primary" onclick="setScreen('${next}','Menu')">${button}</button>${secondary.map(s=>`<button class="btn outline" onclick="toast('${s} placeholder')">${s}</button>`).join('')}<button class="btn ghost" onclick="toast('Saved and exited')">Save & Exit</button></div></section>` }
function formFields(fields){return `<div class="form-grid">${fields.map(f=>`<div class="input-group"><label>${safe(f)}</label>${f.toLowerCase().includes('message')||f.toLowerCase().includes('summary')||f.toLowerCase().includes('boundaries')||f.toLowerCase().includes('deal')?`<textarea class="textarea" placeholder="${safe(f)}"></textarea>`:`<input class="input" placeholder="${safe(f)}" />`}</div>`).join('')}</div>`}
function codeScreen(title,label,accept,next){return `<section class="card">${screenTitle(title)}${formFields([label])}<div class="notice">Loading state: verifying code. Error state: invalid or expired code. ${safe(accept)}</div><div class="btn-row"><button class="btn primary" onclick="setScreen('${next}','Menu')">Continue</button><button class="btn outline" onclick="toast('Code resent')">Resend Code</button></div></section>`}
function steps(items){return `<div class="step-list">${items.map((x,i)=>`<div class="step-item"><span class="step-num">${i+1}</span><p>${safe(x)}</p></div>`).join('')}</div>`}
function checkList(items){return `<div class="step-list">${items.map(x=>`<div class="step-item"><span class="step-num"><i class="fa-solid fa-check"></i></span><p>${safe(x)}</p></div>`).join('')}</div>`}
function emptyNoMatches(){return `<div class="state-box"><h2>No matches meet your threshold</h2><p>Try one of these options:</p><div class="btn-row" style="justify-content:center"><button class="btn outline" onclick="toast('Radius expanded')">Expand radius</button><button class="btn outline" onclick="toast('Threshold lowered')">Lower threshold</button><button class="btn primary" onclick="setScreen('Manual Browse','Discover')">Browse manually</button><button class="btn outline" onclick="toast('Invite flow opened')">Invite families</button><button class="btn coral" onclick="setScreen('Travel Mode','Menu')">Turn on Travel Mode</button></div></div>`}

loadAll()
