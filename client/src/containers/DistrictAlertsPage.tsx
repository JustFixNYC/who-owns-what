import React, { useContext, useEffect, useRef, useState } from "react";
import { withI18n, withI18nProps } from "@lingui/react";
import { t, Trans } from "@lingui/macro";
import { Button, Icon } from "@justfixnyc/component-library";
import Select, { GroupBase, SelectInstance, SingleValue } from "react-select";
import { useHistory } from "react-router-dom";
import { isMobile } from "react-device-detect";
import { I18n } from "@lingui/core";

import "styles/DistrictAlertsPage.css";
import Page from "components/Page";
import { UserContext } from "components/UserContext";
import { createWhoOwnsWhatRoutePaths } from "routes";
import { DistrictMap } from "../components/DistrictMap";
import helpers from "util/helpers";

import districtTypes from "../data/district-types.json";

export interface AreaProperties {
  areaLabel: string;
  areaValue: string;
  typeLabel: string;
  typeValue: string;
}

export interface GeoJsonFeatureDistrict {
  type: "Feature";
  id: number;
  geometry: {
    type: "MultiPolygon";
    coordinates: any;
  };
  properties: AreaProperties;
}

export interface GeoJsonFeatureLabel {
  type: "Feature";
  id: number;
  geometry: {
    type: "Point";
    coordinates: any;
  };
  properties: { areaLabel: string };
}

export interface DistrictsGeoJson {
  type: "FeatureCollection";
  features: GeoJsonFeatureDistrict[];
}

export interface LabelsGeoJson {
  type: "FeatureCollection";
  features: GeoJsonFeatureLabel[];
}

type AreaTypeOption = {
  label: string;
  value: string;
  districtsData?: DistrictsGeoJson;
  labelsData?: LabelsGeoJson;
};

export type AreaOption = {
  label: string;
  value: string;
  feature: GeoJsonFeatureDistrict;
  mapUrl?: string;
};

let areaTypeOptions: AreaTypeOption[] = districtTypes.options;

const DistrictCreation = withI18n()((props: withI18nProps) => {
  const { i18n } = props;
  const userContext = useContext(UserContext);
  const isLoggedIn = !!userContext?.user?.email;

  const history = useHistory();
  const { account } = createWhoOwnsWhatRoutePaths();

  const defaultAreaType = areaTypeOptions.filter((area) => area.value === "zipcode")[0];
  const [areaType, setAreaType] = useState<AreaTypeOption>(defaultAreaType);

  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
  const areaOptions = areaType.districtsData?.features
    .map((x) => {
      return {
        label: x.properties.areaLabel,
        value: x.properties.areaValue,
        feature: x,
      };
    })
    .sort((a, b) => collator.compare(a.label, b.label));

  const [showSaveAreaError, setShowSaveAreaError] = useState(false);

  const [areaSelections, setAreaSelections] = useState<GeoJsonFeatureDistrict[]>([]);
  const selectedAreaIds = areaSelections.map((x) => x.id);

  const geoSelectRef = useRef<SelectInstance<AreaOption, false, GroupBase<AreaOption>>>(null);
  const geoTypeDropdownRef = useRef<HTMLDivElement>(null);
  const geoValueDropdownRef = useRef<HTMLDivElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!!areaType.districtsData) return;
    const controller = new AbortController();
    const signal = controller.signal;
    const url = `${
      process.env.REACT_APP_API_BASE_URL || ""
    }/api/alerts/district/geojson?district_type=${areaType.value}`;

    fetch(url, { signal })
      .then((res) => res.json())
      .then((data) => {
        const updatedAreaType = data["result"][0] as AreaTypeOption;
        setAreaType(updatedAreaType);
        areaTypeOptions = areaTypeOptions
          .filter((x) => x.value !== updatedAreaType.value)
          .concat([updatedAreaType]);
      });

    return () => {
      controller.abort();
    };
  }, [areaType]);

  const handleGeoTypeChange = (newValue: SingleValue<AreaTypeOption>) => {
    newValue && setAreaType(newValue);
    geoSelectRef.current?.clearValue();
  };

  const handleGeoChange = (newValue: SingleValue<AreaOption>) => {
    if (!newValue || selectedAreaIds.includes(newValue?.feature.id)) {
      return;
    }
    setAreaSelections((prev) => prev.concat([newValue.feature]));
  };

  const removeAreaFromSelections = (area: GeoJsonFeatureDistrict) => {
    setAreaSelections((prev) => prev.filter((x) => !(x.id === area.id)));
  };

  const saveSelections = async () => {
    if (!areaSelections.length) {
      setShowSaveAreaError(true);
      return;
    }

    const district = areaSelections.map((x) => x.properties);

    if (!isLoggedIn) {
      const loginRoute = `/${i18n.language}${account.login}`;
      history.push({ pathname: loginRoute, state: { district } });
      return;
    }

    await userContext.subscribeDistrict(district);
    history.push(account.settings);
  };

  const selectClassNames = {
    valueContainer: () => "dropdown-select__value-container",
    indicatorsContainer: () => "dropdown-select__indicators-container",
  };

  areaTypeOptions = areaTypeOptions.sort((a, b) => collator.compare(a.label, b.label));

  return (
    <div className="district-selection">
      <DistrictMap
        districtsData={areaType.districtsData}
        labelsData={areaType.labelsData}
        areaSelections={areaSelections}
        setAreaSelections={setAreaSelections}
        saveButtonRef={saveButtonRef}
      />
      <div className="district-selection__sidebar">
        <Trans render="h2">NYC Area Alerts</Trans>
        <Trans render="p">
          Get a weekly email that identifies buildings and landlord portfolios where tenants are at
          risk of displacement.
        </Trans>
        <hr />
        <Trans render="p">Use the drop-down menu to change between different types of areas.</Trans>
        <div className="district-type-dropdown" ref={geoTypeDropdownRef}>
          <Select
            className="dropdown-select"
            classNames={selectClassNames}
            aria-label={i18n._(t`Area type selection`)}
            defaultValue={defaultAreaType}
            options={areaTypeOptions}
            onChange={handleGeoTypeChange}
            onMenuOpen={() =>
              geoTypeDropdownRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
            // TODO check if this works
            isSearchable={!isMobile}
          />
        </div>
        <div className="district-value-dropdown" ref={geoValueDropdownRef}>
          <Select
            ref={geoSelectRef}
            className="dropdown-select"
            classNames={selectClassNames}
            aria-label={i18n._(t`Area selection`)}
            placeholder={i18n._(t`Select or type a`) + " " + areaType.label}
            options={areaOptions}
            isOptionDisabled={(option) => selectedAreaIds.includes(option.feature.id)}
            onChange={handleGeoChange}
            onMenuOpen={() =>
              geoValueDropdownRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
            isSearchable={!isMobile}
          />
        </div>
        {!!areaSelections.length && (
          <div className="area-selection-container">
            <hr />
            <div className="area-selection-chip-container">
              {areaSelections.map((area, i) => (
                <AreaChip area={area} onClose={removeAreaFromSelections} i18n={i18n} key={i} />
              ))}
            </div>
            <Trans render="span" className="selection-message">
              Save or add more areas
            </Trans>
          </div>
        )}
        {!areaSelections.length && showSaveAreaError && (
          <div className="error-message">
            <Icon icon="circleExclamation" />
            <Trans>Select an area</Trans>
          </div>
        )}
        <Button
          ref={saveButtonRef}
          className="save-selection"
          labelText={i18n._(t`Save selections`)}
          onClick={saveSelections}
        />
      </div>
    </div>
  );
});

type AreaChipProps = {
  area: GeoJsonFeatureDistrict;
  onClose: (area: GeoJsonFeatureDistrict) => void;
  i18n: I18n;
};
const AreaChip: React.FC<AreaChipProps> = ({ onClose, area, i18n }) => {
  const chipLabel = helpers.formatTranslatedAreaLabel(area.properties, i18n);

  return (
    <div className="area-selection-chip">
      <span className="area-selection-chip__label">{chipLabel}</span>
      <button onClick={() => onClose(area)}>
        <Icon icon="xmark" />
      </button>
    </div>
  );
};

const DistrictAlertsPage = withI18n()((props: withI18nProps) => {
  const userContext = useContext(UserContext);
  if (!userContext.user) return <div />;

  const { i18n } = props;

  return (
    <Page title={i18n._(t`Area Alerts`)}>
      <div className="DistrictAlertsPage Page">
        <div className="page-container">
          <DistrictCreation />
        </div>
      </div>
    </Page>
  );
});

export default DistrictAlertsPage;
