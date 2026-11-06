"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BookOpen, Plus, RefreshCw, SlidersHorizontal } from "lucide-react";
import Loading from "@/components/common/Loading";
import LedgerAdjustmentModal from "@/components/financial/LedgerAdjustmentModal";
import Button from "@/components/ui/button/Button";
import TableActionButton from "@/components/ui/table/TableActionButton";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Supplier, useGetSuppliersQuery } from "@/redux/features/setup/SupplierApiSlice";

const money = (value: string | number | null | undefined) =>
  Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function SupplierAPListPage() {
  const router = useRouter();
  const [adjustmentSupplier, setAdjustmentSupplier] = useState<Supplier | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const { currentData, isFetching, isError, refetch } = useGetSuppliersQuery({ page, per_page: perPage });
  const suppliers = currentData?.data || [];
  const meta = currentData?.meta;
  const currentPage = meta?.current_page || page;
  const lastPage = Math.max(meta?.last_page || 1, 1);
  const total = meta?.total ?? suppliers.length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">Supplier AP</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Supplier accounts payable balances.</p>
      </header>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex min-h-20 flex-wrap items-center justify-end gap-3 p-5">
          <Button size="sm" onClick={() => router.push("/financial/supplier-payments")}><Plus size={15} /> Add payment</Button>
          <Button type="button" size="sm" variant="outline" disabled={isFetching} onClick={() => void refetch()}>
            <RefreshCw size={15} className={isFetching ? "animate-spin" : ""} /> Refresh
          </Button>
        </div>

        <div className="border-b border-gray-200 px-5 pb-4 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">Supplier AP balances</h2>
        </div>

        {isFetching && !currentData ? (
          <div className="flex h-64 items-center justify-center"><Loading /></div>
        ) : isError ? (
          <div className="p-8 text-center text-sm text-red-600">Unable to load supplier AP balances.</div>
        ) : !suppliers.length ? (
          <div className="p-8 text-center text-sm text-gray-500">No supplier balances found.</div>
        ) : (
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  {["Supplier", "Supplier Code", "Supplier Type", "Credit Limit", "Payable Balance", "Available Credit", "Status", "Actions"].map((column) => (
                    <TableCell key={column} isHeader className={`whitespace-nowrap px-5 py-3 text-xs font-medium uppercase tracking-wide text-gray-500 ${["Credit Limit", "Payable Balance", "Available Credit"].includes(column) ? "text-right" : "text-start"}`}>
                      {column}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {suppliers.map((supplier) => {
                  const types = supplier.types?.length ? supplier.types : [supplier.type].filter(Boolean);
                  return (
                    <TableRow key={supplier.id}>
                      <TableCell className="whitespace-nowrap px-5 py-4 text-sm font-medium text-gray-900 dark:text-white">{supplier.name}</TableCell>
                      <TableCell className="whitespace-nowrap px-5 py-4 text-sm text-gray-700 dark:text-gray-300">{supplier.code}</TableCell>
                      <TableCell className="whitespace-nowrap px-5 py-4 text-sm capitalize text-gray-700 dark:text-gray-300">{types.join(", ") || "—"}</TableCell>
                      <TableCell className="whitespace-nowrap px-5 py-4 text-right text-sm tabular-nums text-gray-700 dark:text-gray-300">{money(supplier.credit_limit)}</TableCell>
                      <TableCell className="whitespace-nowrap px-5 py-4 text-right text-sm tabular-nums text-gray-900 dark:text-white">{money(supplier.total_credit)}</TableCell>
                      <TableCell className="whitespace-nowrap px-5 py-4 text-right text-sm tabular-nums text-gray-700 dark:text-gray-300">{money(supplier.available_credit)}</TableCell>
                      <TableCell className="whitespace-nowrap px-5 py-4 text-sm">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${supplier.status === "active" ? "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}>
                          {supplier.status}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-5 py-4 text-sm">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <TableActionButton
                            label="Detail"
                            tone="green"
                            title={`View ${supplier.name} payable detail`}
                            onClick={() => router.push(`/setup/supplier-ap/${supplier.id}?from=supplier-ap`)}
                            icon={<BookOpen size={14} />}
                          />
                          <TableActionButton
                            label="Adjust AP"
                            tone="blue"
                            title={`Adjust ${supplier.name} payable balance`}
                            onClick={() => setAdjustmentSupplier(supplier)}
                            icon={<SlidersHorizontal size={14} />}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 px-5 py-3 text-sm text-gray-500 dark:border-gray-800">
          <label className="flex items-center gap-2">
            Rows per page
            <select className="h-9 rounded-md border border-gray-300 bg-white px-2 dark:border-gray-700 dark:bg-gray-900" value={perPage} onChange={(event) => { setPerPage(Number(event.target.value)); setPage(1); }}>
              {[10, 20, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
          </label>
          <span>{total ? `${(currentPage - 1) * perPage + 1}–${Math.min(currentPage * perPage, total)} of ${total}` : "0–0 of 0"}</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={currentPage <= 1 || isFetching} onClick={() => setPage(1)}>First</Button>
            <Button size="sm" variant="outline" disabled={currentPage <= 1 || isFetching} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</Button>
            <span className="whitespace-nowrap">Page {currentPage} of {lastPage}</span>
            <Button size="sm" variant="outline" disabled={currentPage >= lastPage || isFetching} onClick={() => setPage((value) => Math.min(lastPage, value + 1))}>Next</Button>
            <Button size="sm" variant="outline" disabled={currentPage >= lastPage || isFetching} onClick={() => setPage(lastPage)}>Last</Button>
          </div>
        </div>
      </section>
      {adjustmentSupplier && (
        <LedgerAdjustmentModal
          kind="supplier"
          party={adjustmentSupplier}
          onClose={() => setAdjustmentSupplier(null)}
        />
      )}
    </div>
  );
}
