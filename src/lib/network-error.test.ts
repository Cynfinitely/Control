import { describe, expect, it } from "vitest";
import { isNetworkError, shouldPollNotifications } from "./network-error";

describe("isNetworkError", () => {
  it("treats Failed to fetch as a network failure", () => {
    expect(isNetworkError(new TypeError("Failed to fetch"))).toBe(true);
  });

  it("treats Firefox and Safari fetch failures as network failures", () => {
    expect(isNetworkError(new TypeError("NetworkError when attempting to fetch resource."))).toBe(true);
    expect(isNetworkError(new TypeError("Load failed"))).toBe(true);
  });

  it("does not treat application errors as network failures", () => {
    expect(isNetworkError(new Error("Something went wrong"))).toBe(false);
    expect(isNetworkError(new Error("EMAIL_NOT_VERIFIED"))).toBe(false);
    expect(isNetworkError(null)).toBe(false);
    expect(isNetworkError("Failed to fetch")).toBe(false);
  });
});

describe("shouldPollNotifications", () => {
  it("polls only when the tab is visible and online", () => {
    expect(shouldPollNotifications({ hidden: false, online: true })).toBe(true);
    expect(shouldPollNotifications({ hidden: true, online: true })).toBe(false);
    expect(shouldPollNotifications({ hidden: false, online: false })).toBe(false);
  });
});
