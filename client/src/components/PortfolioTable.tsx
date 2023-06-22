/* eslint-disable react-hooks/exhaustive-deps */
import { t, Trans } from "@lingui/macro";
import {
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  filterFns,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  Row,
  useReactTable,
} from "@tanstack/react-table";
import _groupBy from "lodash/groupBy";
import React, { Fragment } from "react";
import { Link, useLocation } from "react-router-dom";
import { createRouteForFullBbl } from "routes";
import { I18n } from "@lingui/core";
import { withI18n, withI18nProps } from "@lingui/react";
import { SupportedLocale } from "../i18n-base";
import Helpers, { longDateOptions } from "../util/helpers";
import { AddressRecord, HpdComplaintCount } from "./APIDataTypes";
import { FilterContext, FilterNumberRange, PortfolioAnalyticsEvent } from "./PropertiesList";
import "styles/PortfolioTable.scss";
import { sortContactsByImportance } from "./DetailView";
import { ArrowIcon } from "./Icons";
import classnames from "classnames";
import { isLegacyPath } from "./WowzaToggle";
import Loader from "./Loader";

const FIRST_COLUMN_WIDTH = 130;
const MAX_TABLE_ROWS_PER_PAGE = 100;

declare module "@tanstack/table-core" {
  interface FilterFns {
    arrIncludesSome: FilterFn<unknown>;
    inNumberRanges: FilterFn<unknown>;
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

const inNumberRanges: FilterFn<any> = (
  row,
  columnId,
  filterValue: FilterNumberRange[],
  addMeta
) => {
  const rowValue = row.getValue<number>(columnId);
  return filterValue.reduce(
    (acc, rng) => acc || (rowValue >= rng.min && rowValue <= rng.max),
    false
  );
};

type PortfolioTableProps = withI18nProps & {
  data: AddressRecord[];
  locale: SupportedLocale;
  rsunitslatestyear: number;
  getRowCanExpand: (row: Row<AddressRecord>) => boolean;
  logPortfolioAnalytics: PortfolioAnalyticsEvent;
  isVisible: boolean;
};

/**
 * This component memoizes the portfolio table via React.memo
 * in an attempt to improve performance, particularly on IE11.
 */
const PortfolioTableWithoutI18n = React.memo((props: PortfolioTableProps) => {
  const {
    data,
    locale,
    rsunitslatestyear,
    getRowCanExpand,
    logPortfolioAnalytics,
    i18n,
    isVisible,
  } = props;

  const { pathname } = useLocation();

  const { filterContext } = React.useContext(FilterContext);

  const { filterSelections } = filterContext;

  const lastColumnRef = React.useRef<HTMLDivElement>(null);
  const isLastColumnVisible = Helpers.useOnScreen(lastColumnRef);
  /**
   * For older browsers that do not support the `useOnScreen` hook,
   * let's hide the dynamic scroll fade by default.
   */
  const isOlderBrowser = typeof IntersectionObserver === "undefined";
  /**
   * Let's hide the fade out on the right edge of the table if:
   * - We've scrolled to the last column OR
   * - We're using an older browser that cannot detect where we've scrolled
   */
  const hideScrollFade = isOlderBrowser || isLastColumnVisible;

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
              to={createRouteForFullBbl(row.original.bbl, locale, isLegacyPath(pathname))}
              onClick={() => logPortfolioAnalytics("addressChangePortfolio", { column: "address" })}
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
            header: i18n._(t`Zip Code`),
            cell: (info) => info.getValue(),
            footer: (props) => props.column.id,
            enableColumnFilter: false,
            filterFn: "arrIncludesSome",
            size: "auto",
          },
          {
            accessorKey: "boro",
            header: i18n._(t`Borough`),
            cell: (info) => info.getValue(),
            footer: (props) => props.column.id,
            enableColumnFilter: false,
            size: "auto",
          },
          {
            accessorKey: "bbl",
            header: "BBL",
            cell: ({ row }) => {
              return (
                <Link
                  to={createRouteForFullBbl(row.original.bbl, locale, isLegacyPath(pathname))}
                  onClick={() => logPortfolioAnalytics("addressChangePortfolio", { column: "bbl" })}
                >
                  {row.original.bbl}
                </Link>
              );
            },
            footer: (props) => props.column.id,
            enableColumnFilter: false,
            size: 100,
          },
          {
            accessorKey: "council",
            header: i18n._(t`Council`),
            cell: (info) => info.getValue(),
            footer: (props) => props.column.id,
            enableColumnFilter: false,
            size: "auto",
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
            enableColumnFilter: false,
            size: "auto",
          },
          {
            accessorKey: "unitsres",
            header: i18n._(t`Units`),
            cell: (info) => info.getValue(),
            footer: (props) => props.column.id,
            enableColumnFilter: false,
            size: "auto",
            filterFn: "inNumberRanges",
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
            enableColumnFilter: false,
            size: "auto",
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
            enableColumnFilter: false,
            size: "auto",
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
            enableColumnFilter: false,
            size: "auto",
          },
          {
            accessorKey: "recentcomplaints",
            header: i18n._(t`Last 3 Years`),
            cell: (info) => info.getValue(),
            footer: (props) => props.column.id,
            enableColumnFilter: false,
            size: "auto",
          },
          {
            accessorKey: "recentcomplaintsbytype",
            header: i18n._(t`Top Complaint`),
            cell: ({ row }) => {
              const mostCommonType = findMostCommonType(row.original.recentcomplaintsbytype);
              return mostCommonType ? Helpers.translateComplaintType(mostCommonType, i18n) : null;
            },
            footer: (props) => props.column.id,
            enableColumnFilter: false,
            size: "auto",
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
            enableColumnFilter: false,
            size: "auto",
          },
          {
            accessorKey: "totalviolations",
            header: i18n._(t`Total`),
            cell: (info) => info.getValue(),
            footer: (props) => props.column.id,
            enableColumnFilter: false,
            size: "auto",
          },
        ],
      },
      {
        header: i18n._(t`Evictions Since 2017`),
        footer: (props) => props.column.id,
        columns: [
          {
            accessorFn: (row) => row.evictionfilings || null,
            id: "evictionfilings",
            header: i18n._(t`Filed`),
            cell: (info) => info.getValue(),
            footer: (props) => props.column.id,
            enableColumnFilter: false,
            size: "auto",
          },
          {
            accessorFn: (row) => row.evictions || null,
            id: "evictions",
            header: i18n._(t`Executed`),
            cell: (info) => info.getValue(),
            footer: (props) => props.column.id,
            enableColumnFilter: false,
            size: "auto",
          },
        ],
      },
      {
        header: i18n._(t`Landlord`),
        footer: (props) => props.column.id,
        columns: [
          {
            accessorFn: (row) => {
              // Group all contact info by the name of each person/corporate entity (same as on overview tab)
              var ownerList =
                row.allcontacts &&
                Object.entries(_groupBy(row.allcontacts, "value"))
                  .sort(sortContactsByImportance)
                  .map((contact) => contact[0]);
              return ownerList || [];
            },
            id: "ownernames",
            header: i18n._(t`Person/Entity`),
            cell: ({ row }) => {
              var contacts =
                row.original.allcontacts &&
                Object.entries(_groupBy(row.original.allcontacts, "value")).sort(
                  sortContactsByImportance
                );

              if (!contacts) return "";

              const contactWords = contacts[0][0].trim().split(/\s+/) || [contacts[0][0]];

              return (
                <>
                  {contactWords.length > 1 && contactWords.slice(0, 1).join(" ") + " "}
                  <span className="col-ownernames-last-word">
                    {contactWords.slice(-1)}
                    {row.getCanExpand() && contacts && contacts.length > 1 ? (
                      <button
                        className="contacts-expand"
                        onClick={() => {
                          row.getToggleExpandedHandler()();
                          !row.getIsExpanded() &&
                            logPortfolioAnalytics("portfolioRowExpanded", { column: "ownernames" });
                        }}
                      >
                        +{contacts.length - 1}
                      </button>
                    ) : (
                      <></>
                    )}
                  </span>
                </>
              );
            },
            footer: (props) => props.column.id,
            filterFn: "arrIncludesSome",
            minSize: 100,
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
            enableColumnFilter: false,
            size: 100,
          },
          {
            accessorKey: "yearstarted421a",
            header: "421a",
            cell: ({ row }) => formatAbatementStartYear(row.original.yearstarted421a, i18n),
            footer: (props) => props.column.id,
            enableColumnFilter: false,
            size: 100,
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
            enableColumnFilter: false,
            size: 100,
          },
          {
            accessorFn: (row) => formatCurrency(row.lastsaleamount),
            id: "lastsaleamount",
            header: i18n._(t`Amount`),
            cell: (info) => info.getValue(),
            footer: (props) => props.column.id,
            enableColumnFilter: false,
            size: 100,
          },
          {
            accessorKey: "lastsaleacrisid",
            header: i18n._(t`Link to Deed`),
            cell: ({ row }) =>
              row.original.lastsaleacrisid ? (
                <a
                  onClick={() => {
                    logPortfolioAnalytics("portfolioLinktoDeed", {
                      gtmEvent: "portfolio-link-to-deed",
                    });
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
            enableColumnFilter: false,
            size: "auto",
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
            enableColumnFilter: false,
            size: "auto",
          },
        ],
      },
      {
        header: i18n._(t`View Detail`),
        footer: (props) => props.column.id,
        columns: [
          {
            accessorKey: "bbl",
            id: "detail",
            header: null,
            cell: ({ row }) => (
              <Link
                to={createRouteForFullBbl(row.original.bbl, locale, isLegacyPath(pathname))}
                className="btn"
                aria-label={i18n._(t`View Detail`)}
                onClick={() =>
                  logPortfolioAnalytics("addressChangePortfolio", { column: "detail" })
                }
              >
                <span style={{ padding: "0 3px" }}>&#10142;</span>
              </Link>
            ),
            footer: (props) => props.column.id,
            enableColumnFilter: false,
            size: 100,
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
      inNumberRanges: inNumberRanges,
      isNonZero: isNonZero,
    },
    state: {
      columnFilters,
      pagination,
    },
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getRowCanExpand,
    getExpandedRowModel: getExpandedRowModel(),
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
    const { rsunitslatest, ownernames, unitsres, zip } = filterSelections;
    table.getColumn("rsunitslatest").setFilterValue(rsunitslatest);
    table.getColumn("ownernames").setFilterValue(ownernames);
    table.getColumn("unitsres").setFilterValue(unitsres.values);
    table.getColumn("zip").setFilterValue(zip);
  }, [filterSelections]);

  // TODO: is this necessary?
  React.useEffect(() => {
    if (table.getState().columnFilters[0]?.id === "ownernames") {
      if (table.getState().sorting[0]?.id !== "ownernames") {
        table.setSorting([{ id: "ownernames", desc: false }]);
      }
    }
    //   eslint-disable-next-line
  }, [table.getState().columnFilters[0]?.id]);

  const tableRef = React.useRef<HTMLDivElement>(null);
  const isTableLoaded = Helpers.useOnScreen(tableRef);

  return (
    <div
      id="PortfolioTable"
      ref={tableRef}
      className={classnames(hideScrollFade && "hide-scroll-fade", !isVisible && "is-hidden")}
    >
      {!isTableLoaded ? (
        <Loader loading={true} classNames="Loader-table">
          {data.length > MAX_TABLE_ROWS_PER_PAGE ? (
            <>
              <Trans>Loading {data.length} rows</Trans>
              <br />
              <Trans>(this may take a while)</Trans>
            </>
          ) : (
            <Trans>Loading</Trans>
          )}
        </Loader>
      ) : (
        <>
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
                          style={{ minWidth: header.getSize() || undefined }}
                        >
                          {header.isPlaceholder ? null : (
                            <>
                              <div
                                {...{
                                  className: header.column.getCanSort()
                                    ? "cursor-pointer select-none"
                                    : "",
                                  onClick: (e) => {
                                    header.column.getToggleSortingHandler()?.(e);
                                    logPortfolioAnalytics("portfolioColumnSort", {
                                      column: header.column.id,
                                    });
                                  },
                                }}
                                ref={header.column.id === "detail" ? lastColumnRef : undefined}
                              >
                                {flexRender(header.column.columnDef.header, header.getContext())}
                                {headerGroup.depth === 1 && header.column.id !== "detail"
                                  ? {
                                      asc: <ArrowIcon dir="up" />,
                                      desc: <ArrowIcon dir="down" />,
                                    }[header.column.getIsSorted() as string] ?? (
                                      <ArrowIcon dir="both" />
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
                    <Fragment key={row.id}>
                      <tr className={`row-${i % 2 ? "even" : "odd"}`}>
                        {row.getVisibleCells().map((cell) => {
                          return (
                            <td
                              key={cell.id}
                              className={`col-${cell.column.id}`}
                              style={{
                                width:
                                  cell.column.getSize() !== 0
                                    ? cell.column.getSize() || undefined
                                    : undefined,
                              }}
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          );
                        })}
                      </tr>
                      {row.getIsExpanded() && (
                        <tr>
                          {/* 2nd row is a custom 1 cell row */}
                          <td colSpan={row.getVisibleCells().length}>
                            {renderContacts({ row, i18n })}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <div className="prev">
              <button
                className="page-btn"
                onClick={() => {
                  table.previousPage();
                  logPortfolioAnalytics("portfolioPagination", {
                    extraParams: { paginationType: "previous" },
                  });
                }}
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
                    aria-label={i18n._(t`page number`)}
                    value={String(table.getState().pagination.pageIndex + 1)}
                    onChange={(e) => {
                      const page = e.target.value ? Number(e.target.value) - 1 : 0;
                      table.setPageIndex(page);
                      logPortfolioAnalytics("portfolioPagination", {
                        extraParams: { paginationType: "custom" },
                      });
                    }}
                  />
                </div>
                <Trans>of</Trans> <span className="total-pages">{table.getPageCount()}</span>
              </span>
              <select
                value={table.getState().pagination.pageSize}
                aria-label={i18n._(t`number of records per page`)}
                onChange={(e) => {
                  table.setPageSize(Number(e.target.value));
                  logPortfolioAnalytics("portfolioPagination", {
                    extraParams: { paginationType: "size" },
                  });
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
                onClick={() => {
                  table.nextPage();
                  logPortfolioAnalytics("portfolioPagination", {
                    extraParams: { paginationType: "next" },
                  });
                }}
                disabled={!table.getCanNextPage()}
              >
                {i18n._(t`Next`)}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
});

const renderContacts = ({ row, i18n }: { row: Row<AddressRecord>; i18n: I18n }) => {
  return (
    <ul className={classnames("contacts-list", `lang-${i18n.language}`)}>
      {Object.entries(_groupBy(row.original.allcontacts, "value"))
        .sort(sortContactsByImportance)
        .map((group) => group[1][0])
        .map((contact, i) => (
          <li key={i}>
            {Helpers.translateContactTitleAndIncludeEnglish(contact.title, i18n)}: {contact.value}
          </li>
        ))}
    </ul>
  );
};

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

const PortfolioTable = withI18n()(PortfolioTableWithoutI18n);

export default PortfolioTable;
