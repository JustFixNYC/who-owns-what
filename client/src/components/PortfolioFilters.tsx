import { Trans } from "@lingui/macro";
import React from "react";
import { CheckIcon, ChevronIcon } from "./Icons";
import { Multiselect } from "./multiselect-dropdown/multiselect/Multiselect";
import { FilterContext } from "./PropertiesList";
// import FocusTrap from "focus-trap-react";

export const PortfolioFilters = React.memo(
  React.forwardRef<HTMLDivElement>((props, ref) => {
    const { filterContext, setFilterContext } = React.useContext(FilterContext);

    const { totalBuildings, filteredBuildings } = filterContext;

    const updateRsunitslatest = () => {
      setFilterContext({
        ...filterContext,
        filterSelections: {
          ...filterContext.filterSelections,
          rsunitslatest: !filterContext.filterSelections.rsunitslatest,
        },
      });
    };

    const updateOwnernames = (selectedList: any) => {
      setFilterContext({
        ...filterContext,
        filterSelections: {
          ...filterContext.filterSelections,
          ownernames: selectedList,
        },
      });
    };

    const updateUnitsRes = (selectedList: any) => {
      setFilterContext({
        ...filterContext,
        filterSelections: {
          ...filterContext.filterSelections,
          unitsres: selectedList,
        },
      });
    };

    const updateZip = (selectedList: any) => {
      setFilterContext({
        ...filterContext,
        filterSelections: {
          ...filterContext.filterSelections,
          zip: selectedList,
        },
      });
    };

    return (
      <div className="filter-bar" ref={ref}>
        <div className="filter-for">
          <div className="pill-new">
            <Trans>New</Trans>
          </div>
          <Trans>
            Filter&nbsp;
            <br />
            for
          </Trans>
          :
        </div>
        <div className="filters-container">
          <div className="filters">
            <ToggleFilter onClick={updateRsunitslatest} className="filter-toggle">
              <Trans>Rent Stabilized Units</Trans>
            </ToggleFilter>

            {/* <FocusTrap
                active={landlordFilterOpen}
                focusTrapOptions={{
                  clickOutsideDeactivates: true,
                  returnFocusOnDeactivate: false,
                  onDeactivate: () => setLandlordFilterOpen(false),
                }}
              > */}
            <details className="filter-accordian" id="landlord-filter-accordian">
              <summary>
                <Trans>Landlord</Trans>
                <ChevronIcon className="chevonIcon" />
              </summary>
              <div className="dropdown-container">
                <span className="filter-subtitle">
                  <Trans>Officer/Owner</Trans>
                </span>
                <MultiSelectFilter
                  options={filterContext.filterOptions.ownernames}
                  onApply={(selectedList) => {
                    document.querySelector("#landlord-filter-accordian")!.removeAttribute("open");
                    updateOwnernames(selectedList);
                  }}
                />
              </div>
            </details>
            {/* </FocusTrap> */}
            <details className="filter-accordian" id="unitsres-filter-accordian">
              <summary>
                <Trans>Building Size</Trans>
                <ChevronIcon className="chevonIcon" />
              </summary>
              <div className="dropdown-container">
                <span className="filter-subtitle">
                  <Trans>Number of Units</Trans>
                </span>
                <MinMaxFilter
                  options={filterContext.filterOptions.unitsres}
                  onApply={(selectedList) => {
                    document.querySelector("#unitsres-filter-accordian")!.removeAttribute("open");
                    updateUnitsRes(selectedList);
                  }}
                />
              </div>
            </details>
            <details className="filter-accordian" id="zipcode-filter-accordian">
              <summary>
                <Trans>Zipcode</Trans>
                <ChevronIcon className="chevonIcon" />
              </summary>
              <div className="dropdown-container">
                <MultiSelectFilter
                  options={filterContext.filterOptions.zip}
                  onApply={(selectedList) => {
                    document.querySelector("#zipcode-filter-accordian")!.removeAttribute("open");
                    updateZip(selectedList);
                  }}
                />
              </div>
            </details>
          </div>
          {/* TODO: what if all properties in portfolio are selected by applied filters? Need another way to know when filters are active */}
          {totalBuildings !== filteredBuildings && (
            <div className="filter-status">
              <span className="results-count">
                <Trans>Showing {filteredBuildings} results.</Trans>
              </span>
              <button className="data-issue button is-text">
                <Trans>Notice an inaccuracy? Click here.</Trans>
              </button>
              <button className="clear-filters button is-text">
                <Trans>Clear Filters</Trans>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  })
);

// TODO: for this to work with map as well, we'll need to change this up
function MultiSelectFilter({
  options,
  onApply,
}: {
  options: any[];
  onApply: (selectedList: any) => void;
}) {
  return (
    <Multiselect
      options={options.map((value: any) => ({ name: value, id: value }))}
      displayValue="name"
      // TODO: localize
      placeholder={`Search... (${options.length})`}
      onApply={onApply}
    />
  );
}

function MinMaxFilter({
  options,
  onApply,
}: {
  options: [number, number] | undefined;
  onApply: (selectedList: [number, number] | undefined) => void;
}) {
  const [minMax, setMinMax] = React.useState(options);

  return (
    <div>
      <DebouncedInput
        type="number"
        min={options ? options[0] : 0}
        max={options ? options[1] : ""}
        value={""}
        // TODO: deal with default max when undefined
        onChange={(value) => setMinMax([Number(value), minMax ? minMax[1] : 99999])}
        // TODO: localize
        placeholder="MIN"
        className="min-input"
      />
      <Trans>and</Trans>
      <DebouncedInput
        type="number"
        min={options ? options[0] : 0}
        max={options ? options[1] : ""}
        value={""}
        onChange={(value) => setMinMax([minMax ? minMax[0] : 0, Number(value || 99999)])}
        // TODO: localize
        placeholder="MAX"
        className="max-input"
      />
      <button onClick={() => onApply(minMax)} className="button is-primary">
        <Trans>Apply</Trans>
      </button>
    </div>
  );
}

function ToggleFilter({
  onClick,
  children,
  className,
}: {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  let [isPressed, setIsPressed] = React.useState(false);

  const handleToggle = () => {
    onClick();
    setIsPressed(!isPressed);
  };

  return (
    <button aria-pressed={isPressed} onClick={handleToggle} className={className}>
      <div className="checkbox">{isPressed && <CheckIcon />}</div>
      {children}
    </button>
  );
}

// A debounced input react component
function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: {
  value: string | number;
  onChange: (value: string | number) => void;
  debounce?: number;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">) {
  const [value, setValue] = React.useState(initialValue);

  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounce);

    return () => clearTimeout(timeout);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return <input {...props} value={value} onChange={(e) => setValue(e.target.value)} />;
}
