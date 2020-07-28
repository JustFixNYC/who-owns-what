import { MonthlyTimelineData, AddressRecord } from "../components/APIDataTypes";
import { IndicatorsDatasetId } from "./IndicatorsDatasets";
import { withI18nProps } from "@lingui/react";

export type IndicatorsTimeSpan = "month" | "quarter" | "year";

// Types Relating to the State of the Indicators Component:

type LastSaleData = {
  date: string | null;
  label: string | null;
  documentid: string | null;
};

type ViolsData = {
  labels: string[] | null;
  values: {
    class_a: number[] | null;
    class_b: number[] | null;
    class_c: number[] | null;
    total: number[] | null;
  };
};

type ComplaintsData = {
  labels: string[] | null;
  values: {
    emergency: number[] | null;
    nonemergency: number[] | null;
    total: number[] | null;
  };
};

type PermitsData = {
  labels: string[] | null;
  values: {
    total: number[] | null;
  };
};

type IndicatorsDataFromAPI = {
  violsData: ViolsData;
  complaintsData: ComplaintsData;
  permitsData: PermitsData;
};

export type IndicatorsState = IndicatorsDataFromAPI & {
  indicatorHistory: MonthlyTimelineData[] | null;

  lastSale: LastSaleData;

  indicatorList: IndicatorsDatasetId[];
  defaultVis: IndicatorsDatasetId;
  activeVis: IndicatorsDatasetId;
  timeSpanList: IndicatorsTimeSpan[];
  activeTimeSpan: IndicatorsTimeSpan;
  monthsInGroup: number;
  xAxisStart: number;
  xAxisViewableColumns: number;
  currentAddr: AddressRecord | null;
};

export const indicatorsInitialState: IndicatorsState = {
  lastSale: {
    date: null,
    label: null,
    documentid: null,
  },

  indicatorHistory: null,

  violsData: {
    labels: null,
    values: {
      class_a: null,
      class_b: null,
      class_c: null,
      total: null,
    },
  },

  complaintsData: {
    labels: null,
    values: {
      emergency: null,
      nonemergency: null,
      total: null,
    },
  },

  permitsData: {
    labels: null,
    values: {
      total: null,
    },
  },

  indicatorList: ["complaints", "viols", "permits"],
  defaultVis: "complaints",
  activeVis: "complaints",
  timeSpanList: ["month", "quarter", "year"],
  activeTimeSpan: "quarter",
  monthsInGroup: 3,
  xAxisStart: 0,
  xAxisViewableColumns: 20,
  currentAddr: null,
};

// Types Relating to the Props of the Indicators Component:

export type IndicatorsProps = withI18nProps & {
  isVisible: boolean;
  detailAddr: AddressRecord;
  onBackToOverview: (addr: AddressRecord) => void;
  generateBaseUrl: () => string;
};

// Other Useful Types and Type-related utilites:

export type IndicatorChartShift = "left" | "right" | "reset";

export const getIndicatorDatasetKey = (datasetId: IndicatorsDatasetId) => {
    const datasetKeyName = (datasetId + "Data") as keyof IndicatorsDataFromAPI;
    return datasetKeyName;
  };
