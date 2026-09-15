import { describe, expect, it } from "vitest";
import {
  isNetworkError,
  notificationPollDecision,
  shouldPollNotifications,
} from "./network-error";

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

  it("does not start a poll while a request is already in flight", () => {
    expect(shouldPollNotifications({ hidden: false, online: true, inFlight: true })).toBe(false);
  });
});

describe("notificationPollDecision", () => {
  it("treats abort as non-fatal", () => {
    const error = new Error("The operation was aborted");
    error.name = "AbortError";
    expect(notificationPollDecision({ error })).toBe("ignore");
  });

  it("treats timeout as non-fatal", () => {
    const error = new Error("Timeout");
    error.name = "TimeoutError";
    expect(notificationPollDecision({ error })).toBe("ignore");
  });

  it("treats network errors as non-fatal", () => {
    expect(notificationPollDecision({ error: new TypeError("Failed to fetch") })).toBe("ignore");
  });

  it("stops polling after 401", () => {
    expect(notificationPollDecision({ status: 401 })).toBe("stop");
  });

  it("applies a successful feed response", () => {
    expect(notificationPollDecision({ status: 200 })).toBe("apply");
  });
});
