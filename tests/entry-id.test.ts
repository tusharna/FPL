import { describe, expect, it } from "vitest";
import { parseFplEntryId } from "@/lib/auth/entry-id";

describe("parseFplEntryId", () => {
  it("accepts a positive team id", () => {
    expect(parseFplEntryId("3944035")).toBe(3944035);
    expect(parseFplEntryId(12)).toBe(12);
  });

  it("rejects blank, decimal, and oversized values", () => {
    expect(parseFplEntryId("")).toBeNull();
    expect(parseFplEntryId("12.5")).toBeNull();
    expect(parseFplEntryId(0)).toBeNull();
    expect(parseFplEntryId(-4)).toBeNull();
    expect(parseFplEntryId("team")).toBeNull();
  });
});