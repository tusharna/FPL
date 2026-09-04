export type NotificationSeverity = "INFO" | "IMPORTANT" | "URGENT";

export type NotificationType =
  | "GAMEWEEK_REPORT"
  | "DEADLINE_REMINDER"
  | "CAPTAIN_CHANGE"
  | "CAPTAIN_RISK"
  | "LINEUP_CHANGE"
  | "TRANSFER_CHANGE"
  | "PLAYER_AVAILABILITY"
  | "FIXTURE_CHANGE"
  | "DOUBLE_GAMEWEEK"
  | "BLANK_GAMEWEEK"
  | "PRICE_CHANGE"
  | "SYSTEM_ERROR";

export type NotificationChannel = "EMAIL" | "SMS";

export type DeliveryStatus =
  | "PENDING"
  | "SENT"
  | "DELIVERED"
  | "FAILED"
  | "DELAYED";

export type Notification = {
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  gameweek?: number;
  playerId?: number;
  actionRequired: boolean;
  expiresAt?: string;
  dedupeKey: string;
};

export type NotificationState = {
  gameweek: number;
  captainId?: number;
  viceCaptainId?: number;
  recommendedXI: number[];
  transferAction: "SAVE" | "TRANSFER";
  transferInId?: number;
  transferOutId?: number;
  playerRisks: Record<number, string>;
  playerAvailability: Record<number, number | null>;
  fixtureKeys: string[];
  priceChanges: Record<number, number>;
};

export type NotificationPreferences = {
  email: boolean;
  sms: boolean;
  gameweekReports: boolean;
  deadlineReminders: boolean;
  captainAlerts: boolean;
  lineupAlerts: boolean;
  transferAlerts: boolean;
  availabilityAlerts: boolean;
  fixtureAlerts: boolean;
  priceAlerts: boolean;
  minimumSeverity: NotificationSeverity;
  quietHours?: {
    enabled: boolean;
    start: string;
    end: string;
  };
  emailDestination?: string;
  smsDestination?: string;
};

export type NotificationEventRow = {
  id: number;
  entry_id: number;
  gameweek_id: number | null;
  type: string;
  severity: string;
  title: string;
  message: string;
  player_id: number | null;
  action_required: boolean;
  dedupe_key: string;
  created_at: string;
  expires_at: string | null;
  read_at: string | null;
};

export type NotificationDeliveryRow = {
  id: number;
  notification_id: number;
  channel: string;
  destination: string | null;
  status: string;
  provider_message_id: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  failed_at: string | null;
  error_message: string | null;
};

export type EvaluateContext = {
  deadline?: string | null;
  playerNames: Map<number, string>;
  intelligenceFixtureChanges?: {
    fixtureId: number;
    type: string;
    teamId?: number;
    affectedPlayerIds: number[];
  }[];
};
