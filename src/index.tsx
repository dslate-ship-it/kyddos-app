import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

type Role = 'parent' | 'nanny' | 'admin' | 'super_admin'
type Plan = 'free' | 'premium' | 'super_premium'
type VerificationStatus = 'pending' | 'approved' | 'failed' | 'manual_review' | 'expired' | 'error'
type RequestStatus = 'sent' | 'incoming' | 'accepted' | 'declined' | 'saved' | 'expired' | 'cancelled'

type User = {
  user_id: string
  role: Role
  email: string
  phone: string
  account_status: 'pending' | 'active' | 'suspended' | 'banned'
  verification_status: VerificationStatus
  email_verified: boolean
  phone_verified: boolean
  vendor: Record<string, VerificationStatus>
  referral_code_used?: string
  created_at: string
}

type ParentProfile = {
  parent_profile_id: string
  user_id: string
  display_first_name: string
  city_area: string
  family_type: string
  seeking_type: string
  hosting_preference: string
  hosting_capacity: number
  home_amenities: string[]
  pet_summary: string
  pool_present: boolean
  trampoline_present: boolean
  firearm_comfort_preference: string
  parent_style: string[]
  adult_interaction_preference: string
}

type KydoProfile = {
  kydo_id: string
  parent_profile_id: string
  child_nickname: string
  age_band: string
  avatar_id: string
  keyword_collage: string[]
  personality_type: string
  kydo_type: string
  interests_top: string[]
  sports_interests: string[]
  allergies: string[]
  special_considerations: string[]
  pet_comfort: string
  screen_time_preference: string
  approved_content_rating: string
}

type MatchPreference = {
  preference_id: string
  user_id: string
  radius_miles: number
  threshold_percent: number
  match_mode: string
  age_range_preference: string
  public_meet_only: boolean
  allergy_hard_filter: boolean
  pet_hard_filter: boolean
  firearm_hard_filter: boolean
  vaccination_preference_filter: string
  sensitive_timeout_rules: Record<string, string>
}

type RequestRecord = {
  request_id: string
  sender_user_id: string
  receiver_user_id: string
  sender_kydo_id: string
  receiver_kydo_id: string
  match_score: number
  match_label: string
  request_status: RequestStatus
  suggested_meet_type: string
  message_preview?: string
  proposed_time?: string
  created_at: string
  expires_at?: string
}

type MatchRecord = {
  match_id: string
  request_id: string
  user_ids: string[]
  kydo_ids: string[]
  created_at: string
}

type Conversation = {
  conversation_id: string
  match_id: string
  participant_ids: string[]
  safety_flagged: boolean
  reported_flag: boolean
  created_at: string
}

type Message = {
  message_id: string
  conversation_id: string
  sender_user_id: string
  body: string
  created_at: string
  reported_flag: boolean
}

type NannyProfile = {
  nanny_profile_id: string
  user_id: string
  display_name: string
  profile_photo: string
  city_area: string
  age: number
  experience_summary: string
  availability: string
  service_type: string[]
  travel_availability: string
  overnight_availability: string
  transportation_offered: boolean
  background_check_status: VerificationStatus
  driving_check_status: VerificationStatus
  reference_check_status: VerificationStatus
  beta_status: 'pending' | 'approved' | 'hidden' | 'rejected'
}

type Subscription = {
  subscription_id: string
  user_id: string
  plan: Plan
  billing_cycle: 'monthly' | 'quarterly' | 'annual'
  trial_status: 'available' | 'active' | 'used'
  renewal_date?: string
  payment_processor_id: string
  credits_balance: number
  credits_ledger: Array<{ id: string; type: string; amount: number; note: string; created_at: string }>
}

type ReportRecord = {
  report_id: string
  reporter_user_id: string
  reported_user_id: string
  conversation_id?: string
  reason: string
  details: string
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed'
  created_at: string
}

const now = () => new Date().toISOString()
const id = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`

const users: User[] = [
  { user_id: 'u_parent', role: 'parent', email: 'maya@kyddos.test', phone: '+15550001000', account_status: 'active', verification_status: 'approved', email_verified: true, phone_verified: true, vendor: { identity: 'approved', liveness: 'approved', address: 'approved', registry: 'approved' }, referral_code_used: 'MOMCREW', created_at: now() },
  { user_id: 'u_river', role: 'parent', email: 'river@kyddos.test', phone: '+15550001001', account_status: 'active', verification_status: 'approved', email_verified: true, phone_verified: true, vendor: { identity: 'approved', liveness: 'approved', address: 'approved', registry: 'approved' }, created_at: now() },
  { user_id: 'u_lena', role: 'parent', email: 'lena@kyddos.test', phone: '+15550001002', account_status: 'active', verification_status: 'approved', email_verified: true, phone_verified: true, vendor: { identity: 'approved', liveness: 'approved', address: 'approved', registry: 'approved' }, created_at: now() },
  { user_id: 'u_pending', role: 'parent', email: 'pending@kyddos.test', phone: '+15550001003', account_status: 'pending', verification_status: 'manual_review', email_verified: true, phone_verified: true, vendor: { identity: 'manual_review', liveness: 'approved', address: 'pending', registry: 'approved' }, created_at: now() },
  { user_id: 'u_nanny', role: 'nanny', email: 'nanny@kyddos.test', phone: '+15550001004', account_status: 'active', verification_status: 'approved', email_verified: true, phone_verified: true, vendor: { identity: 'approved', background: 'approved', driving: 'approved' }, created_at: now() },
  { user_id: 'u_admin', role: 'super_admin', email: 'admin@kyddos.test', phone: '+15550001999', account_status: 'active', verification_status: 'approved', email_verified: true, phone_verified: true, vendor: { identity: 'approved' }, created_at: now() }
]

const parentProfiles: ParentProfile[] = [
  { parent_profile_id: 'pp_maya', user_id: 'u_parent', display_first_name: 'Maya', city_area: 'North Austin', family_type: 'Two-parent household', seeking_type: 'Peer circle', hosting_preference: 'Public venues first', hosting_capacity: 3, home_amenities: ['fenced yard', 'craft table'], pet_summary: 'Friendly dog, can be separated', pool_present: false, trampoline_present: false, firearm_comfort_preference: 'No unsecured firearms', parent_style: ['responsible', 'fun', 'build parent friendships'], adult_interaction_preference: 'Small talk welcome' },
  { parent_profile_id: 'pp_river', user_id: 'u_river', display_first_name: 'River', city_area: 'Cedar Park', family_type: 'Single parent', seeking_type: 'Play group', hosting_preference: 'Public venues first', hosting_capacity: 2, home_amenities: ['backyard', 'legos'], pet_summary: 'No pets', pool_present: false, trampoline_present: false, firearm_comfort_preference: 'No unsecured firearms', parent_style: ['responsible', 'quiet supervision'], adult_interaction_preference: 'Parent friendship open' },
  { parent_profile_id: 'pp_lena', user_id: 'u_lena', display_first_name: 'Lena', city_area: 'Round Rock', family_type: 'Two-parent household', seeking_type: 'One playmate', hosting_preference: 'We can host', hosting_capacity: 4, home_amenities: ['sports gear', 'covered patio'], pet_summary: 'Cat in home', pool_present: true, trampoline_present: false, firearm_comfort_preference: 'Discuss before home visits', parent_style: ['laid back', 'join play'], adult_interaction_preference: 'Small talk' },
  { parent_profile_id: 'pp_pending', user_id: 'u_pending', display_first_name: 'Ari', city_area: 'South Austin', family_type: 'Guardian', seeking_type: 'Village', hosting_preference: 'Flexible', hosting_capacity: 2, home_amenities: ['board games'], pet_summary: 'Dog', pool_present: false, trampoline_present: true, firearm_comfort_preference: 'Private', parent_style: ['fun'], adult_interaction_preference: 'Flexible' }
]

const kydos: KydoProfile[] = [
  { kydo_id: 'k_maya', parent_profile_id: 'pp_maya', child_nickname: 'Junie', age_band: '6–8', avatar_id: 'fox', keyword_collage: ['kind', 'curious', 'builder'], personality_type: 'Depends', kydo_type: 'Builder/Maker', interests_top: ['Legos', 'arts/crafts', 'reading', 'outdoor play'], sports_interests: ['biking'], allergies: ['peanuts'], special_considerations: ['warm-up time'], pet_comfort: 'comfortable with calm pets', screen_time_preference: 'low', approved_content_rating: 'G/PG' },
  { kydo_id: 'k_river', parent_profile_id: 'pp_river', child_nickname: 'Kai', age_band: '6–8', avatar_id: 'bear', keyword_collage: ['energetic', 'creative'], personality_type: 'Extrovert', kydo_type: 'Backyardigan', interests_top: ['Legos', 'outdoor play', 'biking', 'pretend play'], sports_interests: ['soccer', 'biking'], allergies: ['peanuts'], special_considerations: [], pet_comfort: 'prefers no pets', screen_time_preference: 'low', approved_content_rating: 'G/PG' },
  { kydo_id: 'k_lena', parent_profile_id: 'pp_lena', child_nickname: 'Sol', age_band: '9–11', avatar_id: 'owl', keyword_collage: ['sporty', 'brave'], personality_type: 'Extrovert', kydo_type: 'Sportsy', interests_top: ['swimming', 'running/yelling', 'video games'], sports_interests: ['basketball', 'swimming'], allergies: [], special_considerations: [], pet_comfort: 'comfortable with pets', screen_time_preference: 'moderate', approved_content_rating: 'PG' }
]

const preferences: MatchPreference[] = [
  { preference_id: 'pref_maya', user_id: 'u_parent', radius_miles: 18, threshold_percent: 70, match_mode: 'Recommended', age_range_preference: '5–9', public_meet_only: true, allergy_hard_filter: true, pet_hard_filter: false, firearm_hard_filter: true, vaccination_preference_filter: 'private', sensitive_timeout_rules: { discussion: 'Avoid divisive politics at first meetup', homeSafety: 'Public venue until trust is built' } }
]

const subscriptions: Subscription[] = [
  { subscription_id: 'sub_maya', user_id: 'u_parent', plan: 'premium', billing_cycle: 'monthly', trial_status: 'active', renewal_date: '2026-06-03', payment_processor_id: 'mock_app_store_sub_001', credits_balance: 12, credits_ledger: [{ id: 'cl_1', type: 'grant', amount: 12, note: 'Launch promo credit pack', created_at: now() }] }
]

const requests: RequestRecord[] = [
  { request_id: 'req_1', sender_user_id: 'u_river', receiver_user_id: 'u_parent', sender_kydo_id: 'k_river', receiver_kydo_id: 'k_maya', match_score: 91, match_label: 'Excellent Fit', request_status: 'incoming', suggested_meet_type: 'Park', message_preview: 'Kai loves building and biking too. Want to try a public park meetup?', created_at: now() }
]
const matches: MatchRecord[] = []
const conversations: Conversation[] = []
const messages: Message[] = []
const blocks: Array<{ blocker_user_id: string; blocked_user_id: string; created_at: string }> = []
const reports: ReportRecord[] = [
  { report_id: 'rep_demo', reporter_user_id: 'u_lena', reported_user_id: 'u_pending', reason: 'Profile concern', details: 'Verification and profile details need review.', status: 'open', created_at: now() }
]
const nannies: NannyProfile[] = [
  { nanny_profile_id: 'n_1', user_id: 'u_nanny', display_name: 'Sofia R.', profile_photo: 'https://api.dicebear.com/8.x/personas/svg?seed=Sofia', city_area: 'North Austin', age: 27, experience_summary: '7 years supporting families, CPR trained, infant through elementary experience.', availability: 'Weekday afternoons, occasional weekends', service_type: ['part-time', 'on-call', 'family home'], travel_availability: 'Local only', overnight_availability: 'No', transportation_offered: true, background_check_status: 'approved', driving_check_status: 'approved', reference_check_status: 'approved', beta_status: 'approved' }
]
const referrals = [
  { referral_code: 'MOMCREW', influencer_id: 'partner_momcrew', code_status: 'active', usage_cap: 500, signup_count: 42, paid_user_count: 9, residual_period: '2026 launch' },
  { referral_code: 'PARKDADS', influencer_id: 'partner_parkdads', code_status: 'active', usage_cap: 250, signup_count: 18, paid_user_count: 3, residual_period: '2026 launch' }
]
const auditLogs: Array<{ audit_id: string; actor_user_id: string; action: string; target: string; created_at: string; note: string }> = [
  { audit_id: 'audit_1', actor_user_id: 'u_admin', action: 'vendor_status_mapping_loaded', target: 'verification_dashboard', created_at: now(), note: 'Mock vendor status mappings enabled for V1 handoff.' }
]

const currentUserId = 'u_parent'

const planLimits: Record<Plan, { children: number; dailyMatches: number; requestsMonthly: number; activeChats: number; threshold: string; timeOutBox: string; travel: number; nanny: string }> = {
  free: { children: 1, dailyMatches: 10, requestsMonthly: 3, activeChats: 3, threshold: 'basic presets', timeOutBox: 'locked', travel: 0, nanny: 'credits only' },
  premium: { children: 2, dailyMatches: 50, requestsMonthly: 15, activeChats: 15, threshold: 'full control', timeOutBox: 'limited preview', travel: 1, nanny: 'included browse or credits' },
  super_premium: { children: 4, dailyMatches: 999, requestsMonthly: 50, activeChats: 999, threshold: 'full control', timeOutBox: 'full', travel: 3, nanny: 'limited included intros' }
}

function userPlan(userId: string): Plan {
  return subscriptions.find((s) => s.user_id === userId)?.plan ?? 'free'
}

function matchLabel(score: number) {
  if (score >= 90) return 'Excellent Fit'
  if (score >= 80) return 'Strong Fit'
  if (score >= 70) return 'Recommended'
  if (score >= 60) return 'Partial Fit'
  return 'Manual Browse Only'
}

function distanceFor(parentProfileId: string) {
  const table: Record<string, number> = { pp_river: 8, pp_lena: 21, pp_pending: 12, pp_maya: 0 }
  return table[parentProfileId] ?? 15
}

function scoreCandidate(me: KydoProfile, candidate: KydoProfile, myParent: ParentProfile, theirParent: ParentProfile, pref: MatchPreference) {
  const distance = distanceFor(theirParent.parent_profile_id)
  const location = Math.max(0, Math.round(35 * (1 - Math.min(distance, pref.radius_miles) / Math.max(pref.radius_miles, 1)))) + (distance <= pref.radius_miles ? 8 : 0)
  const age = me.age_band === candidate.age_band ? 20 : 10
  const sharedInterests = candidate.interests_top.filter((i) => me.interests_top.includes(i))
  const interests = Math.min(17, sharedInterests.length * 5 + candidate.sports_interests.filter((i) => me.sports_interests.includes(i)).length * 2)
  const allergyConflict = pref.allergy_hard_filter && me.allergies.some((a) => !candidate.allergies.includes(a) && theirParent.pet_summary.toLowerCase().includes(a.toLowerCase()))
  const petConflict = pref.pet_hard_filter && me.pet_comfort.includes('no pets') && !theirParent.pet_summary.toLowerCase().includes('no pets')
  const firearmConflict = pref.firearm_hard_filter && theirParent.firearm_comfort_preference.toLowerCase().includes('discuss')
  const safety = allergyConflict || petConflict || firearmConflict ? 0 : 10
  const parentOverlap = myParent.parent_style.filter((p) => theirParent.parent_style.includes(p)).length
  const parentCompatibility = Math.min(15, parentOverlap * 5 + (myParent.adult_interaction_preference.includes('Small') && theirParent.adult_interaction_preference.includes('Small') ? 5 : 0))
  const logistics = myParent.hosting_preference === theirParent.hosting_preference || theirParent.hosting_preference === 'Flexible' ? 3 : 1
  const score = Math.min(100, Math.max(0, location + age + interests + safety + parentCompatibility + logistics))
  const hardBlocked = allergyConflict || petConflict || firearmConflict
  return {
    score,
    label: matchLabel(score),
    distance,
    sharedInterests,
    breakdown: { location, age, interests, safety, parentCompatibility, logistics },
    mismatchHighlights: [
      ...(score < 70 ? ['Below your current match threshold'] : []),
      ...(hardBlocked ? ['Private safety preference conflict'] : []),
      ...(distance > pref.radius_miles ? ['Outside selected radius for recommendations'] : []),
      ...(me.age_band !== candidate.age_band ? ['Different age band'] : [])
    ]
  }
}

function publicProfileFor(userId: string) {
  const parent = parentProfiles.find((p) => p.user_id === userId)!
  const kydo = kydos.find((k) => k.parent_profile_id === parent.parent_profile_id)!
  const user = users.find((u) => u.user_id === userId)!
  return { user, parent, kydo }
}

function discover(mode = 'recommended') {
  const me = publicProfileFor(currentUserId)
  const pref = preferences.find((p) => p.user_id === currentUserId)!
  const blockedIds = blocks.filter((b) => b.blocker_user_id === currentUserId || b.blocked_user_id === currentUserId).flatMap((b) => [b.blocker_user_id, b.blocked_user_id])
  const rows = parentProfiles
    .filter((p) => p.user_id !== currentUserId)
    .map((parent) => {
      const user = users.find((u) => u.user_id === parent.user_id)!
      const kydo = kydos.find((k) => k.parent_profile_id === parent.parent_profile_id)
      if (!kydo) return null
      const fit = scoreCandidate(me.kydo, kydo, me.parent, parent, pref)
      return { user, parent, kydo, fit }
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
    .filter((row) => row.user.account_status === 'active' && row.user.verification_status === 'approved' && !blockedIds.includes(row.user.user_id))
    .filter((row) => mode === 'manual' || (row.fit.score >= pref.threshold_percent && row.fit.distance <= pref.radius_miles))
    .sort((a, b) => b.fit.score - a.fit.score)
  return rows
}

function createConversationFromRequest(req: RequestRecord) {
  let match = matches.find((m) => m.request_id === req.request_id)
  if (!match) {
    match = { match_id: id('match'), request_id: req.request_id, user_ids: [req.sender_user_id, req.receiver_user_id], kydo_ids: [req.sender_kydo_id, req.receiver_kydo_id], created_at: now() }
    matches.push(match)
  }
  let convo = conversations.find((c) => c.match_id === match!.match_id)
  if (!convo) {
    convo = { conversation_id: id('convo'), match_id: match.match_id, participant_ids: match.user_ids, safety_flagged: false, reported_flag: false, created_at: now() }
    conversations.push(convo)
    messages.push({ message_id: id('msg'), conversation_id: convo.conversation_id, sender_user_id: 'system', body: 'It’s a Kyddos Match. You can now message this parent. For first meetings, Kyddos recommends public venues.', created_at: now(), reported_flag: false })
  }
  return { match, convo }
}

function audit(actor_user_id: string, action: string, target: string, note: string) {
  auditLogs.unshift({ audit_id: id('audit'), actor_user_id, action, target, created_at: now(), note })
}

const app = new Hono()
app.use('/api/*', cors())
app.use('/static/*', serveStatic({ root: './public' }))

app.get('/api/bootstrap', (c) => {
  const currentUser = users.find((u) => u.user_id === currentUserId)!
  return c.json({
    app: { name: 'Kyddos', promise: 'Verified parents. Avatar-only child profiles. Safer parent-controlled playdates.' },
    currentUser,
    parentProfile: parentProfiles.find((p) => p.user_id === currentUserId),
    kydoProfiles: kydos.filter((k) => k.parent_profile_id === 'pp_maya'),
    preferences: preferences.find((p) => p.user_id === currentUserId),
    subscription: subscriptions.find((s) => s.user_id === currentUserId),
    planLimits,
    screens: ['Welcome', 'How It Works', 'Safety First', 'Sign Up', 'Login', 'Email Verification', 'Phone Verification', 'Identity Verification', 'Approval Pending', 'Parent Basics', 'Hosting Preferences', 'Parent Style', 'Add Kydo', 'Kydo Personality', 'Kydo Interests', 'Kydo Safety / Comfort', 'Match Preferences', 'Time Out Box', 'Discover', 'Profile Detail', 'Request Playdate', 'Incoming Request', 'Match Confirmation', 'Requests', 'Matches', 'Message List', 'Chat Thread', 'Manual Browse', 'Travel Mode', 'Nanny Beta Landing', 'Nanny Profile Setup', 'Nanny Detail', 'Public Safety Feed', 'Subscription / Credits', 'Safety Center', 'Settings']
  })
})

app.get('/api/discover', (c) => c.json({ mode: c.req.query('mode') ?? 'recommended', results: discover(c.req.query('mode') ?? 'recommended') }))
app.get('/api/profile/:userId', (c) => {
  const profile = publicProfileFor(c.req.param('userId'))
  const me = publicProfileFor(currentUserId)
  const pref = preferences.find((p) => p.user_id === currentUserId)!
  return c.json({ ...profile, fit: scoreCandidate(me.kydo, profile.kydo, me.parent, profile.parent, pref), privacy: ['No real child photo', 'No school visibility', 'No child geolocation', 'Time Out Box answers hidden'] })
})

app.post('/api/requests', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const targetUserId = body.receiver_user_id
  const currentUser = users.find((u) => u.user_id === currentUserId)!
  if (currentUser.verification_status !== 'approved') return c.json({ error: 'Verification approval is required before sending requests.' }, 403)
  const plan = userPlan(currentUserId)
  const sentThisMonth = requests.filter((r) => r.sender_user_id === currentUserId && r.created_at.slice(0, 7) === now().slice(0, 7)).length
  if (sentThisMonth >= planLimits[plan].requestsMonthly) return c.json({ error: 'Monthly request limit reached. Upgrade or use 3 credits for 5 extra playdate requests.', upgrade: true }, 402)
  const target = publicProfileFor(targetUserId)
  const me = publicProfileFor(currentUserId)
  const pref = preferences.find((p) => p.user_id === currentUserId)!
  const fit = scoreCandidate(me.kydo, target.kydo, me.parent, target.parent, pref)
  const req: RequestRecord = { request_id: id('req'), sender_user_id: currentUserId, receiver_user_id: targetUserId, sender_kydo_id: me.kydo.kydo_id, receiver_kydo_id: target.kydo.kydo_id, match_score: fit.score, match_label: fit.label, request_status: 'sent', suggested_meet_type: body.suggested_meet_type ?? 'Public park', message_preview: body.message_preview ?? '', proposed_time: body.proposed_time, created_at: now() }
  requests.unshift(req)
  audit(currentUserId, 'request_sent', req.request_id, `Playdate request sent to ${targetUserId}`)
  return c.json({ ok: true, request: req, remaining: planLimits[plan].requestsMonthly - sentThisMonth - 1 })
})

app.get('/api/requests', (c) => c.json({ requests }))
app.patch('/api/requests/:id', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const req = requests.find((r) => r.request_id === c.req.param('id'))
  if (!req) return c.json({ error: 'Request not found' }, 404)
  req.request_status = body.status ?? req.request_status
  let created = null
  if (req.request_status === 'accepted') created = createConversationFromRequest(req)
  audit(currentUserId, `request_${req.request_status}`, req.request_id, 'Request status changed')
  return c.json({ ok: true, request: req, created })
})

app.get('/api/matches', (c) => c.json({ matches: matches.map((m) => ({ ...m, participants: m.user_ids.map(publicProfileFor), conversation: conversations.find((cv) => cv.match_id === m.match_id) })) }))
app.get('/api/conversations', (c) => c.json({ conversations: conversations.map((cv) => ({ ...cv, match: matches.find((m) => m.match_id === cv.match_id), messages: messages.filter((m) => m.conversation_id === cv.conversation_id).slice(-1) })) }))
app.get('/api/conversations/:id/messages', (c) => c.json({ messages: messages.filter((m) => m.conversation_id === c.req.param('id')) }))
app.post('/api/conversations/:id/messages', async (c) => {
  const convo = conversations.find((cv) => cv.conversation_id === c.req.param('id'))
  if (!convo) return c.json({ error: 'Conversation not found' }, 404)
  if (!convo.participant_ids.includes(currentUserId)) return c.json({ error: 'Messages are only allowed after a mutual match.' }, 403)
  const body = await c.req.json().catch(() => ({}))
  const msg: Message = { message_id: id('msg'), conversation_id: convo.conversation_id, sender_user_id: currentUserId, body: String(body.body ?? '').slice(0, 1000), created_at: now(), reported_flag: false }
  messages.push(msg)
  return c.json({ ok: true, message: msg })
})

app.get('/api/nannies', (c) => c.json({ nannies: nannies.filter((n) => n.beta_status === 'approved' && n.background_check_status === 'approved' && (!n.transportation_offered || n.driving_check_status === 'approved')) }))
app.post('/api/nannies/intro', async (c) => {
  const sub = subscriptions.find((s) => s.user_id === currentUserId)!
  const plan = sub.plan
  if (plan !== 'super_premium') {
    if (sub.credits_balance < 6) return c.json({ error: 'Nanny intro requires 6 credits or Super Premium included allowance.', upgrade: true }, 402)
    sub.credits_balance -= 6
    sub.credits_ledger.unshift({ id: id('cl'), type: 'debit', amount: -6, note: 'Nanny beta intro request', created_at: now() })
  }
  audit(currentUserId, 'nanny_intro_requested', 'nanny_beta', 'Parent requested nanny beta intro')
  return c.json({ ok: true, message: 'Intro request sent. Messaging opens after the nanny accepts.' })
})
app.post('/api/nanny-profile', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const profile: NannyProfile = { nanny_profile_id: id('nanny'), user_id: body.user_id ?? 'new_nanny_user', display_name: body.display_name ?? 'New Nanny', profile_photo: body.profile_photo ?? 'https://api.dicebear.com/8.x/personas/svg?seed=NewNanny', city_area: body.city_area ?? 'General area', age: Number(body.age ?? 21), experience_summary: body.experience_summary ?? '', availability: body.availability ?? '', service_type: body.service_type ?? ['on-call'], travel_availability: body.travel_availability ?? 'No', overnight_availability: body.overnight_availability ?? 'No', transportation_offered: Boolean(body.transportation_offered), background_check_status: 'pending', driving_check_status: body.transportation_offered ? 'pending' : 'approved', reference_check_status: 'pending', beta_status: 'pending' }
  nannies.unshift(profile)
  audit(currentUserId, 'nanny_submitted', profile.nanny_profile_id, 'Nanny beta profile entered review queue')
  return c.json({ ok: true, profile })
})

app.get('/api/safety-alerts', (c) => c.json({ alerts: [
  { id: 'alert_1', type: 'Public Safety', title: 'Official safety reminder', area: 'Central Texas', severity: 'info', body: 'Kyddos displays official/public alerts only. There are no user-triggered emergency alerts in V1.', source: 'Mock official feed placeholder', created_at: now() },
  { id: 'alert_2', type: 'Amber Alert Feed Status', title: 'Feed integration ready', area: 'Broad area only', severity: 'status', body: 'Replace this placeholder with contracted public safety feed credentials.', source: 'Vendor placeholder', created_at: now() }
] }))

app.post('/api/travel-mode', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  if (!body.destination || !body.start_date || !body.end_date) return c.json({ error: 'Destination and trip dates are required. Travel Mode never tracks child location.' }, 400)
  return c.json({ ok: true, travelSearch: { id: id('travel'), ...body, privacy: 'No itinerary integration, child geolocation, or travel group chat in V1.' }, results: discover('manual').slice(0, 2) })
})

app.post('/api/subscribe', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const sub = subscriptions.find((s) => s.user_id === currentUserId)!
  sub.plan = (body.plan ?? sub.plan) as Plan
  sub.billing_cycle = body.billing_cycle ?? sub.billing_cycle
  sub.trial_status = body.trial ? 'active' : sub.trial_status
  audit(currentUserId, 'subscription_updated', sub.subscription_id, `Plan set to ${sub.plan}`)
  return c.json({ ok: true, subscription: sub, disclosure: 'Real purchases must route through App Store / Play Store in-app purchase where required.' })
})
app.post('/api/credits', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const pack = Number(body.amount ?? 5)
  const sub = subscriptions.find((s) => s.user_id === currentUserId)!
  sub.credits_balance += pack
  sub.credits_ledger.unshift({ id: id('cl'), type: 'purchase', amount: pack, note: `Mock purchase of ${pack} credits`, created_at: now() })
  return c.json({ ok: true, subscription: sub })
})

app.post('/api/reports', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const report: ReportRecord = { report_id: id('rep'), reporter_user_id: currentUserId, reported_user_id: body.reported_user_id, conversation_id: body.conversation_id, reason: body.reason ?? 'Safety concern', details: body.details ?? '', status: 'open', created_at: now() }
  reports.unshift(report)
  if (body.conversation_id) {
    const convo = conversations.find((cv) => cv.conversation_id === body.conversation_id)
    if (convo) { convo.reported_flag = true; convo.safety_flagged = true }
  }
  audit(currentUserId, 'report_created', report.report_id, report.reason)
  return c.json({ ok: true, report })
})
app.post('/api/blocks', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  blocks.push({ blocker_user_id: currentUserId, blocked_user_id: body.blocked_user_id, created_at: now() })
  audit(currentUserId, 'user_blocked', body.blocked_user_id, 'Users hidden from each other and messaging disabled')
  return c.json({ ok: true })
})

app.get('/api/admin/dashboard', (c) => c.json({
  cards: {
    pendingApprovals: users.filter((u) => u.account_status === 'pending').length,
    failedVerifications: users.filter((u) => Object.values(u.vendor).includes('failed')).length,
    manualReviewQueue: users.filter((u) => u.verification_status === 'manual_review').length,
    reportedUsers: reports.filter((r) => r.status === 'open').length,
    flaggedMessages: conversations.filter((cv) => cv.reported_flag || cv.safety_flagged).length,
    nannyBetaPending: nannies.filter((n) => n.beta_status === 'pending').length,
    subscriptionIssues: 0,
    refundRequests: 0,
    referralCodePerformance: referrals.reduce((sum, r) => sum + r.signup_count, 0),
    publicSafetyFeedStatus: 'Mock official feed connected'
  },
  approvalRules: ['Email verified', 'Phone verified', 'Identity vendor approved', 'Address/billing passed or manually cleared', 'Sex offender registry passed', 'Profile completeness threshold met', 'No critical safety flags'],
  vendorStatusMapping: { approved: 'Unlock', pending: 'Hold', failed: 'Block', manual_review: 'Manual Queue', expired: 'Reverify', error: 'Retry' },
  queues: { users, reports, nannies, subscriptions, referrals, auditLogs, flaggedConversations: conversations.filter((cv) => cv.reported_flag || cv.safety_flagged) },
  messageReviewRule: 'Admin message review is available only when a conversation is reported or safety-flagged.'
}))
app.patch('/api/admin/users/:id/status', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const user = users.find((u) => u.user_id === c.req.param('id'))
  if (!user) return c.json({ error: 'User not found' }, 404)
  user.account_status = body.account_status ?? user.account_status
  user.verification_status = body.verification_status ?? user.verification_status
  audit('u_admin', 'admin_user_status_change', user.user_id, `Status: ${user.account_status}/${user.verification_status}`)
  return c.json({ ok: true, user })
})
app.patch('/api/admin/reports/:id', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const report = reports.find((r) => r.report_id === c.req.param('id'))
  if (!report) return c.json({ error: 'Report not found' }, 404)
  report.status = body.status ?? report.status
  audit('u_admin', 'report_review_action', report.report_id, body.note ?? 'Report updated')
  return c.json({ ok: true, report })
})

app.get('/api/data-model', (c) => c.json({
  entities: ['users', 'parent_profiles', 'kydo_profiles', 'match_preferences', 'match_requests', 'matches', 'conversations', 'messages', 'nanny_beta_profiles', 'subscriptions', 'credits_ledger', 'referrals', 'reports', 'blocks', 'verification_statuses', 'admin_audit_logs'],
  privacyRules: ['Store vendor status/reference IDs instead of raw verification documents', 'Public Kydo profiles use avatars only', 'No child school, geolocation, real photo, voice/video/chat, or public sensitive labels in V1'],
  assumptions: ['This sandbox build uses in-memory seeded data plus SQL migrations for D1 handoff; connect real Cloudflare D1 and vendor credentials before production.']
}))

app.get('*', (c) => c.html(`<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Kyddos V1</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.2/css/all.min.css" />
  <link rel="stylesheet" href="/static/styles.css" />
</head>
<body>
  <main id="app" aria-live="polite"></main>
  <script src="/static/app.js"></script>
</body>
</html>`))

export default app
