import { reportError, NetworkError, HTTPError } from "error-reporting";

describe("reportError()", () => {
  let errMock = jest.fn();

  beforeEach(() => {
    console.error = errMock = jest.fn();
  });

  it("reports strings", () => {
    reportError("blah");
    expect(errMock).toHaveBeenCalledWith("blah");
  });

  it("reports network errors we want to report", () => {
    const e = new NetworkError("oof", true);
    reportError(e);
    expect(errMock).toHaveBeenCalledWith(e);
  });

  it("ignores network errors we don't want to report", () => {
    const e = new NetworkError("doh", false);
    reportError(e);
    expect(errMock).not.toHaveBeenCalled();
  });
});

describe("HTTPError", () => {
  const makeHttpError = (status: number) => new HTTPError({ status } as any);

  it("Identifies 500 as not being reportable", () => {
    expect(makeHttpError(500).shouldReport).toBe(false);
  });

  it("Identifies 400 as being reportable", () => {
    expect(makeHttpError(400).shouldReport).toBe(true);
  });
});
