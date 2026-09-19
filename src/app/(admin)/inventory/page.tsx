"use client";

import React, { useMemo, useState } from "react";
import {
  InventoryAdjustment,
  InventoryAdjustmentPayload,
  useConfirmInventoryAdjustmentMutation,
  useCreateInventoryAdjustmentMutation,
  useGetInventoryAdjustmentsQuery,
  useGetInventoryBalancesQuery,
  useGetInventoryConfirmationsQuery,
  useGetInventoryLedgerQuery,
  useLazyGetInventoryAdjustmentQuery,
  useLazyGetInventoryConfirmationQuery,
  useRejectInventoryAdjustmentMutation,
  useReverseInventoryAdjustmentMutation,
  useSubmitInventoryAdjustmentMutation,
  useUpdateInventoryAdjustmentMutation,
} from "@/redux/features/inventory/InventoryFoundationApiSlice";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Loading from "@/components/common/Loading";
import { toast } from "sonner";
import { CheckCircle2, ClipboardCheck, Eye, RotateCcw, Send, XCircle } from "lucide-react";

type InventoryTab = "adjustments" | "balances" | "ledger" | "confirmations";
type JsonAction = "create" | "update" | "reverse" | "reject";

const createAdjustmentSample: InventoryAdjustmentPayload = {
  type: "opening_balance",
  adjustment_date: new Date().toISOString().slice(0, 10),
  branch_id: 1,
  inventory_id: 1,
  reason_type: "opening_balance",
  reason: "Postman opening stock balance",
  notes: "Created from the inventory foundation Postman collection.",
  lines: [
    {
      category: "food",
      item_id: 1,
      location: "R1",
      stock_uom_id: 1,
      adjustment_quantity: 250,
      direction: "in",
      new_identity: true,
      supplier_id: 1,
      supplier_batch_number: "PM-FEED-BATCH-001",
      receipt_lot_number: `PM-FEED-LOT-${Date.now()}`,
      manufacturing_date: "2026-08-01",
      expiry_date: "2027-08-01",
      lot_status: "available",
    },
  ],
};

const stockOutSample: InventoryAdjustmentPayload = {
  type: "data_correction",
  adjustment_date: new Date().toISOString().slice(0, 10),
  branch_id: 1,
  inventory_id: 1,
  reason_type: "correction",
  reason: "Postman controlled stock-out adjustment",
  lines: [
    {
      category: "food",
      item_id: 1,
      location: "R1",
      stock_uom_id: 1,
      stock_lot_id: 1,
      adjustment_quantity: 25,
      direction: "out",
    },
  ],
};

const rejectDraftSample: InventoryAdjustmentPayload = {
  type: "other",
  adjustment_date: new Date().toISOString().slice(0, 10),
  branch_id: 1,
  inventory_id: 1,
  reason_type: "demo_rejection",
  reason: "Postman rejection flow sample",
  lines: [
    {
      category: "food",
      item_id: 1,
      location: "R1",
      stock_uom_id: 1,
      adjustment_quantity: 1,
      direction: "in",
      new_identity: true,
      supplier_id: 1,
      supplier_batch_number: "PM-REJECT-BATCH",
      receipt_lot_number: `PM-REJECT-LOT-${Date.now()}`,
      manufacturing_date: "2026-08-01",
      expiry_date: "2027-08-01",
      lot_status: "available",
    },
  ],
};

const statusClass = (status?: string) => {
  if (status === "confirmed") return "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400";
  if (status === "submitted") return "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300";
  if (status === "rejected") return "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300";
  if (status === "reversed") return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
  return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
};

const formatValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

export default function InventoryPage() {
  const [tab, setTab] = useState<InventoryTab>("adjustments");
  const [selectedJson, setSelectedJson] = useState<unknown | null>(null);
  const [jsonAction, setJsonAction] = useState<JsonAction | null>(null);
  const [targetAdjustment, setTargetAdjustment] = useState<InventoryAdjustment | null>(null);
  const [jsonText, setJsonText] = useState("");

  const { data: adjustmentsData, isLoading: adjustmentsLoading } = useGetInventoryAdjustmentsQuery();
  const { data: balancesData, isLoading: balancesLoading } = useGetInventoryBalancesQuery({ per_page: 15 });
  const { data: ledgerData, isLoading: ledgerLoading } = useGetInventoryLedgerQuery({ per_page: 15 });
  const { data: confirmationsData, isLoading: confirmationsLoading } = useGetInventoryConfirmationsQuery({
    per_page: 15,
  });

  const [showAdjustment] = useLazyGetInventoryAdjustmentQuery();
  const [showConfirmation] = useLazyGetInventoryConfirmationQuery();
  const [createAdjustment, createState] = useCreateInventoryAdjustmentMutation();
  const [updateAdjustment, updateState] = useUpdateInventoryAdjustmentMutation();
  const [submitAdjustment, submitState] = useSubmitInventoryAdjustmentMutation();
  const [confirmAdjustment, confirmState] = useConfirmInventoryAdjustmentMutation();
  const [reverseAdjustment, reverseState] = useReverseInventoryAdjustmentMutation();
  const [rejectAdjustment, rejectState] = useRejectInventoryAdjustmentMutation();

  const adjustments = adjustmentsData?.data || [];
  const balances = balancesData?.data || [];
  const ledger = ledgerData?.data || [];
  const confirmations = confirmationsData?.data || [];

  const isMutating =
    createState.isLoading ||
    updateState.isLoading ||
    submitState.isLoading ||
    confirmState.isLoading ||
    reverseState.isLoading ||
    rejectState.isLoading;

  const tabs = useMemo(
    () => [
      { key: "adjustments" as const, label: "Adjustments", count: adjustments.length },
      { key: "balances" as const, label: "Balances", count: balances.length },
      { key: "ledger" as const, label: "Ledger", count: ledger.length },
      { key: "confirmations" as const, label: "Confirmations", count: confirmations.length },
    ],
    [adjustments.length, balances.length, confirmations.length, ledger.length]
  );

  const openJsonAction = (action: JsonAction, adjustment?: InventoryAdjustment, sample?: unknown) => {
    setJsonAction(action);
    setTargetAdjustment(adjustment || null);
    if (sample) {
      setJsonText(JSON.stringify(sample, null, 2));
    } else if (action === "update" && adjustment) {
      setJsonText(JSON.stringify(createAdjustmentSample, null, 2));
    } else {
      setJsonText(JSON.stringify({ reason: "" }, null, 2));
    }
  };

  const runJsonAction = async () => {
    if (!jsonAction) return;
    try {
      const parsed = JSON.parse(jsonText);
      let result: unknown;
      if (jsonAction === "create") result = await createAdjustment(parsed).unwrap();
      if (jsonAction === "update" && targetAdjustment) {
        result = await updateAdjustment({ id: targetAdjustment.id, body: parsed }).unwrap();
      }
      if (jsonAction === "reverse" && targetAdjustment) {
        result = await reverseAdjustment({ id: targetAdjustment.id, reason: parsed.reason }).unwrap();
      }
      if (jsonAction === "reject" && targetAdjustment) {
        result = await rejectAdjustment({ id: targetAdjustment.id, reason: parsed.reason }).unwrap();
      }
      setSelectedJson(result);
      setJsonAction(null);
      toast.success("Inventory API request saved successfully");
    } catch (error: unknown) {
      const err = error as { data?: { message?: string }; message?: string };
      toast.error(err?.data?.message || err?.message || "Inventory API request failed");
    }
  };

  const runSimpleAction = async (action: "submit" | "confirm", id: number) => {
    try {
      const result =
        action === "submit"
          ? await submitAdjustment(id).unwrap()
          : await confirmAdjustment(id).unwrap();
      setSelectedJson(result);
      toast.success(`Adjustment ${action === "submit" ? "submitted" : "confirmed"} successfully`);
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || "Inventory action failed");
    }
  };

  const showSavedResponse = async (type: "adjustment" | "confirmation", id: number | string, fallback: unknown) => {
    try {
      const result =
        type === "adjustment"
          ? await showAdjustment(id).unwrap()
          : await showConfirmation(id).unwrap();
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
            <ClipboardCheck className="text-[#15803d] dark:text-emerald-400" size={26} />
            <h1 className="text-2xl font-extrabold tracking-tight text-[#1E293B] dark:text-white">
              Inventory
            </h1>
          </div>
          <p className="mt-1 text-sm text-[#64748B] dark:text-gray-400">
            Adjustment workflow, saved balances, ledger entries, and confirmations from the Postman inventory collection.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => openJsonAction("create", undefined, createAdjustmentSample)}>
            Create Opening Balance
          </Button>
          <Button size="sm" variant="outline" onClick={() => openJsonAction("create", undefined, stockOutSample)}>
            Create Stock Out
          </Button>
          <Button size="sm" variant="outline" onClick={() => openJsonAction("create", undefined, rejectDraftSample)}>
            Create Reject Draft
          </Button>
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

      {tab === "adjustments" && (
        <DataPanel loading={adjustmentsLoading} empty="No inventory adjustments found.">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                {["No.", "Number", "Type", "Date", "Branch", "Inventory", "Status", "Lines", "Actions"].map((head) => (
                  <TableCell key={head} isHeader className="px-5 py-3 text-start text-xs font-medium text-gray-500">
                    {head}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {adjustments.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell className="px-5 py-3.5 text-sm text-gray-500">{index + 1}</TableCell>
                  <TableCell className="px-5 py-3.5 text-sm font-semibold text-gray-900 dark:text-white">{item.adjustment_number}</TableCell>
                  <TableCell className="px-5 py-3.5 text-sm text-gray-500">{item.type}</TableCell>
                  <TableCell className="px-5 py-3.5 text-sm text-gray-500">{item.adjustment_date}</TableCell>
                  <TableCell className="px-5 py-3.5 text-sm text-gray-500">#{item.branch_id}</TableCell>
                  <TableCell className="px-5 py-3.5 text-sm text-gray-500">#{item.inventory_id}</TableCell>
                  <TableCell className="px-5 py-3.5 text-sm">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass(item.status)}`}>{item.status}</span>
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-sm text-gray-500">{item.lines?.length || 0}</TableCell>
                  <TableCell className="px-5 py-3.5 text-sm">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <IconButton title="Show adjustment" onClick={() => showSavedResponse("adjustment", item.id, item)} icon={<Eye size={15} />} />
                      <IconButton title="Update with Postman payload" onClick={() => openJsonAction("update", item)} icon={<ClipboardCheck size={15} />} />
                      <IconButton title="Submit" onClick={() => runSimpleAction("submit", item.id)} icon={<Send size={15} />} />
                      <IconButton title="Confirm and post" onClick={() => runSimpleAction("confirm", item.id)} icon={<CheckCircle2 size={15} />} />
                      <IconButton title="Reverse" onClick={() => openJsonAction("reverse", item)} icon={<RotateCcw size={15} />} />
                      <IconButton title="Reject" onClick={() => openJsonAction("reject", item)} icon={<XCircle size={15} />} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataPanel>
      )}

      {tab === "balances" && (
        <SimpleObjectTable loading={balancesLoading} empty="No inventory balances found." rows={balances} preferredKeys={["category", "item_id", "inventory_id", "location", "quantity", "available_quantity", "stock_lot_id"]} onView={setSelectedJson} />
      )}

      {tab === "ledger" && (
        <SimpleObjectTable loading={ledgerLoading} empty="No inventory ledger entries found." rows={ledger} preferredKeys={["transaction_date", "transaction_type", "source_type", "source_id", "item_id", "quantity", "balance_after"]} onView={setSelectedJson} />
      )}

      {tab === "confirmations" && (
        <DataPanel loading={confirmationsLoading} empty="No inventory confirmations found.">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                {["No.", "Number", "Source", "Status", "Submitted", "Confirmed", "Rejected", "Actions"].map((head) => (
                  <TableCell key={head} isHeader className="px-5 py-3 text-start text-xs font-medium text-gray-500">
                    {head}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {confirmations.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell className="px-5 py-3.5 text-sm text-gray-500">{index + 1}</TableCell>
                  <TableCell className="px-5 py-3.5 text-sm font-semibold text-gray-900 dark:text-white">{item.confirmation_number}</TableCell>
                  <TableCell className="px-5 py-3.5 text-sm text-gray-500">{item.source_type} #{item.source_id}</TableCell>
                  <TableCell className="px-5 py-3.5 text-sm"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass(item.status)}`}>{item.status}</span></TableCell>
                  <TableCell className="px-5 py-3.5 text-sm text-gray-500">{item.submitted_at || "-"}</TableCell>
                  <TableCell className="px-5 py-3.5 text-sm text-gray-500">{item.confirmed_at || "-"}</TableCell>
                  <TableCell className="px-5 py-3.5 text-sm text-gray-500">{item.rejected_at || "-"}</TableCell>
                  <TableCell className="px-5 py-3.5 text-sm">
                    <IconButton title="Show confirmation" onClick={() => showSavedResponse("confirmation", item.id, item)} icon={<Eye size={15} />} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataPanel>
      )}

      <JsonModal
        title={jsonAction === "create" ? "Postman Create Payload" : jsonAction === "update" ? "Postman Update Payload" : "Reason Payload"}
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
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {loading ? (
        <div className="flex h-64 items-center justify-center"><Loading /></div>
      ) : React.Children.count(children) === 0 ? (
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
  const keys = preferredKeys;
  return (
    <DataPanel loading={loading} empty={empty}>
      {rows.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-gray-500">{empty}</div>
      ) : (
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 text-start text-xs font-medium text-gray-500">No.</TableCell>
              {keys.map((key) => (
                <TableCell key={key} isHeader className="px-5 py-3 text-start text-xs font-medium text-gray-500">{key}</TableCell>
              ))}
              <TableCell isHeader className="px-5 py-3 text-start text-xs font-medium text-gray-500">Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {rows.map((row, index) => (
              <TableRow key={String(row.id || index)}>
                <TableCell className="px-5 py-3.5 text-sm text-gray-500">{index + 1}</TableCell>
                {keys.map((key) => (
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
