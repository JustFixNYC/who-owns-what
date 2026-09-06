import React from "react";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import { I18nProvider } from "@lingui/react";

import catalogEn from "../locales/en/messages";
import { CodeEntry } from "./CodeEntry";

const catalogs = { en: catalogEn };

describe("CodeEntry paste", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(container);
    document.body.removeChild(container);
  });

  it("sanitizes pasted clipboard text into the OTP field", () => {
    act(() => {
      ReactDOM.render(
        <I18nProvider language="en" catalogs={catalogs}>
          <CodeEntry email="tenant@example.com" onVerify={jest.fn()} onResend={jest.fn()} />
        </I18nProvider>,
        container
      );
    });

    const input = container.querySelector(".otp-input__field") as HTMLInputElement;
    const pasteEvent = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(pasteEvent, "clipboardData", {
      value: { getData: () => "12 34-56789" },
    });

    act(() => {
      input.dispatchEvent(pasteEvent);
    });

    expect(input.value).toBe("123456");
    expect(container.querySelectorAll(".otp-input__cell")[5]?.textContent).toBe("6");
  });
});
