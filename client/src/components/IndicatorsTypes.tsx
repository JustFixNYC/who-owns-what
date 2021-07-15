import { withI18nProps } from "@lingui/react";
import { withMachineInStateProps } from "state-machine";
import { AddressPageRoutes } from "routes";

/**
 * The ids for all datasets shown on the Timeline Tab, _in the order they will appear on the select menu_.
 *
 * Note: This separation of array and type definition allows us to more easily iterate over all dataset ids.
 * See https://stackoverflow.com/a/64174790 for more details on this approach.
 */
export const indicatorsDatasetIds = [
  "hpdcomplaints",
  "hpdviolations",
  "dobpermits",
  "dobviolations",
] as const;
export type IndicatorsDatasetId = typeof indicatorsDatasetIds[number];

/**
 * All the time spans you can view data by on the Timeline Tab, _in the order they will appear on the select menu_.
 *
 * Note: This separation of array and type definition allows us to more easily iterate over all dataset ids.
 * See https://stackoverflow.com/a/64174790 for more details on this approach.
 */
export const indicatorsTimeSpans = ["month", "quarter", "year"] as const;
export type IndicatorsTimeSpan = typeof indicatorsTimeSpans[number];

// Types Relating to the State Machine Data for the Indicators Component:

type IndicatorsDataValues = {
  [k in string]?: number[] | null;
} & {
  total: number[] | null;
};

export interface IndicatorsData {
  labels: string[] | null;
  values: IndicatorsDataValues;
}

interface HpdViolationsData extends IndicatorsData {
  values: {
    class_a: number[] | null;
    class_b: number[] | null;
    class_c: number[] | null;
    total: number[] | null;
  };
}

interface HpdComplaintsData extends IndicatorsData {
  values: {
    emergency: number[] | null;
    nonemergency: number[] | null;
    total: number[] | null;
  };
}

interface DobPermitsData extends IndicatorsData {
  values: {
    total: number[] | null;
  };
}

interface DobViolationsData extends IndicatorsData {
  values: {
    emergency: number[] | null;
    nonemergency: number[] | null;
    ecb: number[] | null;
    total: number[] | null;
  };
}

export type IndicatorsDataIndex = {
  [k in IndicatorsDatasetId]: IndicatorsData;
};

export type IndicatorsDataFromAPI = IndicatorsDataIndex & {
  hpdviolations: HpdViolationsData;
  hpdcomplaints: HpdComplaintsData;
  dobpermits: DobPermitsData;
  dobviolations: DobViolationsData;
};

export const indicatorsInitialDataStructure: IndicatorsDataFromAPI = {
  hpdviolations: {
    labels: null,
    values: {
      class_a: null,
      class_b: null,
      class_c: null,
      total: null,
    },
  },

  hpdcomplaints: {
    labels: null,
    values: {
      emergency: null,
      nonemergency: null,
      total: null,
    },
  },

  dobpermits: {
    labels: null,
    values: {
      total: null,
    },
  },

  dobviolations: {
    labels: null,
    values: {
      emergency: null,
      nonemergency: null,
      ecb: null,
      total: null,
    },
  },
};

// Types Relating to the State of the Indicators Component:

type LastSaleData = {
  date: string | null;
  label: string | null;
  documentid: string | null;
};

export type IndicatorsState = {
  lastSale: LastSaleData;
  indicatorList: IndicatorsDatasetId[];
  defaultVis: IndicatorsDatasetId;
  activeVis: IndicatorsDatasetId;
  timeSpanList: IndicatorsTimeSpan[];
  activeTimeSpan: IndicatorsTimeSpan;
  monthsInGroup: number;
  xAxisStart: number;
  xAxisViewableColumns: number;
};

export const indicatorsInitialState: IndicatorsState = {
  lastSale: {
    date: null,
    label: null,
    documentid: null,
  },

  indicatorList: ["hpdcomplaints", "hpdviolations", "dobpermits", "dobviolations"],
  defaultVis: "hpdcomplaints",
  activeVis: "hpdcomplaints",
  timeSpanList: ["month", "quarter", "year"],
  activeTimeSpan: "quarter",
  monthsInGroup: 3,
  xAxisStart: 0,
  xAxisViewableColumns: 20,
};

// Types Relating to the Props of the Indicators Component:

export type IndicatorsProps = withI18nProps &
  withMachineInStateProps<"portfolioFound"> & {
    isVisible: boolean;
    onBackToOverview: (bbl: string) => void;
    addressPageRoutes: AddressPageRoutes;
  };

// Other Useful Types and Type-related utilites:

export type IndicatorChartShift = "left" | "right" | "reset";
