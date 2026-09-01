import * as UserSettingField from "components/UserSettingField";

describe("AccountSettingsPage password field", () => {
  it("does not export a password setting field after OTP cutover", () => {
    expect(
      (UserSettingField as { PasswordSettingField?: unknown }).PasswordSettingField
    ).toBeUndefined();
    expect(UserSettingField.EmailSettingField).toBeDefined();
  });
});
