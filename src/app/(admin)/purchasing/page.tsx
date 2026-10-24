"use client";

import InventoryBalanceFilters from "@/components/inventory/InventoryBalanceFilters";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  PurchaseInvoice,
  PurchaseInvoicePayload,
  PurchaseReceiptPayload,
  useCancelPurchaseInvoiceMutation,
  useConfirmPurchaseInvoiceMutation,
  useConfirmPurchaseReceiptMutation,
  useCreatePurchaseInvoiceMutation,
  useCreatePurchaseReceiptMutation,
  useGetPurchaseInvoicesQuery,
  useGetPurchaseInvoiceQuery,
  useGetPurchaseReceiptsQuery,
  useLazyGetPurchaseInvoiceQuery,
  useLazyGetPurchaseReceiptQuery,
  useUpdatePurchaseInvoiceMutation,
} from "@/redux/features/purchasing/PurchasingFoundationApiSlice";
import {
  InventoryItem,
  useGetInventoryBalancesQuery,
  useGetInventoryItemsQuery,
  useGetInventoryLedgerQuery,
} from "@/redux/features/inventory/InventoryFoundationApiSlice";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import TableActionButton from "@/components/ui/table/TableActionButton";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { Switch } from "@/components/ui/switch";
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
import { useGetCashbooksQuery } from "@/redux/features/financial/CashbookApiSlice";
import { toast } from "sonner";
import {
  CheckCircle2,
  ClipboardCheck,
  Database,
  Eye,
  ArrowLeft,
  Plus,
  Pencil,
  ReceiptText,
  ScrollText,
  Trash2,
  XCircle,
} from "lucide-react";

type PurchasingTab = "invoices" | "receipts" | "balances" | "ledger";
type JsonAction = "createInvoice" | "updateInvoice" | "cancelInvoice" | "createReceipt";

type InvoiceForm = {
  is_committed?: boolean;
  description: string;
  additionalLines?: InvoiceForm[];
  currency_code: string;
  invoice_number: string;
  invoice_date: string;
  supplier_id: string;
  branch_id: string;
  cashbook_id: string;
  paid_amount: string;
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
};

type ReceiptForm = {
  is_committed?: boolean;
  additionalLines?: ReceiptForm[];
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
  cashbook_id: 1,
  paid_amount: 0,
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
    },
  ],
};

const medicineInvoiceSample: PurchaseInvoicePayload = {
  invoice_number: `PINV-POSTMAN-MED-${Date.now()}`,
  invoice_date: new Date().toISOString().slice(0, 10),
  supplier_id: 1,
  branch_id: 1,
  cashbook_id: 1,
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
    },
  ],
};

const foodInvoiceUpdateSample: PurchaseInvoicePayload = {
  invoice_date: new Date().toISOString().slice(0, 10),
  supplier_id: 1,
  branch_id: 1,
  cashbook_id: 1,
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
    is_committed: true,
    additionalLines: payload.lines.slice(1).map((line) => invoiceFormFromPayload({ ...payload, lines: [line] })),
    currency_code: payload.currency_code ?? "MMK",
    invoice_number: payload.invoice_number || "",
    invoice_date: payload.invoice_date,
    supplier_id: String(payload.supplier_id),
    branch_id: String(payload.branch_id),
    cashbook_id: payload.cashbook_id ? String(payload.cashbook_id) : "",
    paid_amount: payload.paid_amount !== undefined ? String(payload.paid_amount) : "",
    notes: payload.notes || "",
    category: line.category,
    description: line.description || "",
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
  };
};

const invoiceFormFromRecord = (invoice: PurchaseInvoice): InvoiceForm =>
  invoiceFormFromPayload({
    currency_code: String(invoice.currency_code || ""),
    invoice_number: invoice.invoice_number,
    invoice_date: invoice.invoice_date,
    supplier_id: invoice.supplier_id,
    branch_id: invoice.branch_id,
    cashbook_id: invoice.cashbook_id ?? 0,
    paid_amount: invoice.paid_amount !== undefined ? Number(invoice.paid_amount) : undefined,
    notes: invoice.notes,
    lines: invoice.lines?.length ? invoice.lines : foodInvoiceSample.lines,
  });

const toInvoicePayload = (
  form: InvoiceForm,
  includeInvoiceNumber: boolean
): PurchaseInvoicePayload => ({
  ...(includeInvoiceNumber && form.invoice_number ? { invoice_number: form.invoice_number } : {}),
  currency_code: form.currency_code || "MMK",
  invoice_date: form.invoice_date,
  supplier_id: Number(form.supplier_id),
  branch_id: Number(form.branch_id),
  ...(form.paid_amount ? { paid_amount: Number(form.paid_amount) } : {}),
  ...(form.notes ? { notes: form.notes } : {}),
  lines: [form, ...(form.additionalLines || [])]
    .filter((line) => line.is_committed && line.item_id)
    .map((line) => ({
      category: line.category,
      ...(line.description ? { description: line.description } : {}),
      item_id: Number(line.item_id),
      purchase_uom_id: Number(line.purchase_uom_id),
      stock_uom_id: Number(line.stock_uom_id),
      conversion_factor: Number(line.conversion_factor),
      quantity: Number(line.quantity),
      unit_price: Number(line.unit_price),
      ...(line.discount_type ? { discount_type: line.discount_type } : {}),
      ...(line.discount_value ? { discount_value: Number(line.discount_value) } : {}),
      ...(line.foc_type ? { foc_type: line.foc_type } : {}),
      ...(line.foc_value ? { foc_value: Number(line.foc_value) } : {}),
      ...(line.tax_rate ? { tax_rate: Number(line.tax_rate) } : {}),
    })),
});

const receiptFormFromPayload = (payload: PurchaseReceiptPayload): ReceiptForm => {
  const line = payload.lines[0];
  return {
    is_committed: true,
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
    target_inventory_id: String(line.target_inventory_id || ""),
    target_location: line.target_location || "",
    supplier_batch_number: line.supplier_batch_number || "",
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
  lines: [form, ...(form.additionalLines || [])].filter((line) => line.is_committed && line.purchase_invoice_line_id).map((line) => ({
      purchase_invoice_line_id: Number(line.purchase_invoice_line_id),
      accepted_quantity: Number(line.accepted_quantity),
      ...(line.accepted_foc_quantity
        ? { accepted_foc_quantity: Number(line.accepted_foc_quantity) }
        : {}),
      ...(line.rejected_quantity ? { rejected_quantity: Number(line.rejected_quantity) } : {}),
      target_inventory_id: Number(line.target_inventory_id),
      target_location: line.target_location,
      ...(line.supplier_batch_number ? { supplier_batch_number: line.supplier_batch_number } : {}),
      ...(line.manufacturing_date ? { manufacturing_date: line.manufacturing_date } : {}),
      ...(line.expiry_date ? { expiry_date: line.expiry_date } : {}),
      ...(line.cold_chain_required ? { cold_chain_required: true } : {}),
      ...(line.cold_chain_status ? { cold_chain_status: line.cold_chain_status } : {}),
      ...(line.observed_temperature
        ? { observed_temperature: Number(line.observed_temperature) }
        : {}),
      ...(line.temperature_uom ? { temperature_uom: line.temperature_uom } : {}),
      ...(line.exception_reason ? { exception_reason: line.exception_reason } : {}),
    })),
});

const formatValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const isNumericColumn = (key: string) =>
  /(^id$|_id$|quantity|amount|price|cost|balance|count|rate|factor|total|temperature)/i.test(key);

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const createInvoiceType = searchParams.get("createInvoice");
  const createReceiptType = searchParams.get("createReceipt");
  const tabParam = searchParams.get("tab");
  const initialTab: PurchasingTab =
    tabParam === "receipts" || tabParam === "balances" || tabParam === "ledger"
      ? tabParam
      : "invoices";
  const [tab, setTab] = useState<PurchasingTab>(initialTab);
  const [balanceFilters, setBalanceFilters] = useState({ from_date: new Date().toLocaleDateString("en-CA").slice(0, 7) + "-01", to_date: new Date().toLocaleDateString("en-CA"), inventory_id: "", item_id: "", location: "" });
  const [balancePage, setBalancePage] = useState(1);
  const [ledgerFilters, setLedgerFilters] = useState({ from_date: new Date().toLocaleDateString("en-CA").slice(0, 7) + "-01", to_date: new Date().toLocaleDateString("en-CA"), inventory_id: "", item_id: "", location: "" });
  const [ledgerPage, setLedgerPage] = useState(1);
  const [selectedJson, setSelectedJson] = useState<unknown | null>(null);
  const [jsonAction, setJsonAction] = useState<JsonAction | null>(null);
  const [targetInvoice, setTargetInvoice] = useState<PurchaseInvoice | null>(null);
  const [invoiceForm, setInvoiceForm] = useState<InvoiceForm>(() =>
    invoiceFormFromPayload(foodInvoiceSample)
  );
  const [invoiceFieldErrors, setInvoiceFieldErrors] = useState<Record<string, string>>({});
  const [receiptFieldErrors, setReceiptFieldErrors] = useState<Record<string, string>>({});
  const [receiptForm, setReceiptForm] = useState<ReceiptForm>(() =>
    ({ ...receiptFormFromPayload(receiptSample), expiry_date: "" })
  );
  const [cancelReason, setCancelReason] = useState("Supplier cancelled before any receipt.");
  const [confirmingInvoice, setConfirmingInvoice] = useState<PurchaseInvoice | null>(null);
  const [confirmationCashbookId, setConfirmationCashbookId] = useState("");

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
  const { currentData: balancesData, isFetching: balancesLoading, isError: balancesError } = useGetInventoryBalancesQuery({
    per_page: 15,
    page: balancePage,
    ...balanceFilters,
  }, { skip: balanceFilters.from_date > balanceFilters.to_date });
  const { data: inventoryItemsData } = useGetInventoryItemsQuery({
    per_page: 100,
    status: "active",
  });
  const { currentData: ledgerData, isFetching: ledgerLoading, isError: ledgerError } = useGetInventoryLedgerQuery({
    source_type: "purchase_receipt",
    transaction_type: "purchase_receipt",
    per_page: 15,
    page: ledgerPage,
    date_from: ledgerFilters.from_date,
    date_to: ledgerFilters.to_date,
    inventory_id: ledgerFilters.inventory_id,
  }, { skip: ledgerFilters.from_date > ledgerFilters.to_date });

  const [createInvoice, createInvoiceState] = useCreatePurchaseInvoiceMutation();
  const [showInvoice] = useLazyGetPurchaseInvoiceQuery();
  const [showReceipt] = useLazyGetPurchaseReceiptQuery();
  const [updateInvoice, updateInvoiceState] = useUpdatePurchaseInvoiceMutation();
  const [cancelInvoice, cancelInvoiceState] = useCancelPurchaseInvoiceMutation();
  const [createReceipt, createReceiptState] = useCreatePurchaseReceiptMutation();
  const [confirmReceipt, confirmReceiptState] = useConfirmPurchaseReceiptMutation();
  const [confirmInvoice, confirmInvoiceState] = useConfirmPurchaseInvoiceMutation();

  const { data: confirmationCashbooksData, isLoading: confirmationCashbooksLoading } = useGetCashbooksQuery(
    { branch_id: confirmingInvoice?.branch_id, status: "active", per_page: 100 },
    { skip: !confirmingInvoice }
  );

  const invoices = invoicesData?.data || [];
  const receipts = receiptsData?.data || [];
  const balances = balancesData?.data || [];
  const ledger = ledgerData?.data || [];
  const branches = branchesData?.data || [];
  const setupInventories = inventoriesSetupData?.data || [];
  const suppliers = suppliersData?.data || [];
  const foods = foodsData?.data || [];
  const medicines = medicinesData?.data || [];
  const inventoryItems = inventoryItemsData?.data || [];
  const uoms = uomsData?.data || [];
  const confirmationCashbookOptions = (confirmationCashbooksData?.data || [])
    .filter((cashbook) => cashbook.currency_code === "MMK" && cashbook.branch_id === confirmingInvoice?.branch_id)
    .map((cashbook) => ({ value: String(cashbook.id), label: `${cashbook.name} (${cashbook.type}, ${cashbook.currency_code})` }));

  const submitInvoiceConfirmation = async () => {
    if (!confirmingInvoice || !confirmationCashbookId) {
      toast.error("Select an active MMK cashbook for this branch.");
      return;
    }
    try {
      await confirmInvoice({ id: confirmingInvoice.id, cashbook_id: Number(confirmationCashbookId) }).unwrap();
      toast.success("Purchase invoice confirmed.");
      setConfirmingInvoice(null);
      setConfirmationCashbookId("");
    } catch {
      toast.error("Could not confirm purchase invoice.");
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
    const inventoryItem = inventoryItems.find((item) => item.id === id && (!category || item.category === category));
    if (inventoryItem) return `${inventoryItem.name} (${inventoryItem.code})`;
    if (category === "food") {
      const food = foods.find((f) => f.id === id);
      return food ? `${food.name} (${food.code})` : "-";
    }
    if (category === "medicine") {
      const med = medicines.find((m) => m.id === id);
      return med ? `${med.name} (${med.code})` : "-";
    }
    const food = foods.find((f) => f.id === id);
    if (food) return `${food.name} (${food.code})`;
    const med = medicines.find((m) => m.id === id);
    if (med) return `${med.name} (${med.code})`;
    return "-";
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

  const openFormAction = async (
    action: JsonAction,
    sample?: PurchaseInvoicePayload | PurchaseReceiptPayload,
    invoice?: PurchaseInvoice
  ) => {
    if (action === "createInvoice" && !createInvoiceType) {
      const invoiceType = sample === medicineInvoiceSample ? "medicine" : "food";
      router.push(`/purchasing?tab=invoices&createInvoice=${invoiceType}`);
      return;
    }
    if (action === "createReceipt" && !createReceiptType) {
      const receiptType = sample === medicineReceiptSample ? "medicine" : "food";
      router.push(`/purchasing?tab=receipts&createReceipt=${receiptType}`);
      return;
    }
    setJsonAction(action);
    setTargetInvoice(invoice || null);
    if (action === "createInvoice" && sample)
      setInvoiceForm({ ...invoiceFormFromPayload(sample as PurchaseInvoicePayload), is_committed: false, invoice_number: "", supplier_id: "", branch_id: "", cashbook_id: "", paid_amount: "", item_id: "", quantity: "", unit_price: "", purchase_uom_id: "", stock_uom_id: "", conversion_factor: "", discount_type: "", discount_value: "", foc_type: "", foc_value: "", notes: "", invoice_date: new Date().toLocaleDateString("en-CA") });
    if (action === "updateInvoice" && invoice) {
      try { const result = await showInvoice(invoice.id).unwrap(); setInvoiceForm(invoiceFormFromRecord(result.data)); }
      catch { toast.error("Unable to load invoice details"); setJsonAction(null); return; }
    }
    if (action === "updateInvoice" && !invoice && sample)
      setInvoiceForm(invoiceFormFromPayload(sample as PurchaseInvoicePayload));
    if (action === "createReceipt" && sample)
      setReceiptForm({ ...receiptFormFromPayload(sample as PurchaseReceiptPayload), is_committed: false, receipt_number: "", receipt_date: new Date().toLocaleDateString("en-CA"), supplier_batch_number: "", manufacturing_date: "", expiry_date: "", notes: "", cold_chain_required: false, cold_chain_status: "", observed_temperature: "", temperature_uom: "", exception_reason: "", purchase_invoice_id: "", purchase_invoice_line_id: "", accepted_quantity: "", accepted_foc_quantity: "", rejected_quantity: "", target_inventory_id: "", target_location: "", idempotency_key: crypto.randomUUID() });
    if (action === "cancelInvoice") setCancelReason("Supplier cancelled before any receipt.");
  };

  React.useEffect(() => {
    if (createInvoiceType === "food" || createInvoiceType === "medicine") {
      void openFormAction(
        "createInvoice",
        createInvoiceType === "medicine" ? medicineInvoiceSample : foodInvoiceSample
      );
    }
  }, [createInvoiceType]);

  React.useEffect(() => {
    if (createReceiptType === "food" || createReceiptType === "medicine") {
      void openFormAction(
        "createReceipt",
        createReceiptType === "medicine" ? medicineReceiptSample : receiptSample
      );
    }
  }, [createReceiptType]);

  const runFormAction = async () => {
    if (!jsonAction) return;
    try {
      if (jsonAction === "createInvoice" || jsonAction === "updateInvoice") {
        setInvoiceFieldErrors({});
        const payload = toInvoicePayload(invoiceForm, true);
        const lineErrors: Record<string, string> = {};
        const selectedLines = [invoiceForm, ...(invoiceForm.additionalLines || [])]
          .map((line, index) => ({ line, index }))
          .filter(({ line }) => line.is_committed && line.item_id);
        selectedLines.forEach(({ line, index }) => {
          if (!line.purchase_uom_id) lineErrors[`lines.${index}.purchase_uom_id`] = "Select a purchase UOM.";
          if (!line.stock_uom_id) lineErrors[`lines.${index}.stock_uom_id`] = "Select a stock UOM.";
          if (!Number.isFinite(Number(line.conversion_factor)) || Number(line.conversion_factor) <= 0) lineErrors[`lines.${index}.conversion_factor`] = "Enter a conversion factor greater than zero.";
          if (!Number.isFinite(Number(line.quantity)) || Number(line.quantity) <= 0) lineErrors[`lines.${index}.quantity`] = "Enter a quantity greater than zero.";
          if (!Number.isFinite(Number(line.unit_price)) || Number(line.unit_price) < 0) lineErrors[`lines.${index}.unit_price`] = "Enter a valid unit price.";
        });
        if (!selectedLines.length) lineErrors["lines.0.item_id"] = "Select an item before submitting the invoice.";
        if (Object.keys(lineErrors).length) {
          setInvoiceFieldErrors(lineErrors);
          toast.error("Please fix the highlighted invoice item fields.");
          return;
        }
        const headerErrors: Record<string, string> = {};
        if (!invoiceForm.invoice_date) headerErrors.invoice_date = "Select an invoice date.";
        if (!invoiceForm.supplier_id) headerErrors.supplier_id = "Select a supplier.";
        if (!invoiceForm.branch_id) headerErrors.branch_id = "Select a branch.";
        if (invoiceForm.paid_amount && (!Number.isFinite(Number(invoiceForm.paid_amount)) || Number(invoiceForm.paid_amount) < 0)) headerErrors.paid_amount = "Enter a valid paid amount.";
        if (Object.keys(headerErrors).length) {
          setInvoiceFieldErrors(headerErrors);
          toast.error("Please complete the highlighted invoice details.");
          return;
        }
      }
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
      if (jsonAction === "createReceipt") {
        setReceiptFieldErrors({});
        const payload = toReceiptPayload(receiptForm);
        const headerErrors: Record<string, string> = {};
        if (!receiptForm.purchase_invoice_id) headerErrors.purchase_invoice_id = "Select a purchase invoice.";
        if (!receiptForm.receipt_date) headerErrors.receipt_date = "Select a receipt date.";
        if (!receiptForm.idempotency_key) headerErrors.idempotency_key = "Enter an idempotency key.";
        if (Object.keys(headerErrors).length) {
          setReceiptFieldErrors(headerErrors);
          toast.error("Please complete the highlighted receipt details.");
          return;
        }
        const receiptLineErrors: Record<string, string> = {};
        [receiptForm, ...(receiptForm.additionalLines || [])].forEach((line, index) => {
          if (!line.is_committed) return;
          if (!line.purchase_invoice_line_id) return;
          const accepted = Number(line.accepted_quantity);
          const foc = Number(line.accepted_foc_quantity || 0);
          const rejected = Number(line.rejected_quantity || 0);
          if (!Number.isFinite(accepted) || accepted < 0 || accepted + foc + rejected <= 0) receiptLineErrors[`lines.${index}.accepted_quantity`] = "Enter a valid received quantity.";
          if (!Number.isFinite(foc) || foc < 0) receiptLineErrors[`lines.${index}.accepted_foc_quantity`] = "Enter a valid FOC quantity.";
          if (!Number.isFinite(rejected) || rejected < 0) receiptLineErrors[`lines.${index}.rejected_quantity`] = "Enter a valid rejected quantity.";
          if (!line.target_inventory_id) receiptLineErrors[`lines.${index}.target_inventory_id`] = "Select a target warehouse.";
          if (!line.target_location) receiptLineErrors[`lines.${index}.target_location`] = "Enter a target location.";
        });
        if (!payload.lines.length) receiptLineErrors["lines.0.purchase_invoice_line_id"] = "Select an invoice item before adding it.";
        if (Object.keys(receiptLineErrors).length) {
          setReceiptFieldErrors(receiptLineErrors);
          toast.error("Please fix the highlighted receipt item fields.");
          return;
        }
        const duplicateIndex = payload.lines.findIndex((line, index) => payload.lines.findIndex((candidate) => candidate.purchase_invoice_line_id === line.purchase_invoice_line_id) !== index);
        if (duplicateIndex >= 0) {
          setReceiptFieldErrors({ [`lines.${duplicateIndex}.purchase_invoice_line_id`]: "Each invoice item can appear only once per receipt." });
          toast.error("Remove the duplicate receipt item.");
          return;
        }
        const invoice = (await showInvoice(payload.purchase_invoice_id).unwrap()).data;
        const sourceErrors: Record<string, string> = {};
        for (const [lineIndex, line] of payload.lines.entries()) {
          const source = invoice.lines?.find((item) => item.id === line.purchase_invoice_line_id);
          if (!source) { sourceErrors[`lines.${lineIndex}.purchase_invoice_line_id`] = "Select an item from this invoice."; continue; }
          if (source.category === "medicine" && !["compliant", "breached", "unknown"].includes(line.cold_chain_status || "")) sourceErrors[`lines.${lineIndex}.cold_chain_status`] = "Select a cold-chain status for medicine receipts.";
          const inventoryItem = inventoryItems.find((item) => item.id === source.item_id && item.category === source.category);
          if (inventoryItem?.expiry_tracking && !line.expiry_date) sourceErrors[`lines.${lineIndex}.expiry_date`] = "Expiry date is required for this item.";
          const remaining = Number(source.remaining_quantity ?? Math.max(0, Number(source.quantity) - Number(source.received_quantity || 0)));
          const remainingFoc = Number(source.remaining_foc_quantity ?? Math.max(0, Number(source.foc_quantity || 0) - Number(source.received_foc_quantity || 0)));
          if (line.accepted_quantity > remaining || Number(line.accepted_foc_quantity || 0) > remainingFoc) sourceErrors[`lines.${lineIndex}.accepted_quantity`] = "Receipt quantity exceeds the remaining invoice quantity.";
        }
        if (Object.keys(sourceErrors).length) {
          setReceiptFieldErrors(sourceErrors);
          toast.error("Please fix the highlighted receipt item fields.");
          return;
        }
        await createReceipt(payload).unwrap();
      }
      setJsonAction(null);
      toast.success("Purchasing API request saved successfully");
      if (createInvoiceType) router.replace("/purchasing?tab=invoices");
      if (createReceiptType) router.replace("/purchasing?tab=receipts");
    } catch (error: unknown) {
      const err = error as { data?: { message?: string; errors?: Record<string, string | string[]> }; message?: string };
      if (err.data?.errors) {
        const isReceiptError = jsonAction === "createReceipt";
        const lineIndexes = isReceiptError
          ? [receiptForm, ...(receiptForm.additionalLines || [])].map((line, index) => line.purchase_invoice_line_id ? index : -1).filter((index) => index >= 0)
          : [invoiceForm, ...(invoiceForm.additionalLines || [])].map((line, index) => line.item_id ? index : -1).filter((index) => index >= 0);
        const mappedErrors = Object.fromEntries(Object.entries(err.data.errors).map(([key, value]) => {
          const lineError = key.match(/^lines\.(\d+)\.(.+)$/);
          const fieldKey = lineError ? `lines.${lineIndexes[Number(lineError[1])] ?? lineError[1]}.${lineError[2]}` : key;
          return [fieldKey, Array.isArray(value) ? value[0] : value];
        }));
        if (isReceiptError) setReceiptFieldErrors(mappedErrors);
        else setInvoiceFieldErrors(mappedErrors);
      }
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

  if (
    createInvoiceType === "food" ||
    createInvoiceType === "medicine" ||
    createReceiptType === "food" ||
    createReceiptType === "medicine"
  ) {
    const isCreatingReceipt = createReceiptType === "food" || createReceiptType === "medicine";
    const backToList = isCreatingReceipt ? "/purchasing?tab=receipts" : "/purchasing?tab=invoices";
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        <button
          type="button"
          onClick={() => router.push(backToList)}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
        >
          <ArrowLeft size={16} /> Back to invoices
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{isCreatingReceipt ? "Create Purchase Receipt" : "Create Purchase Invoice"}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{isCreatingReceipt ? "Record the items received from the supplier." : "Enter the supplier invoice details and items to purchase."}</p>
        </div>
        <PurchasingActionModal
          action={isCreatingReceipt ? "createReceipt" : "createInvoice"}
          isOpen
          pageMode
          invoiceForm={invoiceForm}
          receiptForm={receiptForm}
          cancelReason={cancelReason}
          branchOptions={branches.map(namedOption)}
          supplierOptions={suppliers.map(namedOption)}
          inventoryOptions={setupInventories.map((i) => ({ branch_id: i.branch_id, value: String(i.id), label: `${i.code} - ${i.name} (${i.type})` }))}
          foodOptions={inventoryItems.filter((item) => item.category === "food").map(namedOption)}
          medicineOptions={inventoryItems.filter((item) => item.category === "medicine").map(namedOption)}
          uomOptions={uoms.map((u) => ({ value: String(u.id), label: `${u.code} - ${u.name} (${u.symbol})` }))}
          invoiceItems={inventoryItems}
          invoiceFieldErrors={invoiceFieldErrors}
          receiptFieldErrors={receiptFieldErrors}
          onClearInvoiceFieldError={(key) => setInvoiceFieldErrors((current) => key === "*" ? {} : Object.fromEntries(Object.entries(current).filter(([field]) => field !== key)))}
          onClearReceiptFieldError={(key) => setReceiptFieldErrors((current) => key === "*" ? {} : Object.fromEntries(Object.entries(current).filter(([field]) => field !== key)))}
          isSaving={isMutating}
          onInvoiceChange={setInvoiceForm}
          onReceiptChange={setReceiptForm}
          onCancelReasonChange={setCancelReason}
          onClose={() => router.push(backToList)}
          onSubmit={runFormAction}
        />
      </div>
    );
  }

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
              onClick={() => router.push("/purchasing?tab=invoices&createInvoice=food")}
            >
              <Plus size={15} />
              Food Invoice
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => router.push("/purchasing?tab=invoices&createInvoice=medicine")}
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
                      className={`px-5 py-3 text-xs font-medium text-gray-500 ${["No.", "Lines"].includes(head) ? "text-right" : "text-start"}`}
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
                  <TableCell className="px-5 py-3.5 text-right text-sm tabular-nums text-gray-500">
                    {index + 1}
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-sm font-semibold text-gray-900 dark:text-white">
                    {item.invoice_number}
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-sm text-gray-500">
                    {formatReadableDate(item.invoice_date)}
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {supplierMap.get(item.supplier_id) || "-"}
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {branchMap.get(item.branch_id) || "-"}
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-sm">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass(item.status)}`}
                    >
                      {item.status || "open"}
                    </span>
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-right text-sm tabular-nums text-gray-500">
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
                      <a className="rounded border px-2 py-1 text-xs" href={`/financial/supplier-payments?branch_id=${item.branch_id}&invoice_id=${item.id}`}>AP / Pay</a>
                      {canEditInvoice(item.status) && Number(item.paid_amount ?? 0) !== 0 && (
                        <TableActionButton
                          label="Confirm"
                          tone="green"
                          onClick={() => {
                            setConfirmingInvoice(item);
                            setConfirmationCashbookId("");
                          }}
                          icon={<CheckCircle2 size={14} />}
                        />
                      )}
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
                    className={`px-5 py-3 text-xs font-medium text-gray-500 ${["No.", "Lines"].includes(head) ? "text-right" : "text-start"}`}
                  >
                    {head}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {receipts.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell className="px-5 py-3.5 text-right text-sm tabular-nums text-gray-500">
                    {index + 1}
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-sm font-semibold text-gray-900 dark:text-white">
                    {item.receipt_number}
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {invoiceMap.get(item.purchase_invoice_id)?.invoice_number ||
                      "-"}
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
                  <TableCell className="px-5 py-3.5 text-right text-sm tabular-nums text-gray-500">
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
        <div className="space-y-4">
          <InventoryBalanceFilters value={balanceFilters} onChange={(value) => { setBalanceFilters(value); setBalancePage(1); }} inventories={inventoriesSetupData?.data || []} items={inventoryItems} />
          {balanceFilters.from_date > balanceFilters.to_date && <p className="text-red-600">Start date must be before or equal to end date.</p>}
          {balancesError && <p className="text-red-600">Unable to load inventory balances.</p>}
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
                  "Opening",
                  "In",
                  "Out",
                  "Closing",
                  "Stock Unit",
                  "Available",
                  "Lot / Batch",
                  "Actions",
                ].map((head) => (
                  <TableCell
                    key={head}
                    isHeader
                    className={`px-5 py-3 text-xs font-medium text-gray-500 ${["No.", "Quantity", "Available"].includes(head) ? "text-right" : "text-start"}`}
                  >
                    {head}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {balances.map((item: Record<string, unknown>, index) => (
                <TableRow key={String(item.id || index)}>
                  <TableCell className="px-5 py-3.5 text-right text-sm tabular-nums text-gray-500">
                    {index + 1}
                  </TableCell>
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
                      "-"}
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-sm text-gray-500">
                    {formatValue(item.location)}
                  </TableCell>
                  {["opening_quantity", "in_quantity", "out_quantity", "closing_quantity"].map((key) => <TableCell key={key} className="px-5 py-3.5 text-right text-sm tabular-nums">{formatValue(item[key])}</TableCell>)}
                  <TableCell className="px-5 py-3.5 text-sm">{uoms.find((uom) => uom.id === Number(item.stock_uom_id))?.symbol || "-"}</TableCell>
                  <TableCell className="px-5 py-3.5 text-right text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatValue(item.available_quantity)}
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-sm text-gray-500">
                    {item.stock_lot_id ? String((item.stock_lot as Record<string, unknown> | undefined)?.receipt_lot_number || (item.stock_lot as Record<string, unknown> | undefined)?.lot_number || "-") : "-"}
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
          <div className="flex items-center gap-3"><Button size="sm" variant="outline" disabled={balancePage <= 1} onClick={() => setBalancePage(balancePage - 1)}>Previous</Button><span className="text-sm">Page {balancePage}</span><Button size="sm" variant="outline" disabled={balancePage >= Number(balancesData?.meta?.last_page || 1)} onClick={() => setBalancePage(balancePage + 1)}>Next</Button></div>
        </div>
      )}

      {tab === "ledger" && (
        <div className="space-y-4">
        <InventoryBalanceFilters value={ledgerFilters} onChange={(value) => { setLedgerFilters(value); setLedgerPage(1); }} inventories={setupInventories} items={inventoryItems} showItemAndLocation={false} />
        {ledgerFilters.from_date > ledgerFilters.to_date && <p className="text-red-600">Start date must be before or equal to end date.</p>}
        {ledgerError && <p className="text-red-600">Unable to load purchase ledger entries.</p>}
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
                    className={`px-5 py-3 text-xs font-medium text-gray-500 ${["No.", "Quantity", "Balance After"].includes(head) ? "text-right" : "text-start"}`}
                  >
                    {head}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {ledger.map((item: Record<string, unknown>, index) => (
                <TableRow key={String(item.id || index)}>
                  <TableCell className="px-5 py-3.5 text-right text-sm tabular-nums text-gray-500">
                    {index + 1}
                  </TableCell>
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
                    {String(item.source_reference || item.source_number || "Source transaction")}
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-sm font-semibold text-gray-900 dark:text-white">
                    {getItemLabel(String(item.category || ""), item.item_id as number)}
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-right text-sm font-semibold tabular-nums">
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
                  <TableCell className="px-5 py-3.5 text-right text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
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
        <div className="flex items-center gap-3"><Button size="sm" variant="outline" disabled={ledgerPage <= 1} onClick={() => setLedgerPage(ledgerPage - 1)}>Previous</Button><span className="text-sm">Page {ledgerPage}</span><Button size="sm" variant="outline" disabled={ledgerPage >= Number(ledgerData?.meta?.last_page || 1)} onClick={() => setLedgerPage(ledgerPage + 1)}>Next</Button></div>
        </div>
      )}

      <PurchasingActionModal
        action={jsonAction}
        isOpen={!!jsonAction && jsonAction !== "createInvoice" && jsonAction !== "createReceipt"}
        invoiceForm={invoiceForm}
        receiptForm={receiptForm}
        cancelReason={cancelReason}
        branchOptions={branches.map(namedOption)}
        supplierOptions={suppliers.map(namedOption)}
        inventoryOptions={setupInventories.map((i) => ({ branch_id: i.branch_id, value: String(i.id), label: `${i.code} - ${i.name} (${i.type})` }))}
        foodOptions={inventoryItems.filter((item) => item.category === "food").map(namedOption)}
        medicineOptions={inventoryItems.filter((item) => item.category === "medicine").map(namedOption)}
        uomOptions={uoms.map((u) => ({
          value: String(u.id),
          label: `${u.code} - ${u.name} (${u.symbol})`,
        }))}
        invoiceItems={inventoryItems}
        invoiceFieldErrors={invoiceFieldErrors}
        receiptFieldErrors={receiptFieldErrors}
        onClearInvoiceFieldError={(key) => setInvoiceFieldErrors((current) => key === "*" ? {} : Object.fromEntries(Object.entries(current).filter(([field]) => field !== key)))}
        onClearReceiptFieldError={(key) => setReceiptFieldErrors((current) => key === "*" ? {} : Object.fromEntries(Object.entries(current).filter(([field]) => field !== key)))}
        isSaving={isMutating}
        onInvoiceChange={setInvoiceForm}
        onReceiptChange={setReceiptForm}
        onCancelReasonChange={setCancelReason}
        onClose={() => setJsonAction(null)}
        onSubmit={runFormAction}
      />

      <Modal isOpen={!!confirmingInvoice} onClose={() => setConfirmingInvoice(null)} className="max-w-lg p-6">
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Confirm purchase invoice</h2>
            <p className="mt-1 text-sm text-gray-500">
              Confirm {confirmingInvoice?.invoice_number || "this invoice"}. Choose the active MMK cashbook for its branch.
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Cashbook <span className="text-red-500">*</span></label>
            <Select
              options={confirmationCashbookOptions}
              placeholder={confirmationCashbooksLoading ? "Loading cashbooks..." : "Select cashbook"}
              value={confirmationCashbookId}
              onChange={(event) => setConfirmationCashbookId(event.target.value)}
              disabled={confirmationCashbooksLoading || !confirmationCashbookOptions.length}
            />
            {!confirmationCashbooksLoading && !confirmationCashbookOptions.length && (
              <p className="mt-1.5 text-sm text-red-600">No active MMK cashbooks are available for this invoice branch.</p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmingInvoice(null)}>Cancel</Button>
            <Button onClick={submitInvoiceConfirmation} disabled={!confirmationCashbookId || confirmInvoiceState.isLoading}>
              {confirmInvoiceState.isLoading ? "Confirming..." : "Confirm invoice"}
            </Button>
          </div>
        </div>
      </Modal>

      <ResponseModal data={selectedJson} onClose={() => setSelectedJson(null)} suppliers={suppliers} branches={branches} warehouses={setupInventories} invoices={invoices} items={inventoryItems} />
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

type SelectOption = { value: string; label: string; branch_id?: number };

function PurchasingActionModal({
  action,
  isOpen,
  pageMode = false,
  invoiceForm,
  receiptForm,
  cancelReason,
  branchOptions,
  supplierOptions,
  inventoryOptions,
  foodOptions,
  medicineOptions,
  uomOptions,
  invoiceItems,
  invoiceFieldErrors,
  receiptFieldErrors,
  onClearInvoiceFieldError,
  onClearReceiptFieldError,
  isSaving,
  onInvoiceChange,
  onReceiptChange,
  onCancelReasonChange,
  onClose,
  onSubmit,
}: {
  action: JsonAction | null;
  isOpen: boolean;
  pageMode?: boolean;
  invoiceForm: InvoiceForm;
  receiptForm: ReceiptForm;
  cancelReason: string;
  branchOptions: SelectOption[];
  supplierOptions: SelectOption[];
  inventoryOptions: SelectOption[];
  foodOptions: SelectOption[];
  medicineOptions: SelectOption[];
  uomOptions: SelectOption[];
  invoiceItems: InventoryItem[];
  invoiceFieldErrors: Record<string, string>;
  receiptFieldErrors: Record<string, string>;
  onClearInvoiceFieldError: (key: string) => void;
  onClearReceiptFieldError: (key: string) => void;
  isSaving: boolean;
  onInvoiceChange: React.Dispatch<React.SetStateAction<InvoiceForm>>;
  onReceiptChange: React.Dispatch<React.SetStateAction<ReceiptForm>>;
  onCancelReasonChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const [activeInvoiceLineIndex, setActiveInvoiceLineIndex] = useState(0);
  const [activeReceiptLineIndex, setActiveReceiptLineIndex] = useState(0);
  const [receiptLinePending, setReceiptLinePending] = useState(true);
  const [localInvoiceFieldErrors, setLocalInvoiceFieldErrors] = useState<Record<string, string>>({});
  const [localReceiptFieldErrors, setLocalReceiptFieldErrors] = useState<Record<string, string>>({});
  useEffect(() => {
    const lineError = Object.keys(invoiceFieldErrors).map((key) => key.match(/^lines\.(\d+)\./)).find(Boolean);
    if (lineError) {
      setActiveInvoiceLineIndex(Number(lineError[1]));
    }
  }, [invoiceFieldErrors]);
  useEffect(() => {
    const lineError = Object.keys(receiptFieldErrors).map((key) => key.match(/^lines\.(\d+)\./)).find(Boolean);
    if (lineError) {
      setActiveReceiptLineIndex(Number(lineError[1]));
      setReceiptLinePending(false);
    }
  }, [receiptFieldErrors]);
  const setInvoiceField = (key: keyof InvoiceForm, value: string) =>
    (onClearInvoiceFieldError(String(key)), onInvoiceChange((current) => ({ ...current, [key]: value })));
  const setReceiptField = (key: keyof ReceiptForm, value: string | boolean) => {
    onClearReceiptFieldError(String(key));
    if (key === "purchase_invoice_id") {
      onClearReceiptFieldError("*");
      setLocalReceiptFieldErrors({});
      setActiveReceiptLineIndex(0);
      setReceiptLinePending(true);
    }
    onReceiptChange((current) => ({ ...current, [key]: value, ...(key === "purchase_invoice_id" ? { is_committed: false, purchase_invoice_line_id: "", accepted_quantity: "", accepted_foc_quantity: "", rejected_quantity: "", target_inventory_id: "", target_location: "", additionalLines: [] } : {}) }));
  };
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

  const [invoiceSearch, setInvoiceSearch] = useState("");
  const availableInvoices = useGetPurchaseInvoicesQuery({ search: invoiceSearch || undefined, per_page: 100 }, { skip: !isOpen || action !== "createReceipt" });
  const invoiceOptions = (availableInvoices.currentData?.data || []).filter((invoice) => invoice.status !== "cancelled" && invoice.delivery_status !== "fully_received").map((invoice) => ({ value: String(invoice.id), label: invoice.invoice_number }));
  const { currentData: receiptInvoice, isFetching: invoiceLoading, isError: invoiceError } = useGetPurchaseInvoiceQuery(receiptForm.purchase_invoice_id, { skip: !isOpen || action !== "createReceipt" || !receiptForm.purchase_invoice_id });
  const receiptLines = receiptInvoice?.data.lines || [];
  const remaining = (line: (typeof receiptLines)[number]) => Number(line.remaining_quantity ?? Math.max(0, Number(line.quantity) - Number(line.received_quantity || 0)));
  const remainingFoc = (line: (typeof receiptLines)[number]) => Number(line.remaining_foc_quantity ?? Math.max(0, Number(line.foc_quantity || 0) - Number(line.received_foc_quantity || 0)));
  const eligibleLines = receiptLines.filter((line) => remaining(line) > 0 || remainingFoc(line) > 0);
  const invoiceLineSummaries = [invoiceForm, ...(invoiceForm.additionalLines || [])]
    .map((line, index) => {
      if (!line.is_committed) return null;
      const options = line.category === "medicine" ? medicineOptions : foodOptions;
      const item = options.find((option) => option.value === line.item_id);
      const uom = uomOptions.find((option) => option.value === line.purchase_uom_id);
      const quantity = Number(line.quantity) || 0;
      const unitPrice = Number(line.unit_price) || 0;
      const gross = Math.max(0, quantity * unitPrice);
      const discountValue = Math.max(0, Number(line.discount_value) || 0);
      const discount = Math.min(
        gross,
        line.discount_type === "percentage"
          ? (gross * Math.min(discountValue, 100)) / 100
          : line.discount_type === "amount"
            ? discountValue
            : 0
      );
      const tax = ((gross - discount) * Math.max(0, Number(line.tax_rate) || 0)) / 100;
      return item
        ? {
            index,
            item: item.label,
            category: line.category,
            quantity: line.quantity,
            uom: uom?.label || "—",
            unitPrice: line.unit_price,
            gross,
            discount,
            tax,
            total: gross - discount + tax,
          }
        : null;
    })
    .filter((line): line is NonNullable<typeof line> => line !== null);
  const invoiceLines = [invoiceForm, ...(invoiceForm.additionalLines || [])];
  const invoiceTotals = invoiceLineSummaries.reduce(
    (totals, line) => ({
      subtotal: totals.subtotal + line.gross,
      discount: totals.discount + line.discount,
      tax: totals.tax + line.tax,
      total: totals.total + line.total,
    }),
    { subtotal: 0, discount: 0, tax: 0, total: 0 }
  );
  const formatInvoiceMoney = (amount: number) =>
    `${invoiceForm.currency_code || "MMK"} ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const activeInvoiceLine = invoiceLines[Math.min(activeInvoiceLineIndex, invoiceLines.length - 1)] || invoiceForm;
  const receiptLinesInForm = [receiptForm, ...(receiptForm.additionalLines || [])];
  const activeReceiptLine = receiptLinesInForm[Math.min(activeReceiptLineIndex, receiptLinesInForm.length - 1)] || receiptForm;
  const activeSelectedReceiptLine = receiptLines.find((line) => String(line.id) === activeReceiptLine.purchase_invoice_line_id);
  const activeSelectedReceiptItem = invoiceItems.find((item) => item.id === activeSelectedReceiptLine?.item_id && item.category === activeSelectedReceiptLine?.category);
  const receiptLineSummaries = receiptLinesInForm.map((line, index) => {
    if (!line.is_committed || (receiptLinePending && index === activeReceiptLineIndex)) return null;
    const source = receiptLines.find((receiptLine) => String(receiptLine.id) === line.purchase_invoice_line_id);
    if (!source) return null;
    const item = invoiceItems.find((inventoryItem) => inventoryItem.id === source.item_id && inventoryItem.category === source.category);
    return { index, item: item?.name || source.item_name || source.description || "-", accepted: line.accepted_quantity || "—", remaining: remaining(source) };
  }).filter((line): line is NonNullable<typeof line> => line !== null);

  const content = (
      <div className={pageMode ? "space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6" : "space-y-4 p-6"}>
        {!pageMode && <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>}
        {!pageMode && (
          <p className="text-sm text-gray-500">
            Add the items to purchase or receive. Partial receipts leave remaining items available for later receipts.
          </p>
        )}

        {action === "cancelInvoice" && (
          <FormField label="Reason" required>
            <Input
              value={cancelReason}
              onChange={(event) => onCancelReasonChange(event.target.value)}
            />
          </FormField>
        )}

        {(action === "createInvoice" || action === "updateInvoice") && (
          <div className={`${pageMode ? "" : "max-h-[60vh] overflow-y-auto"} space-y-5 pr-2`}>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {action === "createInvoice" && (
                <FormField label="Invoice Number">
                  <Input
                    value={invoiceForm.invoice_number}
                    onChange={(event) => setInvoiceField("invoice_number", event.target.value)}
                  />
                </FormField>
              )}
              <FormField label="Invoice Date" required error={invoiceFieldErrors.invoice_date}>
                <DatePicker
                  id="purchase-invoice-date"
                  defaultDate={invoiceForm.invoice_date || undefined}
                  placeholder="Select invoice date"
                  onChange={(_, dateStr) => setInvoiceField("invoice_date", dateStr)}
                />
              </FormField>
              <FormField label="Supplier" required error={invoiceFieldErrors.supplier_id}>
                <Select
                  value={invoiceForm.supplier_id}
                  onChange={(e) => setInvoiceField("supplier_id", e.target.value)}
                  options={ensureOption(supplierOptions, invoiceForm.supplier_id)}
                  placeholder="Select supplier"
                />
              </FormField>
              <FormField label="Branch" required error={invoiceFieldErrors.branch_id}>
                <Select
                  value={invoiceForm.branch_id}
                  onChange={(e) => setInvoiceField("branch_id", e.target.value)}
                  options={ensureOption(branchOptions, invoiceForm.branch_id)}
                  placeholder="Select branch"
                />
              </FormField>
              <FormField label="Paid Amount" error={invoiceFieldErrors.paid_amount}>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={invoiceForm.paid_amount}
                  onChange={(event) => setInvoiceField("paid_amount", event.target.value)}
                />
              </FormField>
              <FormField label="Notes">
                <Input
                  value={invoiceForm.notes}
                  onChange={(event) => setInvoiceField("notes", event.target.value)}
                />
              </FormField>
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm dark:border-green-900 dark:bg-green-950/20">
                <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                  <span>Items subtotal</span>
                  <span className="tabular-nums">{formatInvoiceMoney(invoiceTotals.subtotal)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-gray-600 dark:text-gray-300">
                  <span>Discounts</span>
                  <span className="tabular-nums">−{formatInvoiceMoney(invoiceTotals.discount)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-gray-600 dark:text-gray-300">
                  <span>Tax</span>
                  <span className="tabular-nums">{formatInvoiceMoney(invoiceTotals.tax)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-green-200 pt-2 font-semibold text-gray-900 dark:border-green-900 dark:text-white">
                  <span>Total price ({invoiceLineSummaries.length} items)</span>
                  <span className="tabular-nums">{formatInvoiceMoney(invoiceTotals.total)}</span>
                </div>
              </div>
            </section>

            {[[activeInvoiceLine, activeInvoiceLineIndex] as const].map(([invoiceForm, lineIndex]) => {
              const itemOptions = invoiceForm.category === "medicine" ? medicineOptions : foodOptions;
              const lineError = (field: string) => localInvoiceFieldErrors[field] || invoiceFieldErrors[`lines.${lineIndex}.${field}`];
              const setInvoiceField = (key: keyof InvoiceForm, value: string) => {
                const item = key === "item_id" ? invoiceItems.find((item) => String(item.id) === value) : undefined;
                const clearedKeys = [key, ...(item ? ["purchase_uom_id", "stock_uom_id", "conversion_factor"] : []), ...(key === "category" ? ["item_id", "purchase_uom_id", "stock_uom_id", "conversion_factor"] : [])];
                clearedKeys.forEach((field) => onClearInvoiceFieldError(`lines.${lineIndex}.${field}`));
                setLocalInvoiceFieldErrors((errors) => {
                  const next = { ...errors };
                  clearedKeys.forEach((field) => delete next[field]);
                  return next;
                });
                onInvoiceChange((current) => {
                  const change = { [key]: value, ...(key === "category" ? { item_id: "", purchase_uom_id: "", stock_uom_id: "", conversion_factor: "" } : {}), ...(item ? { purchase_uom_id: String(item.purchase_uom_id || ""), stock_uom_id: String(item.stock_uom_id || ""), conversion_factor: String(item.uom_conversion || 1) } : {}) };
                  return lineIndex === 0 ? { ...current, ...change } : { ...current, additionalLines: current.additionalLines?.map((line, index) => index === lineIndex - 1 ? { ...line, ...change } : line) };
                });
              };
              return <React.Fragment key={lineIndex}>            <section className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white">Item {lineIndex + 1}</h3>
                {invoiceLineSummaries.some((line) => line.index === lineIndex) && <span className="text-xs text-gray-500">Editing selected item</span>}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
                <FormField label="Item" required error={lineError("item_id")}>
                  <Select
                    value={invoiceForm.item_id}
                    onChange={(e) => setInvoiceField("item_id", e.target.value)}
                    options={ensureOption(itemOptions, invoiceForm.item_id)}
                    placeholder="Select item"
                  />
                </FormField>
                <FormField label="Purchase UOM" required error={lineError("purchase_uom_id")}>
                  <Select
                    value={invoiceForm.purchase_uom_id}
                    onChange={(e) => setInvoiceField("purchase_uom_id", e.target.value)}
                    options={ensureOption(uomOptions, invoiceForm.purchase_uom_id)}
                    placeholder="Select purchase UOM"
                  />
                </FormField>
                <FormField label="Description">
                  <Input
                    value={invoiceForm.description}
                    onChange={(event) => setInvoiceField("description", event.target.value)}
                  />
                </FormField>
                <FormField label="Stock UOM" required error={lineError("stock_uom_id")}>
                  <Select
                    value={invoiceForm.stock_uom_id}
                    onChange={(e) => setInvoiceField("stock_uom_id", e.target.value)}
                    options={ensureOption(uomOptions, invoiceForm.stock_uom_id)}
                    placeholder="Select stock UOM"
                  />
                </FormField>
                <FormField label="Conversion Factor" required error={lineError("conversion_factor")}>
                  <Input
                    type="number"
                    step="any"
                    value={invoiceForm.conversion_factor}
                    onChange={(event) => setInvoiceField("conversion_factor", event.target.value)}
                  />
                </FormField>
                <FormField label="Quantity" required error={lineError("quantity")}>
                  <Input
                    type="number"
                    step="any"
                    value={invoiceForm.quantity}
                    onChange={(event) => setInvoiceField("quantity", event.target.value)}
                  />
                </FormField>
                <FormField label="Unit Price" required error={lineError("unit_price")}>
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
              </div>
            </section></React.Fragment>;
            })}
            <Button size="sm" onClick={() => {
              const conversionFactor = Number(activeInvoiceLine.conversion_factor);
              const quantity = Number(activeInvoiceLine.quantity);
              const unitPrice = Number(activeInvoiceLine.unit_price);
              const errors: Record<string, string> = {};
              if (!activeInvoiceLine.item_id) errors.item_id = "Select an item.";
              if (!activeInvoiceLine.purchase_uom_id) errors.purchase_uom_id = "Select a purchase UOM.";
              if (!activeInvoiceLine.stock_uom_id) errors.stock_uom_id = "Select a stock UOM.";
              if (!Number.isFinite(conversionFactor) || conversionFactor <= 0) errors.conversion_factor = "Enter a conversion factor greater than zero.";
              if (!Number.isFinite(quantity) || quantity <= 0) errors.quantity = "Enter a quantity greater than zero.";
              if (!Number.isFinite(unitPrice) || unitPrice < 0) errors.unit_price = "Enter a valid unit price.";
              setLocalInvoiceFieldErrors(errors);
              if (Object.keys(errors).length) {
                return;
              }
              setActiveInvoiceLineIndex(invoiceLines.length);
              onInvoiceChange((current) => {
                const lines = [current, ...(current.additionalLines || [])].map((line, index) =>
                  index === activeInvoiceLineIndex ? { ...line, is_committed: true } : line
                );
                const blankLine = {
                  ...invoiceFormFromPayload(foodInvoiceSample),
                  is_committed: false,
                  additionalLines: [],
                  item_id: "",
                  quantity: "",
                  unit_price: "",
                  purchase_uom_id: "",
                  stock_uom_id: "",
                  conversion_factor: "",
                  discount_type: "",
                  discount_value: "",
                  foc_type: "",
                  foc_value: "",
                };
                const nextLines = [...lines, blankLine];
                return { ...nextLines[0], additionalLines: nextLines.slice(1) };
              });
            }}>Add item</Button>
            <section className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white">Invoice items</h3>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  {invoiceLineSummaries.length}
                </span>
              </div>
              {invoiceLineSummaries.length ? (
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  <Table>
                    <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
                      <TableRow>
                        {["Item", "Category", "Quantity", "Purchase UOM", "Unit Price", "Actions"].map((label) => (
                          <TableCell key={label} isHeader className="whitespace-nowrap px-3 py-2 text-xs font-medium text-gray-500">
                            {label}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {invoiceLineSummaries.map((line) => (
                        <TableRow key={line.index}>
                          <TableCell className="min-w-[180px] px-3 py-2 text-sm font-medium text-gray-800 dark:text-gray-200">
                            {line.item}
                          </TableCell>
                          <TableCell className="px-3 py-2 text-sm capitalize text-gray-600 dark:text-gray-400">
                            {line.category}
                          </TableCell>
                          <TableCell className="px-3 py-2 text-sm tabular-nums text-gray-700 dark:text-gray-300">
                            {line.quantity || "—"}
                          </TableCell>
                          <TableCell className="min-w-[150px] px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                            {line.uom}
                          </TableCell>
                          <TableCell className="whitespace-nowrap px-3 py-2 text-right text-sm tabular-nums text-gray-700 dark:text-gray-300">
                            {line.unitPrice ? `${invoiceForm.currency_code} ${Number(line.unitPrice).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap px-3 py-2 text-right">
                            <div className="flex justify-end gap-2">
                              <button type="button" aria-label={`Edit item ${line.index + 1}`} title="Edit item" onClick={() => setActiveInvoiceLineIndex(line.index)} className="rounded-md border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"><Pencil size={15} /></button>
                              <button type="button" aria-label={`Delete item ${line.index + 1}`} title="Delete item" disabled={invoiceLines.length <= 1} onClick={() => {
                                const remainingLines = invoiceLines.filter((_, index) => index !== line.index);
                                onInvoiceChange((current) => ({ ...remainingLines[0], invoice_number: current.invoice_number, invoice_date: current.invoice_date, supplier_id: current.supplier_id, branch_id: current.branch_id, currency_code: current.currency_code, notes: current.notes, additionalLines: remainingLines.slice(1) }));
                                setActiveInvoiceLineIndex((index) => Math.max(0, index > line.index ? index - 1 : Math.min(index, remainingLines.length - 1)));
                              }} className="rounded-md border border-red-200 p-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-500/30 dark:text-red-400"><Trash2 size={15} /></button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Selected items will appear here.</p>
              )}
            </section>
          </div>
        )}

        {action === "createReceipt" && (
          <div className={`${pageMode ? "" : "max-h-[60vh] overflow-y-auto"} space-y-5 pr-2`}>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <FormField label="Receipt Number">
                <Input
                  value={receiptForm.receipt_number}
                  onChange={(event) => setReceiptField("receipt_number", event.target.value)}
                />
              </FormField>
              <FormField label="Find Invoice"><Input value={invoiceSearch} onChange={(event) => setInvoiceSearch(event.target.value)} placeholder="Search invoice number" /></FormField>
              <FormField label="Purchase Invoice" required error={receiptFieldErrors.purchase_invoice_id}>
                <Select
                  value={receiptForm.purchase_invoice_id}
                  onChange={(e) => setReceiptField("purchase_invoice_id", e.target.value)}
                  options={invoiceOptions}
                  placeholder="Select invoice"
                />
              </FormField>
              <FormField label="Receipt Date" required error={receiptFieldErrors.receipt_date}>
                <DatePicker
                  id="purchase-receipt-date"
                  defaultDate={receiptForm.receipt_date || undefined}
                  placeholder="Select receipt date"
                  onChange={(_, dateStr) => setReceiptField("receipt_date", dateStr)}
                />
              </FormField>
              <FormField label="Notes">
                <Input
                  value={receiptForm.notes}
                  onChange={(event) => setReceiptField("notes", event.target.value)}
                />
              </FormField>
            </section>

            {invoiceError && <p className="text-sm text-red-600">Unable to load invoice items. Select the invoice again to retry.</p>}
            {!invoiceLoading && receiptForm.purchase_invoice_id && !eligibleLines.length && <p className="text-sm">No remaining items available to receive.</p>}
            {[[activeReceiptLine, activeReceiptLineIndex] as const].map(([receiptForm, lineIndex]) => {
              const selectedLine = receiptLines.find((line) => String(line.id) === receiptForm.purchase_invoice_line_id);
              const selectedItem = invoiceItems.find((item) => item.id === selectedLine?.item_id && item.category === selectedLine?.category);
              const coldChainStatusRequired = selectedLine?.category === "medicine";
              const receiptLineError = (field: string) => localReceiptFieldErrors[field] || receiptFieldErrors[`lines.${lineIndex}.${field}`];
              const setReceiptField = (key: keyof ReceiptForm, value: string | boolean) => {
                const clearedKeys = [key, ...(key === "purchase_invoice_line_id" ? ["accepted_quantity", "accepted_foc_quantity", "target_inventory_id", "target_location"] : [])];
                clearedKeys.forEach((field) => onClearReceiptFieldError(`lines.${lineIndex}.${field}`));
                setLocalReceiptFieldErrors((errors) => { const next = { ...errors }; clearedKeys.forEach((field) => delete next[field]); return next; });
                onReceiptChange((current) => {
                const selected = key === "purchase_invoice_line_id" ? receiptLines.find((line) => String(line.id) === value) : undefined;
                const change = { [key]: value, ...(selected ? { accepted_quantity: "", accepted_foc_quantity: "", target_inventory_id: "", target_location: "" } : {}), ...(key === "cold_chain_required" && value === false ? { ...(!coldChainStatusRequired ? { cold_chain_status: "" } : {}), observed_temperature: "", temperature_uom: "", exception_reason: "" } : {}) };
                return lineIndex === 0 ? { ...current, ...change } : { ...current, additionalLines: current.additionalLines?.map((line, index) => index === lineIndex - 1 ? { ...line, ...change } : line) };
                });
              };
              return <React.Fragment key={lineIndex}>            <section className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white">Item {lineIndex + 1}</h3>
                {receiptLineSummaries.some((line) => line.index === lineIndex) && <span className="text-xs text-gray-500">Editing selected item</span>}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <FormField label="Invoice Item (ordered / received / remaining)" required error={receiptLineError("purchase_invoice_line_id")}>
                  <Select value={receiptForm.purchase_invoice_line_id} onChange={(event) => setReceiptField("purchase_invoice_line_id", event.target.value)} options={eligibleLines.filter((line) => !receiptLinesInForm.some((other, index) => index !== lineIndex && other.purchase_invoice_line_id === String(line.id))).map((line) => ({ value: String(line.id), label: `${String((line.item as { name?: string; code?: string } | undefined)?.name && `${(line.item as { code?: string }).code || ""} - ${(line.item as { name: string }).name}` || line.item_name || line.description || (line.category === "medicine" ? medicineOptions : foodOptions).find((option) => option.value === String(line.item_id))?.label || "Item #" + line.item_id)} · ${line.quantity} / ${line.received_quantity || 0} / ${remaining(line)} (FOC remaining: ${remainingFoc(line)})` }))} placeholder={invoiceLoading ? "Loading invoice items..." : "Select item"} disabled={invoiceLoading || invoiceError} />
                </FormField>
                <FormField label="Accepted Quantity" required error={receiptLineError("accepted_quantity")}>
                  <Input
                    type="number"
                    step="any"
                    min="0"
                    max={selectedLine ? remaining(selectedLine) : 0}
                    value={receiptForm.accepted_quantity}
                    onChange={(event) => setReceiptField("accepted_quantity", event.target.value)}
                  />
                </FormField>
                <FormField label="Accepted FOC Quantity" error={receiptLineError("accepted_foc_quantity")}>
                  <Input
                    type="number"
                    step="any"
                    min="0"
                    max={selectedLine ? remainingFoc(selectedLine) : 0}
                    value={receiptForm.accepted_foc_quantity}
                    onChange={(event) =>
                      setReceiptField("accepted_foc_quantity", event.target.value)
                    }
                  />
                </FormField>
                <FormField label="Rejected Quantity" error={receiptLineError("rejected_quantity")}>
                  <Input
                    type="number"
                    step="any"
                    value={receiptForm.rejected_quantity}
                    onChange={(event) => setReceiptField("rejected_quantity", event.target.value)}
                  />
                </FormField>
                <FormField label="Target Warehouse" required error={receiptLineError("target_inventory_id")}>
                  <Select
                    value={receiptForm.target_inventory_id}
                    onChange={(event) => setReceiptField("target_inventory_id", event.target.value)}
                    options={inventoryOptions.filter((option) => option.branch_id === receiptInvoice?.data.branch_id)}
                    placeholder="Select warehouse"
                  />
                </FormField>
                <FormField label="Target Location" required error={receiptLineError("target_location")}>
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
                <FormField label="Manufacturing Date">
                  <DatePicker
                    id={`purchase-receipt-manufacturing-date-${lineIndex}`}
                    defaultDate={receiptForm.manufacturing_date || undefined}
                    placeholder="Select manufacturing date"
                    onChange={(_, dateStr) => setReceiptField("manufacturing_date", dateStr)}
                  />
                </FormField>
                <FormField label="Expiry Date" required={!selectedLine || Boolean(selectedItem?.expiry_tracking)} error={receiptLineError("expiry_date")}>
                  <DatePicker
                    id={`purchase-receipt-expiry-date-${lineIndex}`}
                  value={receiptForm.expiry_date}
                    placeholder="Select expiry date"
                  required={Boolean(selectedItem?.expiry_tracking)}
                    onChange={(_, dateStr) => setReceiptField("expiry_date", dateStr)}
                  />
                </FormField>
                <label className="flex h-full items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Switch
                    checked={receiptForm.cold_chain_required}
                    onCheckedChange={(checked) => setReceiptField("cold_chain_required", checked)}
                    aria-label="Cold chain required"
                  />
                  Cold chain required
                </label>
                {(receiptForm.cold_chain_required || coldChainStatusRequired) && (
                  <>
                    <FormField label="Cold Chain Status" required={receiptForm.cold_chain_required || coldChainStatusRequired} error={receiptLineError("cold_chain_status")}>
                      <Select
                        value={receiptForm.cold_chain_status}
                        onChange={(event) => setReceiptField("cold_chain_status", event.target.value)}
                        options={[
                          { value: "compliant", label: "Compliant" },
                          { value: "breached", label: "Breached" },
                          { value: "unknown", label: "Unknown" },
                        ]}
                        placeholder="Select status"
                      />
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
                  </>
                )}
              </div>
            </section></React.Fragment>;
            })}
            <Button size="sm" onClick={() => {
              const accepted = Number(activeReceiptLine.accepted_quantity);
              const acceptedFoc = Number(activeReceiptLine.accepted_foc_quantity || 0);
              const rejected = Number(activeReceiptLine.rejected_quantity || 0);
              const errors: Record<string, string> = {};
              if (!activeReceiptLine.purchase_invoice_line_id) errors.purchase_invoice_line_id = "Select an invoice item.";
              if (!Number.isFinite(accepted) || accepted < 0 || !Number.isFinite(acceptedFoc) || acceptedFoc < 0 || !Number.isFinite(rejected) || rejected < 0 || accepted + acceptedFoc + rejected <= 0) errors.accepted_quantity = "Enter a valid received, FOC, or rejected quantity.";
              if (!Number.isFinite(acceptedFoc) || acceptedFoc < 0) errors.accepted_foc_quantity = "Enter a valid FOC quantity.";
              if (!Number.isFinite(rejected) || rejected < 0) errors.rejected_quantity = "Enter a valid rejected quantity.";
              if (!activeReceiptLine.target_inventory_id) errors.target_inventory_id = "Select a target warehouse.";
              if (!activeReceiptLine.target_location.trim()) errors.target_location = "Enter a target location.";
              if (receiptLinesInForm.some((line, index) => index !== activeReceiptLineIndex && line.purchase_invoice_line_id === activeReceiptLine.purchase_invoice_line_id && activeReceiptLine.purchase_invoice_line_id)) errors.purchase_invoice_line_id = "This invoice item is already on the receipt.";
              if (activeSelectedReceiptItem?.expiry_tracking && !activeReceiptLine.expiry_date) errors.expiry_date = "Expiry date is required for this item.";
              if ((activeReceiptLine.cold_chain_required || activeSelectedReceiptLine?.category === "medicine") && !activeReceiptLine.cold_chain_status) errors.cold_chain_status = "Select a cold-chain status.";
              setLocalReceiptFieldErrors(errors);
              if (Object.keys(errors).length) {
                toast.error("Please fix the highlighted receipt item fields.");
                return;
              }
              setReceiptLinePending(true);
              setActiveReceiptLineIndex(receiptLinesInForm.length);
              onReceiptChange((current) => {
                const lines = [current, ...(current.additionalLines || [])].map((line, index) =>
                  index === activeReceiptLineIndex ? { ...line, is_committed: true } : line
                );
                const blankLine = {
                  ...lines[activeReceiptLineIndex],
                  is_committed: false,
                  additionalLines: [],
                  purchase_invoice_line_id: "",
                  accepted_quantity: "",
                  accepted_foc_quantity: "",
                  rejected_quantity: "",
                  target_inventory_id: "",
                  target_location: "",
                  supplier_batch_number: "",
                  manufacturing_date: "",
                  expiry_date: "",
                  cold_chain_required: false,
                  cold_chain_status: "",
                  observed_temperature: "",
                  temperature_uom: "",
                  exception_reason: "",
                };
                const nextLines = [...lines, blankLine];
                return { ...nextLines[0], additionalLines: nextLines.slice(1) };
              });
            }}>Add item</Button>
            <section className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white">Receipt items</h3>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">{receiptLineSummaries.length}</span>
              </div>
              {receiptLineSummaries.length ? (
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  <Table>
                    <TableHeader className="bg-gray-50 dark:bg-gray-800/50"><TableRow>{["Item", "Accepted Quantity", "Remaining", "Actions"].map((label) => <TableCell key={label} isHeader className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-gray-500">{label}</TableCell>)}</TableRow></TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {receiptLineSummaries.map((line) => <TableRow key={line.index}>
                        <TableCell className="min-w-[180px] px-3 py-2 text-sm font-medium text-gray-800 dark:text-gray-200">{String(line.item)}</TableCell>
                        <TableCell className="px-3 py-2 text-sm tabular-nums text-gray-700 dark:text-gray-300">{line.accepted}</TableCell>
                        <TableCell className="px-3 py-2 text-sm tabular-nums text-gray-700 dark:text-gray-300">{line.remaining}</TableCell>
                        <TableCell className="whitespace-nowrap px-3 py-2 text-right"><div className="flex justify-end gap-2">
                          <button type="button" aria-label={`Edit receipt item ${line.index + 1}`} title="Edit item" onClick={() => { setActiveReceiptLineIndex(line.index); setReceiptLinePending(false); }} className="rounded-md border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"><Pencil size={15} /></button>
                          <button type="button" aria-label={`Delete receipt item ${line.index + 1}`} title="Delete item" disabled={receiptLinesInForm.length <= 1} onClick={() => {
                            const remainingItems = receiptLinesInForm.filter((_, index) => index !== line.index);
                            onReceiptChange((current) => ({ ...remainingItems[0], receipt_number: current.receipt_number, purchase_invoice_id: current.purchase_invoice_id, receipt_date: current.receipt_date, idempotency_key: current.idempotency_key, notes: current.notes, additionalLines: remainingItems.slice(1) }));
                            setActiveReceiptLineIndex((index) => Math.max(0, index > line.index ? index - 1 : Math.min(index, remainingItems.length - 1)));
                          }} className="rounded-md border border-red-200 p-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-500/30 dark:text-red-400"><Trash2 size={15} /></button>
                        </div></TableCell>
                      </TableRow>)}
                    </TableBody>
                  </Table>
                </div>
              ) : <p className="text-sm text-gray-500">Added receipt items will appear here.</p>}
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
            disabled={isSaving || (action === "createReceipt" && (invoiceLoading || invoiceError || !receiptInvoice)) || (action === "cancelInvoice" && !cancelReason.trim())}
            onClick={onSubmit}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
  );

  if (pageMode) return content;
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="m-4 max-w-4xl">
      {content}
    </Modal>
  );
}

function FormField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
      <span className="mb-1.5 block">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs font-normal text-red-600 dark:text-red-400">{error}</span>}
    </label>
  );
}

const responseRecord = (data: unknown): Record<string, unknown> | null => {
  if (!data || typeof data !== "object") return null;
  const wrapper = data as { data?: unknown };
  const value = wrapper.data && typeof wrapper.data === "object" ? wrapper.data : data;
  return value as Record<string, unknown>;
};

function ResponseModal({ data, onClose, suppliers, branches, warehouses, invoices, items }: {
  data: unknown | null;
  onClose: () => void;
  suppliers: Array<{ id: number; code?: string; name: string }>;
  branches: Array<{ id: number; code?: string; name: string }>;
  warehouses: Array<{ id: number; code?: string; name: string }>;
  invoices: Array<{ id: number; invoice_number: string }>;
  items: InventoryItem[];
}) {
  const record = responseRecord(data);
  const fieldEntries = Object.entries(record || {}).filter(
    ([, value]) => !Array.isArray(value) && (value === null || typeof value !== "object")
  );
  const lines = Array.isArray(record?.lines) ? (record.lines as Record<string, unknown>[]) : [];
  const lineKeys = [
    "id",
    "line_number",
    "category",
    "item_id",
    "quantity",
    "accepted_quantity",
    "target_inventory_id",
    "target_location",
    "cold_chain_status",
  ];
  const relatedValue = (key: string, value: unknown, line?: Record<string, unknown>) => {
    const id = Number(value);
    if (!Number.isFinite(id) || !value) return formatValue(value);
    let related: { code?: string; name?: string } | undefined;
    if (key === "supplier_id") related = suppliers.find((item) => item.id === id);
    if (key === "branch_id") related = branches.find((item) => item.id === id);
    if (key === "purchase_invoice_id") {
      const invoice = invoices.find((item) => item.id === id);
      if (invoice) return `${invoice.invoice_number} (#${id})`;
    }
    if (key === "target_inventory_id") related = warehouses.find((item) => item.id === id);
    if (key === "item_id") {
      const category = String(line?.category || "");
      related = items.find((item) => item.id === id && (!category || item.category === category));
    }
    if (key === "purchase_invoice_line_id") return `Invoice item #${id}`;
    return related ? `${related.code ? `${related.code} — ` : ""}${related.name || ""} (#${id})` : formatValue(value);
  };

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
                  <Input value={relatedValue(key, value)} disabled />
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
                            className={`px-4 py-3 text-xs font-medium text-gray-500 ${isNumericColumn(key) ? "text-right" : "text-start"}`}
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
                            <TableCell
                              key={key}
                              className={`px-4 py-3 text-sm text-gray-500 ${isNumericColumn(key) ? "text-right tabular-nums" : ""}`}
                            >
                              {relatedValue(key, line[key], line)}
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
