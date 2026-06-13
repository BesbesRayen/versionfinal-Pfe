import { afterEach, describe, expect, it, vi } from "vitest";
import { getDeviceLocalDate } from "@/lib/deviceDate";

describe("device date synchronization", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("sends the phone calendar date without UTC conversion", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 27, 15, 36, 0));

    expect(getDeviceLocalDate()).toBe("2026-08-27");
  });
});
