import {
  createColumnHelper,
  filterFns,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { DatasetTrackerInfo } from "./APIDataTypes";
import { inNumberRanges, isNonZero } from "./PortfolioTable";
import classNames from "classnames";
import "../styles/DatasetTrackerTable.scss";

const columnHelper = createColumnHelper<DatasetTrackerInfo>();

const columns = [
  columnHelper.accessor("dataset", {
    header: "Dataset",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("last_updated", {
    header: "Last Updated",
    cell: (info) => {
      return new Date(info.getValue()).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
    },
  }),
  columnHelper.accessor("update_cadence", {
    header: "Update Cadence",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("alert_threshold", {
    header: "Alert Threshold",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("is_late", {
    header: "Status",
    cell: (info) => (info.getValue() ? "Late" : info.getValue() === false ? "Up-to-date" : ""),
  }),
];

const initialSorting = [
  { id: "is_late", desc: true },
  { id: "last_updated", desc: true },
];

export const DatasetTrackerTable: React.FC<{ data: DatasetTrackerInfo[] }> = ({ data }) => {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting: initialSorting,
    },
    filterFns: {
      arrIncludesSome: filterFns.arrIncludesSome,
      inNumberRanges: inNumberRanges,
      isNonZero: isNonZero,
    },
  });

  return (
    <table id="dataset-tracker-table">
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th key={header.id}>
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getSortedRowModel().rows.map((row) => (
          <tr
            key={row.id}
            className={classNames(
              row.original.is_late ? "late" : row.original.is_late === false ? "up-to-date" : ""
            )}
          >
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
