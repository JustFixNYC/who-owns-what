import React from "react";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import { I18nProvider } from "@lingui/react";
import { MemoryRouter } from "react-router-dom";

import PropertiesMap from "./PropertiesMap";
import { AddressRecord } from "./APIDataTypes";
import { defaultFilterContext, FilterContext } from "./PropertiesList";
import { SAMPLE_ADDRESS_RECORDS } from "state-machine-sample-data";
import { createAddressPageRoutes } from "routes";
import mapping from "util/mapping";

jest.mock("react-resize-detector", () => ({
  withResizeDetector: (Component: React.ComponentType) => Component,
}));

// Exercise the map component without WebGL, a Mapbox token, or tile requests.
jest.mock("react-mapbox-gl", () => ({
  __esModule: true,
  default: () => ({ children, fitBounds }: any) => (
    <div data-map-bounds={JSON.stringify(fitBounds)}>{children}</div>
  ),
  Layer: ({ children, id }: any) => <div data-layer={id}>{children}</div>,
  Feature: ({ coordinates, properties, onClick }: any) => (
    <button
      data-coordinates={JSON.stringify(coordinates)}
      data-map-type={properties.mapType}
      onClick={onClick}
    />
  ),
  ZoomControl: () => null,
}));

type Props = React.ComponentProps<typeof PropertiesMap>;

describe("PropertiesMap coordinates", () => {
  let container: HTMLDivElement;
  let onAddrChange: jest.Mock;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    onAddrChange = jest.fn();
    jest.spyOn(mapping, "hasWebGLContext").mockReturnValue(true);
  });

  afterEach(() => {
    act(() => {
      ReactDOM.unmountComponentAtNode(container);
    });
    container.remove();
    jest.restoreAllMocks();
  });

  function address(bbl: string, lat = 40.7, lng = -74): AddressRecord {
    return { ...SAMPLE_ADDRESS_RECORDS[0], bbl, lat, lng };
  }

  function render(
    assocAddrs: AddressRecord[],
    searchAddr = assocAddrs[0],
    detailAddr = searchAddr,
    location: "overview" | "portfolio" = "overview",
    useNewPortfolioMethod = false
  ) {
    const state = {
      context: { portfolioData: { assocAddrs, searchAddr, detailAddr }, useNewPortfolioMethod },
    } as Props["state"];

    act(() => {
      ReactDOM.render(
        <MemoryRouter>
          <I18nProvider language="en" catalogs={{ en: { messages: {} } }}>
            <FilterContext.Provider
              value={{ filterContext: defaultFilterContext, setFilterContext: jest.fn() }}
            >
              <PropertiesMap
                state={state}
                send={jest.fn()}
                onAddrChange={onAddrChange}
                isVisible={true}
                addressPageRoutes={createAddressPageRoutes("/example")}
                location={location}
              />
            </FilterContext.Provider>
          </I18nProvider>
        </MemoryRouter>,
        container
      );
    });
  }

  function coordinates(layer: string) {
    return Array.from(
      container.querySelectorAll(`[data-layer="${layer}"] [data-coordinates]`)
    ).map((feature) => JSON.parse(feature.getAttribute("data-coordinates")!));
  }

  function bounds() {
    return JSON.parse(
      container.querySelector("[data-map-bounds]")!.getAttribute("data-map-bounds")!
    );
  }

  it.each<[number | null | undefined, number | null | undefined]>([
    [null, null],
    [null, -74],
    [40.7, null],
    [NaN, -74],
    [40.7, NaN],
    [undefined, undefined],
    [Infinity, -74],
    [40.7, -Infinity],
  ])("omits an unmappable building (%s, %s) from features and bounds", (lat, lng) => {
    const invalid = { ...address("1000000001"), lat, lng } as AddressRecord;
    const valid = address("1000000002");
    const assocAddrs = [invalid, valid];

    // The searched building can itself lack coordinates; the rest of its
    // portfolio should still be visible and the original data preserved.
    render(assocAddrs, invalid);

    expect(coordinates("assoc")).toEqual([[-74, 40.7]]);
    expect(coordinates("detail")).toEqual([]);
    expect(bounds()).toEqual([
      [-74, 40.7],
      [-74, 40.7],
    ]);
    expect(assocAddrs).toEqual([invalid, valid]);
    expect(invalid.lat).toBe(lat);
    expect(invalid.lng).toBe(lng);
  });

  it("uses the default city bounds when no building has coordinates", () => {
    const invalid = { ...address("1000000001"), lat: null, lng: null };
    render([invalid]);

    expect(coordinates("assoc")).toEqual([]);
    expect(coordinates("detail")).toEqual([]);
    expect(bounds()).toEqual([
      [-74.259087, 40.477398],
      [-73.700172, 40.917576],
    ]);
  });

  it.each([300, 301])(
    "counts all %s buildings for the big-portfolio alert, including unmappable ones",
    (portfolioSize) => {
      const assocAddrs = Array.from({ length: portfolioSize }, (_, index) =>
        address(`${1000000000 + index}`)
      );
      assocAddrs[portfolioSize - 1].lat = null;
      assocAddrs[portfolioSize - 1].lng = null;

      render(assocAddrs, assocAddrs[0], assocAddrs[0], "overview", true);

      expect(coordinates("assoc")).toHaveLength(portfolioSize - 1);
      expect(container.querySelector(".big-portfolio-alert") !== null).toBe(portfolioSize > 300);
      expect(assocAddrs).toHaveLength(portfolioSize);
    }
  );

  it("keeps valid markers, search highlighting, bounds and address selection", () => {
    const search = address("1000000001");
    const associated = address("1000000002", 40.8, -73.9);
    render([search, associated]);

    expect(coordinates("assoc")).toEqual([
      [-73.9, 40.8],
      [-74, 40.7],
    ]);
    expect(coordinates("detail")).toEqual([[-74, 40.7]]);
    expect(bounds()).toEqual([
      [-74, 40.7],
      [-73.9, 40.8],
    ]);
    const searchMarker = container.querySelector(
      '[data-layer="assoc"] [data-map-type="search"]'
    ) as HTMLButtonElement;
    act(() => searchMarker.click());
    expect(onAddrChange).toHaveBeenCalledWith(search.bbl);
  });

  it("does not treat zero coordinates as missing", () => {
    const search = address("1000000001", 0, 0);
    render([search]);

    expect(coordinates("assoc")).toEqual([[0, 0]]);
    expect(coordinates("detail")).toEqual([[0, 0]]);
    expect(bounds()).toEqual([
      [0, 0],
      [0, 0],
    ]);
  });

  it("can select a valid zero-coordinate marker on the portfolio map", () => {
    const search = address("1000000001", 0, 0);
    render([search], search, search, "portfolio");
    const marker = container.querySelector('[data-layer="assoc"] button') as HTMLButtonElement;
    act(() => marker.click());

    expect(coordinates("selected")).toEqual([[0, 0]]);
    expect(onAddrChange).toHaveBeenCalledWith(search.bbl);
  });
});
