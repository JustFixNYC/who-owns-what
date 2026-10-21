import React from "react";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import { I18nProvider } from "@lingui/react";

import MultiSelect from "./Multiselect";

const options = Array.from({ length: 6 }, (_, index) => ({
  value: `${index + 1}`,
  label: `Owner ${index + 1}`,
}));

describe("MultiSelect keyboard focus", () => {
  let container: HTMLDivElement;
  let onApply: jest.Mock;
  let onChange: jest.Mock;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    onApply = jest.fn();
    onChange = jest.fn();
  });

  afterEach(() => {
    act(() => {
      ReactDOM.unmountComponentAtNode(container);
    });
    container.remove();
  });

  function render(selections = options.slice(0, 3)) {
    const component = (isOpen: boolean) => (
      <I18nProvider language="en" catalogs={{ en: { messages: {} } }}>
        <MultiSelect
          aria-label="Landlord filter"
          options={options}
          defaultSelections={selections}
          isOpen={isOpen}
          onApply={onApply}
          onChange={onChange}
        />
      </I18nProvider>
    );

    act(() => {
      ReactDOM.render(component(false), container);
    });
    act(() => {
      ReactDOM.render(component(true), container);
    });

    return container.querySelector("input")!;
  }

  function pressKey(input: HTMLInputElement, key: string) {
    act(() => {
      input.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
    });
  }

  function focusedLabel() {
    return container.querySelector(
      ".multiselect__multi-value--is-focused .multiselect__multi-value__label"
    )?.textContent;
  }

  function selectedLabels() {
    return Array.from(container.querySelectorAll(".multiselect__multi-value__label")).map(
      (element) => element.textContent
    );
  }

  it("moves the visible focus indicator with the arrow keys and clears it on return to input", () => {
    const input = render();
    act(() => input.focus());
    expect(focusedLabel()).toBeUndefined();

    pressKey(input, "ArrowLeft");
    expect(focusedLabel()).toBe("Owner 3");
    pressKey(input, "ArrowLeft");
    expect(focusedLabel()).toBe("Owner 2");
    pressKey(input, "ArrowRight");
    expect(focusedLabel()).toBe("Owner 3");
    pressKey(input, "ArrowRight");
    expect(focusedLabel()).toBeUndefined();
    expect(document.activeElement).toBe(input);
  });

  it("clears the selected-value focus indicator when the input loses focus", () => {
    const input = render();
    act(() => input.focus());
    pressKey(input, "ArrowLeft");
    expect(focusedLabel()).toBe("Owner 3");

    act(() => input.blur());
    expect(focusedLabel()).toBeUndefined();
  });

  it("keeps arrow keys in the search text until the input is empty", () => {
    const input = render();
    act(() => input.focus());
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    const type = (value: string) => {
      act(() => {
        setValue.call(input, value);
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });
    };

    type("Owner");
    expect(input.value).toBe("Owner");
    pressKey(input, "ArrowLeft");
    expect(focusedLabel()).toBeUndefined();
    expect(selectedLabels()).toHaveLength(3);

    type("");
    pressKey(input, "ArrowLeft");
    expect(focusedLabel()).toBe("Owner 3");
  });

  it.each(["Backspace", "Delete"])("removes the visibly focused value with %s", (key) => {
    const input = render();
    act(() => input.focus());
    pressKey(input, "ArrowLeft");
    pressKey(input, "ArrowLeft");
    expect(focusedLabel()).toBe("Owner 2");

    pressKey(input, key);
    expect(selectedLabels()).toEqual(["Owner 1", "Owner 3"]);
    expect(onChange).toHaveBeenLastCalledWith(
      [options[0], options[2]],
      expect.objectContaining({ action: "remove-value", removedValue: options[1] })
    );
  });

  it("reveals a focused value beyond the selection preview", () => {
    const input = render(options);
    expect(selectedLabels()).toHaveLength(5);
    act(() => input.focus());

    pressKey(input, "ArrowLeft");
    expect(focusedLabel()).toBe("Owner 6");
    expect(selectedLabels()).toHaveLength(6);
    pressKey(input, "ArrowLeft");
    expect(focusedLabel()).toBe("Owner 5");
    pressKey(input, "ArrowRight");
    pressKey(input, "ArrowRight");
    expect(focusedLabel()).toBeUndefined();
    expect(selectedLabels()).toHaveLength(5);
  });

  it("keeps show more, show less, and clear controls independent of the options menu", () => {
    const input = render(options);
    const click = (selector: string) => {
      const button = container.querySelector(selector) as HTMLButtonElement;
      act(() => {
        button.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
        button.click();
      });
    };

    click(".multiselect__show-more-button");
    expect(selectedLabels()).toHaveLength(6);
    expect(input.getAttribute("aria-expanded")).toBe("false");
    click(".multiselect__show-less-button");
    expect(selectedLabels()).toHaveLength(5);
    expect(input.getAttribute("aria-expanded")).toBe("false");
    click(".multiselect__clear-value-button");
    expect(selectedLabels()).toHaveLength(0);
    expect(onApply).toHaveBeenLastCalledWith([]);
    expect(input.getAttribute("aria-expanded")).toBe("false");
  });

  it.each(["click", "touchend"])("removes a selected value with %s", (type) => {
    const input = render();
    const remove = container.querySelector('[aria-label="Remove Owner 2"]')!;
    act(() => {
      remove.dispatchEvent(new Event(type, { bubbles: true }));
    });

    expect(selectedLabels()).toEqual(["Owner 1", "Owner 3"]);
    expect(onChange).toHaveBeenLastCalledWith(
      [options[0], options[2]],
      expect.objectContaining({ action: "remove-value", removedValue: options[1] })
    );
    expect(document.activeElement).toBe(input);
    expect(input.getAttribute("aria-expanded")).toBe("true");
  });

  it("keeps the search placeholder when values are selected", () => {
    const input = render();
    expect(input.placeholder).toBe("Search... (6)");
  });
});
