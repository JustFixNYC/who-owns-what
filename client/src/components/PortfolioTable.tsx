/* eslint-disable react-hooks/exhaustive-deps */
import { I18n } from "@lingui/core";
import { t, Trans } from "@lingui/macro";
import {
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  filterFns,
  flexRender,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  useReactTable,
} from "@tanstack/react-table";
import React from "react";
import { Link } from "react-router-dom";
import { AddressPageRoutes } from "routes";
import { SupportedLocale } from "../i18n-base";
import Helpers, { longDateOptions } from "../util/helpers";
import { logAmplitudeEvent } from "./Amplitude";
import { AddressRecord, HpdComplaintCount } from "./APIDataTypes";
import { FilterContext } from "./PropertiesList";

const FIRST_COLUMN_WIDTH = 130;
export const MAX_TABLE_ROWS_PER_PAGE = 100; // was 500, but that seems like a lot

declare module "@tanstack/table-core" {
  interface FilterFns {
    arrIncludesSome: FilterFn<unknown>;
    inNumberRange: FilterFn<unknown>;
    isNonZero: FilterFn<unknown>;
  }
}

const currencyFormater = new Intl.NumberFormat("en-us", {
  currency: "USD",
  style: "currency",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const isNonZero: FilterFn<any> = (row, columnId, value, addMeta) =>
  value ? !!row.getValue(columnId) : true;

type TableOfDataProps = {
  data: AddressRecord[];
  headerTopSpacing: number | undefined;
  i18n: I18n;
  locale: SupportedLocale;
  rsunitslatestyear: number;
  onOpenDetail: (bbl: string) => void;
  addressPageRoutes: AddressPageRoutes;
};

/**
 * This component memoizes the portfolio table via React.memo
 * in an attempt to improve performance, particularly on IE11.
 */
export const TableOfData = React.memo(
  React.forwardRef<HTMLDivElement, TableOfDataProps>((props, lastColumnRef) => {
    const { data, i18n, locale, rsunitslatestyear } = props;

    const { filterContext, setFilterContext } = React.useContext(FilterContext);

    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

    const [{ pageIndex, pageSize }, setPagination] = React.useState<PaginationState>({
      pageIndex: 0,
      pageSize: MAX_TABLE_ROWS_PER_PAGE,
    });

    const pagination = React.useMemo(
      () => ({
        pageIndex,
        pageSize,
      }),
      [pageIndex, pageSize]
    );

    const columns = React.useMemo<ColumnDef<AddressRecord, any>[]>(
      () => [
        {
          accessorFn: (row) => `${row.housenumber} ${row.streetname}`,
          id: "address",
          header: () => i18n._(t`Address`),
          cell: ({ row }) => {
            return (
              <Link
                to={props.addressPageRoutes.overview}
                onClick={() => props.onOpenDetail(row.original.bbl)}
              >
                {row.original.housenumber} {row.original.streetname}
              </Link>
            );
          },
          footer: (props) => props.column.id,
          size: FIRST_COLUMN_WIDTH,
          enableColumnFilter: false,
        },
        {
          header: i18n._(t`Location`),
          footer: (props) => props.column.id,
          columns: [
            {
              accessorKey: "zip",
              header: i18n._(t`Zipcode`),
              cell: (info) => info.getValue(),
              footer: (props) => props.column.id,
              size: getWidthFromLabel(i18n._(t`Zipcode`)),
              enableColumnFilter: false,
              filterFn: "arrIncludesSome",
            },
            {
              accessorKey: "boro",
              header: i18n._(t`Borough`),
              cell: (info) => info.getValue(),
              footer: (props) => props.column.id,
              size: getWidthFromLabel(i18n._(t`Borough`)),
              enableColumnFilter: false,
            },
            {
              accessorKey: "bbl",
              header: "BBL",
              cell: ({ row }) => {
                return (
                  <Link
                    to={props.addressPageRoutes.overview}
                    onClick={() => props.onOpenDetail(row.original.bbl)}
                  >
                    {row.original.bbl}
                  </Link>
                );
              },
              footer: (props) => props.column.id,
              size: getWidthFromLabel("BBL", 100),
              enableColumnFilter: false,
            },
            {
              accessorKey: "council",
              header: i18n._(t`Council`),
              cell: (info) => info.getValue(),
              footer: (props) => props.column.id,
              size: getWidthFromLabel(i18n._(t`Council`)),
              enableColumnFilter: false,
            },
          ],
        },
        {
          header: i18n._(t`Information`),
          footer: (props) => props.column.id,
          columns: [
            {
              accessorKey: "yearbuilt",
              header: i18n._(t`Built`),
              cell: (info) => info.getValue(),
              footer: (props) => props.column.id,
              size: getWidthFromLabel(i18n._(t`Built`)),
              enableColumnFilter: false,
            },
            {
              accessorKey: "unitsres",
              header: i18n._(t`Units`),
              cell: (info) => info.getValue(),
              footer: (props) => props.column.id,
              size: getWidthFromLabel(i18n._(t`Units`)),
              enableColumnFilter: false,
              filterFn: "inNumberRange",
            },
          ],
        },
        {
          header: i18n._(t`RS Units`),
          footer: (props) => props.column.id,
          columns: [
            {
              accessorKey: "rsunits2007",
              header: "2007",
              cell: (info) => info.getValue(),
              footer: (props) => props.column.id,
              size: getWidthFromLabel("2007"),
              enableColumnFilter: false,
            },
            {
              accessorKey: "rsunitslatest",
              header: rsunitslatestyear,
              cell: ({ row }) => {
                return (
                  <span
                    className={`${
                      // TODO: double check this works with nulls
                      row.original.rsunitslatest! < row.original.rsunits2007! ?? false
                        ? "text-danger"
                        : ""
                    }`}
                  >
                    {row.original.rsunitslatest}
                  </span>
                );
              },
              footer: (props) => props.column.id,
              size: getWidthFromLabel("XXXX"),
              enableColumnFilter: false,
              filterFn: "isNonZero",
            },
          ],
        },
        {
          header: i18n._(t`HPD Complaints`),
          footer: (props) => props.column.id,
          columns: [
            {
              accessorKey: "totalcomplaints",
              header: i18n._(t`Total`),
              cell: (info) => info.getValue(),
              footer: (props) => props.column.id,
              size: getWidthFromLabel(i18n._(t`Total`)),
              enableColumnFilter: false,
            },
            {
              accessorKey: "recentcomplaints",
              header: i18n._(t`Last 3 Years`),
              cell: (info) => info.getValue(),
              footer: (props) => props.column.id,
              size: getWidthFromLabel(i18n._(t`Last 3 Years`)),
              enableColumnFilter: false,
            },
            {
              accessorKey: "recentcomplaintsbytype",
              header: i18n._(t`Top Complaint`),
              cell: ({ row }) => {
                const mostCommonType = findMostCommonType(row.original.recentcomplaintsbytype);
                return mostCommonType ? Helpers.translateComplaintType(mostCommonType, i18n) : null;
              },
              footer: (props) => props.column.id,
              size: getWidthFromLabel(i18n._(t`Top Complaint`)),
              enableColumnFilter: false,
            },
          ],
        },
        {
          header: i18n._(t`HPD Violations`),
          footer: (props) => props.column.id,
          columns: [
            {
              accessorKey: "openviolations",
              header: i18n._(t`Open`),
              cell: (info) => info.getValue(),
              footer: (props) => props.column.id,
              size: getWidthFromLabel(i18n._(t`Open`), 85),
              enableColumnFilter: false,
            },
            {
              accessorKey: "totalviolations",
              header: i18n._(t`Total`),
              cell: (info) => info.getValue(),
              footer: (props) => props.column.id,
              size: getWidthFromLabel(i18n._(t`Total`), 85),
              enableColumnFilter: false,
            },
          ],
        },
        {
          header: i18n._(t`Evictions Since 2017`),
          footer: (props) => props.column.id,
          size: getWidthFromLabel(i18n._(t`Evictions Since 2017`)),
          columns: [
            {
              accessorFn: (row) => row.evictionfilings || null,
              id: "evictionfilings",
              header: i18n._(t`Filed`),
              cell: (info) => info.getValue(),
              footer: (props) => props.column.id,
              size: getWidthFromLabel(i18n._(t`Filed`)),
              enableColumnFilter: false,
            },
            {
              accessorFn: (row) => row.evictions || null,
              id: "evictions",
              header: i18n._(t`Executed`),
              cell: (info) => info.getValue(),
              footer: (props) => props.column.id,
              size: getWidthFromLabel(i18n._(t`Executed`)),
              enableColumnFilter: false,
            },
          ],
        },
        {
          header: i18n._(t`Landlord`),
          footer: (props) => props.column.id,
          columns: [
            {
              accessorFn: (row) => {
                var owner =
                  row.ownernames &&
                  row.ownernames.find(
                    (o) =>
                      o.title === "HeadOfficer" ||
                      o.title === "IndividualOwner" ||
                      o.title === "CorporateOwner" ||
                      o.title === "JointOwner"
                  );
                return owner ? owner.value : "";
              },
              id: "ownernames",
              header: i18n._(t`Officer/Owner`),
              cell: ({ row }) => {
                var owner =
                  row.original.ownernames &&
                  row.original.ownernames.find(
                    (o) =>
                      o.title === "HeadOfficer" ||
                      o.title === "IndividualOwner" ||
                      o.title === "CorporateOwner" ||
                      o.title === "JointOwner"
                  );
                return owner ? owner.value : "";
              },
              footer: (props) => props.column.id,
              size: getWidthFromLabel(i18n._(t`Officer/Owner`), 100),
              filterFn: "arrIncludesSome",
            },
          ],
        },
        {
          header: i18n._(t`Tax Exemptions`),
          footer: (props) => props.column.id,
          columns: [
            {
              accessorKey: "yearstartedj51",
              header: "J-51",
              cell: ({ row }) => formatAbatementStartYear(row.original.yearstartedj51, i18n),
              footer: (props) => props.column.id,
              size: 100,
              enableColumnFilter: false,
            },
            {
              accessorKey: "yearstarted421a",
              header: "421a",
              cell: ({ row }) => formatAbatementStartYear(row.original.yearstarted421a, i18n),
              footer: (props) => props.column.id,
              size: 100,
              enableColumnFilter: false,
            },
          ],
        },
        {
          header: i18n._(t`Last Sale`),
          footer: (props) => props.column.id,
          columns: [
            {
              accessorKey: "lastsaledate",
              header: i18n._(t`Date`),
              cell: ({ row }) =>
                row.original.lastsaledate
                  ? Helpers.formatDate(row.original.lastsaledate, longDateOptions, locale)
                  : null,
              footer: (props) => props.column.id,
              size: getWidthFromLabel(i18n._(t`Date`), 100),
              enableColumnFilter: false,
            },
            {
              accessorFn: (row) => formatCurrency(row.lastsaleamount),
              id: "lastsaleamount",
              header: i18n._(t`Amount`),
              cell: (info) => info.getValue(),
              footer: (props) => props.column.id,
              size: getWidthFromLabel(i18n._(t`Amount`), 100),
              enableColumnFilter: false,
            },
            {
              accessorKey: "lastsaleacrisid",
              header: i18n._(t`Link to Deed`),
              cell: ({ row }) =>
                row.original.lastsaleacrisid ? (
                  <a
                    onClick={() => {
                      logAmplitudeEvent("portfolioLinktoDeed");
                      window.gtag("event", "portfolio-link-to-deed");
                    }}
                    href={`https://a836-acris.nyc.gov/DS/DocumentSearch/DocumentImageView?doc_id=${row.original.lastsaleacrisid}`}
                    className="btn"
                    target="_blank"
                    aria-label={i18n._(t`Link to Deed`)}
                    rel="noopener noreferrer"
                  >
                    <span style={{ padding: "0 3px" }}>&#8599;&#xFE0E;</span>
                  </a>
                ) : null,
              footer: (props) => props.column.id,
              size: getWidthFromLabel(i18n._(t`Link to Deed`)),
              enableColumnFilter: false,
            },
            {
              accessorFn: (row) => {
                // Make id's that are part of group sales show up first when sorted:
                const idPrefix =
                  row.lastsaleacrisid && isPartOfGroupSale(row.lastsaleacrisid, data) ? " " : "";
                return `${idPrefix}${row.lastsaleacrisid}`;
              },
              id: "lastsaleisgroupsale",
              header: i18n._(t`Group Sale?`),
              cell: ({ row }) =>
                row.original.lastsaleacrisid
                  ? isPartOfGroupSale(row.original.lastsaleacrisid, data)
                    ? i18n._(t`Yes`)
                    : i18n._(t`No`)
                  : null,
              footer: (props) => props.column.id,
              size: getWidthFromLabel(i18n._(t`Group Sale?`)),
              enableColumnFilter: false,
            },
            {
              accessorKey: "bbl",
              id: "detail",
              header: (
                <div ref={lastColumnRef} style={{ float: "left" }}>
                  <Trans>View detail</Trans>
                </div>
              ),
              cell: ({ row }) => (
                <Link
                  to={props.addressPageRoutes.overview}
                  className="btn"
                  aria-label={i18n._(t`View detail`)}
                  onClick={() => {
                    props.onOpenDetail(row.original.bbl);
                    logAmplitudeEvent("portfolioViewDetail");
                    window.gtag("event", "portfolio-view-detail");
                  }}
                >
                  <span style={{ padding: "0 3px" }}>&#10142;</span>
                </Link>
              ),
              footer: (props) => props.column.id,
              size: getWidthFromLabel(i18n._(t`View detail`)),
              enableColumnFilter: false,
            },
          ],
        },
      ],
      [data, i18n, lastColumnRef, locale, rsunitslatestyear, props]
    );

    const table = useReactTable({
      data,
      columns,
      filterFns: {
        arrIncludesSome: filterFns.arrIncludesSome,
        inNumberRange: filterFns.inNumberRange,
        isNonZero: isNonZero,
      },
      state: {
        columnFilters,
        pagination,
      },
      onPaginationChange: setPagination,
      onColumnFiltersChange: setColumnFilters,
      getCoreRowModel: getCoreRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      getFacetedRowModel: getFacetedRowModel(),
      getFacetedUniqueValues: getFacetedUniqueValues(),
      getFacetedMinMaxValues: getFacetedMinMaxValues(),
      debugTable: true,
      debugHeaders: true,
      debugColumns: false,
    });

    React.useEffect(() => {
      // TODO: previously we were using useMemo within the multiselect table filter component, can/should we memoize these here now too?
      setFilterContext({
        ...filterContext,
        filterOptions: {
          ownernames: Array.from(
            table.getColumn("ownernames").getFacetedUniqueValues().keys()
          ).sort(),
          unitsres: table.getColumn("unitsres").getFacetedMinMaxValues(),
          zip: Array.from(table.getColumn("zip").getFacetedUniqueValues().keys()).sort(),
        },
      });

      console.log("filter options updated");
    }, [
      table.getColumn("ownernames").getFacetedUniqueValues(),
      table.getColumn("unitsres").getFacetedMinMaxValues(),
      table.getColumn("zip").getFacetedUniqueValues(),
    ]);

    React.useEffect(() => {
      const { rsunitslatest, ownernames, unitsres, zip } = filterContext.filterSelections;
      table.getColumn("rsunitslatest").setFilterValue(rsunitslatest);
      table.getColumn("ownernames").setFilterValue(ownernames!.map((item: any) => item.name));
      table.getColumn("unitsres").setFilterValue(unitsres);
      table.getColumn("zip").setFilterValue(zip!.map((item: any) => item.name));
      console.log("table filters updated");
    }, [filterContext.filterSelections]);

    // TODO: is this necessary?
    React.useEffect(() => {
      if (table.getState().columnFilters[0]?.id === "ownernames") {
        if (table.getState().sorting[0]?.id !== "ownernames") {
          table.setSorting([{ id: "ownernames", desc: false }]);
        }
      }
      //   eslint-disable-next-line
    }, [table.getState().columnFilters[0]?.id]);

    return (
      <div className="portfolio-table-container">
        <table>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <th
                      key={header.id}
                      colSpan={header.colSpan}
                      className={`col-${header.column.id}`}
                      style={{ minWidth: header.getSize() }}
                    >
                      {header.isPlaceholder ? null : (
                        <>
                          <div
                            {...{
                              className: header.column.getCanSort()
                                ? "cursor-pointer select-none"
                                : "",
                              onClick: header.column.getToggleSortingHandler(),
                            }}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {headerGroup.depth === 1
                              ? {
                                  asc: <ArrowIcon dir={"up"} />,
                                  desc: <ArrowIcon dir={"down"} />,
                                }[header.column.getIsSorted() as string] ?? (
                                  <ArrowIcon dir={"both"} />
                                )
                              : null}
                          </div>
                        </>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, i) => {
              return (
                <tr key={row.id} className={`row-${i % 2 ? "even" : "odd"}`}>
                  {row.getVisibleCells().map((cell) => {
                    return (
                      <td
                        key={cell.id}
                        className={`col-${cell.column.id}`}
                        style={{
                          width: cell.column.getSize() !== 0 ? cell.column.getSize() : undefined,
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="pagination">
          <div className="prev">
            <button
              className="page-btn"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              {i18n._(t`Previous`)}
            </button>
          </div>
          <div className="center">
            <span className="page-info">
              <span>
                <Trans>Page</Trans>
              </span>
              <div>
                <input
                  type="number"
                  value={String(table.getState().pagination.pageIndex + 1)}
                  onChange={(e) => {
                    const page = e.target.value ? Number(e.target.value) - 1 : 0;
                    table.setPageIndex(page);
                  }}
                />
              </div>
              <Trans>of</Trans> <span className="total-pages">{table.getPageCount()}</span>
            </span>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
              }}
            >
              {[10, 20, 50, 100, 500].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  Show {pageSize}
                </option>
              ))}
            </select>
          </div>
          <div className="next">
            <button
              className="page-btn"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              {i18n._(t`Next`)}
            </button>
          </div>
        </div>
      </div>
    );
  })
);

type ArrowIconProps = {
  dir: "up" | "down" | "both";
};

function ArrowIcon(props: ArrowIconProps) {
  return (
    <span className="arrow-icon">
      {props.dir === "up" ? (
        <span>↑</span>
      ) : props.dir === "down" ? (
        <span>↓</span>
      ) : (
        <>
          ↑<span>↓</span>
        </>
      )}
    </span>
  );
}

function formatCurrency(x: number | null): string | null {
  return x == null ? null : currencyFormater.format(x);
}

export function isPartOfGroupSale(saleId: string, addrs: AddressRecord[]) {
  const addrsWithMatchingSale = addrs.filter((addr) => addr.lastsaleacrisid === saleId);
  return addrsWithMatchingSale.length > 1;
}

function formatAbatementStartYear(year: number | null, i18n: I18n) {
  const thisYear = new Date().getFullYear();
  if (!year) return null;
  return year > thisYear ? i18n._(t`Starts ${year}`) : i18n._(t`Since ${year}`);
}

function findMostCommonType(complaints: HpdComplaintCount[] | null) {
  return complaints && complaints.length > 0 && complaints[0].type;
}

function getWidthFromLabel(label: string, customDefaultWidth?: number) {
  const MIN_WIDTH = customDefaultWidth || 70;
  const LETTER_WIDTH = 7;
  const ARROW_ICON_WIDTH = 20;
  const MARGIN_OFFSET = 10;

  return Math.max(label.length * LETTER_WIDTH + ARROW_ICON_WIDTH + MARGIN_OFFSET, MIN_WIDTH);
}
