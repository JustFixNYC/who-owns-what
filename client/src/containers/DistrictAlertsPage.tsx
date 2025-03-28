import React, { useContext, useRef, useState } from "react";
import { withI18n, withI18nProps } from "@lingui/react";
import { t, Trans } from "@lingui/macro";
import { Button, Icon, Link } from "@justfixnyc/component-library";
import Select, { GroupBase, SelectInstance, SingleValue } from "react-select";
import { useHistory } from "react-router-dom";

import "styles/DistrictAlertsPage.css";
import Page from "components/Page";
import { UserContext } from "components/UserContext";
import Modal from "components/Modal";
import { createWhoOwnsWhatRoutePaths } from "routes";
import { DistrictMap } from "../components/DistrictMap";

import ntaData from "../data/nta.json";
import ccdData from "../data/ccd.json";

export interface AreaProperties {
  arealabel: string;
  areavalue: string;
  typelabel: string;
  typevalue: string;
}

interface GeoJsonGeometry {
  type: "MultiPolygon";
  coordinates: any;
}

export interface GeoJsonFeature {
  type: "Feature";
  id: number;
  geometry: GeoJsonGeometry;
  properties: AreaProperties;
}

export interface GeoJsonFeatureCollection {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
}

type AreaTypeOption = { label: string; value: string; data: GeoJsonFeatureCollection };
export type AreaOption = { label: string; value: string; feature: GeoJsonFeature; mapUrl?: string };

const areaTypeOptions: AreaTypeOption[] = [
  { value: "nta", label: "Neighborhoods", data: ntaData as GeoJsonFeatureCollection },
  {
    value: "coun_dist",
    label: "City Council Districts",
    data: ccdData as GeoJsonFeatureCollection,
  },
];

const DistrictAlertsPage = withI18n()((props: withI18nProps) => {
  const userContext = useContext(UserContext);
  if (!userContext.user) return <div />;

  const { i18n } = props;

  return (
    <Page title={i18n._(t`District Alerts`)}>
      <div className="DistrictAlertsPage Page">
        <div className="page-container">
          <Trans render="h2">Area alerts</Trans>
          <p>
            Get a weekly email that identifies buildings and portfolios that exhibit urgent
            displacement indicators within a single area or multiple areas of the city.
          </p>
          <Link href="#" target="_blank" rel="noopener noreferrer" icon="external">
            View sample area alerts email
          </Link>
          <DistrictCreation />
        </div>
      </div>
    </Page>
  );
});

const DistrictCreation = withI18n()((props: withI18nProps) => {
  const { i18n } = props;
  const userContext = useContext(UserContext);
  const isLoggedIn = !!userContext?.user?.email;

  const history = useHistory();
  const { account } = createWhoOwnsWhatRoutePaths();

  const defaultAreaType = areaTypeOptions.filter((area) => area.value === "nta")[0];
  const [areaType, setAreaType] = useState<AreaTypeOption>(defaultAreaType);

  const areaOptions = areaType.data?.features.map((x) => {
    return {
      label: x.properties.arealabel,
      value: x.properties.areavalue,
      feature: x,
    };
  });

  const [showSaveAreaError, setShowSaveAreaError] = useState(false);
  const [showBoundariesModal, setShowBoundariesModal] = useState(false);

  const [areaSelections, setAreaSelections] = useState<GeoJsonFeature[]>([]);
  const selectedAreaIds = areaSelections.map((x) => x.id);

  const geoSelectRef = useRef<SelectInstance<AreaOption, false, GroupBase<AreaOption>>>(null);

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

  const removeAreaFromSelections = (area: GeoJsonFeature) => {
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

  return (
    <>
      <div className="district-selection">
        <Trans render="h3">Create your email</Trans>
        <hr />
        <Trans render="p">You can follow one or multiple areas.</Trans>
        <Trans render="p">
          Need help finding an area?{" "}
          <button
            className="map-modal-button button is-text"
            onClick={() => setShowBoundariesModal(true)}
          >
            See all area maps
          </button>
        </Trans>
        <Trans render="strong">Area</Trans>
        <Select
          className="dropdown-select"
          aria-label="Area type selection"
          defaultValue={defaultAreaType}
          options={areaTypeOptions}
          onChange={handleGeoTypeChange}
        />
        <Select
          ref={geoSelectRef}
          className="dropdown-select"
          aria-label="Area selection"
          placeholder={`Select or type a ${areaType.label}`}
          options={areaOptions}
          isOptionDisabled={(option) => selectedAreaIds.includes(option.feature.id)}
          onChange={handleGeoChange}
        />
        <DistrictMap
          districtsData={areaType.data}
          areaSelections={areaSelections}
          setAreaSelections={setAreaSelections}
        />
        <hr />
        <div className="area-selection-container">
          <div className="area-selection-chip-container">
            {areaSelections.map((area, i) => (
              <AreaChip area={area} onClose={removeAreaFromSelections} key={i} />
            ))}
          </div>
          <span className="selection-message">
            {areaSelections.length ? (
              <>You can save or add more areas to your email</>
            ) : (
              <>Add an area to build your email</>
            )}
          </span>
        </div>
      </div>
      <Button
        className="save-selection"
        labelText="Save selections"
        // disabled={!areaSelections.length}
        onClick={saveSelections}
      />
      {showSaveAreaError && (
        <div className="error-message">
          <Icon icon="circleExclamation" />
          You must add at least one area before saving selections
        </div>
      )}
      <Modal showModal={showBoundariesModal} onClose={() => setShowBoundariesModal(false)}>
        <Trans render="h3">Area maps</Trans>
        <Trans render="p">View a map of each area type lorem ipsum dolor sit amet</Trans>
        <ul>
          {areaTypeOptions.map((areaType, i) => (
            <li key={i}>
              <Link
                // href={areaType.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                icon="external"
              >
                <Trans>{areaType.label}</Trans>
              </Link>
            </li>
          ))}
        </ul>
      </Modal>
    </>
  );
});

type AreaChipProps = {
  area: GeoJsonFeature;
  onClose: (area: GeoJsonFeature) => void;
};
const AreaChip: React.FC<AreaChipProps> = ({ onClose, area }) => {
  const areaTypeLabel = area.properties?.typelabel;
  const areaLabel = area.properties?.arealabel;

  return (
    <div className="area-selection-chip">
      {areaTypeLabel}: {areaLabel}
      <button onClick={() => onClose(area)}>
        <Icon icon="xmark" />
      </button>
    </div>
  );
};

export default DistrictAlertsPage;
