-- Kyddos V1 integration-ready D1 schema
-- Source of truth: Kyddos V1 Developer Build Packet data dictionary.
-- Production note: raw identity documents, biometric data, and background reports
-- should remain with contracted vendors. Store only status/reference/timestamps here.

CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('parent','nanny','admin','super_admin')),
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  account_status TEXT NOT NULL CHECK (account_status IN ('pending','active','suspended','banned')),
  verification_status TEXT NOT NULL CHECK (verification_status IN ('pending','approved','failed','manual_review','expired','error')),
  email_verified INTEGER NOT NULL DEFAULT 0,
  phone_verified INTEGER NOT NULL DEFAULT 0,
  referral_code_used TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS verification_statuses (
  verification_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id),
  vendor_type TEXT NOT NULL,
  vendor_reference_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending','approved','failed','manual_review','expired','error')),
  admin_review_required INTEGER NOT NULL DEFAULT 0,
  checked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS parent_profiles (
  parent_profile_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(user_id),
  legal_first_name TEXT,
  legal_last_name TEXT,
  display_first_name TEXT NOT NULL,
  city_area TEXT NOT NULL,
  address_vendor_status TEXT NOT NULL DEFAULT 'pending',
  family_type TEXT,
  parent_type TEXT,
  seeking_type TEXT NOT NULL,
  hosting_preference TEXT NOT NULL,
  hosting_capacity INTEGER,
  home_amenities TEXT,
  pet_summary TEXT,
  pool_present INTEGER NOT NULL DEFAULT 0,
  trampoline_present INTEGER NOT NULL DEFAULT 0,
  firearm_comfort_preference TEXT,
  parent_style TEXT,
  adult_interaction_preference TEXT,
  race_ethnicity TEXT,
  religion TEXT,
  vaccination_preference TEXT,
  politics_discussion_boundary TEXT,
  marijuana_alcohol_boundary TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kydo_profiles (
  kydo_id TEXT PRIMARY KEY,
  parent_profile_id TEXT NOT NULL REFERENCES parent_profiles(parent_profile_id),
  child_nickname TEXT NOT NULL,
  child_real_first_name TEXT,
  date_of_birth TEXT,
  age_band TEXT NOT NULL,
  assigned_sex_at_birth TEXT,
  gender_identity TEXT,
  avatar_id TEXT NOT NULL,
  keyword_collage TEXT,
  personality_type TEXT,
  kydo_type TEXT,
  interests_top TEXT NOT NULL,
  sports_interests TEXT,
  allergies TEXT,
  special_considerations TEXT,
  pet_comfort TEXT,
  screen_time_preference TEXT,
  approved_content_rating TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  -- Excluded from V1 public/UI: school_name, real_child_photo, child_geolocation.
);

CREATE TABLE IF NOT EXISTS match_preferences (
  preference_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(user_id),
  radius_miles INTEGER NOT NULL CHECK (radius_miles BETWEEN 1 AND 25),
  threshold_percent INTEGER NOT NULL CHECK (threshold_percent IN (60,65,70,75,80,85,90,95)),
  match_mode TEXT NOT NULL,
  age_range_preference TEXT NOT NULL,
  gender_preference TEXT,
  public_meet_only INTEGER NOT NULL DEFAULT 0,
  allergy_hard_filter INTEGER NOT NULL DEFAULT 0,
  pet_hard_filter INTEGER NOT NULL DEFAULT 0,
  firearm_hard_filter INTEGER NOT NULL DEFAULT 0,
  vaccination_preference_filter TEXT,
  sensitive_timeout_rules TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS match_requests (
  request_id TEXT PRIMARY KEY,
  sender_user_id TEXT NOT NULL REFERENCES users(user_id),
  receiver_user_id TEXT NOT NULL REFERENCES users(user_id),
  sender_kydo_id TEXT NOT NULL REFERENCES kydo_profiles(kydo_id),
  receiver_kydo_id TEXT NOT NULL REFERENCES kydo_profiles(kydo_id),
  match_score INTEGER NOT NULL,
  match_label TEXT NOT NULL,
  request_status TEXT NOT NULL CHECK (request_status IN ('sent','incoming','accepted','declined','saved','expired','cancelled')),
  suggested_meet_type TEXT,
  message_preview TEXT,
  proposed_time TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT
);

CREATE TABLE IF NOT EXISTS matches (
  match_id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL UNIQUE REFERENCES match_requests(request_id),
  user_a_id TEXT NOT NULL REFERENCES users(user_id),
  user_b_id TEXT NOT NULL REFERENCES users(user_id),
  kydo_a_id TEXT NOT NULL REFERENCES kydo_profiles(kydo_id),
  kydo_b_id TEXT NOT NULL REFERENCES kydo_profiles(kydo_id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at TEXT
);

CREATE TABLE IF NOT EXISTS conversations (
  conversation_id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL UNIQUE REFERENCES matches(match_id),
  safety_flagged INTEGER NOT NULL DEFAULT 0,
  reported_flag INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  message_id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(conversation_id),
  sender_user_id TEXT NOT NULL REFERENCES users(user_id),
  body TEXT NOT NULL,
  attachment_url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reported_flag INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS nanny_beta_profiles (
  nanny_profile_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(user_id),
  display_name TEXT NOT NULL,
  legal_name TEXT,
  profile_photo TEXT NOT NULL,
  city_area TEXT NOT NULL,
  age INTEGER NOT NULL,
  experience_summary TEXT NOT NULL,
  availability TEXT NOT NULL,
  service_type TEXT NOT NULL,
  travel_availability TEXT,
  overnight_availability TEXT,
  transportation_offered INTEGER NOT NULL DEFAULT 0,
  background_check_status TEXT NOT NULL,
  driving_check_status TEXT,
  reference_check_status TEXT,
  beta_status TEXT NOT NULL CHECK (beta_status IN ('pending','approved','hidden','rejected')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscriptions (
  subscription_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(user_id),
  plan TEXT NOT NULL CHECK (plan IN ('free','premium','super_premium')),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly','quarterly','annual')),
  trial_status TEXT CHECK (trial_status IN ('available','active','used')),
  renewal_date TEXT,
  payment_processor_id TEXT,
  credits_balance INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS credits_ledger (
  ledger_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id),
  transaction_type TEXT NOT NULL,
  credit_amount INTEGER NOT NULL,
  note TEXT,
  processor_reference_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS referrals (
  referral_code TEXT PRIMARY KEY,
  influencer_id TEXT NOT NULL,
  code_status TEXT NOT NULL CHECK (code_status IN ('active','paused','expired')),
  usage_cap INTEGER,
  signup_count INTEGER NOT NULL DEFAULT 0,
  paid_user_count INTEGER NOT NULL DEFAULT 0,
  residual_period_start TEXT,
  residual_period_end TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reports (
  report_id TEXT PRIMARY KEY,
  reporter_user_id TEXT NOT NULL REFERENCES users(user_id),
  reported_user_id TEXT NOT NULL REFERENCES users(user_id),
  conversation_id TEXT REFERENCES conversations(conversation_id),
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL CHECK (status IN ('open','reviewing','resolved','dismissed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TEXT
);

CREATE TABLE IF NOT EXISTS blocks (
  block_id TEXT PRIMARY KEY,
  blocker_user_id TEXT NOT NULL REFERENCES users(user_id),
  blocked_user_id TEXT NOT NULL REFERENCES users(user_id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(blocker_user_id, blocked_user_id)
);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  audit_id TEXT PRIMARY KEY,
  actor_user_id TEXT NOT NULL REFERENCES users(user_id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_status ON users(account_status, verification_status);
CREATE INDEX IF NOT EXISTS idx_parent_profiles_user ON parent_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_kydo_parent ON kydo_profiles(parent_profile_id);
CREATE INDEX IF NOT EXISTS idx_requests_receiver ON match_requests(receiver_user_id, request_status);
CREATE INDEX IF NOT EXISTS idx_requests_sender ON match_requests(sender_user_id, request_status);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON admin_audit_logs(actor_user_id, created_at);
