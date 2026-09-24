export type PaymentStatus =
  | "PENDING"
  | "PAID_ONLINE"
  | "PAID_CASH"
  | "REFUNDED"
  | "REFUNDED_CASH"
  | "FAILED"
  | "FORFEITED"
  | "TO_REFUND"
  | "WAITING_CASH";

export type GroupStatus =
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "WAITING"
  | "CALLED"
  | "READY"
  | "COUNTDOWN"
  | "PLAYING"
  | "FINISHED"
  | "SKIPPED"
  | "CANCELLED"
  | "NO_SHOW";

export type BookingMode = "SOLO" | "TEAMS";
export type SlotStatus = "AVAILABLE" | "RESERVED" | "UNAVAILABLE" | "IN_PROGRESS" | "COMPLETED";

export interface EventRow {
  id: string;
  name: string;
  event_date: string;
  start_time: string;
  end_time: string;
  game_duration_minutes: number;
  break_duration_minutes: number;
  min_players: number;
  max_players: number;
  countdown_seconds: number;
  countdown_enabled: boolean;
  deposit_amount_cents: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GameSlotRow {
  id: string;
  event_id: string;
  slot_index: number;
  start_time: string;
  end_time: string;
  status: SlotStatus;
  created_at: string;
  updated_at: string;
}

export interface GroupRow {
  id: string;
  group_number: number;
  event_id: string;
  slot_id: string | null;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  mode: BookingMode;
  status: GroupStatus;
  source: "ONLINE" | "KIOSK";
  player_count: number;
  arrived: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlayerRow {
  id: string;
  group_id: string;
  name: string;
  created_at: string;
}

export interface TeamRow {
  id: string;
  group_id: string;
  name: string;
  created_at: string;
}

export interface TeamMemberRow {
  id: string;
  team_id: string;
  player_id: string;
  created_at: string;
}

export interface PaymentRow {
  id: string;
  group_id: string;
  amount_cents: number;
  status: PaymentStatus;
  method: "ONLINE" | "CASH";
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  refunded_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GameSessionRow {
  id: string;
  event_id: string;
  group_id: string | null;
  slot_id: string | null;
  state: string;
  countdown_started_at: string | null;
  game_started_at: string | null;
  game_ends_at: string | null;
  finished_at: string | null;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export interface SettingsRow {
  id: number;
  rules_visible_on_board: boolean;
  sound_enabled: boolean;
  updated_at: string;
}

export interface RulesRow {
  id: number;
  content: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      events: { Row: EventRow; Insert: Partial<EventRow>; Update: Partial<EventRow> };
      game_slots: { Row: GameSlotRow; Insert: Partial<GameSlotRow>; Update: Partial<GameSlotRow> };
      groups: { Row: GroupRow; Insert: Partial<GroupRow>; Update: Partial<GroupRow> };
      players: { Row: PlayerRow; Insert: Partial<PlayerRow>; Update: Partial<PlayerRow> };
      teams: { Row: TeamRow; Insert: Partial<TeamRow>; Update: Partial<TeamRow> };
      team_members: { Row: TeamMemberRow; Insert: Partial<TeamMemberRow>; Update: Partial<TeamMemberRow> };
      payments: { Row: PaymentRow; Insert: Partial<PaymentRow>; Update: Partial<PaymentRow> };
      game_sessions: { Row: GameSessionRow; Insert: Partial<GameSessionRow>; Update: Partial<GameSessionRow> };
      settings: { Row: SettingsRow; Insert: Partial<SettingsRow>; Update: Partial<SettingsRow> };
      rules: { Row: RulesRow; Insert: Partial<RulesRow>; Update: Partial<RulesRow> };
    };
  };
}
