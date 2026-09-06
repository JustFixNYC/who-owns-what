import { applyAuthCheckUser } from "./UserContext";

const loggedInUser = {
  email: "tenant@example.com",
  verified: true,
  id: 42,
  type: "tenant",
  buildingSubscriptions: [{ bbl: "1234567890" }],
  districtSubscriptions: [],
  subscriptionLimit: 15,
};

describe("applyAuthCheckUser", () => {
  it("does not let a stale logged-out auth_check replace a magic-link session", () => {
    const staleAuthCheck = { error: "Auth request failed (401)" };

    expect(applyAuthCheckUser(loggedInUser as any, staleAuthCheck)).toEqual(loggedInUser);
  });

  it("keeps a logged-in session when fetchUser returns nothing (network error)", () => {
    expect(applyAuthCheckUser(loggedInUser as any, undefined)).toEqual(loggedInUser);
  });

  it("records a logged-out sentinel when there is no session yet", () => {
    const result = applyAuthCheckUser(undefined, { error: "Auth request failed (401)" });

    expect(result?.email).toBeUndefined();
    expect(result?.buildingSubscriptions).toEqual([]);
  });

  it("applies a successful auth_check when context is still empty", () => {
    const result = applyAuthCheckUser(undefined, {
      email: "tenant@example.com",
      verified: true,
      id: 42,
      type: "tenant",
      subscriptions: [{ bbl: "1234567890" }],
      district_subscriptions: [],
      subscription_limit: 15,
    });

    expect(result).toEqual(loggedInUser);
  });
});
