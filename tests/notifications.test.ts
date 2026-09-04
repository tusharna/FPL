import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { buildDedupeKey, isDuplicate } from "@/lib/notifications/dedupe";
import { selectChannels, formatSmsMessage } from "@/lib/notifications/channels";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  isTypeEnabled,
  meetsMinimumSeverity,
} from "@/lib/notifications/preferences";
import {
  isInQuietHours,
  shouldDelayDelivery,
} from "@/lib/notifications/quiet-hours";
import {
  evaluateDeadlineReminders,
  evaluateNotifications,
} from "@/lib/notifications/rules";
import type { Notification, NotificationState } from "@/lib/notifications/types";
import { validateCronRequest } from "@/lib/cron/auth";

function baseState(overrides: Partial<NotificationState> = {}): NotificationState {
  return {
    gameweek: 5,
    captainId: 10,
    viceCaptainId: 11,
    recommendedXI: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    transferAction: "SAVE",
    playerRisks: { 10: "LOW", 11: "LOW" },
    playerAvailability: { 10: 100, 11: 100 },
    fixtureKeys: [],
    priceChanges: {},
    ...overrides,
  };
}

describe("notification rules", () => {
  const playerNames = new Map([
    [10, "Bruno"],
    [12, "Cole"],
    [3, "Player A"],
    [4, "Player B"],
    [25, "Unrelated"],
  ]);

  it("captain change creates alert", () => {
    const previous = baseState({ captainId: 10 });
    const current = baseState({ captainId: 12 });
    const notifications = evaluateNotifications(
      previous,
      current,
      DEFAULT_NOTIFICATION_PREFERENCES,
      new Set(),
      { playerNames },
    );
    expect(notifications.some((n) => n.type === "CAPTAIN_CHANGE")).toBe(true);
  });

  it("unchanged captain creates no alert", () => {
    const previous = baseState();
    const current = baseState();
    const notifications = evaluateNotifications(
      previous,
      current,
      DEFAULT_NOTIFICATION_PREFERENCES,
      new Set(),
      { playerNames },
    );
    expect(notifications).toHaveLength(0);
  });

  it("high-risk captain creates alert", () => {
    const previous = baseState({
      playerRisks: { 10: "LOW" },
      playerAvailability: { 10: 100 },
    });
    const current = baseState({
      playerRisks: { 10: "HIGH" },
      playerAvailability: { 10: 25 },
    });
    const notifications = evaluateNotifications(
      previous,
      current,
      DEFAULT_NOTIFICATION_PREFERENCES,
      new Set(),
      { playerNames },
    );
    expect(notifications.some((n) => n.type === "CAPTAIN_RISK")).toBe(true);
  });

  it("unrelated player injury creates no alert", () => {
    const previous = baseState({
      playerAvailability: { 25: 100 },
      playerRisks: { 25: "LOW" },
    });
    const current = baseState({
      playerAvailability: { 25: 25 },
      playerRisks: { 25: "HIGH" },
    });
    const notifications = evaluateNotifications(
      previous,
      current,
      DEFAULT_NOTIFICATION_PREFERENCES,
      new Set(),
      { playerNames },
    );
    expect(notifications).toHaveLength(0);
  });

  it("transfer change creates alert", () => {
    const previous = baseState({ transferAction: "SAVE" });
    const current = baseState({
      transferAction: "TRANSFER",
      transferOutId: 3,
      transferInId: 4,
    });
    const notifications = evaluateNotifications(
      previous,
      current,
      DEFAULT_NOTIFICATION_PREFERENCES,
      new Set(),
      { playerNames },
    );
    expect(notifications.some((n) => n.type === "TRANSFER_CHANGE")).toBe(true);
  });

  it("SAVE to SAVE creates no transfer alert", () => {
    const previous = baseState({ transferAction: "SAVE" });
    const current = baseState({ transferAction: "SAVE" });
    const notifications = evaluateNotifications(
      previous,
      current,
      DEFAULT_NOTIFICATION_PREFERENCES,
      new Set(),
      { playerNames },
    );
    expect(notifications.some((n) => n.type === "TRANSFER_CHANGE")).toBe(false);
  });

  it("lineup change creates alert", () => {
    const previous = baseState({ recommendedXI: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] });
    const current = baseState({
      recommendedXI: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12],
      playerAvailability: { 10: 100, 11: 25, 12: 100 },
      playerRisks: { 10: "LOW", 11: "HIGH", 12: "LOW" },
    });
    const notifications = evaluateNotifications(
      previous,
      current,
      DEFAULT_NOTIFICATION_PREFERENCES,
      new Set(),
      { playerNames },
    );
    expect(notifications.some((n) => n.type === "LINEUP_CHANGE")).toBe(true);
  });

  it("fixture change affecting squad creates alert", () => {
    const previous = baseState({ fixtureKeys: [] });
    const current = baseState({ fixtureKeys: ["100:DOUBLE:GW6"] });
    const notifications = evaluateNotifications(
      previous,
      current,
      DEFAULT_NOTIFICATION_PREFERENCES,
      new Set(),
      {
        playerNames,
        intelligenceFixtureChanges: [
          { fixtureId: 100, type: "DOUBLE", affectedPlayerIds: [10] },
        ],
      },
    );
    expect(notifications.some((n) => n.type === "DOUBLE_GAMEWEEK")).toBe(true);
  });
});

describe("deduplication", () => {
  it("same dedupe key sends once", () => {
    const key = buildDedupeKey(5, "CAPTAIN_CHANGE", ["player-12"]);
    const existing = new Set([key]);
    expect(isDuplicate(key, existing)).toBe(true);
  });

  it("repeated cron execution does not duplicate notifications", () => {
    const previous = baseState({ captainId: 10 });
    const current = baseState({ captainId: 12 });
    const dedupeKey = buildDedupeKey(5, "CAPTAIN_CHANGE", ["player-12"]);
    const notifications = evaluateNotifications(
      previous,
      current,
      DEFAULT_NOTIFICATION_PREFERENCES,
      new Set([dedupeKey]),
      { playerNames: new Map([[10, "Bruno"], [12, "Cole"]]) },
    );
    expect(notifications).toHaveLength(0);
  });
});

describe("preferences", () => {
  it("disabled alert type creates no notification", () => {
    const previous = baseState({ captainId: 10 });
    const current = baseState({ captainId: 12 });
    const prefs = { ...DEFAULT_NOTIFICATION_PREFERENCES, captainAlerts: false };
    const notifications = evaluateNotifications(
      previous,
      current,
      prefs,
      new Set(),
      { playerNames: new Map([[10, "Bruno"], [12, "Cole"]]) },
    );
    expect(notifications).toHaveLength(0);
  });

  it("severity threshold works", () => {
    const notification: Notification = {
      type: "GAMEWEEK_REPORT",
      severity: "INFO",
      title: "Report",
      message: "Test",
      actionRequired: false,
      dedupeKey: "GW5:GAMEWEEK_REPORT",
    };
    expect(meetsMinimumSeverity(notification.severity, "IMPORTANT")).toBe(false);
    expect(isTypeEnabled("GAMEWEEK_REPORT", DEFAULT_NOTIFICATION_PREFERENCES)).toBe(true);
  });

  it("disabled channel is not used", () => {
    const notification: Notification = {
      type: "DEADLINE_REMINDER",
      severity: "URGENT",
      title: "Deadline",
      message: "Soon",
      actionRequired: true,
      dedupeKey: "GW5:DEADLINE_REMINDER:2H",
    };
    const channels = selectChannels(notification, {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      email: false,
      sms: false,
    });
    expect(channels).toHaveLength(0);
  });
});

describe("quiet hours", () => {
  it("normal alerts are delayed", () => {
    const prefs = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      quietHours: { enabled: true, start: "00:00", end: "23:59" },
    };
    expect(shouldDelayDelivery("IMPORTANT", prefs)).toBe(true);
  });

  it("urgent alerts are not silently lost", () => {
    const prefs = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      quietHours: { enabled: true, start: "00:00", end: "23:59" },
    };
    expect(shouldDelayDelivery("URGENT", prefs)).toBe(false);
  });

  it("detects quiet hours window", () => {
    const prefs = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      quietHours: { enabled: true, start: "22:00", end: "07:00" },
    };
    const lateNight = new Date("2026-01-15T23:00:00");
    expect(isInQuietHours(prefs, lateNight)).toBe(true);
    const midday = new Date("2026-01-15T12:00:00");
    expect(isInQuietHours(prefs, midday)).toBe(false);
  });
});

describe("delivery formatting", () => {
  it("formats SMS message concisely", () => {
    const message = formatSmsMessage({
      type: "CAPTAIN_CHANGE",
      severity: "IMPORTANT",
      title: "Captain Alert",
      message: "Captain Alert\n\nPrevious: Bruno\nNew: Cole",
      actionRequired: true,
      dedupeKey: "test",
    });
    expect(message).toContain("Captain Alert");
    expect(message.length).toBeLessThan(200);
  });
});

describe("deadline logic", () => {
  it("does not send reminder after gameweek finished", () => {
    const notifications = evaluateDeadlineReminders(
      5,
      new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      true,
      "Cole",
      "SAVE",
      undefined,
      DEFAULT_NOTIFICATION_PREFERENCES,
      new Set(),
    );
    expect(notifications).toHaveLength(0);
  });

  it("sends reminder within 2 hour window", () => {
    const deadline = new Date(Date.now() + 90 * 60 * 1000).toISOString();
    const notifications = evaluateDeadlineReminders(
      5,
      deadline,
      false,
      "Cole",
      "SAVE",
      undefined,
      DEFAULT_NOTIFICATION_PREFERENCES,
      new Set(),
    );
    expect(notifications.some((n) => n.type === "DEADLINE_REMINDER")).toBe(true);
  });
});

describe("cron auth", () => {
  const originalSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = "test-secret";
  });

  afterEach(() => {
    process.env.CRON_SECRET = originalSecret;
  });

  it("unauthorized cron request rejected", () => {
    const request = new Request("http://localhost/api/cron/deadline-check");
    expect(validateCronRequest(request)).toBe(false);
  });

  it("authorized request succeeds", () => {
    const request = new Request("http://localhost/api/cron/deadline-check", {
      headers: { authorization: "Bearer test-secret" },
    });
    expect(validateCronRequest(request)).toBe(true);
  });
});

describe("email/SMS provider failures", () => {
  it("email provider throws when not configured", async () => {
    const { createEmailProvider } = await import("@/lib/providers/email");
    process.env.NOTIFICATION_EMAIL_PROVIDER = "none";
    const provider = createEmailProvider();
    await expect(
      provider.sendEmail({ to: "a@b.com", subject: "Test", text: "Hello" }),
    ).rejects.toThrow();
  });

  it("SMS provider throws when not configured", async () => {
    const { createSMSProvider } = await import("@/lib/providers/sms");
    process.env.NOTIFICATION_SMS_PROVIDER = "none";
    const provider = createSMSProvider();
    await expect(
      provider.sendSMS({ to: "+123", message: "Hello" }),
    ).rejects.toThrow();
  });
});

describe("channel selection", () => {
  it("urgent notifications include SMS when enabled", () => {
    const notification: Notification = {
      type: "CAPTAIN_RISK",
      severity: "URGENT",
      title: "Risk",
      message: "High risk",
      actionRequired: true,
      dedupeKey: "test",
    };
    const channels = selectChannels(notification, {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      sms: true,
    });
    expect(channels).toContain("EMAIL");
    expect(channels).toContain("SMS");
  });
});
