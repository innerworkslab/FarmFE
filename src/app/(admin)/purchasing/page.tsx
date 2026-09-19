"use client";

import React, { useMemo, useState } from "react";
import {
  PurchaseInvoice,
  PurchaseInvoicePayload,
  PurchaseReceiptPayload,
  useCancelPurchaseInvoiceMutation,
  useConfirmPurchaseReceiptMutation,
  useCreatePurchaseInvoiceMutation,
  useCreatePurchaseReceiptMutation,
  useGetPurchaseInvoicesQuery,
  useGetPurchaseReceiptsQuery,
  useLazyGetPurchaseInvoiceQuery,
  useLazyGetPurchaseReceiptQuery,
  useUpdatePurchaseInvoiceMutation,
} from "@/redux/features/purchasing/PurchasingFoundationApiSlice";
import { useGetInventoryBalancesQuery, useGetInventoryLedgerQuery } from "@/redux/features/inventory/InventoryFoundationApiSlice";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Loading from "@/components/common/Loading";
import { toast } from "sonner";
import { CheckCircle2, Eye, ReceiptText, XCircle } from "lucide-react";

type PurchasingTab = "invoices" | "receipts" | "balances" | "ledger";
type JsonAction = "createInvoice" | "updateInvoice" | "cancelInvoice" | "createReceipt";

const foodInvoiceSample: PurchaseInvoicePayload = {
  invoice_number: `PINV-POSTMAN-${Date.now()}`,
  invoice_date: new Date().toISOString().slice(0, 10),
  supplier_id: 1,
  branch_id: 1,
  notes: "Postman food purchase; saving this invoice should not move stock.",
  lines: [
    {
      category: "food",
      item_id: 1,
      purchase_uom_id: 1,
      stock_uom_id: 1,
      conversion_factor: 1,
      quantity: 20,
      unit_price: 75000,
      discount_type: "percentage",
      discount_value: 2,
      foc_type: "quantity",
      foc_value: 2,
      tax_rate: 0,
      target_inventory_id: 1,
      target_location: "R1",
    },
  ],
};

const medicineInvoiceSample: PurchaseInvoicePayload = {
  invoice_number: `PINV-POSTMAN-MED-${Date.now()}`,
  invoice_date: new Date().toISOString().slice(0, 10),
  supplier_id: 1,
  branch_id: 1,
  notes: "Postman medicine purchase; receipt can quarantine breached cold-chain stock.",
  lines: [
    {
      category: "medicine",
      item_id: 1,
      purchase_uom_id: 1,
      stock_uom_id: 1,
      conversion_factor: 1,
      quantity: 12,
      unit_price: 45000,
      foc_type: "quantity",
      foc_value: 1,
      tax_rate: 0,
      target_inventory_id: 1,
      target_location: "MED-R1",
    },
  ],
};

const foodInvoiceUpdateSample: PurchaseInvoicePayload = {
  invoice_date: new Date().toISOString().slice(0, 10),
  supplier_id: 1,
  branch_id: 1,
  notes: "Updated while invoice is still unreceived.",
  lines: foodInvoiceSample.lines,
};

const receiptSample: PurchaseReceiptPayload = {
  receipt_number: `PREC-POSTMAN-${Date.now()}`,
  purchase_invoice_id: 1,
  receipt_date: new Date().toISOString().slice(0, 10),
  idempotency_key: `postman-food-receipt-${Date.now()}`,
  notes: "Postman food receipt; confirmation posts stock balance and ledger.",
  lines: [
    {
      purchase_invoice_line_id: 1,
      accepted_quantity: 20,
      accepted_foc_quantity: 2,
      rejected_quantity: 0,
      target_inventory_id: 1,
      target_location: "R1",
      supplier_batch_number: `SUP-POSTMAN-FEED-${Date.now()}`,
      receipt_lot_number: `LOT-POSTMAN-FEED-${Date.now()}`,
      manufacturing_date: "2026-08-01",
      expiry_date: "2027-08-01",
    },
  ],
};

const medicineReceiptSample: PurchaseReceiptPayload = {
  receipt_number: `PREC-POSTMAN-MED-${Date.now()}`,
  purchase_invoice_id: 1,
  receipt_date: new Date().toISOString().slice(0, 10),
  idempotency_key: `postman-med-receipt-${Date.now()}`,
  notes: "Postman medicine receipt with breached cold-chain status.",
  lines: [
    {
      purchase_invoice_line_id: 1,
      accepted_quantity: 12,
      accepted_foc_quantity: 1,
      target_inventory_id: 1,
      target_location: "MED-R1",
      supplier_batch_number: `SUP-POSTMAN-MED-${Date.now()}`,
      receipt_lot_number: `LOT-POSTMAN-MED-${Date.now()}`,
      manufacturing_date: "2026-08-01",
      expiry_date: "2027-08-01",
      cold_chain_required: true,
      cold_chain_status: "breached",
      observed_temperature: 12.5,
      temperature_uom: "C",
      exception_reason: "Postman sample: delivery temperature breached threshold.",
    },
  ],
};

const formatValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const statusClass = (status?: string) => {
  if (status === "confirmed" || status === "received") return "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400";
  if (status === "cancelled") return "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300";
  return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
};

export default function PurchasingPage() {
  const [tab, setTab] = useState<PurchasingTab>("invoices");
  const [selectedJson, setSelectedJson] = useState<unknown | null>(null);
  const [jsonAction, setJsonAction] = useState<JsonAction | null>(null);
  const [targetInvoice, setTargetInvoice] = useState<PurchaseInvoice | null>(null);
  const [jsonText, setJsonText] = useState("");

  const { data: invoicesData, isLoading: invoicesLoading } = useGetPurchaseInvoicesQuery({ per_page: 15 });
  const { data: receiptsData, isLoading: receiptsLoading } = useGetPurchaseReceiptsQuery({ per_page: 15 });
  const { data: balancesData, isLoading: balancesLoading } = useGetInventoryBalancesQuery({ per_page: 15 });
  const { data: ledgerData, isLoading: ledgerLoading } = useGetInventoryLedgerQuery({
    source_type: "purchase_receipt",
    transaction_type: "purchase_receipt",
    per_page: 15,
  });

  const [createInvoice, createInvoiceState] = useCreatePurchaseInvoiceMutation();
  const [showInvoice] = useLazyGetPurchaseInvoiceQuery();
  const [showReceipt] = useLazyGetPurchaseReceiptQuery();
  const [updateInvoice, updateInvoiceState] = useUpdatePurchaseInvoiceMutation();
  const [cancelInvoice, cancelInvoiceState] = useCancelPurchaseInvoiceMutation();
  const [createReceipt, createReceiptState] = useCreatePurchaseReceiptMutation();
  const [confirmReceipt, confirmReceiptState] = useConfirmPurchaseReceiptMutation();

  const invoices = invoicesData?.data || [];
  const receipts = receiptsData?.data || [];
  const balances = balancesData?.data || [];
  const ledger = ledgerData?.data || [];

  const isMutating =
    createInvoiceState.isLoading ||
    updateInvoiceState.isLoading ||
    cancelInvoiceState.isLoading ||
    createReceiptState.isLoading ||
    confirmReceiptState.isLoading;

  const tabs = useMemo(
    () => [
      { key: "invoices" as const, label: "Invoices", count: invoices.length },
      { key: "receipts" as const, label: "Receipts", count: receipts.length },
      { key: "balances" as const, label: "Inventory Checks", count: balances.length },
      { key: "ledger" as const, label: "Purchase Ledger", count: ledger.length },
    ],
    [balances.length, invoices.length, ledger.length, receipts.length]
  );

  const openJsonAction = (action: JsonAction, sample: unknown, invoice?: PurchaseInvoice) => {
    setJsonAction(action);
    setTargetInvoice(invoice || null);
    setJsonText(JSON.stringify(sample, null, 2));
  };

  const runJsonAction = async () => {
    if (!jsonAction) return;
    try {
      const parsed = JSON.parse(jsonText);
      let result: unknown;
      if (jsonAction === "createInvoice") result = await createInvoice(parsed).unwrap();
      if (jsonAction === "updateInvoice" && targetInvoice) {
        result = await updateInvoice({ id: targetInvoice.id, body: parsed }).unwrap();
      }
      if (jsonAction === "cancelInvoice" && targetInvoice) {
        result = await cancelInvoice({ id: targetInvoice.id, reason: parsed.reason }).unwrap();
      }
      if (jsonAction === "createReceipt") result = await createReceipt(parsed).unwrap();
      setSelectedJson(result);
      setJsonAction(null);
      toast.success("Purchasing API request saved successfully");
    } catch (error: unknown) {
      const err = error as { data?: { message?: string }; message?: string };
      toast.error(err?.data?.message || err?.message || "Purchasing API request failed");
    }
  };

  const runConfirmReceipt = async (id: number) => {
    try {
      const result = await confirmReceipt(id).unwrap();
      setSelectedJson(result);
      toast.success("Purchase receipt confirmed and posted");
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || "Receipt confirmation failed");
    }
  };

  const showSavedResponse = async (type: "invoice" | "receipt", id: number | string, fallback: unknown) => {
    try {
      const result =
        type === "invoice"
          ? await showInvoice(id).unwrap()
          : await showReceipt(id).unwrap();
      setSelectedJson(result);
    } catch {
      setSelectedJson(fallback);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ReceiptText className="text-[#15803d] dark:text-emerald-400" size={26} />
            <h1 className="text-2xl font-extrabold tracking-tight text-[#1E293B] dark:text-white">
              Purchasing
            </h1>
          </div>
          <p className="mt-1 text-sm text-[#64748B] dark:text-gray-400">
            Purchase invoices, receipt drafts, confirmation posting, and inventory checks from the Postman purchasing collection.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => openJsonAction("createInvoice", foodInvoiceSample)}>Food Invoice</Button>
          <Button size="sm" variant="outline" onClick={() => openJsonAction("createInvoice", medicineInvoiceSample)}>Medicine Invoice</Button>
          <Button size="sm" variant="outline" onClick={() => openJsonAction("createReceipt", receiptSample)}>Food Receipt</Button>
          <Button size="sm" variant="outline" onClick={() => openJsonAction("createReceipt", medicineReceiptSample)}>Medicine Receipt</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === item.key
                ? "bg-[#15803d] text-white"
                : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
            }`}
          >
            {item.label} <span className="ml-1 opacity-75">{item.count}</span>
          </button>
        ))}
      </div>

      {tab === "invoices" && (
        <DataPanel loading={invoicesLoading} empty="No purchase invoices found.">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                {["No.", "Invoice", "Date", "Supplier", "Branch", "Status", "Lines", "Actions"].map((head) => (
                  <TableCell key={head} isHeader className="px-5 py-3 text-start text-xs font-medium text-gray-500">{head}</TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {invoices.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell className="px-5 py-3.5 text-sm text-gray-500">{index + 1}</TableCell>
                  <TableCell className="px-5 py-3.5 text-sm font-semibold text-gray-900 dark:text-white">{item.invoice_number}</TableCell>
                  <TableCell className="px-5 py-3.5 text-sm text-gray-500">{item.invoice_date}</TableCell>
                  <TableCell className="px-5 py-3.5 text-sm text-gray-500">#{item.supplier_id}</TableCell>
                  <TableCell className="px-5 py-3.5 text-sm text-gray-500">#{item.branch_id}</TableCell>
                  <TableCell className="px-5 py-3.5 text-sm"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass(item.status)}`}>{item.status || "open"}</span></TableCell>
                  <TableCell className="px-5 py-3.5 text-sm text-gray-500">{item.lines?.length || 0}</TableCell>
                  <TableCell className="px-5 py-3.5 text-sm">
                    <div className="flex flex-wrap gap-1.5">
                      <IconButton title="Show purchase invoice" onClick={() => showSavedResponse("invoice", item.id, item)} icon={<Eye size={15} />} />
                      <IconButton title="Update invoice" onClick={() => openJsonAction("updateInvoice", foodInvoiceUpdateSample, item)} icon={<ReceiptText size={15} />} />
                      <IconButton title="Cancel invoice" onClick={() => openJsonAction("cancelInvoice", { reason: "Supplier cancelled before any receipt." }, item)} icon={<XCircle size={15} />} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataPanel>
      )}

      {tab === "receipts" && (
        <DataPanel loading={receiptsLoading} empty="No purchase receipts found.">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                {["No.", "Receipt", "Invoice", "Date", "Status", "Lines", "Actions"].map((head) => (
                  <TableCell key={head} isHeader className="px-5 py-3 text-start text-xs font-medium text-gray-500">{head}</TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {receipts.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell className="px-5 py-3.5 text-sm text-gray-500">{index + 1}</TableCell>
                  <TableCell className="px-5 py-3.5 text-sm font-semibold text-gray-900 dark:text-white">{item.receipt_number}</TableCell>
                  <TableCell className="px-5 py-3.5 text-sm text-gray-500">#{item.purchase_invoice_id}</TableCell>
                  <TableCell className="px-5 py-3.5 text-sm text-gray-500">{item.receipt_date}</TableCell>
                  <TableCell className="px-5 py-3.5 text-sm"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass(item.status)}`}>{item.status || "draft"}</span></TableCell>
                  <TableCell className="px-5 py-3.5 text-sm text-gray-500">{item.lines?.length || 0}</TableCell>
                  <TableCell className="px-5 py-3.5 text-sm">
                    <div className="flex flex-wrap gap-1.5">
                      <IconButton title="Show purchase receipt" onClick={() => showSavedResponse("receipt", item.id, item)} icon={<Eye size={15} />} />
                      <IconButton title="Confirm and post stock" onClick={() => runConfirmReceipt(item.id)} icon={<CheckCircle2 size={15} />} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataPanel>
      )}

      {tab === "balances" && (
        <SimpleObjectTable loading={balancesLoading} empty="No purchase inventory balances found." rows={balances} preferredKeys={["category", "item_id", "inventory_id", "location", "quantity", "available_quantity", "stock_lot_id"]} onView={setSelectedJson} />
      )}

      {tab === "ledger" && (
        <SimpleObjectTable loading={ledgerLoading} empty="No purchase ledger entries found." rows={ledger} preferredKeys={["transaction_date", "transaction_type", "source_type", "source_id", "item_id", "quantity", "balance_after"]} onView={setSelectedJson} />
      )}

      <JsonModal
        title={jsonAction?.includes("Invoice") ? "Postman Invoice Payload" : jsonAction === "cancelInvoice" ? "Cancel Reason Payload" : "Postman Receipt Payload"}
        isOpen={!!jsonAction}
        jsonText={jsonText}
        isSaving={isMutating}
        onChange={setJsonText}
        onClose={() => setJsonAction(null)}
        onSubmit={runJsonAction}
      />

      <ResponseModal data={selectedJson} onClose={() => setSelectedJson(null)} />
    </div>
  );
}

function IconButton({ title, icon, onClick }: { title: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="rounded-md p-1.5 text-gray-600 transition hover:bg-green-50 hover:text-[#15803d] dark:text-gray-300 dark:hover:bg-green-950/20"
    >
      {icon}
    </button>
  );
}

function DataPanel({ loading, empty, children }: { loading: boolean; empty: string; children: React.ReactNode }) {
  const isEmpty = React.Children.count(children) === 0;
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {loading ? (
        <div className="flex h-64 items-center justify-center"><Loading /></div>
      ) : isEmpty ? (
        <div className="flex h-64 items-center justify-center text-gray-500">{empty}</div>
      ) : (
        <div className="max-w-full overflow-x-auto">{children}</div>
      )}
    </div>
  );
}

function SimpleObjectTable({
  loading,
  empty,
  rows,
  preferredKeys,
  onView,
}: {
  loading: boolean;
  empty: string;
  rows: Record<string, unknown>[];
  preferredKeys: string[];
  onView: (row: unknown) => void;
}) {
  return (
    <DataPanel loading={loading} empty={empty}>
      {rows.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-gray-500">{empty}</div>
      ) : (
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 text-start text-xs font-medium text-gray-500">No.</TableCell>
              {preferredKeys.map((key) => (
                <TableCell key={key} isHeader className="px-5 py-3 text-start text-xs font-medium text-gray-500">{key}</TableCell>
              ))}
              <TableCell isHeader className="px-5 py-3 text-start text-xs font-medium text-gray-500">Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {rows.map((row, index) => (
              <TableRow key={String(row.id || index)}>
                <TableCell className="px-5 py-3.5 text-sm text-gray-500">{index + 1}</TableCell>
                {preferredKeys.map((key) => (
                  <TableCell key={key} className="max-w-[220px] truncate px-5 py-3.5 text-sm text-gray-500">{formatValue(row[key])}</TableCell>
                ))}
                <TableCell className="px-5 py-3.5 text-sm">
                  <IconButton title="View saved response" onClick={() => onView(row)} icon={<Eye size={15} />} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </DataPanel>
  );
}

function JsonModal({
  title,
  isOpen,
  jsonText,
  isSaving,
  onChange,
  onClose,
  onSubmit,
}: {
  title: string;
  isOpen: boolean;
  jsonText: string;
  isSaving: boolean;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="m-4 max-w-[820px]">
      <div className="space-y-4 p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
        <textarea
          value={jsonText}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-[360px] w-full rounded-lg border border-gray-300 bg-white p-4 font-mono text-xs text-gray-800 outline-none focus:border-[#15803d] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />
        <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
          <Button type="button" size="sm" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="button" size="sm" disabled={isSaving} onClick={onSubmit}>{isSaving ? "Saving..." : "Save Response"}</Button>
        </div>
      </div>
    </Modal>
  );
}

function ResponseModal({ data, onClose }: { data: unknown | null; onClose: () => void }) {
  return (
    <Modal isOpen={!!data} onClose={onClose} className="m-4 max-w-[820px]">
      <div className="space-y-4 p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Saved API Response</h2>
        <pre className="max-h-[520px] overflow-auto rounded-lg bg-gray-950 p-4 text-xs text-gray-100">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </Modal>
  );
}
