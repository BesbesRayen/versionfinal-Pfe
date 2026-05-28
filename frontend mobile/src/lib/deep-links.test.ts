import { describe, expect, it } from "vitest";
import { resolveDeepLink } from "@/lib/deep-links";

describe("resolveDeepLink", () => {
  it("opens requested app screens from the CreditTN scheme", () => {
    expect(resolveDeepLink("credittn://home")).toEqual({ route: "Home" });
    expect(resolveDeepLink("credittn://payments")).toEqual({ route: "Installments" });
    expect(resolveDeepLink("credittn://login")).toEqual({ route: "Login" });
  });

  it("opens Expo Go development URLs with an app route", () => {
    expect(resolveDeepLink("exp://192.168.1.167:8084/--/home")).toEqual({ route: "Home" });
    expect(resolveDeepLink("exp://192.168.1.167:8084/--/payments")).toEqual({ route: "Installments" });
  });
});
