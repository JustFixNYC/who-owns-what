import React from "react";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";

import { OtpInput } from "./OtpInput";

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

  it("forwards paste events to onPaste", () => {
    const onPaste = jest.fn();

    act(() => {
      ReactDOM.render(
        <OtpInput id="otp" name="code" value="" onChange={jest.fn()} onPaste={onPaste} />,
        container
      );
    });

    const input = container.querySelector(".otp-input__field") as HTMLInputElement;
    const pasteEvent = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(pasteEvent, "clipboardData", {
      value: { getData: () => "123456" },
    });

    act(() => {
      input.dispatchEvent(pasteEvent);
    });

    expect(onPaste).toHaveBeenCalledTimes(1);
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
});
