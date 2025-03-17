import { useContext, useRef, useState } from "react";
import { withI18n, withI18nProps } from "@lingui/react";
import { t, Trans } from "@lingui/macro";
import { Button, Icon, Link } from "@justfixnyc/component-library";
import Select, { GroupBase, SelectInstance, SingleValue } from "react-select";

import "styles/DistrictAlertsPage.css";
import Page from "components/Page";
import { UserContext } from "components/UserContext";
import { JustfixUser } from "state-machine";
import Modal from "components/Modal";

import geoIds from "../data/district-ids.json";
import areaTypes from "../data/area-types.json";

type AreaType = keyof typeof geoIds;

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

export const DistrictSubscriptionsList: React.FC = () => {
  const userContext = useContext(UserContext);
  if (!userContext.user) return <div />;

  const user = userContext.user as JustfixUser;
  const { districtSubscriptions } = user;

  return (
    <div className="district-subscriptions-list">
      {!districtSubscriptions || !districtSubscriptions.length ? (
        <div className="district-subscription">No subscriptions</div>
      ) : (
        <>
          {districtSubscriptions.map((subscription, i) => {
            return (
              <div className="district-subscription">
                <h3>Subscription {i + 1}</h3>
                <pre>{JSON.stringify(subscription.district, null, 2)}</pre>
                <Button
                  labelText="Unsubscribe"
                  onClick={() => {
                    userContext.unsubscribeDistrict(subscription.pk);
                    window.location.reload();
                  }}
                />
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

type Option = { label: string; value: string; mapUrl?: string };

export type AreaSelection = {
  typeValue: string;
  typeLabel: string;
  areaValue: string;
  areaLabel: string;
};

const DistrictCreation = withI18n()((props: withI18nProps) => {
  // const { i18n } = props;
  const userContext = useContext(UserContext);
  if (!userContext.user) return <div />;

  const areaTypeOptions: Option[] = areaTypes.options;
  const defaultArea = areaTypeOptions.filter((area) => area.value === "nta")[0];

  const [isLoading, setIsLoading] = useState(false);
  const [showBoundariesModal, setShowBoundariesModal] = useState(false);
  const [geoType, setGeoType] = useState<Option>(defaultArea);
  const [geo, setGeo] = useState<Option>();
  const [areaSelections, setAreaSelections] = useState<AreaSelection[]>([]);
  const selectedGeoValues = areaSelections.map((x) => x.areaValue);

  const geoSelectRef = useRef<SelectInstance<Option, false, GroupBase<Option>>>(null);

  const handleGeoTypeChange = (newValue: SingleValue<Option>) => {
    newValue && setGeoType(newValue);
    setGeo(undefined);
    geoSelectRef.current?.clearValue();
  };

  const addAreaToSelections = () => {
    if (!geoType || !geo) return;
    const selection: AreaSelection = {
      typeValue: geoType.value,
      typeLabel: geoType.label,
      areaValue: geo.value,
      areaLabel: geo.label,
    };
    setAreaSelections((prev) => prev.concat([selection]));
  };

  const removeAreaFromSelections = (area: AreaSelection) => {
    setAreaSelections((prev) =>
      prev.filter((geo) => geo.typeValue !== area.typeValue && geo.areaValue !== area.areaValue)
    );
  };

  const saveSelections = async () => {
    setIsLoading(true);
    await userContext.subscribeDistrict(areaSelections);
    setIsLoading(false);
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
          defaultValue={defaultArea}
          options={areaTypeOptions}
          onChange={handleGeoTypeChange}
        />
        <Select
          ref={geoSelectRef}
          className="dropdown-select"
          aria-label="Area selection"
          placeholder={`Select or type a ${geoType.label}`}
          options={geoIds[geoType.value as AreaType]}
          onChange={(newValue) => newValue && setGeo(newValue)}
        />
        {geo && geo.value !== "borough" && (
          <Link
            className="geo-map-link"
            href={encodeURI(
              `${geoType.mapUrl}&dist=${
                geoType.value === "nta" ? geo.label.replaceAll(" ", "+") : geo.value
              }`
            )}
            target="_blank"
            rel="noopener noreferrer"
            icon="external"
          >
            <Trans>Map of {geo.label}</Trans>
          </Link>
        )}
        <Button
          className="add-selection"
          labelText="Add to email"
          variant="secondary"
          size="small"
          onClick={addAreaToSelections}
          disabled={!geoType || !geo || selectedGeoValues.includes(geo.value)}
        />
        <hr />
        <div className="area-selection-container">
          <div className="area-selection-chip-container">
            {areaSelections.map((area, i) => (
              <AreaChip {...area} onClose={removeAreaFromSelections} key={i} />
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
        loading={isLoading}
        disabled={!areaSelections.length}
        onClick={saveSelections}
      />
      <Modal showModal={showBoundariesModal} onClose={() => setShowBoundariesModal(false)}>
        <Trans render="h3">Area maps</Trans>
        <Trans render="p">View a map of each area type lorem ipsum dolor sit amet</Trans>
        <ul>
          {areaTypeOptions.map((areaType, i) => (
            <li key={i}>
              <Link
                href={areaType.mapUrl}
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

type AreaChipProps = AreaSelection & { onClose: (area: AreaSelection) => void };
const AreaChip = (props: AreaChipProps) => {
  const { onClose, ...area } = props;

  return (
    <div className="area-selection-chip">
      {props.typeLabel}: {area.areaLabel}
      <button onClick={() => onClose(area)}>
        <Icon icon="xmark" />
      </button>
    </div>
  );
};

export default DistrictAlertsPage;
