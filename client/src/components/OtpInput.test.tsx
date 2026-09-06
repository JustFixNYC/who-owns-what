import React from "react";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";

import { OtpInput, OTP_LENGTH, sanitizeOtpValue } from "./OtpInput";

describe("OtpInput", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(container);
    document.body.removeChild(container);
  });

  it("exposes one-time-code autocomplete on the real input", () => {
    act(() => {
      ReactDOM.render(<OtpInput id="otp" name="code" value="" onChange={jest.fn()} />, container);
    });

    const input = container.querySelector(".otp-input__field") as HTMLInputElement;
    expect(input.autocomplete).toBe("one-time-code");
    expect(input.inputMode).toBe("numeric");
  });

  it("sanitizes pasted clipboard text", () => {
    const onChange = jest.fn();

    act(() => {
      ReactDOM.render(<OtpInput id="otp" name="code" value="" onChange={onChange} />, container);
    });

    const input = container.querySelector(".otp-input__field") as HTMLInputElement;
    const pasteEvent = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(pasteEvent, "clipboardData", {
      value: { getData: () => "12 34-56789" },
    });

    act(() => {
      input.dispatchEvent(pasteEvent);
    });

    expect(onChange).toHaveBeenCalledWith("123456");
  });

  it("renders decorative cells from value", () => {
    act(() => {
      ReactDOM.render(
        <OtpInput id="otp" name="code" value="123" onChange={jest.fn()} />,
        container
      );
    });

    const cells = container.querySelectorAll(".otp-input__cell");
    expect(cells[0]?.textContent).toBe("1");
    expect(cells[1]?.textContent).toBe("2");
    expect(cells[2]?.textContent).toBe("3");
    expect(cells[3]?.textContent).toBe("");
  });

  it("shows active cell outline and caret when focused", () => {
    act(() => {
      ReactDOM.render(
        <OtpInput id="otp" name="code" value="" onChange={jest.fn()} autoFocus />,
        container
      );
    });

    const activeCell = container.querySelector(".otp-input__cell--active");
    const caret = container.querySelector(".otp-input__caret");

    expect(activeCell).not.toBeNull();
    expect(caret).not.toBeNull();
  });
});

describe("sanitizeOtpValue", () => {
  it("keeps a 6-digit numeric code", () => {
    expect(OTP_LENGTH).toBe(6);
    expect(sanitizeOtpValue("123456")).toBe("123456");
  });

  it("strips non-digits and truncates past 6", () => {
    expect(sanitizeOtpValue("12 34-56789")).toBe("123456");
    expect(sanitizeOtpValue("abcdef")).toBe("");
  });
});
