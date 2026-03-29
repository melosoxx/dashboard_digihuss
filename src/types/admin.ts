// User profile (extends auth.users with business data)
export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  company: string | null;
  country: string | null;
  role: "user" | "superadmin";
  account_status: "pending" | "active" | "paused" | "cancelled";
  stripe_customer_id: string | null;
  mercadopago_customer_id: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

// Subscription record
export interface Subscription {
  id: string;
  user_id: string;
  provider: "stripe" | "mercadopago" | "manual";
  external_subscription_id: string | null;
  status: "active" | "past_due" | "cancelled" | "paused";
  plan_name: string;
  amount: number;
  currency: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancelled_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Onboarding session
export interface OnboardingSession {
  id: string;
  user_id: string;
  scheduled_at: string;
  status: "scheduled" | "completed" | "no_show" | "rescheduled";
  assigned_team_member: string | null;
  notes: string | null;
  calendly_event_id: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Audit log entry (immutable)
export interface AuditLogEntry {
  id: string;
  admin_user_id: string;
  action: string;
  target_user_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

// Admin overview stats
export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  pausedUsers: number;
  pendingUsers: number;
  cancelledUsers: number;
  mrr: number;
  mrrCurrency: string;
  newUsersThisMonth: number;
  upcomingOnboardings: number;
}

// User with subscription info (for admin user list)
export interface UserWithSubscription extends UserProfile {
  subscription: Subscription | null;
  onboarding: OnboardingSession | null;
}
