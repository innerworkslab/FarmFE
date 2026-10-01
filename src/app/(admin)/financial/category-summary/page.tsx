"use client";

import { useState } from "react";
import { Tags } from "lucide-react";
import DatePicker from "@/components/form/date-picker";
import Loading from "@/components/common/Loading";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { useGetCashbookCategorySummaryQuery } from "@/redux/features/financial/CashbookApiSlice";
import { formatReadableDate } from "@/lib/dateFormat";

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const money = (value: string | number) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function CashbookCategorySummaryPage() {
  const [fromDate, setFromDate] = useState(today());
  const [toDate, setToDate] = useState(today());
  const { data, isLoading, isFetching } = useGetCashbookCategorySummaryQuery({
    from_date: fromDate,
    to_date: toDate,
  });
  const currencies = data?.data.currencies ?? [];
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header>
        <div className="flex items-center gap-2">
          <Tags className="text-emerald-700" size={24} />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Cashbook Category Summary
          </h1>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Review posted money in and money out grouped by category and currency.
        </p>
      </header>
      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">
            From date
          </label>
          <DatePicker
            id="category-summary-from-date"
            defaultDate={fromDate}
            onChange={(_, date) => setFromDate(date)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">
            To date
          </label>
          <DatePicker
            id="category-summary-to-date"
            defaultDate={toDate}
            onChange={(_, date) => setToDate(date)}
          />
        </div>
        {isFetching && <span className="pb-3 text-xs text-gray-500">Updating…</span>}
      </div>
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loading />
        </div>
      ) : currencies.length ? (
        <div className="space-y-4">
          {currencies.map((currency) => (
            <section
              key={currency.currency_code}
              className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
            >
              <div className="border-b border-gray-200 px-4 py-3 font-semibold text-gray-900 dark:border-gray-800 dark:text-white">
                {currency.currency_code}
                <span className="ml-2 text-xs font-normal text-gray-500">
                  {formatReadableDate(data?.data.from_date)} –{" "}
                  {formatReadableDate(data?.data.to_date)}
                </span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    {["Category", "Direction", "Entries", "Total amount"].map((head) => (
                      <TableCell
                        key={head}
                        isHeader
                        className={`px-4 py-3 text-xs font-semibold text-gray-500 ${["Entries", "Total amount"].includes(head) ? "text-right" : ""}`}
                      >
                        {head}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currency.categories.map((row) => (
                    <TableRow key={`${row.category_id}-${row.direction}`}>
                      <TableCell className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {row.category_name}
                      </TableCell>
                      <TableCell
                        className={`px-4 py-3 text-sm font-semibold capitalize ${row.direction === "in" ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}
                      >
                        {row.direction === "in" ? "Money in" : "Money out"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right text-sm tabular-nums text-gray-600 dark:text-gray-300">
                        {row.entry_count}
                      </TableCell>
                      <TableCell
                        className={`px-4 py-3 text-right text-sm font-semibold tabular-nums ${row.direction === "in" ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}
                      >
                        {money(row.total_amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </section>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white py-14 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-white/[0.03]">
          No category totals for this date range.
        </div>
      )}
    </div>
  );
}
