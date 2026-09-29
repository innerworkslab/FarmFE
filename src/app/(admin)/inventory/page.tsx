"use client";

import React, { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
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
import TableActionButton from "@/components/ui/table/TableActionButton";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import DatePicker from "@/components/form/date-picker";
import Loading from "@/components/common/Loading";
import { formatReadableDate, formatReadableDateTime } from "@/lib/dateFormat";
import { useGetBranchesQuery } from "@/redux/features/setup/BranchApiSlice";
import { useGetInventoriesQuery } from "@/redux/features/setup/InventoryApiSlice";
import { useGetFoodsQuery } from "@/redux/features/setup/FoodApiSlice";
import { useGetMedicinesQuery } from "@/redux/features/setup/MedicineApiSlice";
import { useGetAnimalsQuery } from "@/redux/features/setup/AnimalApiSlice";
import { useGetEquipmentListQuery } from "@/redux/features/setup/EquipmentApiSlice";
import { useGetUomsQuery } from "@/redux/features/setup/UomApiSlice";
import { useGetSuppliersQuery } from "@/redux/features/setup/SupplierApiSlice";
import { toast } from "sonner";
import { CheckCircle2, ClipboardCheck, Eye, Plus, RotateCcw, Send, XCircle } from "lucide-react";

type InventoryTab = "adjustments" | "balances" | "ledger" | "confirmations";
type JsonAction = "create" | "update" | "reverse" | "reject";

type AdjustmentForm = {
  type: string;
  adjustment_date: string;
  branch_id: string;
  inventory_id: string;
  reason_type: string;
  reason: string;
  notes: string;
  category: string;
  item_id: string;
  location: string;
  stock_uom_id: string;
  stock_lot_id: string;
  adjustment_quantity: string;
  direction: string;
  new_identity: boolean;
  supplier_id: string;
  supplier_batch_number: string;
  receipt_lot_number: string;
  manufacturing_date: string;
  expiry_date: string;
  lot_status: string;
};

type SelectOption = { value: string; label: string };

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

const adjustmentFormFromPayload = (payload: InventoryAdjustmentPayload): AdjustmentForm => {
  const line = payload.lines[0];
  return {
    type: payload.type,
    adjustment_date: payload.adjustment_date,
    branch_id: String(payload.branch_id),
    inventory_id: String(payload.inventory_id),
    reason_type: payload.reason_type,
    reason: payload.reason,
    notes: payload.notes || "",
    category: line.category,
    item_id: String(line.item_id),
    location: line.location,
    stock_uom_id: String(line.stock_uom_id),
    stock_lot_id: line.stock_lot_id ? String(line.stock_lot_id) : "",
    adjustment_quantity: String(line.adjustment_quantity),
    direction: line.direction,
    new_identity: Boolean(line.new_identity),
    supplier_id: line.supplier_id ? String(line.supplier_id) : "",
    supplier_batch_number: line.supplier_batch_number || "",
    receipt_lot_number: line.receipt_lot_number || "",
    manufacturing_date: line.manufacturing_date || "",
    expiry_date: line.expiry_date || "",
    lot_status: line.lot_status || "available",
  };
};

const adjustmentFormFromRecord = (adjustment: InventoryAdjustment) =>
  adjustmentFormFromPayload({
    type: adjustment.type,
    adjustment_date: adjustment.adjustment_date,
    branch_id: adjustment.branch_id,
    inventory_id: adjustment.inventory_id,
    reason_type: adjustment.reason_type,
    reason: adjustment.reason,
    notes: adjustment.notes,
    lines: adjustment.lines?.length ? adjustment.lines : createAdjustmentSample.lines,
  });

const namedOption = (item: { id: number; code?: string; name?: string }): SelectOption => ({
  value: String(item.id),
  label: [item.code, item.name].filter(Boolean).join(" - ") || `#${item.id}`,
});

const ensureSelectedOption = (options: SelectOption[], value: string): SelectOption[] => {
  if (!value || options.some((option) => option.value === value)) return options;
  return [{ value, label: `#${value}` }, ...options];
};

const reasonOptionsByType: Record<string, SelectOption[]> = {
  opening_balance: [{ value: "opening_balance", label: "opening_balance" }],
  data_correction: [{ value: "correction", label: "correction" }],
  other: [
    { value: "demo_rejection", label: "demo_rejection" },
    { value: "other", label: "other" },
  ],
};

const toAdjustmentPayload = (form: AdjustmentForm): InventoryAdjustmentPayload => ({
  type: form.type,
  adjustment_date: form.adjustment_date,
  branch_id: Number(form.branch_id),
  inventory_id: Number(form.inventory_id),
  reason_type: form.reason_type,
  reason: form.reason,
  ...(form.notes ? { notes: form.notes } : {}),
  lines: [
    {
      category: form.category,
      item_id: Number(form.item_id),
      location: form.location,
      stock_uom_id: Number(form.stock_uom_id),
      adjustment_quantity: Number(form.adjustment_quantity),
      direction: form.direction,
      ...(form.direction === "out" && form.stock_lot_id
        ? { stock_lot_id: Number(form.stock_lot_id) }
        : {}),
      ...(form.direction === "in"
        ? {
            new_identity: form.new_identity,
            ...(form.supplier_id ? { supplier_id: Number(form.supplier_id) } : {}),
            ...(form.supplier_batch_number
              ? { supplier_batch_number: form.supplier_batch_number }
              : {}),
            ...(form.receipt_lot_number ? { receipt_lot_number: form.receipt_lot_number } : {}),
            ...(form.manufacturing_date ? { manufacturing_date: form.manufacturing_date } : {}),
            ...(form.expiry_date ? { expiry_date: form.expiry_date } : {}),
            ...(form.lot_status ? { lot_status: form.lot_status } : {}),
          }
        : {}),
    },
  ],
});

const statusClass = (status?: string) => {
  if (status === "confirmed")
    return "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400";
  if (status === "submitted")
    return "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300";
  if (status === "rejected") return "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300";
  if (status === "reversed")
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
  return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
};

const adjustmentActions = (item: InventoryAdjustment) => {
  const status = item.status;
  return {
    canUpdate: status === "draft" || status === "rejected",
    canSubmit: status === "draft" || status === "rejected",
    canConfirm: status === "submitted",
    canReject: status === "submitted",
    canReverse: status === "confirmed" && item.type !== "reversal",
  };
};

const formatValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

export default function InventoryPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab: InventoryTab =
    tabParam === "balances" || tabParam === "ledger" || tabParam === "confirmations"
      ? tabParam
      : "adjustments";
  const [tab, setTab] = useState<InventoryTab>(initialTab);
  const [selectedJson, setSelectedJson] = useState<unknown | null>(null);
  const [jsonAction, setJsonAction] = useState<JsonAction | null>(null);
  const [targetAdjustment, setTargetAdjustment] = useState<InventoryAdjustment | null>(null);
  const [form, setForm] = useState<AdjustmentForm>(() =>
    adjustmentFormFromPayload(createAdjustmentSample)
  );

  const { data: adjustmentsData, isLoading: adjustmentsLoading } =
    useGetInventoryAdjustmentsQuery();
  const { data: balancesData, isLoading: balancesLoading } = useGetInventoryBalancesQuery({
    per_page: 15,
  });
  const { data: ledgerData, isLoading: ledgerLoading } = useGetInventoryLedgerQuery({
    per_page: 15,
  });
  const { data: confirmationsData, isLoading: confirmationsLoading } =
    useGetInventoryConfirmationsQuery({
      per_page: 15,
    });
  const { data: branchesData } = useGetBranchesQuery({ per_page: 100 });
  const { data: inventoriesSetupData } = useGetInventoriesQuery({ per_page: 100 });
  const { data: foodsData } = useGetFoodsQuery({ per_page: 100 });
  const { data: medicinesData } = useGetMedicinesQuery({ per_page: 100 });
  const { data: animalsData } = useGetAnimalsQuery({ per_page: 100 });
  const { data: equipmentData } = useGetEquipmentListQuery({ per_page: 100 });
  const { data: uomsData } = useGetUomsQuery({ per_page: 100 });
  const { data: suppliersData } = useGetSuppliersQuery({ per_page: 100 });

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
  const branches = branchesData?.data || [];
  const setupInventories = inventoriesSetupData?.data || [];
  const itemOptionsByCategory = {
    food: foodsData?.data.map(namedOption) || [],
    medicine: medicinesData?.data.map(namedOption) || [],
    animal: animalsData?.data.map(namedOption) || [],
    equipment: equipmentData?.data.map(namedOption) || [],
  };

  const isMutating =
    createState.isLoading ||
    updateState.isLoading ||
    submitState.isLoading ||
    confirmState.isLoading ||
    reverseState.isLoading ||
    rejectState.isLoading;

  const pageMeta = {
    adjustments: {
      title: "Inventory Adjustments",
      description:
        "Create drafts, submit checker requests, confirm postings, reject submissions, and reverse confirmed adjustments.",
    },
    balances: {
      title: "Inventory Balances",
      description: "Review saved stock balances by item, inventory, location, and lot.",
    },
    ledger: {
      title: "Inventory Ledger",
      description: "Review posted inventory movements and balance-after history.",
    },
    confirmations: {
      title: "Inventory Confirmations",
      description: "Review pending, confirmed, and rejected inventory confirmation records.",
    },
  }[tab];

  React.useEffect(() => {
    if (
      tabParam === "adjustments" ||
      tabParam === "balances" ||
      tabParam === "ledger" ||
      tabParam === "confirmations"
    ) {
      setTab(tabParam);
    }
  }, [tabParam]);

  const openFormAction = (
    action: JsonAction,
    adjustment?: InventoryAdjustment,
    sample?: InventoryAdjustmentPayload
  ) => {
    setJsonAction(action);
    setTargetAdjustment(adjustment || null);
    if (sample) setForm(adjustmentFormFromPayload(sample));
    else if (action === "update" && adjustment) setForm(adjustmentFormFromRecord(adjustment));
    else setForm((current) => ({ ...current, reason: "" }));
  };

  const runFormAction = async () => {
    if (!jsonAction) return;
    try {
      if (jsonAction === "create") await createAdjustment(toAdjustmentPayload(form)).unwrap();
      if (jsonAction === "update" && targetAdjustment) {
        await updateAdjustment({
          id: targetAdjustment.id,
          body: toAdjustmentPayload(form),
        }).unwrap();
      }
      if (jsonAction === "reverse" && targetAdjustment) {
        await reverseAdjustment({ id: targetAdjustment.id, reason: form.reason }).unwrap();
      }
      if (jsonAction === "reject" && targetAdjustment) {
        await rejectAdjustment({ id: targetAdjustment.id, reason: form.reason }).unwrap();
      }
      setJsonAction(null);
      toast.success("Inventory API request saved successfully");
    } catch (error: unknown) {
      const err = error as { data?: { message?: string }; message?: string };
      toast.error(err?.data?.message || err?.message || "Inventory API request failed");
    }
  };

  const runSimpleAction = async (action: "submit" | "confirm", id: number) => {
    try {
      if (action === "submit") await submitAdjustment(id).unwrap();
      else await confirmAdjustment(id).unwrap();
      toast.success(`Adjustment ${action === "submit" ? "submitted" : "confirmed"} successfully`);
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || "Inventory action failed");
    }
  };

  const showSavedResponse = async (
    type: "adjustment" | "confirmation",
    id: number | string,
    fallback: unknown
  ) => {
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

  const branchMap = useMemo(
    () => new Map((branchesData?.data || []).map((b) => [b.id, b.name])),
    [branchesData]
  );
  const inventoryMap = useMemo(
    () => new Map((inventoriesSetupData?.data || []).map((i) => [i.id, i.name])),
    [inventoriesSetupData]
  );

  const getItemLabel = (category?: string, itemId?: number | string) => {
    if (!itemId) return "-";
    const id = Number(itemId);
    if (category === "food") {
      const food = foodsData?.data.find((f) => f.id === id);
      return food ? `${food.name} (${food.code})` : `Food #${id}`;
    }
    if (category === "medicine") {
      const med = medicinesData?.data.find((m) => m.id === id);
      return med ? `${med.name} (${med.code})` : `Medicine #${id}`;
    }
    if (category === "animal") {
      const animal = animalsData?.data.find((a) => a.id === id);
      return animal ? `${animal.name} (${animal.code})` : `Animal #${id}`;
    }
    if (category === "equipment") {
      const eq = equipmentData?.data.find((e) => e.id === id);
      return eq ? `${eq.name} (${eq.code})` : `Equipment #${id}`;
    }
    const food = foodsData?.data.find((f) => f.id === id);
    if (food) return `${food.name} (${food.code})`;
    const med = medicinesData?.data.find((m) => m.id === id);
    if (med) return `${med.name} (${med.code})`;
    return `Item #${id}`;
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="text-[#15803d] dark:text-emerald-400" size={26} />
            <h1 className="text-2xl font-extrabold tracking-tight text-[#1E293B] dark:text-white">
              {pageMeta.title}
            </h1>
          </div>
          <p className="mt-1 text-sm text-[#64748B] dark:text-gray-400">{pageMeta.description}</p>
        </div>
        {tab === "adjustments" && (
          <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-3">
            <Button
              size="sm"
              className="justify-center gap-2 whitespace-nowrap"
              onClick={() => openFormAction("create", undefined, createAdjustmentSample)}
            >
              <Plus size={15} />
              Opening Balance
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="justify-center gap-2 whitespace-nowrap"
              onClick={() => openFormAction("create", undefined, stockOutSample)}
            >
              <Send size={15} />
              Stock Out
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="justify-center gap-2 whitespace-nowrap"
              onClick={() => openFormAction("create", undefined, rejectDraftSample)}
            >
              <XCircle size={15} />
              Reject Draft
            </Button>
          </div>
        )}
      </div>

      {tab === "adjustments" && (
        <DataPanel loading={adjustmentsLoading} empty="No inventory adjustments found.">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                {[
                  "No.",
                  "Number",
                  "Type",
                  "Date",
                  "Branch",
                  "Warehouse",
                  "Status",
                  "Lines",
                  "Actions",
                ].map((head) => (
                  <TableCell
                    key={head}
                    isHeader
                    className="px-5 py-3 text-start text-xs font-medium text-gray-500"
                  >
                    {head}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {adjustments.map((item, index) => (
                <AdjustmentRow
                  key={item.id}
                  item={item}
                  index={index}
                  branchName={branchMap.get(item.branch_id) || `Branch #${item.branch_id}`}
                  inventoryName={
                    inventoryMap.get(item.inventory_id) || `Warehouse #${item.inventory_id}`
                  }
                  onShow={() => showSavedResponse("adjustment", item.id, item)}
                  onUpdate={() => openFormAction("update", item)}
                  onSubmit={() => runSimpleAction("submit", item.id)}
                  onConfirm={() => runSimpleAction("confirm", item.id)}
                  onReverse={() => openFormAction("reverse", item)}
                  onReject={() => openFormAction("reject", item)}
                />
              ))}
            </TableBody>
          </Table>
        </DataPanel>
      )}

      {tab === "balances" && (
        <DataPanel loading={balancesLoading} empty="No inventory balances found.">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                {[
                  "No.",
                  "Item",
                  "Category",
                  "Warehouse",
                  "Location",
                  "Quantity",
                  "Available",
                  "Lot / Batch",
                  "Actions",
                ].map((head) => (
                  <TableCell
                    key={head}
                    isHeader
                    className="px-5 py-3 text-start text-xs font-medium text-gray-500"
                  >
                    {head}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {balances.map((item: Record<string, unknown>, index) => (
                <TableRow key={String(item.id || index)}>
                  <TableCell className="px-5 py-3.5 text-sm text-gray-500">{index + 1}</TableCell>
                  <TableCell className="px-5 py-3.5 text-sm font-semibold text-gray-900 dark:text-white">
                    {getItemLabel(String(item.category || ""), item.item_id as number)}
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-sm">
                    <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      {formatValue(item.category)}
                    </span>
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-300">
                    {inventoryMap.get(Number(item.inventory_id)) ||
                      `Warehouse #${item.inventory_id}`}
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-sm text-gray-500">
                    {formatValue(item.location)}
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-sm font-semibold text-gray-900 dark:text-white">
                    {formatValue(item.quantity)}
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatValue(item.available_quantity ?? item.quantity)}
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-sm text-gray-500">
                    {item.stock_lot_id ? `Lot #${item.stock_lot_id}` : "-"}
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-sm">
                    <TableActionButton
                      label="View"
                      tone="neutral"
                      onClick={() => setSelectedJson(item)}
                      icon={<Eye size={14} />}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataPanel>
      )}

      {tab === "ledger" && (
        <DataPanel loading={ledgerLoading} empty="No inventory ledger entries found.">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                {[
                  "No.",
                  "Date",
                  "Type",
                  "Source",
                  "Item",
                  "Quantity",
                  "Balance After",
                  "Actions",
                ].map((head) => (
                  <TableCell
                    key={head}
                    isHeader
                    className="px-5 py-3 text-start text-xs font-medium text-gray-500"
                  >
                    {head}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {ledger.map((item: Record<string, unknown>, index) => (
                <TableRow key={String(item.id || index)}>
                  <TableCell className="px-5 py-3.5 text-sm text-gray-500">{index + 1}</TableCell>
                  <TableCell className="px-5 py-3.5 text-sm text-gray-500">
                    {item.transaction_date
                      ? formatReadableDate(String(item.transaction_date))
                      : formatReadableDateTime(item.created_at ? String(item.created_at) : null)}
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-sm">
                    <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                      {formatValue(item.transaction_type)}
                    </span>
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-sm text-gray-500">
                    {String(item.source_type || "").replace(/_/g, " ")} #
                    {formatValue(item.source_id)}
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-sm font-semibold text-gray-900 dark:text-white">
                    {getItemLabel(String(item.category || ""), item.item_id as number)}
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-sm font-semibold">
                    <span
                      className={
                        Number(item.quantity) >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      }
                    >
                      {Number(item.quantity) > 0 ? `+${item.quantity}` : formatValue(item.quantity)}
                    </span>
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-sm font-semibold text-gray-900 dark:text-white">
                    {formatValue(item.balance_after)}
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-sm">
                    <TableActionButton
                      label="View"
                      tone="neutral"
                      onClick={() => setSelectedJson(item)}
                      icon={<Eye size={14} />}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataPanel>
      )}

      {tab === "confirmations" && (
        <DataPanel loading={confirmationsLoading} empty="No inventory confirmations found.">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                {[
                  "No.",
                  "Number",
                  "Source",
                  "Status",
                  "Submitted",
                  "Confirmed",
                  "Rejected",
                  "Actions",
                ].map((head) => (
                  <TableCell
                    key={head}
                    isHeader
                    className="px-5 py-3 text-start text-xs font-medium text-gray-500"
                  >
                    {head}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {confirmations.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell className="px-5 py-3.5 text-sm text-gray-500">{index + 1}</TableCell>
                  <TableCell className="px-5 py-3.5 text-sm font-semibold text-gray-900 dark:text-white">
                    {item.confirmation_number}
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-sm text-gray-500">
                    {item.source_type?.replace(/_/g, " ")} #{item.source_id}
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-sm">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass(item.status)}`}
                    >
                      {item.status}
                    </span>
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-sm text-gray-500">
                    {formatReadableDateTime(item.submitted_at)}
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-sm text-gray-500">
                    {formatReadableDateTime(item.confirmed_at)}
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-sm text-gray-500">
                    {formatReadableDateTime(item.rejected_at)}
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-sm">
                    <TableActionButton
                      label="View"
                      tone="neutral"
                      onClick={() => showSavedResponse("confirmation", item.id, item)}
                      icon={<Eye size={14} />}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataPanel>
      )}

      <InventoryActionModal
        action={jsonAction}
        isOpen={!!jsonAction}
        form={form}
        branchOptions={branches.map(namedOption)}
        inventoryOptions={setupInventories.map((item) => ({
          value: String(item.id),
          label: `${item.code} - ${item.name} (${item.type})`,
        }))}
        itemOptions={
          itemOptionsByCategory[form.category as keyof typeof itemOptionsByCategory] || []
        }
        uomOptions={
          uomsData?.data.map((item) => ({
            value: String(item.id),
            label: `${item.code} - ${item.name} (${item.symbol})`,
          })) || []
        }
        supplierOptions={suppliersData?.data.map(namedOption) || []}
        isSaving={isMutating}
        onChange={setForm}
        onClose={() => setJsonAction(null)}
        onSubmit={runFormAction}
      />

      <ResponseModal data={selectedJson} onClose={() => setSelectedJson(null)} />
    </div>
  );
}

function AdjustmentRow({
  item,
  index,
  branchName,
  inventoryName,
  onShow,
  onUpdate,
  onSubmit,
  onConfirm,
  onReverse,
  onReject,
}: {
  item: InventoryAdjustment;
  index: number;
  branchName: string;
  inventoryName: string;
  onShow: () => void;
  onUpdate: () => void;
  onSubmit: () => void;
  onConfirm: () => void;
  onReverse: () => void;
  onReject: () => void;
}) {
  const actions = adjustmentActions(item);

  return (
    <TableRow>
      <TableCell className="px-5 py-3.5 text-sm text-gray-500">{index + 1}</TableCell>
      <TableCell className="px-5 py-3.5 text-sm font-semibold text-gray-900 dark:text-white">
        {item.adjustment_number}
      </TableCell>
      <TableCell className="px-5 py-3.5 text-sm text-gray-500">{item.type}</TableCell>
      <TableCell className="px-5 py-3.5 text-sm text-gray-500">
        {formatReadableDate(item.adjustment_date)}
      </TableCell>
      <TableCell className="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-300 font-medium">
        {branchName}
      </TableCell>
      <TableCell className="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-300 font-medium">
        {inventoryName}
      </TableCell>
      <TableCell className="px-5 py-3.5 text-sm">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass(item.status)}`}
        >
          {item.status}
        </span>
      </TableCell>
      <TableCell className="px-5 py-3.5 text-sm text-gray-500">{item.lines?.length || 0}</TableCell>
      <TableCell className="px-5 py-3.5 text-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          <TableActionButton
            label="View"
            tone="neutral"
            onClick={onShow}
            icon={<Eye size={14} />}
          />
          {actions.canUpdate && (
            <TableActionButton
              label="Update"
              tone="neutral"
              onClick={onUpdate}
              icon={<ClipboardCheck size={14} />}
            />
          )}
          {actions.canSubmit && (
            <TableActionButton
              label="Submit"
              tone="blue"
              onClick={onSubmit}
              icon={<Send size={14} />}
            />
          )}
          {actions.canConfirm && (
            <TableActionButton
              label="Confirm"
              tone="green"
              onClick={onConfirm}
              icon={<CheckCircle2 size={14} />}
            />
          )}
          {actions.canReverse && (
            <TableActionButton
              label="Reverse"
              tone="amber"
              onClick={onReverse}
              icon={<RotateCcw size={14} />}
            />
          )}
          {actions.canReject && (
            <TableActionButton
              label="Reject"
              tone="red"
              onClick={onReject}
              icon={<XCircle size={14} />}
            />
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

function DataPanel({
  loading,
  empty,
  children,
}: {
  loading: boolean;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loading />
        </div>
      ) : React.Children.count(children) === 0 ? (
        <div className="flex h-64 items-center justify-center text-gray-500">{empty}</div>
      ) : (
        <div className="max-w-full overflow-x-auto">{children}</div>
      )}
    </div>
  );
}

function InventoryActionModal({
  action,
  isOpen,
  form,
  branchOptions,
  inventoryOptions,
  itemOptions,
  uomOptions,
  supplierOptions,
  isSaving,
  onChange,
  onClose,
  onSubmit,
}: {
  action: JsonAction | null;
  isOpen: boolean;
  form: AdjustmentForm;
  branchOptions: SelectOption[];
  inventoryOptions: SelectOption[];
  itemOptions: SelectOption[];
  uomOptions: SelectOption[];
  supplierOptions: SelectOption[];
  isSaving: boolean;
  onChange: React.Dispatch<React.SetStateAction<AdjustmentForm>>;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const setField = (key: keyof AdjustmentForm, value: string | boolean) =>
    onChange((current) => ({ ...current, [key]: value }));
  const setAdjustmentType = (value: string) =>
    onChange((current) => ({
      ...current,
      type: value,
      reason_type: reasonOptionsByType[value]?.[0]?.value || current.reason_type,
    }));
  const setCategory = (value: string) =>
    onChange((current) => ({ ...current, category: value, item_id: "" }));
  const isReasonOnly = action === "reverse" || action === "reject";
  const title =
    action === "create"
      ? "Create Inventory Adjustment"
      : action === "update"
        ? "Update Inventory Adjustment"
        : action === "reverse"
          ? "Reverse Adjustment"
          : "Reject Adjustment";
  const reasonOptions = reasonOptionsByType[form.type] || [
    { value: form.reason_type, label: form.reason_type },
  ];
  const hasRequiredPayloadFields = Boolean(
    form.type &&
      form.adjustment_date &&
      form.branch_id &&
      form.inventory_id &&
      form.reason_type &&
      form.reason.trim() &&
      form.category &&
      form.item_id &&
      form.location &&
      form.stock_uom_id &&
      form.adjustment_quantity &&
      form.direction
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="m-4 max-w-4xl">
      <div className="space-y-4 p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
        <p className="text-sm text-gray-500">
          These fields produce the required Postman request payload.
        </p>
        {isReasonOnly ? (
          <FormField label="Reason" required>
            <Input
              value={form.reason}
              onChange={(event) => setField("reason", event.target.value)}
              placeholder="Enter reason"
            />
          </FormField>
        ) : (
          <div className="max-h-[60vh] space-y-5 overflow-y-auto pr-2">
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Adjustment Type" required>
                <Select
                  value={form.type}
                  onChange={(event) => setAdjustmentType(event.target.value)}
                  options={[
                    { value: "opening_balance", label: "opening_balance" },
                    { value: "data_correction", label: "data_correction" },
                    { value: "other", label: "other" },
                  ]}
                />
              </FormField>
              <FormField label="Adjustment Date" required>
                <DatePicker
                  id="inventory-adjustment-date"
                  defaultDate={form.adjustment_date || undefined}
                  placeholder="Select adjustment date"
                  onChange={(_, dateStr) => setField("adjustment_date", dateStr)}
                />
              </FormField>
              <FormField label="Branch" required>
                <Select
                  value={form.branch_id}
                  onChange={(event) => setField("branch_id", event.target.value)}
                  placeholder="Select branch"
                  options={ensureSelectedOption(branchOptions, form.branch_id)}
                />
              </FormField>
              <FormField label="Inventory" required>
                <Select
                  value={form.inventory_id}
                  onChange={(event) => setField("inventory_id", event.target.value)}
                  placeholder="Select inventory"
                  options={ensureSelectedOption(inventoryOptions, form.inventory_id)}
                />
              </FormField>
              <FormField label="Reason Type" required>
                <Select
                  value={form.reason_type}
                  onChange={(event) => setField("reason_type", event.target.value)}
                  options={reasonOptions}
                />
              </FormField>
              <FormField label="Reason" required>
                <Input
                  value={form.reason}
                  onChange={(event) => setField("reason", event.target.value)}
                />
              </FormField>
              <FormField label="Notes">
                <Input
                  value={form.notes}
                  onChange={(event) => setField("notes", event.target.value)}
                />
              </FormField>
            </section>
            <section className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <h3 className="mb-4 text-sm font-bold text-gray-800 dark:text-white">
                Adjustment Line
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Category" required>
                  <Select
                    value={form.category}
                    onChange={(event) => setCategory(event.target.value)}
                    options={[
                      { value: "food", label: "food" },
                      { value: "medicine", label: "medicine" },
                      { value: "animal", label: "animal" },
                      { value: "equipment", label: "equipment" },
                    ]}
                  />
                </FormField>
                <FormField label="Item" required>
                  <Select
                    value={form.item_id}
                    onChange={(event) => setField("item_id", event.target.value)}
                    placeholder="Select item"
                    options={ensureSelectedOption(itemOptions, form.item_id)}
                  />
                </FormField>
                <FormField label="Location" required>
                  <Input
                    value={form.location}
                    onChange={(event) => setField("location", event.target.value)}
                  />
                </FormField>
                <FormField label="Stock UOM" required>
                  <Select
                    value={form.stock_uom_id}
                    onChange={(event) => setField("stock_uom_id", event.target.value)}
                    placeholder="Select stock UOM"
                    options={ensureSelectedOption(uomOptions, form.stock_uom_id)}
                  />
                </FormField>
                <FormField label="Quantity" required>
                  <Input
                    type="number"
                    step="any"
                    value={form.adjustment_quantity}
                    onChange={(event) => setField("adjustment_quantity", event.target.value)}
                  />
                </FormField>
                <FormField label="Direction" required>
                  <Select
                    value={form.direction}
                    onChange={(event) => setField("direction", event.target.value)}
                    options={[
                      { value: "in", label: "in" },
                      { value: "out", label: "out" },
                    ]}
                  />
                </FormField>
                {form.direction === "out" && (
                  <FormField label="Stock Lot ID">
                    <Input
                      type="number"
                      min="1"
                      value={form.stock_lot_id}
                      onChange={(event) => setField("stock_lot_id", event.target.value)}
                    />
                  </FormField>
                )}
              </div>
              {form.direction === "in" && (
                <div className="mt-4 grid grid-cols-1 gap-4 border-t border-gray-100 pt-4 sm:grid-cols-2 dark:border-gray-800">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={form.new_identity}
                      onChange={(event) => setField("new_identity", event.target.checked)}
                    />{" "}
                    New identity
                  </label>
                  <FormField label="Supplier">
                    <Select
                      value={form.supplier_id}
                      onChange={(event) => setField("supplier_id", event.target.value)}
                      placeholder="Select supplier"
                      options={ensureSelectedOption(supplierOptions, form.supplier_id)}
                    />
                  </FormField>
                  <FormField label="Supplier Batch Number">
                    <Input
                      value={form.supplier_batch_number}
                      onChange={(event) => setField("supplier_batch_number", event.target.value)}
                    />
                  </FormField>
                  <FormField label="Receipt Lot Number">
                    <Input
                      value={form.receipt_lot_number}
                      onChange={(event) => setField("receipt_lot_number", event.target.value)}
                    />
                  </FormField>
                  <FormField label="Manufacturing Date">
                    <DatePicker
                      id="inventory-manufacturing-date"
                      defaultDate={form.manufacturing_date || undefined}
                      placeholder="Select manufacturing date"
                      onChange={(_, dateStr) => setField("manufacturing_date", dateStr)}
                    />
                  </FormField>
                  <FormField label="Expiry Date">
                    <DatePicker
                      id="inventory-expiry-date"
                      defaultDate={form.expiry_date || undefined}
                      placeholder="Select expiry date"
                      onChange={(_, dateStr) => setField("expiry_date", dateStr)}
                    />
                  </FormField>
                  <FormField label="Lot Status">
                    <Select
                      value={form.lot_status}
                      onChange={(event) => setField("lot_status", event.target.value)}
                      options={[
                        { value: "available", label: "available" },
                        { value: "quarantine", label: "quarantine" },
                        { value: "blocked", label: "blocked" },
                      ]}
                    />
                  </FormField>
                </div>
              )}
            </section>
          </div>
        )}
        <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
          <Button type="button" size="sm" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isSaving || (isReasonOnly ? !form.reason.trim() : !hasRequiredPayloadFields)}
            onClick={onSubmit}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
      <span className="mb-1.5 block">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

const responseRecord = (data: unknown): Record<string, unknown> | null => {
  if (!data || typeof data !== "object") return null;
  const wrapper = data as { data?: unknown };
  const value = wrapper.data && typeof wrapper.data === "object" ? wrapper.data : data;
  return value as Record<string, unknown>;
};

function ResponseModal({ data, onClose }: { data: unknown | null; onClose: () => void }) {
  const record = responseRecord(data);
  const fieldEntries = Object.entries(record || {}).filter(
    ([, value]) => !Array.isArray(value) && (value === null || typeof value !== "object")
  );
  const lines = Array.isArray(record?.lines) ? (record.lines as Record<string, unknown>[]) : [];
  const lineKeys = [
    "line_number",
    "category",
    "item_id",
    "location",
    "stock_uom_id",
    "adjustment_quantity",
    "direction",
    "lot_status",
  ];

  return (
    <Modal isOpen={!!data} onClose={onClose} className="m-4 max-w-5xl">
      <div className="space-y-4 p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Saved API Response</h2>
        {!record ? (
          <p className="text-sm text-gray-500">No response data found.</p>
        ) : (
          <div className="max-h-[70vh] space-y-5 overflow-y-auto pr-2">
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {fieldEntries.map(([key, value]) => (
                <FormField key={key} label={key}>
                  <Input value={formatValue(value)} disabled />
                </FormField>
              ))}
            </section>

            {lines.length > 0 && (
              <section className="rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="border-b border-gray-100 px-4 py-3 text-sm font-bold text-gray-800 dark:border-gray-800 dark:text-white">
                  Lines
                </div>
                <div className="max-w-full overflow-x-auto">
                  <Table>
                    <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                      <TableRow>
                        {lineKeys.map((key) => (
                          <TableCell
                            key={key}
                            isHeader
                            className="px-4 py-3 text-start text-xs font-medium text-gray-500"
                          >
                            {key}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                      {lines.map((line, index) => (
                        <TableRow key={String(line.id || index)}>
                          {lineKeys.map((key) => (
                            <TableCell key={key} className="px-4 py-3 text-sm text-gray-500">
                              {formatValue(line[key])}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
