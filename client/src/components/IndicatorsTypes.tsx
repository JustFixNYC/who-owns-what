import { MonthlyTimelineData, AddressRecord } from "./APIDataTypes";
import { IndicatorsDatasetId } from "./IndicatorsDatasets";
import { withI18nProps } from "@lingui/react";

export type IndicatorsTimeSpan = "month" | "quarter" | "year";

// Types Relating to the State of the Indicators Component:

type LastSaleData = {
  date: string | null;
  label: string | null;
  documentid: string | null;
};

type IndicatorsDataValues = {
  [k in string]?: number[] | null;
} & {
  total: number[] | null;
};

export interface IndicatorsData {
  labels: string[] | null;
  values: IndicatorsDataValues;
}

interface ViolsData extends IndicatorsData {
  values: {
    class_a: number[] | null;
    class_b: number[] | null;
    class_c: number[] | null;
    total: number[] | null;
  };
}

interface ComplaintsData extends IndicatorsData {
  values: {
    emergency: number[] | null;
    nonemergency: number[] | null;
    total: number[] | null;
  };
}

interface PermitsData extends IndicatorsData {
  values: {
    total: number[] | null;
  };
}

type IndicatorsDataIndex = {
  [k in IndicatorsDatasetId]: IndicatorsData;
};

type IndicatorsDataFromAPI = IndicatorsDataIndex & {
  viols: ViolsData;
  complaints: ComplaintsData;
  permits: PermitsData;
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

  viols: {
    labels: null,
    values: {
      class_a: null,
      class_b: null,
      class_c: null,
      total: null,
    },
  },

  complaints: {
    labels: null,
    values: {
      emergency: null,
      nonemergency: null,
      total: null,
    },
  },

  permits: {
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
