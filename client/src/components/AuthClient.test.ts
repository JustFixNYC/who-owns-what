import AuthClient from "./AuthClient";
import { NetworkError } from "error-reporting";

describe("AuthClient network failure handling", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    // Keep tests deterministic regardless of browser globals.
    delete (window as any).Rollbar;
  });

  it("converts fetch network failures into NetworkError without requiring Rollbar", async () => {
    fetchMock.mockReject(new Error("Failed to fetch"));

    await expect(AuthClient.isEmailAlreadyUsed("test@example.com")).rejects.toBeInstanceOf(
      NetworkError
    );
  });

  it("fetchUser handles auth check network failures without throwing", async () => {
    fetchMock.mockReject(new Error("Failed to fetch"));

    await expect(AuthClient.fetchUser()).resolves.toBeUndefined();
    expect(AuthClient.user()).toBeUndefined();
  });

  it("fetchUser still populates user when auth check succeeds", async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({
        email: "person@example.com",
        verified: true,
        id: 10,
        type: "tenant",
        subscriptions: [{ bbl: "1000000000" }],
        district_subscriptions: [{ id: "sub-1" }],
        subscription_limit: 20,
      })
    );

    const user = await AuthClient.fetchUser();
    expect(user?.email).toBe("person@example.com");
    expect(user?.buildingSubscriptions?.length).toBe(1);
    expect(user?.districtSubscriptions?.length).toBe(1);
  });
});
