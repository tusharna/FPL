import { describe, expect, it } from "vitest";
import {
  APP_TIMEZONE,
  formatDate,
  formatDateTime,
  formatDeadline,
  formatTimestamp,
} from "@/lib/format";

describe("format timezone", () => {
  it("uses Asia/Kolkata as app timezone", () => {
    expect(APP_TIMEZONE).toBe("Asia/Kolkata");
  });

  it("formats deadline in IST", () => {
    const formatted = formatDeadline("2026-09-04T13:00:00Z");
    expect(formatted).toMatch(/IST|GMT\+5:30/i);
  });

  it("formats datetime in IST", () => {
    const formatted = formatDateTime("2026-09-04T13:00:00Z");
    expect(formatted).toMatch(/IST|GMT\+5:30/i);
    expect(formatted).toContain("2026");
  });

  it("formats date in IST", () => {
    const formatted = formatDate("2026-09-04T13:00:00Z");
    expect(formatted).toContain("2026");
  });

  it("includes IST in timestamp labels", () => {
    const formatted = formatTimestamp(new Date().toISOString());
    expect(formatted).toMatch(/IST|GMT\+5:30/i);
  });
});
