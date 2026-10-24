"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import DatePicker from "@/components/form/date-picker";
import Button from "@/components/ui/button/Button";
import FarmStatusBadge from "@/components/farms/FarmStatusBadge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import TableActionButton from "@/components/ui/table/TableActionButton";
import { Modal } from "@/components/ui/modal";
import { CheckCircle2, Eye, ReceiptText, XCircle } from "lucide-react";
import { useGetFarmInformationListQuery } from "@/redux/features/setup/FarmInformationApiSlice";
import { useGetAnimalsQuery } from "@/redux/features/setup/AnimalApiSlice";
import { useGetSuppliersQuery } from "@/redux/features/setup/SupplierApiSlice";
import { useGetInventoriesQuery } from "@/redux/features/setup/InventoryApiSlice";
import { useGetUomsQuery } from "@/redux/features/setup/UomApiSlice";
import { useGetBranchesQuery } from "@/redux/features/setup/BranchApiSlice";
import { useGetCashbooksQuery } from "@/redux/features/financial/CashbookApiSlice";
import { InventoryItem, useGetInventoryItemsQuery } from "@/redux/features/inventory/InventoryFoundationApiSlice";
import {
  PurchaseInvoice, useGetPurchaseInvoicesQuery, useLazyGetPurchaseInvoiceQuery,
  useGetPurchaseReceiptsQuery, useCreatePurchaseInvoiceMutation,
  useCreatePurchaseReceiptMutation, useConfirmPurchaseReceiptMutation,
  useUpdatePurchaseInvoiceMutation, useCancelPurchaseInvoiceMutation, useConfirmPurchaseInvoiceMutation,
  useLazyGetPurchaseReceiptQuery, useGetPurchaseInvoiceQuery, useGetPurchaseReceiptQuery, useUpdatePurchaseReceiptMutation,
} from "@/redux/features/purchasing/PurchasingFoundationApiSlice";

type Mode = "batch" | "individual" | "serial" | "quantity";
type FarmInvoiceLineDraft = { category: string; item_id: number; purchase_uom_id: number; stock_uom_id: number; conversion_factor: number; quantity: number; unit_price: number; discount_type: string; discount_value: number; tax_rate: number; foc_type: string; foc_value: number; target_inventory_id: number; target_farm_information_id: number; item_name: string; item_code: string };
type FarmReceiptLineDraft = { purchase_invoice_line_id: number; accepted_quantity: number; accepted_foc_quantity: number; rejected_quantity: number; target_inventory_id: number; target_farm_information_id?: number; metadata: Record<string, unknown>; item_name: string; item_code: string; category: string };
type Identity = { rfid: string; gender: string; date_of_birth: string; weight: string; weight_uom: string; serial_number: string; asset_tag: string; condition: string; foc: boolean };
const today = () => new Date().toLocaleDateString("en-CA");
const input = "h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-green-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100";
const panel = "rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]";
const modeHelp: Record<Mode, string> = { batch: "Receive a herd as one batch with a batch number.", individual: "Record one RFID for every paid and free animal.", serial: "Record a serial number or asset tag for every unit.", quantity: "Receive equipment as a quantity without individual identities." };
const errorText = (error: unknown) => { const e = error as { data?: { message?: string; errors?: Record<string, string[]> } }; return (e.data?.errors && Object.values(e.data.errors).flat()[0]) || e.data?.message || "Request failed"; };
const detailsRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object") return null;
  const wrapper = value as { data?: unknown };
  const record = wrapper.data && typeof wrapper.data === "object" ? wrapper.data : value;
  return record as Record<string, unknown>;
};
const readableLabel = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const readableValue = (value: unknown) => value === null || value === undefined || value === "" ? "-" : typeof value === "object" ? JSON.stringify(value) : String(value);
const emptyIdentity = (): Identity => ({ rfid: "", gender: "unknown", date_of_birth: "", weight: "", weight_uom: "kg", serial_number: "", asset_tag: "", condition: "", foc: false });
const farmInvoiceLineTotals = (line: Pick<FarmInvoiceLineDraft, "quantity" | "unit_price" | "discount_type" | "discount_value" | "tax_rate">) => {
  const subtotal = Math.max(0, line.quantity * line.unit_price);
  const discountValue = Math.max(0, line.discount_value);
  const discount = Math.min(subtotal, line.discount_type === "percentage" ? subtotal * Math.min(discountValue, 100) / 100 : line.discount_type === "fixed" ? discountValue : 0);
  const tax = (subtotal - discount) * Math.max(0, line.tax_rate) / 100;
  return { subtotal, discount, tax, total: subtotal - discount + tax };
};

export default function FarmReceivingPage({ tab, invoiceForm = false, receiptForm = false }: { tab: "invoices" | "receipts"; invoiceForm?: boolean; receiptForm?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editInvoiceId = invoiceForm ? searchParams.get("edit") : null;
  const editReceiptId = receiptForm ? searchParams.get("edit") : null;
  const editingInvoiceQuery = useGetPurchaseInvoiceQuery(editInvoiceId || "", { skip: !editInvoiceId });
  const editingReceiptQuery = useGetPurchaseReceiptQuery(editReceiptId || "", { skip: !editReceiptId });
  const [mode, setMode] = useState<Mode>("batch");
  const [farmId, setFarmId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [inventoryId, setInventoryId] = useState("");
  const [itemId, setItemId] = useState("");
  const [invoiceLines, setInvoiceLines] = useState<FarmInvoiceLineDraft[]>([]);
  const [invoiceDate, setInvoiceDate] = useState(today);
  const [receiptDate, setReceiptDate] = useState(today);
  const [receiptNumber, setReceiptNumber] = useState("");
  const [receiptNotes, setReceiptNotes] = useState("");
  const [quantity, setQuantity] = useState("");
  const [focQuantity, setFocQuantity] = useState("0");
  const [unitPrice, setUnitPrice] = useState("");
  const [discountType, setDiscountType] = useState("none");
  const [discountValue, setDiscountValue] = useState("");
  const [taxRate, setTaxRate] = useState("0");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [selectedInvoiceRecord, setSelectedInvoiceRecord] = useState<PurchaseInvoice | null>(null);
  const [selectedInvoiceLineId, setSelectedInvoiceLineId] = useState("");
  const [receiptLines, setReceiptLines] = useState<FarmReceiptLineDraft[]>([]);
  const [editingReceiptLineIndex, setEditingReceiptLineIndex] = useState<number | null>(null);
  const [accepted, setAccepted] = useState("");
  const [acceptedFoc, setAcceptedFoc] = useState("");
  const [rejectedQuantity, setRejectedQuantity] = useState("0");
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [busy, setBusy] = useState(false);
  const [details, setDetails] = useState<{ title: string; data: unknown } | null>(null);
  const [cancelTarget, setCancelTarget] = useState<PurchaseInvoice | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [confirmTarget, setConfirmTarget] = useState<PurchaseInvoice | null>(null);
  const [confirmCashbookId, setConfirmCashbookId] = useState("");
  const category = mode === "batch" || mode === "individual" ? "animal" : "equipment";
  const { data: farmsResponse } = useGetFarmInformationListQuery({ per_page: 100 });
  const { data: branchesResponse } = useGetBranchesQuery({ per_page: 100 });
  const { data: animalMasters } = useGetAnimalsQuery({ per_page: 100 });
  const { data: suppliersResponse } = useGetSuppliersQuery({ per_page: 100 });
  const { data: inventoriesResponse } = useGetInventoriesQuery({ per_page: 100 });
  const { data: uomsResponse } = useGetUomsQuery({ per_page: 100 });
  const { data: itemsResponse, isError: itemsError } = useGetInventoryItemsQuery({ category, status: "active", per_page: 100 });
  const { data: invoicesResponse, isError: invoicesError } = useGetPurchaseInvoicesQuery({ per_page: 100 });
  const { data: receiptsResponse, isError: receiptsError } = useGetPurchaseReceiptsQuery({ per_page: 100 });
  const { data: cashbooksResponse, isLoading: cashbooksLoading } = useGetCashbooksQuery({ branch_id: confirmTarget?.branch_id, status: "active", per_page: 100 }, { skip: !confirmTarget });
  const [createInvoice] = useCreatePurchaseInvoiceMutation();
  const [updateInvoice] = useUpdatePurchaseInvoiceMutation();
  const [cancelInvoice] = useCancelPurchaseInvoiceMutation();
  const [confirmInvoice, confirmInvoiceState] = useConfirmPurchaseInvoiceMutation();
  const [createReceipt] = useCreatePurchaseReceiptMutation();
  const [updateReceipt, updateReceiptState] = useUpdatePurchaseReceiptMutation();
  const [confirmReceipt] = useConfirmPurchaseReceiptMutation();
  const [getInvoice] = useLazyGetPurchaseInvoiceQuery();
  const [getReceipt] = useLazyGetPurchaseReceiptQuery();
  const farms = farmsResponse?.data || [];
  const branches = (branchesResponse?.data || []).filter((branch) => branch.status === "active");
  const branchFarms = farms.filter((farmRecord) => String(farmRecord.branch_id) === branchId);
  const countUomId = uomsResponse?.data.find((uom) => uom.status === "active" && uom.code === "HEAD-FARM")?.id ?? uomsResponse?.data.find((uom) => uom.status === "active" && uom.category === "count")?.id;
  const itemStockUomId = (item?: InventoryItem) => item?.stock_uom_id || Number(item?.purchase_uom_id) || countUomId;
  const farm = farms.find((item) => String(item.id) === farmId);
  const selectedItem = itemsResponse?.data.find((item) => String(item.id) === itemId);
  const eligibleItems = (itemsResponse?.data || []).filter((item) => mode === "batch" || mode === "individual" ? animalMasters?.data.some((animal) => animal.id === item.itemable_id && animal.tracking_type === mode) : mode === "quantity" ? !item.serial_tracking : true);
  const farmCategories = ["animal", "equipment"];
  const invoices = (invoicesResponse?.data || []).filter((invoice) => invoice.lines?.some((line) => farmCategories.includes(String(line.category))));
  const matchingFarmInvoices = invoices.filter((invoice) => invoice.invoice_number.toLowerCase().includes(invoiceSearch.trim().toLowerCase()));
  const receipts = (receiptsResponse?.data || []).filter((receipt) => receipt.lines?.some((line) => farmCategories.includes(String(line.category))));
  const confirmCashbooks = (cashbooksResponse?.data || []).filter((cashbook) => cashbook.status === "active" && cashbook.currency_code === "MMK" && cashbook.branch_id === confirmTarget?.branch_id);
  const detailRecord = detailsRecord(details?.data);
  const detailLines = Array.isArray(detailRecord?.lines) ? detailRecord.lines.filter((line): line is Record<string, unknown> => Boolean(line) && typeof line === "object") : [];
  const selectedInvoice = selectedInvoiceRecord?.id === Number(selectedInvoiceId) ? selectedInvoiceRecord : invoicesResponse?.data.find((invoice) => String(invoice.id) === selectedInvoiceId);
  const selectedLine = selectedInvoice?.lines?.find((line) => String(line.id) === selectedInvoiceLineId);
  const remainingQuantity = (line: NonNullable<PurchaseInvoice["lines"]>[number]) => Number(line.remaining_quantity ?? Math.max(0, Number(line.quantity) - Number(line.received_quantity || 0)));
  const remainingFocQuantity = (line: NonNullable<PurchaseInvoice["lines"]>[number]) => Number(line.remaining_foc_quantity ?? Math.max(0, Number(line.foc_quantity || 0) - Number(line.received_foc_quantity || 0)));
  const invoiceTotals = invoiceLines.reduce((totals, line) => {
    const lineTotals = farmInvoiceLineTotals(line);
    return { subtotal: totals.subtotal + lineTotals.subtotal, discount: totals.discount + lineTotals.discount, tax: totals.tax + lineTotals.tax, total: totals.total + lineTotals.total };
  }, { subtotal: 0, discount: 0, tax: 0, total: 0 });
  const modeForInvoiceLine = (line: NonNullable<PurchaseInvoice["lines"]>[number]): Mode => {
    const item = itemsResponse?.data.find((candidate) => candidate.id === line.item_id);
    if (line.category === "animal") {
      const animal = animalMasters?.data.find((candidate) => candidate.id === item?.itemable_id);
      return animal?.tracking_type === "individual" ? "individual" : "batch";
    }
    return item?.serial_tracking ? "serial" : "quantity";
  };
  const count = Math.max(0, Math.floor(Number(accepted) + Number(acceptedFoc)));
  useEffect(() => {
    const invoice = editingInvoiceQuery.data?.data;
    const lines = invoice?.lines || [];
    const line = lines[0];
    if (!invoice) return;
    setInvoiceDate(invoice.invoice_date?.slice(0, 10) || today());
    setInvoiceNumber(invoice.invoice_number || "");
    setPaidAmount(invoice.paid_amount !== undefined && invoice.paid_amount !== null ? String(invoice.paid_amount) : "");
    setSupplierId(String(invoice.supplier_id));
    setBranchId(String(invoice.branch_id || ""));
    if (!line) return;
    setFarmId(String(line.target_farm_information_id || ""));
    setInventoryId(String(line.target_inventory_id || ""));
    setInvoiceLines(lines.map((invoiceLine) => {
      const item = itemsResponse?.data.find((inventoryItem) => inventoryItem.id === invoiceLine.item_id);
      return { category: invoiceLine.category, item_id: invoiceLine.item_id, purchase_uom_id: invoiceLine.purchase_uom_id, stock_uom_id: invoiceLine.stock_uom_id, conversion_factor: Number(invoiceLine.conversion_factor || 1), quantity: Number(invoiceLine.quantity), unit_price: Number(invoiceLine.unit_price), discount_type: invoiceLine.discount_type || "none", discount_value: Number(invoiceLine.discount_value || 0), tax_rate: Number(invoiceLine.tax_rate || 0), foc_type: invoiceLine.foc_type || "quantity", foc_value: Number(invoiceLine.foc_value || 0), target_inventory_id: Number(invoiceLine.target_inventory_id || 0), target_farm_information_id: Number(invoiceLine.target_farm_information_id || 0), item_name: item?.name || `Item ${invoiceLine.item_id}`, item_code: item?.code || String(invoiceLine.item_id) };
    }));
    if (line.category === "animal") {
      const inventoryItem = itemsResponse?.data.find((item) => item.id === line.item_id);
      const animal = animalMasters?.data.find((item) => item.id === inventoryItem?.itemable_id);
      setMode(animal?.tracking_type === "individual" ? "individual" : "batch");
    } else {
      const inventoryItem = itemsResponse?.data.find((item) => item.id === line.item_id);
      setMode(inventoryItem?.serial_tracking ? "serial" : "quantity");
    }
  }, [editingInvoiceQuery.data?.data, itemsResponse?.data, animalMasters?.data]);
  useEffect(() => {
    const receipt = editingReceiptQuery.data?.data;
    if (!receipt) return;
    setReceiptNumber(receipt.receipt_number || "");
    setReceiptDate(receipt.receipt_date?.slice(0, 10) || today());
    setReceiptNotes(receipt.notes || "");
    setSelectedInvoiceId(String(receipt.purchase_invoice_id));
    const invoice = invoicesResponse?.data.find((candidate) => candidate.id === receipt.purchase_invoice_id);
    if (invoice) {
      setSelectedInvoiceRecord(invoice);
      setBranchId(String(invoice.branch_id));
    }
    const lines = (receipt.lines || []).filter((line) => farmCategories.includes(String(line.category))).map((line) => {
      const item = line.item as { name?: string; code?: string } | undefined;
      const inventoryItem = itemsResponse?.data.find((candidate) => candidate.id === line.item_id);
      return {
        purchase_invoice_line_id: line.purchase_invoice_line_id,
        accepted_quantity: Number(line.accepted_quantity || 0),
        accepted_foc_quantity: Number(line.accepted_foc_quantity || 0),
        rejected_quantity: Number(line.rejected_quantity || 0),
        target_inventory_id: Number(line.target_inventory_id || 0),
        ...(line.target_farm_information_id ? { target_farm_information_id: Number(line.target_farm_information_id) } : {}),
        metadata: line.metadata && typeof line.metadata === "object" ? line.metadata as Record<string, unknown> : {},
        item_name: item?.name || inventoryItem?.name || `Item ${line.item_id}`,
        item_code: item?.code || inventoryItem?.code || String(line.item_id),
        category: String(line.category),
      };
    });
    setReceiptLines(lines);
    setEditingReceiptLineIndex(null);
  }, [editingReceiptQuery.data?.data, invoicesResponse?.data, itemsResponse?.data]);
  const onMode = (next: Mode) => { setMode(next); setItemId(""); setSelectedInvoiceId(""); setSelectedInvoiceRecord(null); setIdentities([]); };
  const selectInvoice = (invoice: PurchaseInvoice) => {
    setSelectedInvoiceId(String(invoice.id));
    setSelectedInvoiceRecord(invoice);
    setBranchId(String(invoice.branch_id));
    const line = invoice.lines?.find((invoiceLine) => farmCategories.includes(invoiceLine.category));
    setSelectedInvoiceLineId(line ? String(line.id) : "");
    setReceiptLines([]);
    setAccepted("");
    setRejectedQuantity("0");
    setAcceptedFoc("");
    setInventoryId(String(line?.target_inventory_id ?? ""));
    setFarmId(String(line?.target_farm_information_id ?? ""));
    setIdentities([]);
    if (line) setMode(modeForInvoiceLine(line));
  };
  const selectInvoiceLine = (lineId: string) => {
    setSelectedInvoiceLineId(lineId);
    const line = selectedInvoice?.lines?.find((invoiceLine) => String(invoiceLine.id) === lineId);
    if (!line) return;
    setAccepted("");
    setRejectedQuantity("0");
    setAcceptedFoc("");
    setInventoryId(String(line.target_inventory_id ?? ""));
    setFarmId(String(line.target_farm_information_id ?? ""));
    setIdentities([]);
    setMode(modeForInvoiceLine(line));
  };
  const updateIdentity = (index: number, key: keyof Identity, value: string | boolean) => setIdentities((old) => { const next = [...old]; next[index] = { ...(next[index] || emptyIdentity()), [key]: value }; return next; });
  const setIdentityCount = () => { if (count > 100) return toast.error("Enter at most 100 identities at a time."); setIdentities((old) => Array.from({ length: count }, (_, index) => old[index] || { ...emptyIdentity(), foc: index >= count - Number(acceptedFoc) })); };
  const run = async (call: () => Promise<unknown>, message: string) => { setBusy(true); try { await call(); toast.success(message); } catch (error) { toast.error(errorText(error)); } finally { setBusy(false); } };
  const addInvoiceLine = () => {
    if (!branchId) return toast.error("Select a branch.");
    if (!farm) return toast.error("Select a farm.");
    if (!itemId || !selectedItem) return toast.error("Select an item.");
    const stockUomId = itemStockUomId(selectedItem);
    if (!stockUomId) return toast.error("No active count unit is available for this item.");
    const gross = Number(quantity) * Number(unitPrice);
    const parsedDiscount = Number(discountValue) || 0;
    if (Number(quantity) <= 0 || !Number.isInteger(Number(quantity)) || !unitPrice || Number(unitPrice) < 0 || !Number.isInteger(Number(focQuantity)) || Number(focQuantity) < 0 || parsedDiscount < 0 || !Number.isFinite(Number(taxRate)) || Number(taxRate) < 0) return toast.error("Enter valid quantities, price, discount and tax rate.");
    if ((discountType === "percentage" && parsedDiscount > 100) || (discountType === "fixed" && parsedDiscount > gross)) return toast.error("Discount cannot exceed the item subtotal.");
    setInvoiceLines((lines) => [...lines, { category, item_id: selectedItem.id, purchase_uom_id: stockUomId, stock_uom_id: stockUomId, conversion_factor: 1, quantity: Number(quantity), unit_price: Number(unitPrice), discount_type: discountType, discount_value: parsedDiscount, tax_rate: Number(taxRate), foc_type: "quantity", foc_value: Number(focQuantity), target_inventory_id: 0, target_farm_information_id: farm.id, item_name: selectedItem.name, item_code: selectedItem.code }]);
    setItemId("");
    setQuantity("");
    setFocQuantity("0");
    setUnitPrice("");
    setDiscountType("none");
    setDiscountValue("");
    setTaxRate("0");
  };
  const editInvoiceLine = (index: number) => {
    const line = invoiceLines[index];
    setMode(line.category === "animal" ? "batch" : "quantity");
    setItemId(String(line.item_id));
    setInventoryId(String(line.target_inventory_id));
    setFarmId(String(line.target_farm_information_id));
    setQuantity(String(line.quantity));
    setFocQuantity(String(line.foc_value));
    setUnitPrice(String(line.unit_price));
    setDiscountType(line.discount_type || "none");
    setDiscountValue(String(line.discount_value || ""));
    setTaxRate(String(line.tax_rate ?? 0));
    setInvoiceLines((lines) => lines.filter((_, lineIndex) => lineIndex !== index));
  };
  const saveInvoice = () => {
    if (!branchId || !farm || farm.branch_id !== Number(branchId) || !supplierId || !invoiceLines.length) return toast.error("Select a branch, a farm in that branch, a supplier and add at least one invoice item.");
    if (paidAmount.trim() && (!Number.isFinite(Number(paidAmount)) || Number(paidAmount) < 0)) return toast.error("Enter a valid paid amount.");
    void run(async () => {
      const payload = { invoice_number: invoiceNumber.trim() || undefined, invoice_date: invoiceDate, supplier_id: Number(supplierId), branch_id: Number(branchId), ...(paidAmount.trim() ? { paid_amount: Number(paidAmount) } : {}), lines: invoiceLines.map((line) => ({ category: line.category, item_id: line.item_id, purchase_uom_id: line.purchase_uom_id, stock_uom_id: line.stock_uom_id, conversion_factor: line.conversion_factor, quantity: line.quantity, unit_price: line.unit_price, ...(line.discount_type !== "none" ? { discount_type: line.discount_type } : {}), discount_value: line.discount_value, foc_type: line.foc_type, foc_value: line.foc_value, tax_rate: line.tax_rate, target_farm_information_id: line.target_farm_information_id })) };
      if (editInvoiceId) await updateInvoice({ id: editInvoiceId, body: payload }).unwrap();
      else await createInvoice(payload).unwrap();
      router.push("/farms/receiving/invoices");
    }, editInvoiceId ? "Purchase invoice updated." : "Purchase invoice created.");
  };
  const addReceiptLine = () => {
    if (!selectedInvoice || !selectedLine || !inventoryId || Number(accepted) < 0 || Number(acceptedFoc) < 0 || Number(rejectedQuantity) < 0 || Number(accepted) + Number(acceptedFoc) + Number(rejectedQuantity) <= 0) return toast.error("Select an invoice item, target warehouse, then enter accepted, FOC, or rejected quantity.");
    if (selectedLine.category === "animal" && (!farm || farm.branch_id !== selectedInvoice.branch_id)) return toast.error("Select a target farm in the invoice branch.");
    if (!Number.isInteger(Number(accepted)) || !Number.isInteger(Number(acceptedFoc)) || !Number.isInteger(Number(rejectedQuantity))) return toast.error("Animals and equipment must be received as whole units.");
    if (Number(accepted) + Number(rejectedQuantity) > remainingQuantity(selectedLine) || Number(acceptedFoc) > remainingFocQuantity(selectedLine)) return toast.error("The receipt quantities cannot exceed the remaining invoice quantities.");
    if ((mode === "individual" || mode === "serial") && (identities.length !== count || identities.some((id) => mode === "individual" ? !id.rfid.trim() : !id.serial_number.trim() && !id.asset_tag.trim()))) return toast.error("Add one identity per accepted or FOC unit.");
    if ((mode === "individual" || mode === "serial") && identities.filter((id) => id.foc).length !== Number(acceptedFoc)) return toast.error("FOC identity count must match accepted FOC quantity.");
    const metadata: Record<string, unknown> = mode === "batch" ? {} : mode === "individual" ? { animals: identities.map((id) => ({ rfid: id.rfid.trim(), gender: id.gender, ...(id.date_of_birth ? { date_of_birth: id.date_of_birth } : {}), ...(id.weight ? { weight: Number(id.weight), weight_uom: id.weight_uom } : {}), ...(id.foc ? { foc: true } : {}) })) } : mode === "serial" ? { units: identities.map((id) => ({ ...(id.serial_number.trim() ? { serial_number: id.serial_number.trim() } : {}), ...(id.asset_tag.trim() ? { asset_tag: id.asset_tag.trim() } : {}), ...(id.condition ? { condition: id.condition } : {}), ...(id.foc ? { foc: true } : {}) })) } : { tracking_mode: "quantity" };
    const existingLineIndex = receiptLines.findIndex((line) => line.purchase_invoice_line_id === selectedLine.id);
    if (existingLineIndex >= 0 && existingLineIndex !== editingReceiptLineIndex) return toast.error("This invoice item is already in the receipt.");
    const item = itemsResponse?.data.find((candidate) => candidate.id === selectedLine.item_id);
    const nextLine: FarmReceiptLineDraft = { purchase_invoice_line_id: selectedLine.id, accepted_quantity: Number(accepted), accepted_foc_quantity: Number(acceptedFoc), rejected_quantity: Number(rejectedQuantity), target_inventory_id: Number(inventoryId), ...(farm?.id ? { target_farm_information_id: farm.id } : {}), metadata, item_name: item?.name || `Item ${selectedLine.item_id}`, item_code: item?.code || String(selectedLine.item_id), category: selectedLine.category };
    setReceiptLines((lines) => editingReceiptLineIndex === null ? [...lines, nextLine] : lines.map((line, index) => index === editingReceiptLineIndex ? nextLine : line));
    setEditingReceiptLineIndex(null);
    setSelectedInvoiceLineId("");
    setAccepted("");
    setAcceptedFoc("");
    setRejectedQuantity("0");
    setIdentities([]);
  };
  const editReceiptLine = (index: number) => {
    const line = receiptLines[index];
    const invoiceLine = selectedInvoice?.lines?.find((candidate) => candidate.id === line.purchase_invoice_line_id);
    if (!line || !invoiceLine) return;
    setEditingReceiptLineIndex(index);
    setSelectedInvoiceLineId(String(line.purchase_invoice_line_id));
    setAccepted(String(line.accepted_quantity));
    setAcceptedFoc(String(line.accepted_foc_quantity));
    setRejectedQuantity(String(line.rejected_quantity));
    setInventoryId(String(line.target_inventory_id));
    setFarmId(String(line.target_farm_information_id || invoiceLine.target_farm_information_id || ""));
    setMode(modeForInvoiceLine(invoiceLine));
    const rows = (line.metadata.animals || line.metadata.units || []) as Record<string, unknown>[];
    setIdentities(rows.map((row) => ({
      ...emptyIdentity(),
      rfid: String(row.rfid || ""), gender: String(row.gender || "unknown"),
      date_of_birth: String(row.date_of_birth || ""), weight: String(row.weight || ""),
      weight_uom: String(row.weight_uom || "kg"), serial_number: String(row.serial_number || ""),
      asset_tag: String(row.asset_tag || ""), condition: String(row.condition || ""), foc: Boolean(row.foc),
    })));
  };
  const saveReceipt = () => {
    if (!selectedInvoice || !receiptDate || !receiptLines.length) return toast.error("Select an invoice, add at least one item, and choose a receipt date.");
    const body = { receipt_number: receiptNumber.trim() || undefined, purchase_invoice_id: selectedInvoice.id, receipt_date: receiptDate, idempotency_key: editingReceiptQuery.data?.data.idempotency_key || crypto.randomUUID(), notes: receiptNotes.trim() || undefined, lines: receiptLines.map((line) => ({ purchase_invoice_line_id: line.purchase_invoice_line_id, accepted_quantity: line.accepted_quantity, accepted_foc_quantity: line.accepted_foc_quantity, rejected_quantity: line.rejected_quantity, target_inventory_id: line.target_inventory_id, ...(line.target_farm_information_id ? { target_farm_information_id: line.target_farm_information_id } : {}), ...(Object.keys(line.metadata).length ? { metadata: line.metadata } : {}) })) };
    void run(async () => {
      if (editReceiptId) await updateReceipt({ id: editReceiptId, body }).unwrap();
      else await createReceipt(body).unwrap();
      router.push("/farms/receiving/receipts");
    }, editReceiptId ? "Receipt updated." : "Receipt created. Confirm it to post stock.");
  };
  const viewInvoice = (invoice: PurchaseInvoice) => { void run(async () => { const result = await getInvoice(invoice.id).unwrap(); setDetails({ title: "Purchase invoice details", data: result }); }, "Invoice details loaded"); };
  const viewReceipt = (receiptId: number) => { void run(async () => { const result = await getReceipt(receiptId).unwrap(); setDetails({ title: "Receipt details", data: result }); }, "Receipt details loaded"); };
  const submitInvoiceCancellation = () => {
    if (!cancelTarget || !cancelReason.trim()) return toast.error("Enter a cancellation reason.");
    void run(async () => { await cancelInvoice({ id: cancelTarget.id, reason: cancelReason.trim() }).unwrap(); setCancelTarget(null); setCancelReason(""); }, "Purchase invoice cancelled.");
  };
  const submitInvoiceConfirmation = () => {
    if (!confirmTarget || !confirmCashbookId) return toast.error("Select an active MMK cashbook for this branch.");
    void run(async () => { await confirmInvoice({ id: confirmTarget.id, cashbook_id: Number(confirmCashbookId) }).unwrap(); setConfirmTarget(null); setConfirmCashbookId(""); }, "Purchase invoice confirmed.");
  };

  return <div className="mx-auto max-w-7xl space-y-6 text-gray-800 dark:text-gray-100"><div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">Farm receiving · {invoiceForm || receiptForm ? invoiceForm ? `${editInvoiceId ? "Update" : "Create"} purchase invoice` : `${editReceiptId ? "Update" : "Create"} receipt` : tab === "invoices" ? "Purchase invoices" : "Receipts"}</h1><p className="text-sm text-gray-500">Create animal and equipment purchase invoices, capture receipt identities, then confirm stock</p></div><div className="flex gap-2">{invoiceForm && <Button size="sm" variant="outline" onClick={() => router.push("/farms/receiving/invoices")}>Back to purchase invoices</Button>}{receiptForm && <Button size="sm" variant="outline" onClick={() => router.push("/farms/receiving/receipts")}>Back to receipts</Button>}</div></div>
    {!invoiceForm && !receiptForm && <div className="flex justify-end">{tab === "invoices" ? <Button size="sm" onClick={() => router.push("/farms/receiving/invoices/create")}>+ Create purchase invoice</Button> : <Button size="sm" onClick={() => router.push("/farms/receiving/receipts/create")}>+ Create receipt</Button>}</div>}
    {invoiceForm && <p className="-mt-3 text-sm text-gray-500 dark:text-gray-400">{modeHelp[mode]}</p>}
    {tab === "invoices" && invoiceForm && <section className={panel}><h2 className="mb-4 font-semibold">{editInvoiceId ? "Update purchase invoice" : "Create purchase invoice"}</h2>{editingInvoiceQuery.isLoading && <p className="mb-3 text-sm text-gray-500">Loading invoice details…</p>}{editingInvoiceQuery.isError && <p className="mb-3 text-sm text-red-600">Unable to load invoice details.</p>}<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field title="Invoice Number (optional)"><input className={input} value={invoiceNumber} onChange={(event) => setInvoiceNumber(event.target.value)}/></Field>
        <DatePicker id="farm-receiving-invoice-date" label="Invoice Date" defaultDate={invoiceDate} onChange={(_, value) => setInvoiceDate(value)} />
        <Field title="Supplier"><select className={input} value={supplierId} onChange={(event) => setSupplierId(event.target.value)}><option value="">Select supplier</option>{(suppliersResponse?.data || []).filter((item) => item.status === "active" && (!item.supplied_categories?.length || item.supplied_categories.includes(category) || (typeof selectedItem?.master_category === "string" && item.supplied_categories.includes(selectedItem.master_category)))).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
        <Field title="Branch"><select className={input} value={branchId} onChange={(event) => { setBranchId(event.target.value); setFarmId(""); setItemId(""); setInvoiceLines([]); }}><option value="">Select branch</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.code} - {branch.name}</option>)}</select></Field>
        <Field title="Farm"><select className={input} value={farmId} disabled={!branchId} onChange={(event) => { const nextFarm = branchFarms.find((item) => String(item.id) === event.target.value); setFarmId(event.target.value); if (nextFarm) setBranchId(String(nextFarm.branch_id)); }}><option value="">{branchId ? "Select farm" : "Select branch first"}</option>{branchFarms.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
        <Field title="Paid Amount"><input className={input} type="number" min="0" step="any" value={paidAmount} onChange={(event) => setPaidAmount(event.target.value)}/></Field>
      <section className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950/20"><div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300"><span>Items subtotal</span><span className="tabular-nums">MMK {invoiceTotals.subtotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div><div className="mt-1 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300"><span>Discounts</span><span className="tabular-nums">−MMK {invoiceTotals.discount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div><div className="mt-1 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300"><span>Tax</span><span className="tabular-nums">MMK {invoiceTotals.tax.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div><div className="mt-2 flex items-center justify-between border-t border-green-200 pt-2 font-semibold text-gray-900 dark:border-green-900 dark:text-white"><span>Total price ({invoiceLines.length} items)</span><span className="tabular-nums">MMK {invoiceTotals.total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div></section></div>

      <section className="mt-5 rounded-lg border border-gray-200 p-4 dark:border-gray-700"><h3 className="mb-4 text-sm font-semibold">Item {invoiceLines.length + 1}</h3><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field title="Receiving mode"><select className={input} value={mode} onChange={(event) => onMode(event.target.value as Mode)}><option value="batch">Animal batch</option><option value="individual">Individual animals</option><option value="serial">Serial equipment</option><option value="quantity">Quantity equipment</option></select></Field>
        <Field title="Item"><select className={input} value={itemId} onChange={(event) => setItemId(event.target.value)}><option value="">Select item</option>{eligibleItems.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select></Field>
        <Field title="Quantity"><input className={input} type="number" min="0" step="any" value={quantity} onChange={(event) => setQuantity(event.target.value)}/></Field>
        <Field title="Unit Price"><input className={input} type="number" min="0" step="any" value={unitPrice} onChange={(event) => setUnitPrice(event.target.value)}/></Field>
        <Field title="Discount Type"><select className={input} value={discountType} onChange={(event) => setDiscountType(event.target.value)}><option value="none">none</option><option value="percentage">percentage</option><option value="fixed">fixed amount</option></select></Field>
        <Field title="Discount Value"><input className={input} type="number" min="0" step="any" value={discountValue} onChange={(event) => setDiscountValue(event.target.value)} disabled={discountType === "none"}/></Field>
        <Field title="FOC quantity"><input className={input} type="number" min="0" step="any" value={focQuantity} onChange={(event) => setFocQuantity(event.target.value)}/></Field>
        <Field title="Tax Rate (%)"><input className={input} type="number" min="0" step="any" value={taxRate} onChange={(event) => setTaxRate(event.target.value)}/></Field>
      </div></section>{itemsError && <p className="mt-3 text-sm text-red-600">Unable to load inventory items.</p>}<div className="mt-4"><Button variant="outline" onClick={addInvoiceLine}>Add item</Button></div><section className="mt-5 rounded-lg border border-gray-200 p-4 dark:border-gray-700"><div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">Invoice items</h3><span className="rounded-full bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">{invoiceLines.length}</span></div>{invoiceLines.length ? <div className="overflow-x-auto"><Table><TableHeader><TableRow>{["Item", "Category", "Quantity", "Purchase UOM", "Unit price", "Total", "Actions"].map((heading) => <TableCell key={heading} isHeader className="px-3 py-2 text-xs text-gray-500">{heading}</TableCell>)}</TableRow></TableHeader><TableBody>{invoiceLines.map((line, index) => <TableRow key={`${line.item_id}-${index}`}><TableCell className="px-3 py-3 text-sm font-medium">{line.item_code} · {line.item_name}</TableCell><TableCell className="px-3 py-3 text-sm capitalize">{line.category}</TableCell><TableCell className="px-3 py-3 text-sm">{line.quantity}{line.foc_value ? ` + ${line.foc_value} FOC` : ""}</TableCell><TableCell className="px-3 py-3 text-sm">{uomsResponse?.data.find((uom) => uom.id === line.purchase_uom_id)?.name || `UOM #${line.purchase_uom_id}`}</TableCell><TableCell className="px-3 py-3 text-sm">MMK {line.unit_price.toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell><TableCell className="px-3 py-3 text-sm">MMK {farmInvoiceLineTotals(line).total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell><TableCell className="px-3 py-3"><div className="flex gap-1"><TableActionButton label="Edit" icon={<ReceiptText size={14}/>} onClick={() => editInvoiceLine(index)}/><TableActionButton label="Remove" tone="red" icon={<XCircle size={14}/>} onClick={() => setInvoiceLines((lines) => lines.filter((_, lineIndex) => lineIndex !== index))}/></div></TableCell></TableRow>)}</TableBody></Table></div> : <p className="py-5 text-center text-sm text-gray-500">Add items to include them in the invoice.</p>}</section><div className="mt-4"><Button disabled={busy || !invoiceLines.length || (Boolean(editInvoiceId) && editingInvoiceQuery.isLoading)} onClick={saveInvoice}>{editInvoiceId ? "Update invoice" : "Create invoice"}</Button></div></section>}
    {tab === "receipts" && receiptForm && <section className={panel}>
      <h2 className="mb-4 font-semibold">{editReceiptId ? "Update receipt" : "Create receipt"}</h2>
      {editingReceiptQuery.isLoading && <p className="mb-3 text-sm text-gray-500">Loading receipt details…</p>}
      {editingReceiptQuery.isError && <p className="mb-3 text-sm text-red-600">Unable to load receipt details.</p>}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Field title="Receipt Number"><input className={input} value={receiptNumber} onChange={(event) => setReceiptNumber(event.target.value)}/></Field>
        <Field title="Find Invoice"><input className={input} value={invoiceSearch} onChange={(event) => setInvoiceSearch(event.target.value)} placeholder="Search invoice number"/></Field>
        <Field title="Purchase Invoice"><select className={input} value={selectedInvoiceId} disabled={Boolean(editReceiptId)} onChange={(event) => { const invoice = invoicesResponse?.data.find((item) => String(item.id) === event.target.value); if (invoice) selectInvoice(invoice); else { setSelectedInvoiceId(""); setSelectedInvoiceRecord(null); setSelectedInvoiceLineId(""); setReceiptLines([]); } }}><option value="">Select invoice</option>{selectedInvoiceRecord && !invoices.some((invoice) => invoice.id === selectedInvoiceRecord.id) && <option value={selectedInvoiceRecord.id}>{selectedInvoiceRecord.invoice_number}</option>}{matchingFarmInvoices.map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.invoice_number} · {invoice.status || "—"}</option>)}</select></Field>
        <DatePicker id="farm-receiving-receipt-date" label="Receipt Date" defaultDate={receiptDate} onChange={(_, value) => setReceiptDate(value)} />
        <Field title="Notes"><input className={input} value={receiptNotes} onChange={(event) => setReceiptNotes(event.target.value)}/></Field>
      </section>
      {selectedInvoice && <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm dark:border-green-500/30 dark:bg-green-500/10"><span className="font-medium">Selected invoice: {selectedInvoice.invoice_number}</span><FarmStatusBadge status={selectedInvoice.status}/></div>}
      {invoicesError && <p className="mt-3 text-sm text-red-600">Unable to load invoices.</p>}
      <section className="mt-5 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <h3 className="mb-4 text-sm font-bold text-gray-800 dark:text-white">Item {receiptLines.length + 1}</h3>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Field title="Invoice Item"><select className={input} value={selectedInvoiceLineId} disabled={!selectedInvoice} onChange={(event) => selectInvoiceLine(event.target.value)}><option value="">Select item</option>{selectedInvoice?.lines?.filter((line) => farmCategories.includes(line.category) && !receiptLines.some((added, index) => added.purchase_invoice_line_id === line.id && index !== editingReceiptLineIndex) && (remainingQuantity(line) > 0 || remainingFocQuantity(line) > 0)).map((line) => { const item = itemsResponse?.data.find((candidate) => candidate.id === line.item_id); return <option key={line.id} value={line.id}>{item?.code || `Item ${line.item_id}`} · {item?.name || line.category} · Remaining {remainingQuantity(line)} (FOC {remainingFocQuantity(line)})</option>; })}</select></Field>
          <Field title="Target Warehouse" required><select className={input} value={inventoryId} disabled={!selectedLine} onChange={(event) => setInventoryId(event.target.value)}><option value="">Select warehouse</option>{(inventoriesResponse?.data || []).filter((item) => item.status === "active" && (!selectedInvoice || item.branch_id === selectedInvoice.branch_id) && (!item.allowed_item_categories?.length || !selectedLine || item.allowed_item_categories.includes(selectedLine.category))).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
          <Field title="Target Farm"><select className={input} value={farmId} disabled={!selectedInvoice} onChange={(event) => setFarmId(event.target.value)}><option value="">{selectedInvoice ? "Select farm" : "Select invoice first"}</option>{farms.filter((farmRecord) => farmRecord.branch_id === selectedInvoice?.branch_id).map((farmRecord) => <option key={farmRecord.id} value={farmRecord.id}>{farmRecord.name}</option>)}</select></Field>
            <Field title="Accepted Quantity"><input className={input} type="text" inputMode="numeric" pattern="[0-9]*" value={accepted} disabled={!selectedLine} onChange={(event) => setAccepted(event.target.value.replace(/\D/g, ""))}/></Field>
          <Field title="Accepted FOC Quantity"><input className={input} type="text" inputMode="numeric" pattern="[0-9]*" value={acceptedFoc} disabled={!selectedLine} onChange={(event) => setAcceptedFoc(event.target.value.replace(/\D/g, ""))}/></Field>
          <Field title="Rejected Quantity"><input className={input} type="number" min="0" step="1" value={rejectedQuantity} disabled={!selectedLine} onChange={(event) => setRejectedQuantity(event.target.value)}/></Field>
        </div>
      </section>
      {(mode === "individual" || mode === "serial") && selectedLine && <div className="mt-4"><div className="flex items-center gap-3"><p className="text-sm">{count} identities required</p><Button size="sm" variant="outline" onClick={setIdentityCount}>Set identity rows</Button></div><div className="mt-3 grid gap-3 sm:grid-cols-2">{identities.map((identity, index) => <div key={index} className="space-y-2 rounded-lg border border-gray-200 p-3 dark:border-gray-700"><b className="text-sm">Unit {index + 1}</b>{mode === "individual" ? <><input className={input} placeholder="RFID" value={identity.rfid} onChange={(event) => updateIdentity(index, "rfid", event.target.value)}/><select className={input} value={identity.gender} onChange={(event) => updateIdentity(index, "gender", event.target.value)}>{["unknown", "female", "male", "mixed"].map((gender) => <option key={gender}>{gender}</option>)}</select><DatePicker id={`farm-receiving-individual-dob-${index}`} label="Date of birth (optional)" defaultDate={identity.date_of_birth || undefined} onChange={(_, value) => updateIdentity(index, "date_of_birth", value)} /><Field title="Weight (optional)"><input className={input} type="number" min="0" step="any" value={identity.weight} onChange={(event) => updateIdentity(index, "weight", event.target.value)}/></Field><select className={input} value={identity.weight_uom} onChange={(event) => updateIdentity(index, "weight_uom", event.target.value)}>{["kg", "g", "lb"].map((unit) => <option key={unit}>{unit}</option>)}</select></> : <><input className={input} placeholder="Serial number" value={identity.serial_number} onChange={(event) => updateIdentity(index, "serial_number", event.target.value)}/><input className={input} placeholder="Asset tag" value={identity.asset_tag} onChange={(event) => updateIdentity(index, "asset_tag", event.target.value)}/><select className={input} value={identity.condition} onChange={(event) => updateIdentity(index, "condition", event.target.value)}><option value="">Condition (optional)</option>{["new", "good", "fair", "damaged"].map((condition) => <option key={condition}>{condition}</option>)}</select></>}<label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={identity.foc} onChange={(event) => updateIdentity(index, "foc", event.target.checked)}/> FOC unit</label></div>)}</div></div>}
      <div className="mt-4"><Button variant="outline" disabled={busy || !selectedLine} onClick={addReceiptLine}>{editingReceiptLineIndex === null ? "Add item" : "Update item"}</Button></div>
      <section className="mt-5 rounded-lg border border-gray-200 p-4 dark:border-gray-700"><div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">Receipt items</h3><span className="rounded-full bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">{receiptLines.length}</span></div>{receiptLines.length ? <div className="overflow-x-auto"><Table><TableHeader><TableRow>{["Item", "Category", "Accepted", "Rejected", "Target Farm", "Target Warehouse", "Actions"].map((heading) => <TableCell key={heading} isHeader className="px-3 py-2 text-xs text-gray-500">{heading}</TableCell>)}</TableRow></TableHeader><TableBody>{receiptLines.map((line, index) => <TableRow key={line.purchase_invoice_line_id}><TableCell className="px-3 py-3 text-sm font-medium">{line.item_code} · {line.item_name}</TableCell><TableCell className="px-3 py-3 text-sm capitalize">{line.category}</TableCell><TableCell className="px-3 py-3 text-sm">{line.accepted_quantity}{line.accepted_foc_quantity ? ` + ${line.accepted_foc_quantity} FOC` : ""}</TableCell><TableCell className="px-3 py-3 text-sm">{line.rejected_quantity}</TableCell><TableCell className="px-3 py-3 text-sm">{farms.find((farmRecord) => farmRecord.id === line.target_farm_information_id)?.name || "-"}</TableCell><TableCell className="px-3 py-3 text-sm">{inventoriesResponse?.data.find((inventory) => inventory.id === line.target_inventory_id)?.name || `Warehouse #${line.target_inventory_id}`}</TableCell><TableCell className="px-3 py-3"><div className="flex gap-1"><TableActionButton label="Edit" icon={<ReceiptText size={14}/>} onClick={() => editReceiptLine(index)}/><TableActionButton label="Remove" tone="red" icon={<XCircle size={14}/>} onClick={() => setReceiptLines((lines) => lines.filter((entry) => entry.purchase_invoice_line_id !== line.purchase_invoice_line_id))}/></div></TableCell></TableRow>)}</TableBody></Table></div> : <p className="py-5 text-center text-sm text-gray-500">Add invoice items to include them in this receipt.</p>}</section>
      <div className="mt-4"><Button disabled={busy || !selectedInvoice || !receiptLines.length || (Boolean(editReceiptId) && editingReceiptQuery.isLoading)} onClick={saveReceipt}>{editReceiptId ? "Update receipt" : "Create receipt"}</Button></div>
    </section>}
    {tab === "invoices" && !invoiceForm && <section className={panel}><div className="mb-4"><h2 className="font-semibold">Purchase invoices</h2></div>{invoicesError ? <p className="text-sm text-red-600">Unable to load invoices.</p> : invoices.length ? <div className="overflow-x-auto"><Table><TableHeader className="border-b border-gray-100 dark:border-white/[0.05]"><TableRow>{["No.", "Invoice", "Date", "Supplier", "Branch", "Status", "Lines", "Actions"].map((head) => <TableCell key={head} isHeader className={`px-5 py-3 text-xs font-medium text-gray-500 ${["No.", "Lines"].includes(head) ? "text-right" : "text-start"}`}>{head}</TableCell>)}</TableRow></TableHeader><TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">{invoices.map((invoice, index) => <TableRow key={invoice.id}><TableCell className="px-5 py-3.5 text-right text-sm tabular-nums text-gray-500">{index + 1}</TableCell><TableCell className="px-5 py-3.5 text-sm font-semibold text-gray-900 dark:text-white">{invoice.invoice_number}</TableCell><TableCell className="px-5 py-3.5 text-sm text-gray-500">{invoice.invoice_date}</TableCell><TableCell className="px-5 py-3.5 text-sm font-medium text-gray-700 dark:text-gray-300">{suppliersResponse?.data.find((supplier) => supplier.id === invoice.supplier_id)?.name || "-"}</TableCell><TableCell className="px-5 py-3.5 text-sm font-medium text-gray-700 dark:text-gray-300">{farms.find((farmItem) => farmItem.branch_id === invoice.branch_id)?.name || "-"}</TableCell><TableCell className="px-5 py-3.5 text-sm"><FarmStatusBadge status={invoice.status}/></TableCell><TableCell className="px-5 py-3.5 text-right text-sm tabular-nums text-gray-500">{invoice.lines?.length || 0}</TableCell><TableCell className="px-5 py-3.5 text-sm"><div className="flex flex-wrap gap-1.5"><TableActionButton label="View" tone="neutral" onClick={() => viewInvoice(invoice)} icon={<Eye size={14}/>}/>{(!invoice.status || ["open", "draft"].includes(invoice.status)) && Number(invoice.paid_amount ?? 0) !== 0 && <TableActionButton label="Confirm" tone="green" disabled={busy || confirmInvoiceState.isLoading} onClick={() => { setConfirmTarget(invoice); setConfirmCashbookId(""); }} icon={<CheckCircle2 size={14}/>}/>}{(!invoice.status || ["open", "draft"].includes(invoice.status)) && <TableActionButton label="Update" tone="neutral" onClick={() => router.push(`/farms/receiving/invoices/create?edit=${invoice.id}`)} icon={<ReceiptText size={14}/>}/>}<a className="inline-flex h-8 items-center rounded-md border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300" href={`/financial/supplier-payments?branch_id=${invoice.branch_id}&invoice_id=${invoice.id}`}>AP / Pay</a>{(!invoice.status || ["open", "draft"].includes(invoice.status)) && <TableActionButton label="Cancel" tone="red" onClick={() => { setCancelTarget(invoice); setCancelReason("Farm purchase invoice cancelled."); }} icon={<XCircle size={14}/>}/>}</div></TableCell></TableRow>)}</TableBody></Table></div> : <p className="py-8 text-center text-sm text-gray-500">No animal or equipment invoices found.</p>}</section>}
    {tab === "receipts" && !receiptForm && <section className={panel}><div className="mb-4"><h2 className="font-semibold">Receipts</h2><p className="mt-1 text-xs text-gray-500">Confirm draft receipts to post stock.</p></div>{receiptsError ? <p className="text-sm text-red-600">Unable to load receipts.</p> : receipts.length ? <div className="overflow-x-auto"><Table><TableHeader className="border-b border-gray-100 dark:border-white/[0.05]"><TableRow>{["No.", "Receipt", "Invoice", "Date", "Status", "Lines", "Actions"].map((head) => <TableCell key={head} isHeader className={`px-5 py-3 text-xs font-medium text-gray-500 ${["No.", "Lines"].includes(head) ? "text-right" : "text-start"}`}>{head}</TableCell>)}</TableRow></TableHeader><TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">{receipts.map((receipt, index) => <TableRow key={receipt.id}><TableCell className="px-5 py-3.5 text-right text-sm tabular-nums text-gray-500">{index + 1}</TableCell><TableCell className="px-5 py-3.5 text-sm font-semibold text-gray-900 dark:text-white">{receipt.receipt_number}</TableCell><TableCell className="px-5 py-3.5 text-sm font-medium text-gray-700 dark:text-gray-300">{invoicesResponse?.data.find((invoice) => invoice.id === receipt.purchase_invoice_id)?.invoice_number || "-"}</TableCell><TableCell className="px-5 py-3.5 text-sm text-gray-500">{receipt.receipt_date}</TableCell><TableCell className="px-5 py-3.5 text-sm"><FarmStatusBadge status={receipt.status}/></TableCell><TableCell className="px-5 py-3.5 text-right text-sm tabular-nums text-gray-500">{receipt.lines?.length || 0}</TableCell><TableCell className="px-5 py-3.5 text-sm"><div className="flex flex-wrap gap-1.5"><TableActionButton label="View" tone="neutral" onClick={() => viewReceipt(receipt.id)} icon={<Eye size={14}/>}/>{receipt.status === "draft" && <TableActionButton label="Edit" tone="neutral" onClick={() => router.push(`/farms/receiving/receipts/create?edit=${receipt.id}`)} icon={<ReceiptText size={14}/>} />}{(!receipt.status || ["draft", "open"].includes(receipt.status)) && <TableActionButton label="Confirm" tone="green" disabled={busy} onClick={() => void run(() => confirmReceipt(receipt.id).unwrap(), "Purchase receipt confirmed and posted")} icon={<CheckCircle2 size={14}/>}/>}</div></TableCell></TableRow>)}</TableBody></Table></div> : <p className="py-8 text-center text-sm text-gray-500">No receipts found.</p>}</section>}
    <Modal isOpen={!!details} onClose={() => setDetails(null)} className="m-4 max-w-5xl"><div className="space-y-4 p-6"><h2 className="text-lg font-bold text-gray-900 dark:text-white">{details?.title?.replace("Saved API Response · ", "")}</h2>{!detailRecord ? <p className="text-sm text-gray-500">No saved details found.</p> : <div className="max-h-[70vh] space-y-5 overflow-y-auto pr-2"><section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{detailRecord.paid_amount !== undefined && detailRecord.paid_amount !== null && <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"><p className="text-xs font-medium text-gray-500">Paid Amount</p><p className="mt-1 break-words text-sm text-gray-900 dark:text-gray-100">MMK {Number(detailRecord.paid_amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div>}{Object.entries(detailRecord).filter(([key, value]) => key !== "paid_amount" && key !== "posted_paid_amount" && !Array.isArray(value) && (value === null || typeof value !== "object")).map(([key, value]) => { const id = Number(value); const related = key === "supplier_id" ? suppliersResponse?.data.find((item) => item.id === id)?.name : key === "branch_id" ? farms.filter((item) => item.branch_id === id).map((item) => item.name).join(", ") : key === "purchase_invoice_id" ? invoicesResponse?.data.find((item) => item.id === id)?.invoice_number : undefined; return <div key={key} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"><p className="text-xs font-medium text-gray-500">{readableLabel(key)}</p><p className="mt-1 break-words text-sm text-gray-900 dark:text-gray-100">{related || readableValue(value)}</p></div>; })}</section>{detailLines.length > 0 && <section className="rounded-lg border border-gray-200 dark:border-gray-700"><div className="border-b border-gray-100 px-4 py-3 text-sm font-bold text-gray-800 dark:border-gray-800 dark:text-white">Lines</div><div className="overflow-x-auto"><Table><TableHeader className="border-b border-gray-100 dark:border-white/[0.05]"><TableRow>{["category", "item_id", "quantity", "accepted_quantity", "accepted_foc_quantity", "rejected_quantity", "unit_price", "discount_type", "discount_value", "target_inventory_id"].filter((key) => detailLines.some((line) => key in line)).map((key) => <TableCell key={key} isHeader className="px-4 py-3 text-xs font-medium text-gray-500">{readableLabel(key)}</TableCell>)}</TableRow></TableHeader><TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">{detailLines.map((line, index) => <TableRow key={String(line.id || index)}>{["category", "item_id", "quantity", "accepted_quantity", "accepted_foc_quantity", "rejected_quantity", "unit_price", "discount_type", "discount_value", "target_inventory_id"].filter((key) => detailLines.some((entry) => key in entry)).map((key) => { const value = line[key]; const id = Number(value); const related = key === "item_id" ? itemsResponse?.data.find((item) => item.id === id)?.name : key === "target_inventory_id" ? inventoriesResponse?.data.find((item) => item.id === id)?.name : undefined; return <TableCell key={key} className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{related || readableValue(value)}</TableCell>; })}</TableRow>)}</TableBody></Table></div></section>}</div>}</div></Modal>
    <Modal isOpen={!!cancelTarget} onClose={() => setCancelTarget(null)} className="m-4 max-w-lg"><div className="space-y-4 p-6"><div><h2 className="text-lg font-bold text-gray-900 dark:text-white">Cancel purchase invoice</h2><p className="mt-1 text-sm text-gray-500">{cancelTarget?.invoice_number}</p></div><Field title="Cancellation reason"><textarea className="min-h-24 w-full rounded-lg border border-gray-300 bg-white p-3 text-sm outline-none focus:border-green-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} /></Field><div className="flex justify-end gap-2"><Button size="sm" variant="outline" onClick={() => setCancelTarget(null)}>Keep invoice</Button><Button size="sm" disabled={busy || !cancelReason.trim()} onClick={submitInvoiceCancellation}>Cancel invoice</Button></div></div></Modal>
    <Modal isOpen={!!confirmTarget} onClose={() => { setConfirmTarget(null); setConfirmCashbookId(""); }} className="m-4 max-w-lg"><div className="space-y-4 p-6"><div><h2 className="text-lg font-bold text-gray-900 dark:text-white">Confirm purchase invoice</h2><p className="mt-1 text-sm text-gray-500">{confirmTarget?.invoice_number} · Paid amount MMK {Number(confirmTarget?.paid_amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div><Field title="Cashbook"><select className={input} value={confirmCashbookId} onChange={(event) => setConfirmCashbookId(event.target.value)} disabled={cashbooksLoading || !confirmCashbooks.length}><option value="">{cashbooksLoading ? "Loading cashbooks..." : "Select active MMK cashbook"}</option>{confirmCashbooks.map((cashbook) => <option key={cashbook.id} value={cashbook.id}>{cashbook.name} ({cashbook.type}, {cashbook.currency_code})</option>)}</select></Field>{!cashbooksLoading && !confirmCashbooks.length && <p className="text-sm text-red-600">No active MMK cashbooks are available for this invoice branch.</p>}<div className="flex justify-end gap-2"><Button size="sm" variant="outline" onClick={() => { setConfirmTarget(null); setConfirmCashbookId(""); }}>Cancel</Button><Button size="sm" disabled={busy || confirmInvoiceState.isLoading || !confirmCashbookId} onClick={submitInvoiceConfirmation}>{busy || confirmInvoiceState.isLoading ? "Confirming..." : "Confirm invoice"}</Button></div></div></Modal>
  </div>;
}

function Field({ title, children, required = false }: { title: string; children: React.ReactNode; required?: boolean }) { return <label className="block"><span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{title}{required && <span className="ml-0.5 text-red-500">*</span>}</span>{children}</label>; }
