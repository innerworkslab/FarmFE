"use client";

import React, { useMemo, useState } from "react";
import { Wallet } from "lucide-react";
import Loading from "@/components/common/Loading";
import Button from "@/components/ui/button/Button";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import {
  useGetStaffAdvanceBalancesQuery,
  useGetStaffAdvanceHistoryQuery,
} from "@/redux/features/financial/StaffAdvanceApiSlice";
import { StaffRecord, useGetStaffQuery } from "@/redux/features/setup/StaffApiSlice";
import { formatReadableDate } from "@/lib/dateFormat";

const inputClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white";
const labelClass = "mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300";
const money = (value?: number | string | null, currency = "") =>
  `${currency ? `${currency} ` : ""}${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function StaffAdvanceBalancesPage() {
  const [selectedStaff, setSelectedStaff] = useState<StaffRecord | null>(null);
  const { data: staffResponse } = useGetStaffQuery({ per_page: 100 });
  const staff = staffResponse?.data ?? [];
  const { data: balancesResponse, isLoading: balancesLoading } = useGetStaffAdvanceBalancesQuery({
    search: "",
    balance_state: "positive",
    per_page: 100,
  });
  const { data: historyResponse, isLoading: historyLoading } = useGetStaffAdvanceHistoryQuery(
    { staff_id: selectedStaff?.id ?? 0, per_page: 30 },
    { skip: !selectedStaff }
  );
  const historyEntries = historyResponse?.data ?? [];
  const historyCurrency = useMemo(
    () =>
      historyEntries[historyEntries.length - 1]?.currency_code ??
      balancesResponse?.data.find((balance) => balance.staff_id === selectedStaff?.id)
        ?.currency_code ??
      "",
    [historyEntries, balancesResponse?.data, selectedStaff?.id]
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-8">
      <header>
        <div className="mb-1 flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
          <Wallet size={17} />
          <span>Financial management</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Staff Advance Balances
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Review outstanding balances and transaction history by staff member.
        </p>
      </header>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Outstanding balances
            </h2>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              Staff members with an outstanding advance.
            </p>
          </div>
          {!!balancesResponse?.data.length && (
            <span className="text-xs text-gray-500">{balancesResponse.data.length} staff</span>
          )}
        </div>
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-gray-200/70 dark:bg-white/[0.03] dark:ring-gray-800">
          {balancesLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loading />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {["Staff", "Branch", "Employment", "Added", "Repaid", "Outstanding", ""].map(
                    (head) => (
                      <TableCell
                        key={head}
                        isHeader
                        className={`px-4 py-3 text-xs font-semibold text-gray-500 ${["Added", "Repaid", "Outstanding"].includes(head) ? "text-right" : ""}`}
                      >
                        {head}
                      </TableCell>
                    )
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(balancesResponse?.data ?? []).map((balance) => (
                  <TableRow
                    key={balance.staff_id}
                    className="transition-colors hover:bg-gray-50/80 dark:hover:bg-white/[0.03]"
                  >
                    <TableCell className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                      {balance.staff_name}
                      <div className="text-xs font-normal text-gray-500">{balance.staff_code}</div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {balance.branch?.name ?? `#${balance.branch_id}`}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm capitalize text-gray-600 dark:text-gray-300">
                      {balance.employment_status}
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums">
                      {money(balance.total_additions, balance.currency_code)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums text-emerald-700 dark:text-emerald-400">
                      {money(balance.total_deductions, balance.currency_code)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
                      {money(balance.outstanding_balance, balance.currency_code)}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setSelectedStaff(
                            staff.find((person) => person.id === balance.staff_id) ?? null
                          )
                        }
                      >
                        History
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!balancesLoading && !balancesResponse?.data.length && (
            <p className="py-10 text-center text-sm text-gray-500">
              No outstanding staff advances.
            </p>
          )}
        </div>
      </section>

      <section className="max-w-md">
        <label>
          <span className={labelClass}>View history for staff</span>
          <select
            className={inputClass}
            value={selectedStaff?.id ?? ""}
            onChange={(event) =>
              setSelectedStaff(
                staff.find((person) => person.id === Number(event.target.value)) ?? null
              )
            }
          >
            <option value="">Select staff to view loan history</option>
            {staff.map((person) => (
              <option key={person.id} value={person.id}>
                {person.staff_code} · {person.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      {selectedStaff && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedStaff.name} · loan history
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Running balance{" "}
                <span className="font-semibold tabular-nums text-gray-800 dark:text-gray-200">
                  {money(historyResponse?.meta?.current_balance, historyCurrency)}
                </span>
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setSelectedStaff(null)}>
              Hide history
            </Button>
          </div>
          <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-gray-200/70 dark:bg-white/[0.03] dark:ring-gray-800">
            {historyLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loading />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {["Date", "Entry", "Reference", "Addition", "Deduction", "Running balance"].map(
                      (head) => (
                        <TableCell
                          key={head}
                          isHeader
                          className={`px-4 py-3 text-xs font-semibold text-gray-500 ${["Addition", "Deduction", "Running balance"].includes(head) ? "text-right" : ""}`}
                        >
                          {head}
                        </TableCell>
                      )
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(historyResponse?.data ?? []).map((entry) => (
                    <TableRow
                      key={entry.id}
                      className="transition-colors hover:bg-gray-50/80 dark:hover:bg-white/[0.03]"
                    >
                      <TableCell className="whitespace-nowrap px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {formatReadableDate(entry.business_date)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-3 text-sm capitalize text-gray-700 dark:text-gray-200">
                        {entry.entry_type.replaceAll("_", " ")}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {entry.reference}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums text-emerald-700 dark:text-emerald-400">
                        {money(entry.addition, entry.currency_code)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums text-red-700 dark:text-red-400">
                        {money(entry.deduction, entry.currency_code)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold tabular-nums">
                        {money(entry.running_balance, entry.currency_code)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {!historyLoading && !historyResponse?.data.length && (
              <p className="py-8 text-center text-sm text-gray-500">
                No loan history for this staff member.
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
