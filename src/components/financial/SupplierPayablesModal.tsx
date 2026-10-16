"use client";

import { BookOpen, ChevronRight, FileText, Loader2 } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Supplier, useGetSupplierPayablesQuery } from "@/redux/features/setup/SupplierApiSlice";
import { formatReadableDate } from "@/lib/dateFormat";

const amount = (value: string | number) =>
  Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function SupplierPayablesModal({
  supplier,
  onClose,
  onAdjust,
}: {
  supplier: Supplier;
  onClose: () => void;
  onAdjust: () => void;
}) {
  const { currentData, isFetching, isError, refetch } = useGetSupplierPayablesQuery(supplier.id);
  const entries = currentData?.data.entries || [];
  const balances = currentData?.data.balances || [];
  const totals = balances.reduce(
    (summary, balance) => ({
      opening_balance: summary.opening_balance + Number(balance.opening_balance || 0),
      invoice_amount: summary.invoice_amount + Number(balance.invoice_amount || 0),
      paid_amount: summary.paid_amount + Number(balance.paid_amount || 0),
      outstanding_amount: summary.outstanding_amount + Number(balance.outstanding_amount || 0),
    }),
    { opening_balance: 0, invoice_amount: 0, paid_amount: 0, outstanding_amount: 0 }
  );

  return (
    <Modal isOpen onClose={onClose} className="m-4 max-w-4xl">
      <div className="p-6 sm:p-8">
        <div className="mb-6 flex items-start gap-3 pr-10">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
            <BookOpen size={21} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Accounts payable
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {supplier.name} <span className="mx-1 text-gray-300">/</span> {supplier.code}
            </p>
          </div>
        </div>
        <div className="max-h-[60vh] space-y-6 overflow-y-auto pr-1">
          {isFetching ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
              <Loader2 className="animate-spin" size={18} />
              Loading payables…
            </div>
          ) : isError ? (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
            >
              Unable to load payable balances.
              <button
                type="button"
                className="ml-2 font-semibold underline"
                onClick={() => refetch()}
              >
                Try again
              </button>
            </div>
          ) : (
            <>
              <section>
                <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Balance summary
                </h3>
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                  <Table>
                    <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
                      <TableRow>
                        {["Opening balance", "Invoices", "Paid", "Outstanding"].map((label) => (
                          <TableCell
                            key={label}
                            isHeader
                            className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium text-gray-500"
                          >
                            {label}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {balances.length > 0 && (
                        <TableRow>
                          {[totals.opening_balance, totals.invoice_amount, totals.paid_amount].map((value, columnIndex) => (
                            <TableCell key={columnIndex} className="whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums text-gray-900 dark:text-white">
                              {amount(value)}
                            </TableCell>
                          ))}
                          <TableCell className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                            {amount(totals.outstanding_amount)}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  {!balances.length && <p className="p-4 text-sm text-gray-500">No balances available.</p>}
                </div>
              </section>
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    Ledger entries
                  </h3>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-800">
                    {entries.length}
                  </span>
                </div>
                {entries.length ? (
                  <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                    <Table>
                      <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
                        <TableRow>
                          {["Date", "Type", "Reference", "Amount"].map((label) => (
                            <TableCell
                              key={label}
                              isHeader
                              className={`px-4 py-3 text-xs font-medium text-gray-500 ${label === "Amount" ? "text-right" : "text-start"}`}
                            >
                              {label}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {entries.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                              {formatReadableDate(entry.business_date)}
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <span className="whitespace-nowrap rounded-md bg-gray-100 px-2 py-1 text-xs capitalize text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                {entry.entry_type.replace(/_/g, " ")}
                              </span>
                            </TableCell>
                            <TableCell className="min-w-[160px] break-words px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                              {entry.reference}
                            </TableCell>
                            <TableCell
                              className={`whitespace-nowrap px-4 py-3 text-right text-sm font-medium tabular-nums ${Number(entry.amount) < 0 ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-white"}`}
                            >
                              {amount(entry.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-200 py-10 text-center dark:border-gray-800">
                    <FileText size={26} className="mx-auto mb-3 text-gray-400" />
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      No payable entries yet
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Opening balances and adjustments will appear here.
                    </p>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
        <div className="mt-6 flex items-center justify-between gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
          <Button type="button" size="sm" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button type="button" size="sm" onClick={onAdjust}>
            Adjust AP <ChevronRight size={15} />
          </Button>
        </div>
      </div>
    </Modal>
  );
}
