"use client";

import React, { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
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
import {
  useGetInventoryBalancesQuery,
  useGetInventoryLedgerQuery,
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
import { useGetUomsQuery } from "@/redux/features/setup/UomApiSlice";
import { useGetSuppliersQuery } from "@/redux/features/setup/SupplierApiSlice";
import { toast } from "sonner";
import {
  CheckCircle2,
  ClipboardCheck,
  Database,
  Eye,
  Plus,
  ReceiptText,
  ScrollText,
  XCircle,
} from "lucide-react";

type PurchasingTab = "invoices" | "receipts" | "balances" | "ledger";
type JsonAction = "createInvoice" | "updateInvoice" | "cancelInvoice" | "createReceipt";

type InvoiceForm = {
  invoice_number: string;
  invoice_date: string;
  supplier_id: string;
  branch_id: string;
  notes: string;
  category: string;
  item_id: string;
  purchase_uom_id: string;
  stock_uom_id: string;
  conversion_factor: string;
  quantity: string;
  unit_price: string;
  discount_type: string;
  discount_value: string;
  foc_type: string;
  foc_value: string;
  tax_rate: string;
  target_inventory_id: string;
  target_location: string;
};

type ReceiptForm = {
  receipt_number: string;
  purchase_invoice_id: string;
  receipt_date: string;
  idempotency_key: string;
  notes: string;
  purchase_invoice_line_id: string;
  accepted_quantity: string;
  accepted_foc_quantity: string;
  rejected_quantity: string;
  target_inventory_id: string;
  target_location: string;
  supplier_batch_number: string;
  receipt_lot_number: string;
  manufacturing_date: string;
  expiry_date: string;
  cold_chain_required: boolean;
  cold_chain_status: string;
  observed_temperature: string;
  temperature_uom: string;
  exception_reason: string;
};

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

const invoiceFormFromPayload = (payload: PurchaseInvoicePayload): InvoiceForm => {
  const line = payload.lines[0];
  return {
    invoice_number: payload.invoice_number || "",
    invoice_date: payload.invoice_date,
    supplier_id: String(payload.supplier_id),
    branch_id: String(payload.branch_id),
    notes: payload.notes || "",
    category: line.category,
    item_id: String(line.item_id),
    purchase_uom_id: String(line.purchase_uom_id),
    stock_uom_id: String(line.stock_uom_id),
    conversion_factor: String(line.conversion_factor),
    quantity: String(line.quantity),
    unit_price: String(line.unit_price),
    discount_type: line.discount_type || "",
    discount_value: line.discount_value !== undefined ? String(line.discount_value) : "",
    foc_type: line.foc_type || "",
    foc_value: line.foc_value !== undefined ? String(line.foc_value) : "",
    tax_rate: line.tax_rate !== undefined ? String(line.tax_rate) : "",
    target_inventory_id: line.target_inventory_id ? String(line.target_inventory_id) : "",
    target_location: line.target_location || "",
  };
};

const invoiceFormFromRecord = (invoice: PurchaseInvoice): InvoiceForm =>
  invoiceFormFromPayload({
    invoice_number: invoice.invoice_number,
    invoice_date: invoice.invoice_date,
    supplier_id: invoice.supplier_id,
    branch_id: invoice.branch_id,
    notes: invoice.notes,
    lines: invoice.lines?.length ? invoice.lines : foodInvoiceSample.lines,
  });

const toInvoicePayload = (
  form: InvoiceForm,
  includeInvoiceNumber: boolean
): PurchaseInvoicePayload => ({
  ...(includeInvoiceNumber && form.invoice_number ? { invoice_number: form.invoice_number } : {}),
  invoice_date: form.invoice_date,
  supplier_id: Number(form.supplier_id),
  branch_id: Number(form.branch_id),
  ...(form.notes ? { notes: form.notes } : {}),
  lines: [
    {
      category: form.category,
      item_id: Number(form.item_id),
      purchase_uom_id: Number(form.purchase_uom_id),
      stock_uom_id: Number(form.stock_uom_id),
      conversion_factor: Number(form.conversion_factor),
      quantity: Number(form.quantity),
      unit_price: Number(form.unit_price),
      ...(form.discount_type ? { discount_type: form.discount_type } : {}),
      ...(form.discount_value ? { discount_value: Number(form.discount_value) } : {}),
      ...(form.foc_type ? { foc_type: form.foc_type } : {}),
      ...(form.foc_value ? { foc_value: Number(form.foc_value) } : {}),
      ...(form.tax_rate ? { tax_rate: Number(form.tax_rate) } : {}),
      ...(form.target_inventory_id
        ? { target_inventory_id: Number(form.target_inventory_id) }
        : {}),
      ...(form.target_location ? { target_location: form.target_location } : {}),
    },
  ],
});

const receiptFormFromPayload = (payload: PurchaseReceiptPayload): ReceiptForm => {
  const line = payload.lines[0];
  return {
    receipt_number: payload.receipt_number || "",
    purchase_invoice_id: String(payload.purchase_invoice_id),
    receipt_date: payload.receipt_date,
    idempotency_key: payload.idempotency_key,
    notes: payload.notes || "",
    purchase_invoice_line_id: String(line.purchase_invoice_line_id),
    accepted_quantity: String(line.accepted_quantity),
    accepted_foc_quantity:
      line.accepted_foc_quantity !== undefined ? String(line.accepted_foc_quantity) : "",
    rejected_quantity: line.rejected_quantity !== undefined ? String(line.rejected_quantity) : "",
    target_inventory_id: String(line.target_inventory_id),
    target_location: line.target_location,
    supplier_batch_number: line.supplier_batch_number || "",
    receipt_lot_number: line.receipt_lot_number || "",
    manufacturing_date: line.manufacturing_date || "",
    expiry_date: line.expiry_date || "",
    cold_chain_required: Boolean(line.cold_chain_required),
    cold_chain_status: line.cold_chain_status || "",
    observed_temperature:
      line.observed_temperature !== undefined ? String(line.observed_temperature) : "",
    temperature_uom: line.temperature_uom || "",
    exception_reason: line.exception_reason || "",
  };
};

const toReceiptPayload = (form: ReceiptForm): PurchaseReceiptPayload => ({
  ...(form.receipt_number ? { receipt_number: form.receipt_number } : {}),
  purchase_invoice_id: Number(form.purchase_invoice_id),
  receipt_date: form.receipt_date,
  idempotency_key: form.idempotency_key,
  ...(form.notes ? { notes: form.notes } : {}),
  lines: [
    {
      purchase_invoice_line_id: Number(form.purchase_invoice_line_id),
      accepted_quantity: Number(form.accepted_quantity),
      ...(form.accepted_foc_quantity
        ? { accepted_foc_quantity: Number(form.accepted_foc_quantity) }
        : {}),
      ...(form.rejected_quantity ? { rejected_quantity: Number(form.rejected_quantity) } : {}),
      target_inventory_id: Number(form.target_inventory_id),
      target_location: form.target_location,
      ...(form.supplier_batch_number ? { supplier_batch_number: form.supplier_batch_number } : {}),
      ...(form.receipt_lot_number ? { receipt_lot_number: form.receipt_lot_number } : {}),
      ...(form.manufacturing_date ? { manufacturing_date: form.manufacturing_date } : {}),
      ...(form.expiry_date ? { expiry_date: form.expiry_date } : {}),
      ...(form.cold_chain_required ? { cold_chain_required: true } : {}),
      ...(form.cold_chain_status ? { cold_chain_status: form.cold_chain_status } : {}),
      ...(form.observed_temperature
        ? { observed_temperature: Number(form.observed_temperature) }
        : {}),
      ...(form.temperature_uom ? { temperature_uom: form.temperature_uom } : {}),
      ...(form.exception_reason ? { exception_reason: form.exception_reason } : {}),
    },
  ],
});

const formatValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const statusClass = (status?: string) => {
  if (status === "confirmed" || status === "received")
    return "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400";
  if (status === "cancelled") return "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300";
  return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
};

const canEditInvoice = (status?: string) => !status || ["open", "draft"].includes(status);
const canCancelInvoice = (status?: string) => !status || ["open", "draft"].includes(status);
const canConfirmReceipt = (status?: string) => !status || ["draft", "open"].includes(status);

export default function PurchasingPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab: PurchasingTab =
    tabParam === "receipts" || tabParam === "balances" || tabParam === "ledger"
      ? tabParam
      : "invoices";
  const [tab, setTab] = useState<PurchasingTab>(initialTab);
  const [selectedJson, setSelectedJson] = useState<unknown | null>(null);
  const [jsonAction, setJsonAction] = useState<JsonAction | null>(null);
  const [targetInvoice, setTargetInvoice] = useState<PurchaseInvoice | null>(null);
  const [invoiceForm, setInvoiceForm] = useState<InvoiceForm>(() =>
    invoiceFormFromPayload(foodInvoiceSample)
  );
  const [receiptForm, setReceiptForm] = useState<ReceiptForm>(() =>
    receiptFormFromPayload(receiptSample)
  );
  const [cancelReason, setCancelReason] = useState("Supplier cancelled before any receipt.");

  const { data: branchesData } = useGetBranchesQuery({ per_page: 100 });
  const { data: inventoriesSetupData } = useGetInventoriesQuery({ per_page: 100 });
  const { data: foodsData } = useGetFoodsQuery({ per_page: 100 });
  const { data: medicinesData } = useGetMedicinesQuery({ per_page: 100 });
  const { data: uomsData } = useGetUomsQuery({ per_page: 100 });
  const { data: suppliersData } = useGetSuppliersQuery({ per_page: 100 });

  const { data: invoicesData, isLoading: invoicesLoading } = useGetPurchaseInvoicesQuery({
    per_page: 15,
  });
  const { data: receiptsData, isLoading: receiptsLoading } = useGetPurchaseReceiptsQuery({
    per_page: 15,
  });
  const { data: balancesData, isLoading: balancesLoading } = useGetInventoryBalancesQuery({
    per_page: 15,
  });
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
  const branches = branchesData?.data || [];
  const setupInventories = inventoriesSetupData?.data || [];
  const suppliers = suppliersData?.data || [];
  const foods = foodsData?.data || [];
  const medicines = medicinesData?.data || [];
  const uoms = uomsData?.data || [];

  const branchMap = useMemo(
    () => new Map((branchesData?.data || []).map((b) => [b.id, b.name])),
    [branchesData]
  );
  const inventoryMap = useMemo(
    () => new Map((inventoriesSetupData?.data || []).map((i) => [i.id, i.name])),
    [inventoriesSetupData]
  );
  const supplierMap = useMemo(
    () => new Map((suppliersData?.data || []).map((s) => [s.id, s.name])),
    [suppliersData]
  );
  const invoiceMap = useMemo(
    () => new Map((invoicesData?.data || []).map((inv) => [inv.id, inv])),
    [invoicesData]
  );

  const getItemLabel = (category?: string, itemId?: number | string) => {
    if (!itemId) return "-";
    const id = Number(itemId);
    if (category === "food") {
      const food = foods.find((f) => f.id === id);
      return food ? `${food.name} (${food.code})` : `Food #${id}`;
    }
    if (category === "medicine") {
      const med = medicines.find((m) => m.id === id);
      return med ? `${med.name} (${med.code})` : `Medicine #${id}`;
    }
    const food = foods.find((f) => f.id === id);
    if (food) return `${food.name} (${food.code})`;
    const med = medicines.find((m) => m.id === id);
    if (med) return `${med.name} (${med.code})`;
    return `Item #${id}`;
  };

  const namedOption = (item: { id: number; code?: string; name?: string }) => ({
    value: String(item.id),
    label: [item.code, item.name].filter(Boolean).join(" - ") || `#${item.id}`,
  });

  const isMutating =
    createInvoiceState.isLoading ||
    updateInvoiceState.isLoading ||
    cancelInvoiceState.isLoading ||
    createReceiptState.isLoading ||
    confirmReceiptState.isLoading;

  const pageMeta = useMemo(() => {
    switch (tab) {
      case "receipts":
        return {
          title: "Purchase Receipts",
          description:
            "Record incoming goods receipts, supplier batch/lot details, and cold-chain compliance verification.",
          icon: <ClipboardCheck className="text-[#15803d] dark:text-emerald-400" size={26} />,
        };
      case "balances":
        return {
          title: "Purchasing Inventory Checks",
          description:
            "Review real-time inventory balances and lot availability for purchased goods.",
          icon: <Database className="text-[#15803d] dark:text-emerald-400" size={26} />,
        };
      case "ledger":
        return {
          title: "Purchase Ledger",
          description:
            "Inspect immutable audit ledger transactions posted from completed purchase receipts.",
          icon: <ScrollText className="text-[#15803d] dark:text-emerald-400" size={26} />,
        };
      case "invoices":
      default:
        return {
          title: "Purchase Invoices",
          description:
            "Manage purchase invoices, pricing terms, FOC goods, discounts, and vendor billing records.",
          icon: <ReceiptText className="text-[#15803d] dark:text-emerald-400" size={26} />,
        };
    }
  }, [tab]);

  React.useEffect(() => {
    if (
      tabParam === "invoices" ||
      tabParam === "receipts" ||
      tabParam === "balances" ||
      tabParam === "ledger"
    ) {
      setTab(tabParam);
    }
  }, [tabParam]);

  const openFormAction = (
    action: JsonAction,
    sample?: PurchaseInvoicePayload | PurchaseReceiptPayload,
    invoice?: PurchaseInvoice
  ) => {
    setJsonAction(action);
    setTargetInvoice(invoice || null);
    if (action === "createInvoice" && sample)
      setInvoiceForm(invoiceFormFromPayload(sample as PurchaseInvoicePayload));
    if (action === "updateInvoice" && invoice) setInvoiceForm(invoiceFormFromRecord(invoice));
    if (action === "updateInvoice" && !invoice && sample)
      setInvoiceForm(invoiceFormFromPayload(sample as PurchaseInvoicePayload));
    if (action === "createReceipt" && sample)
      setReceiptForm(receiptFormFromPayload(sample as PurchaseReceiptPayload));
    if (action === "cancelInvoice") setCancelReason("Supplier cancelled before any receipt.");
  };

  const runFormAction = async () => {
    if (!jsonAction) return;
    try {
      if (jsonAction === "createInvoice")
        await createInvoice(toInvoicePayload(invoiceForm, true)).unwrap();
      if (jsonAction === "updateInvoice" && targetInvoice) {
        await updateInvoice({
          id: targetInvoice.id,
          body: toInvoicePayload(invoiceForm, false),
        }).unwrap();
      }
      if (jsonAction === "cancelInvoice" && targetInvoice) {
        await cancelInvoice({ id: targetInvoice.id, reason: cancelReason }).unwrap();
      }
      if (jsonAction === "createReceipt")
        await createReceipt(toReceiptPayload(receiptForm)).unwrap();
      setJsonAction(null);
      toast.success("Purchasing API request saved successfully");
    } catch (error: unknown) {
      const err = error as { data?: { message?: string }; message?: string };
      toast.error(err?.data?.message || err?.message || "Purchasing API request failed");
    }
  };

  const runConfirmReceipt = async (id: number) => {
    try {
      await confirmReceipt(id).unwrap();
      toast.success("Purchase receipt confirmed and posted");
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || "Receipt confirmation failed");
    }
  };

  const showSavedResponse = async (
    type: "invoice" | "receipt",
    id: number | string,
    fallback: unknown
  ) => {
    try {
      const result =
        type === "invoice" ? await showInvoice(id).unwrap() : await showReceipt(id).unwrap();
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
            {pageMeta.icon}
            <h1 className="text-2xl font-extrabold tracking-tight text-[#1E293B] dark:text-white">
              {pageMeta.title}
            </h1>
          </div>
          <p className="mt-1 text-sm text-[#64748B] dark:text-gray-400">{pageMeta.description}</p>
        </div>
        {tab === "invoices" && (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              className="gap-2"
              onClick={() => openFormAction("createInvoice", foodInvoiceSample)}
            >
              <Plus size={15} />
              Food Invoice
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => openFormAction("createInvoice", medicineInvoiceSample)}
            >
              <ReceiptText size={15} />
              Medicine Invoice
            </Button>
          </div>
        )}
        {tab === "receipts" && (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              className="gap-2"
              onClick={() => openFormAction("createReceipt", receiptSample)}
            >
              <Plus size={15} />
              Food Receipt
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => openFormAction("createReceipt", medicineReceiptSample)}
            >
              <ClipboardCheck size={15} />
              Medicine Receipt
            </Button>
          </div>
        )}
      </div>

      {tab === "invoices" && (
        <DataPanel loading={invoicesLoading} empty="No purchase invoices found.">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                {["No.", "Invoice", "Date", "Supplier", "Branch", "Status", "Lines", "Actions"].map(
                  (head) => (
                    <TableCell
                      key={head}
                      isHeader
                      className="px-5 py-3 text-start text-xs font-medium text-gray-500"
                    >
                      {head}
                    </TableCell>
                  )
                )}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {invoices.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell className="px-5 py-3.5 text-sm text-gray-500">{index + 1}</TableCell>
                  <TableCell className="px-5 py-3.5 text-sm font-semibold text-gray-900 dark:text-white">
                    {item.invoice_number}
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-sm text-gray-500">
                    {formatReadableDate(item.invoice_date)}
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {supplierMap.get(item.supplier_id) || `Supplier #${item.supplier_id}`}
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {branchMap.get(item.branch_id) || `Branch #${item.branch_id}`}
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-sm">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass(item.status)}`}
                    >
                      {item.status || "open"}
                    </span>
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-sm text-gray-500">
                    {item.lines?.length || 0}
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-sm">
                    <div className="flex flex-wrap gap-1.5">
                      <TableActionButton
                        label="View"
                        tone="neutral"
                        onClick={() => showSavedResponse("invoice", item.id, item)}
                        icon={<Eye size={14} />}
                      />
                      {canEditInvoice(item.status) && (
                        <TableActionButton
                          label="Update"
                          tone="neutral"
                          onClick={() =>
                            openFormAction("updateInvoice", foodInvoiceUpdateSample, item)
                          }
                          icon={<ReceiptText size={14} />}
                        />
                      )}
                      {canCancelInvoice(item.status) && (
                        <TableActionButton
                          label="Cancel"
                          tone="red"
                          onClick={() => openFormAction("cancelInvoice", undefined, item)}
                          icon={<XCircle size={14} />}
                        />
                      )}
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
              {receipts.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell className="px-5 py-3.5 text-sm text-gray-500">{index + 1}</TableCell>
                  <TableCell className="px-5 py-3.5 text-sm font-semibold text-gray-900 dark:text-white">
                    {item.receipt_number}
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {invoiceMap.get(item.purchase_invoice_id)?.invoice_number ||
                      `Invoice #${item.purchase_invoice_id}`}
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-sm text-gray-500">
                    {formatReadableDate(item.receipt_date)}
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-sm">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass(item.status)}`}
                    >
                      {item.status || "draft"}
                    </span>
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-sm text-gray-500">
                    {item.lines?.length || 0}
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-sm">
                    <div className="flex flex-wrap gap-1.5">
                      <TableActionButton
                        label="View"
                        tone="neutral"
                        onClick={() => showSavedResponse("receipt", item.id, item)}
                        icon={<Eye size={14} />}
                      />
                      {canConfirmReceipt(item.status) && (
                        <TableActionButton
                          label="Confirm"
                          tone="green"
                          onClick={() => runConfirmReceipt(item.id)}
                          icon={<CheckCircle2 size={14} />}
                        />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataPanel>
      )}

      {tab === "balances" && (
        <DataPanel loading={balancesLoading} empty="No purchase inventory balances found.">
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
        <DataPanel loading={ledgerLoading} empty="No purchase ledger entries found.">
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

      <PurchasingActionModal
        action={jsonAction}
        isOpen={!!jsonAction}
        invoiceForm={invoiceForm}
        receiptForm={receiptForm}
        cancelReason={cancelReason}
        branchOptions={branches.map(namedOption)}
        supplierOptions={suppliers.map(namedOption)}
        inventoryOptions={setupInventories.map((i) => ({
          value: String(i.id),
          label: `${i.code} - ${i.name} (${i.type})`,
        }))}
        foodOptions={foods.map(namedOption)}
        medicineOptions={medicines.map(namedOption)}
        uomOptions={uoms.map((u) => ({
          value: String(u.id),
          label: `${u.code} - ${u.name} (${u.symbol})`,
        }))}
        invoiceOptions={invoices.map((inv) => ({
          value: String(inv.id),
          label: `${inv.invoice_number} (Supplier #${inv.supplier_id})`,
        }))}
        isSaving={isMutating}
        onInvoiceChange={setInvoiceForm}
        onReceiptChange={setReceiptForm}
        onCancelReasonChange={setCancelReason}
        onClose={() => setJsonAction(null)}
        onSubmit={runFormAction}
      />

      <ResponseModal data={selectedJson} onClose={() => setSelectedJson(null)} />
    </div>
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
  const isEmpty = React.Children.count(children) === 0;
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loading />
        </div>
      ) : isEmpty ? (
        <div className="flex h-64 items-center justify-center text-gray-500">{empty}</div>
      ) : (
        <div className="max-w-full overflow-x-auto">{children}</div>
      )}
    </div>
  );
}

type SelectOption = { value: string; label: string };

function PurchasingActionModal({
  action,
  isOpen,
  invoiceForm,
  receiptForm,
  cancelReason,
  branchOptions,
  supplierOptions,
  inventoryOptions,
  foodOptions,
  medicineOptions,
  uomOptions,
  invoiceOptions,
  isSaving,
  onInvoiceChange,
  onReceiptChange,
  onCancelReasonChange,
  onClose,
  onSubmit,
}: {
  action: JsonAction | null;
  isOpen: boolean;
  invoiceForm: InvoiceForm;
  receiptForm: ReceiptForm;
  cancelReason: string;
  branchOptions: SelectOption[];
  supplierOptions: SelectOption[];
  inventoryOptions: SelectOption[];
  foodOptions: SelectOption[];
  medicineOptions: SelectOption[];
  uomOptions: SelectOption[];
  invoiceOptions: SelectOption[];
  isSaving: boolean;
  onInvoiceChange: React.Dispatch<React.SetStateAction<InvoiceForm>>;
  onReceiptChange: React.Dispatch<React.SetStateAction<ReceiptForm>>;
  onCancelReasonChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const setInvoiceField = (key: keyof InvoiceForm, value: string) =>
    onInvoiceChange((current) => ({ ...current, [key]: value }));
  const setReceiptField = (key: keyof ReceiptForm, value: string | boolean) =>
    onReceiptChange((current) => ({ ...current, [key]: value }));
  const selectClass =
    "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";
  const title =
    action === "createInvoice"
      ? "Create Purchase Invoice"
      : action === "updateInvoice"
        ? "Update Purchase Invoice"
        : action === "cancelInvoice"
          ? "Cancel Purchase Invoice"
          : "Create Purchase Receipt";

  const ensureOption = (opts: SelectOption[], val: string) => {
    if (!val || opts.some((o) => o.value === val)) return opts;
    return [{ value: val, label: `#${val}` }, ...opts];
  };

  const itemOptions = invoiceForm.category === "medicine" ? medicineOptions : foodOptions;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="m-4 max-w-4xl">
      <div className="space-y-4 p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
        <p className="text-sm text-gray-500">
          These fields produce the required Postman request payload.
        </p>

        {action === "cancelInvoice" && (
          <FormField label="Reason" required>
            <Input
              value={cancelReason}
              onChange={(event) => onCancelReasonChange(event.target.value)}
            />
          </FormField>
        )}

        {(action === "createInvoice" || action === "updateInvoice") && (
          <div className="max-h-[60vh] space-y-5 overflow-y-auto pr-2">
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {action === "createInvoice" && (
                <FormField label="Invoice Number">
                  <Input
                    value={invoiceForm.invoice_number}
                    onChange={(event) => setInvoiceField("invoice_number", event.target.value)}
                  />
                </FormField>
              )}
              <FormField label="Invoice Date" required>
                <DatePicker
                  id="purchase-invoice-date"
                  defaultDate={invoiceForm.invoice_date || undefined}
                  placeholder="Select invoice date"
                  onChange={(_, dateStr) => setInvoiceField("invoice_date", dateStr)}
                />
              </FormField>
              <FormField label="Supplier" required>
                <Select
                  value={invoiceForm.supplier_id}
                  onChange={(e) => setInvoiceField("supplier_id", e.target.value)}
                  options={ensureOption(supplierOptions, invoiceForm.supplier_id)}
                  placeholder="Select supplier"
                />
              </FormField>
              <FormField label="Branch" required>
                <Select
                  value={invoiceForm.branch_id}
                  onChange={(e) => setInvoiceField("branch_id", e.target.value)}
                  options={ensureOption(branchOptions, invoiceForm.branch_id)}
                  placeholder="Select branch"
                />
              </FormField>
              <FormField label="Notes">
                <Input
                  value={invoiceForm.notes}
                  onChange={(event) => setInvoiceField("notes", event.target.value)}
                />
              </FormField>
            </section>

            <section className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <h3 className="mb-4 text-sm font-bold text-gray-800 dark:text-white">Invoice Line</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Category" required>
                  <select
                    value={invoiceForm.category}
                    onChange={(event) => setInvoiceField("category", event.target.value)}
                    className={selectClass}
                  >
                    <option value="food">food</option>
                    <option value="medicine">medicine</option>
                  </select>
                </FormField>
                <FormField label="Item" required>
                  <Select
                    value={invoiceForm.item_id}
                    onChange={(e) => setInvoiceField("item_id", e.target.value)}
                    options={ensureOption(itemOptions, invoiceForm.item_id)}
                    placeholder="Select item"
                  />
                </FormField>
                <FormField label="Purchase UOM" required>
                  <Select
                    value={invoiceForm.purchase_uom_id}
                    onChange={(e) => setInvoiceField("purchase_uom_id", e.target.value)}
                    options={ensureOption(uomOptions, invoiceForm.purchase_uom_id)}
                    placeholder="Select purchase UOM"
                  />
                </FormField>
                <FormField label="Stock UOM" required>
                  <Select
                    value={invoiceForm.stock_uom_id}
                    onChange={(e) => setInvoiceField("stock_uom_id", e.target.value)}
                    options={ensureOption(uomOptions, invoiceForm.stock_uom_id)}
                    placeholder="Select stock UOM"
                  />
                </FormField>
                <FormField label="Conversion Factor" required>
                  <Input
                    type="number"
                    step="any"
                    value={invoiceForm.conversion_factor}
                    onChange={(event) => setInvoiceField("conversion_factor", event.target.value)}
                  />
                </FormField>
                <FormField label="Quantity" required>
                  <Input
                    type="number"
                    step="any"
                    value={invoiceForm.quantity}
                    onChange={(event) => setInvoiceField("quantity", event.target.value)}
                  />
                </FormField>
                <FormField label="Unit Price" required>
                  <Input
                    type="number"
                    step="any"
                    value={invoiceForm.unit_price}
                    onChange={(event) => setInvoiceField("unit_price", event.target.value)}
                  />
                </FormField>
                <FormField label="Discount Type">
                  <select
                    value={invoiceForm.discount_type}
                    onChange={(event) => setInvoiceField("discount_type", event.target.value)}
                    className={selectClass}
                  >
                    <option value="">none</option>
                    <option value="percentage">percentage</option>
                    <option value="amount">amount</option>
                  </select>
                </FormField>
                <FormField label="Discount Value">
                  <Input
                    type="number"
                    step="any"
                    value={invoiceForm.discount_value}
                    onChange={(event) => setInvoiceField("discount_value", event.target.value)}
                  />
                </FormField>
                <FormField label="FOC Type">
                  <select
                    value={invoiceForm.foc_type}
                    onChange={(event) => setInvoiceField("foc_type", event.target.value)}
                    className={selectClass}
                  >
                    <option value="">none</option>
                    <option value="quantity">quantity</option>
                    <option value="amount">amount</option>
                  </select>
                </FormField>
                <FormField label="FOC Value">
                  <Input
                    type="number"
                    step="any"
                    value={invoiceForm.foc_value}
                    onChange={(event) => setInvoiceField("foc_value", event.target.value)}
                  />
                </FormField>
                <FormField label="Tax Rate">
                  <Input
                    type="number"
                    step="any"
                    value={invoiceForm.tax_rate}
                    onChange={(event) => setInvoiceField("tax_rate", event.target.value)}
                  />
                </FormField>
                <FormField label="Target Warehouse">
                  <Select
                    value={invoiceForm.target_inventory_id}
                    onChange={(e) => setInvoiceField("target_inventory_id", e.target.value)}
                    options={ensureOption(inventoryOptions, invoiceForm.target_inventory_id)}
                    placeholder="Select warehouse"
                  />
                </FormField>
                <FormField label="Target Location">
                  <Input
                    value={invoiceForm.target_location}
                    onChange={(event) => setInvoiceField("target_location", event.target.value)}
                  />
                </FormField>
              </div>
            </section>
          </div>
        )}

        {action === "createReceipt" && (
          <div className="max-h-[60vh] space-y-5 overflow-y-auto pr-2">
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Receipt Number">
                <Input
                  value={receiptForm.receipt_number}
                  onChange={(event) => setReceiptField("receipt_number", event.target.value)}
                />
              </FormField>
              <FormField label="Purchase Invoice" required>
                <Select
                  value={receiptForm.purchase_invoice_id}
                  onChange={(e) => setReceiptField("purchase_invoice_id", e.target.value)}
                  options={ensureOption(invoiceOptions, receiptForm.purchase_invoice_id)}
                  placeholder="Select invoice"
                />
              </FormField>
              <FormField label="Receipt Date" required>
                <DatePicker
                  id="purchase-receipt-date"
                  defaultDate={receiptForm.receipt_date || undefined}
                  placeholder="Select receipt date"
                  onChange={(_, dateStr) => setReceiptField("receipt_date", dateStr)}
                />
              </FormField>
              <FormField label="Idempotency Key" required>
                <Input
                  value={receiptForm.idempotency_key}
                  onChange={(event) => setReceiptField("idempotency_key", event.target.value)}
                />
              </FormField>
              <FormField label="Notes">
                <Input
                  value={receiptForm.notes}
                  onChange={(event) => setReceiptField("notes", event.target.value)}
                />
              </FormField>
            </section>

            <section className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <h3 className="mb-4 text-sm font-bold text-gray-800 dark:text-white">Receipt Line</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Purchase Invoice Line ID" required>
                  <Input
                    type="number"
                    min="1"
                    value={receiptForm.purchase_invoice_line_id}
                    onChange={(event) =>
                      setReceiptField("purchase_invoice_line_id", event.target.value)
                    }
                  />
                </FormField>
                <FormField label="Accepted Quantity" required>
                  <Input
                    type="number"
                    step="any"
                    value={receiptForm.accepted_quantity}
                    onChange={(event) => setReceiptField("accepted_quantity", event.target.value)}
                  />
                </FormField>
                <FormField label="Accepted FOC Quantity">
                  <Input
                    type="number"
                    step="any"
                    value={receiptForm.accepted_foc_quantity}
                    onChange={(event) =>
                      setReceiptField("accepted_foc_quantity", event.target.value)
                    }
                  />
                </FormField>
                <FormField label="Rejected Quantity">
                  <Input
                    type="number"
                    step="any"
                    value={receiptForm.rejected_quantity}
                    onChange={(event) => setReceiptField("rejected_quantity", event.target.value)}
                  />
                </FormField>
                <FormField label="Target Warehouse" required>
                  <Select
                    value={receiptForm.target_inventory_id}
                    onChange={(e) => setReceiptField("target_inventory_id", e.target.value)}
                    options={ensureOption(inventoryOptions, receiptForm.target_inventory_id)}
                    placeholder="Select warehouse"
                  />
                </FormField>
                <FormField label="Target Location" required>
                  <Input
                    value={receiptForm.target_location}
                    onChange={(event) => setReceiptField("target_location", event.target.value)}
                  />
                </FormField>
                <FormField label="Supplier Batch Number">
                  <Input
                    value={receiptForm.supplier_batch_number}
                    onChange={(event) =>
                      setReceiptField("supplier_batch_number", event.target.value)
                    }
                  />
                </FormField>
                <FormField label="Receipt Lot Number">
                  <Input
                    value={receiptForm.receipt_lot_number}
                    onChange={(event) => setReceiptField("receipt_lot_number", event.target.value)}
                  />
                </FormField>
                <FormField label="Manufacturing Date">
                  <DatePicker
                    id="purchase-receipt-manufacturing-date"
                    defaultDate={receiptForm.manufacturing_date || undefined}
                    placeholder="Select manufacturing date"
                    onChange={(_, dateStr) => setReceiptField("manufacturing_date", dateStr)}
                  />
                </FormField>
                <FormField label="Expiry Date">
                  <DatePicker
                    id="purchase-receipt-expiry-date"
                    defaultDate={receiptForm.expiry_date || undefined}
                    placeholder="Select expiry date"
                    onChange={(_, dateStr) => setReceiptField("expiry_date", dateStr)}
                  />
                </FormField>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={receiptForm.cold_chain_required}
                    onChange={(event) =>
                      setReceiptField("cold_chain_required", event.target.checked)
                    }
                  />{" "}
                  Cold chain required
                </label>
                <FormField label="Cold Chain Status">
                  <select
                    value={receiptForm.cold_chain_status}
                    onChange={(event) => setReceiptField("cold_chain_status", event.target.value)}
                    className={selectClass}
                  >
                    <option value="">none</option>
                    <option value="breached">breached</option>
                    <option value="ok">ok</option>
                  </select>
                </FormField>
                <FormField label="Observed Temperature">
                  <Input
                    type="number"
                    step="any"
                    value={receiptForm.observed_temperature}
                    onChange={(event) =>
                      setReceiptField("observed_temperature", event.target.value)
                    }
                  />
                </FormField>
                <FormField label="Temperature UOM">
                  <Input
                    value={receiptForm.temperature_uom}
                    onChange={(event) => setReceiptField("temperature_uom", event.target.value)}
                  />
                </FormField>
                <FormField label="Exception Reason">
                  <Input
                    value={receiptForm.exception_reason}
                    onChange={(event) => setReceiptField("exception_reason", event.target.value)}
                  />
                </FormField>
              </div>
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
            disabled={isSaving || (action === "cancelInvoice" && !cancelReason.trim())}
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
    "quantity",
    "accepted_quantity",
    "target_inventory_id",
    "target_location",
    "receipt_lot_number",
    "cold_chain_status",
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
