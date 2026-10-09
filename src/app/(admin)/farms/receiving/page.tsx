"use client";

import { useState } from "react";
import { toast } from "sonner";
import DatePicker from "@/components/form/date-picker";
import Button from "@/components/ui/button/Button";
import FarmStatusBadge from "@/components/farms/FarmStatusBadge";
import { useGetFarmInformationListQuery } from "@/redux/features/setup/FarmInformationApiSlice";
import { useGetAnimalsQuery } from "@/redux/features/setup/AnimalApiSlice";
import { useGetSuppliersQuery } from "@/redux/features/setup/SupplierApiSlice";
import { useGetInventoriesQuery } from "@/redux/features/setup/InventoryApiSlice";
import { useGetUomsQuery } from "@/redux/features/setup/UomApiSlice";
import { useGetInventoryItemsQuery } from "@/redux/features/inventory/InventoryFoundationApiSlice";
import {
  PurchaseInvoice, useGetPurchaseInvoicesQuery, useLazyGetPurchaseInvoiceQuery,
  useGetPurchaseReceiptsQuery, useCreatePurchaseInvoiceMutation,
  useCreatePurchaseReceiptMutation, useConfirmPurchaseReceiptMutation,
} from "@/redux/features/purchasing/PurchasingFoundationApiSlice";

type Mode = "batch" | "individual" | "serial" | "quantity";
type Identity = { rfid: string; gender: string; date_of_birth: string; weight: string; weight_uom: string; serial_number: string; asset_tag: string; condition: string; foc: boolean };
const today = () => new Date().toLocaleDateString("en-CA");
const input = "h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-green-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100";
const panel = "rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]";
const modeHelp: Record<Mode, string> = { batch: "Receive a herd as one batch with a batch number.", individual: "Record one RFID for every paid and free animal.", serial: "Record a serial number or asset tag for every unit.", quantity: "Receive equipment as a quantity without individual identities." };
const errorText = (error: unknown) => { const e = error as { data?: { message?: string; errors?: Record<string, string[]> } }; return (e.data?.errors && Object.values(e.data.errors).flat()[0]) || e.data?.message || "Request failed"; };
const emptyIdentity = (): Identity => ({ rfid: "", gender: "unknown", date_of_birth: "", weight: "", weight_uom: "kg", serial_number: "", asset_tag: "", condition: "", foc: false });

export default function FarmReceivingPage() {
  const [mode, setMode] = useState<Mode>("batch");
  const [farmId, setFarmId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [inventoryId, setInventoryId] = useState("");
  const [itemId, setItemId] = useState("");
  const [countUomId, setCountUomId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(today);
  const [receiptDate, setReceiptDate] = useState(today);
  const [location, setLocation] = useState("");
  const [quantity, setQuantity] = useState("");
  const [focQuantity, setFocQuantity] = useState("0");
  const [unitPrice, setUnitPrice] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [selectedInvoiceRecord, setSelectedInvoiceRecord] = useState<PurchaseInvoice | null>(null);
  const [accepted, setAccepted] = useState("");
  const [acceptedFoc, setAcceptedFoc] = useState("0");
  const [batchNumber, setBatchNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [weight, setWeight] = useState("");
  const [lifeStage, setLifeStage] = useState("");
  const [healthStatus, setHealthStatus] = useState("");
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [busy, setBusy] = useState(false);
  const category = mode === "batch" || mode === "individual" ? "animal" : "equipment";
  const { data: farmsResponse } = useGetFarmInformationListQuery({ per_page: 100 });
  const { data: animalMasters } = useGetAnimalsQuery({ per_page: 100 });
  const { data: suppliersResponse } = useGetSuppliersQuery({ per_page: 100 });
  const { data: inventoriesResponse } = useGetInventoriesQuery({ per_page: 100 });
  const { data: uomsResponse } = useGetUomsQuery({ per_page: 100 });
  const { data: itemsResponse, isError: itemsError } = useGetInventoryItemsQuery({ category, status: "active", per_page: 100 });
  const { data: invoicesResponse, isError: invoicesError } = useGetPurchaseInvoicesQuery({ per_page: 100 });
  const { data: receiptsResponse, isError: receiptsError } = useGetPurchaseReceiptsQuery({ per_page: 100 });
  const [createInvoice] = useCreatePurchaseInvoiceMutation();
  const [createReceipt] = useCreatePurchaseReceiptMutation();
  const [confirmReceipt] = useConfirmPurchaseReceiptMutation();
  const [getInvoice] = useLazyGetPurchaseInvoiceQuery();
  const farms = farmsResponse?.data || [];
  const farm = farms.find((item) => String(item.id) === farmId);
  const selectedItem = itemsResponse?.data.find((item) => String(item.id) === itemId);
  const eligibleItems = (itemsResponse?.data || []).filter((item) => mode === "batch" || mode === "individual" ? animalMasters?.data.some((animal) => animal.id === item.itemable_id && animal.tracking_type === mode) : mode === "quantity" ? !item.serial_tracking : true);
  const invoices = (invoicesResponse?.data || []).filter((invoice) => invoice.lines?.some((line) => line.category === category));
  const receipts = (receiptsResponse?.data || []).filter((receipt) => receipt.lines?.some((line) => line.category === category));
  const selectedInvoice = selectedInvoiceRecord?.id === Number(selectedInvoiceId) ? selectedInvoiceRecord : invoicesResponse?.data.find((invoice) => String(invoice.id) === selectedInvoiceId);
  const selectedLine = selectedInvoice?.lines?.[0];
  const count = Math.max(0, Math.floor(Number(accepted) + Number(acceptedFoc)));
  const onMode = (next: Mode) => { setMode(next); setItemId(""); setCountUomId(""); setSelectedInvoiceId(""); setSelectedInvoiceRecord(null); setIdentities([]); };
  const selectInvoice = (invoice: PurchaseInvoice) => {
    setSelectedInvoiceId(String(invoice.id));
    setSelectedInvoiceRecord(invoice);
    const line = invoice.lines?.[0];
    setAccepted(String(line?.quantity ?? ""));
    setAcceptedFoc(String(line?.foc_type === "quantity" ? line.foc_value ?? 0 : 0));
    setInventoryId(String(line?.target_inventory_id ?? ""));
    setFarmId(String(line?.target_farm_information_id ?? ""));
    setLocation(String(line?.target_location ?? ""));
    setIdentities([]);
  };
  const updateIdentity = (index: number, key: keyof Identity, value: string | boolean) => setIdentities((old) => { const next = [...old]; next[index] = { ...(next[index] || emptyIdentity()), [key]: value }; return next; });
  const setIdentityCount = () => { if (count > 100) return toast.error("Enter at most 100 identities at a time."); setIdentities((old) => Array.from({ length: count }, (_, index) => old[index] || { ...emptyIdentity(), foc: index >= count - Number(acceptedFoc) })); };
  const run = async (call: () => Promise<unknown>, message: string) => { setBusy(true); try { await call(); toast.success(message); } catch (error) { toast.error(errorText(error)); } finally { setBusy(false); } };
  const saveInvoice = () => {
    if (!farm || !supplierId || !inventoryId || !selectedItem || !countUomId || !location.trim() || Number(quantity) <= 0 || Number(unitPrice) < 0 || !unitPrice) return toast.error("Complete the farm, supplier, warehouse, item, count unit, location, quantity and price.");
    if (!Number.isInteger(Number(quantity)) || !Number.isInteger(Number(focQuantity)) || Number(focQuantity) < 0) return toast.error("Animals and equipment require whole-number quantities.");
    void run(async () => {
      const result = await createInvoice({ invoice_number: invoiceNumber.trim() || undefined, invoice_date: invoiceDate, supplier_id: Number(supplierId), branch_id: farm.branch_id, lines: [{ category, item_id: selectedItem.id, purchase_uom_id: Number(countUomId), stock_uom_id: Number(countUomId), conversion_factor: 1, quantity: Number(quantity), unit_price: Number(unitPrice), foc_type: "quantity", foc_value: Number(focQuantity), target_inventory_id: Number(inventoryId), target_farm_information_id: farm.id, target_location: location.trim() }] }).unwrap();
      selectInvoice(result.data);
      setSelectedInvoiceId(String(result.data.id));
    }, "Purchase invoice created. Create its receipt below.");
  };
  const saveReceipt = () => {
    if (!selectedInvoice || !selectedLine || Number(accepted) <= 0 || !receiptDate) return toast.error("Select an invoice and enter accepted quantity and receipt date.");
    if (!Number.isInteger(Number(accepted)) || !Number.isInteger(Number(acceptedFoc)) || Number(acceptedFoc) < 0) return toast.error("Animals and equipment must be received as whole units.");
    if (mode === "batch" && !batchNumber.trim()) return toast.error("Enter a batch number.");
    if ((mode === "individual" || mode === "serial") && (identities.length !== count || identities.some((id) => mode === "individual" ? !id.rfid.trim() : !id.serial_number.trim() && !id.asset_tag.trim()))) return toast.error("Add one identity per accepted or FOC unit.");
    if ((mode === "individual" || mode === "serial") && identities.filter((id) => id.foc).length !== Number(acceptedFoc)) return toast.error("FOC identity count must match accepted FOC quantity.");
    const metadata: Record<string, unknown> = mode === "batch" ? { batch_number: batchNumber.trim(), ...(dateOfBirth ? { date_of_birth: dateOfBirth } : {}), ...(weight ? { weight: Number(weight), weight_uom: "kg" } : {}), ...(lifeStage ? { life_stage: lifeStage } : {}), ...(healthStatus ? { health_status: healthStatus } : {}) } : mode === "individual" ? { animals: identities.map((id) => ({ rfid: id.rfid.trim(), gender: id.gender, ...(id.date_of_birth ? { date_of_birth: id.date_of_birth } : {}), ...(id.weight ? { weight: Number(id.weight), weight_uom: id.weight_uom } : {}), ...(id.foc ? { foc: true } : {}) })) } : mode === "serial" ? { units: identities.map((id) => ({ ...(id.serial_number.trim() ? { serial_number: id.serial_number.trim() } : {}), ...(id.asset_tag.trim() ? { asset_tag: id.asset_tag.trim() } : {}), ...(id.condition ? { condition: id.condition } : {}), ...(id.foc ? { foc: true } : {}) })) } : { tracking_mode: "quantity" };
    void run(async () => { await createReceipt({ purchase_invoice_id: selectedInvoice.id, receipt_date: receiptDate, idempotency_key: crypto.randomUUID(), lines: [{ purchase_invoice_line_id: selectedLine.id, accepted_quantity: Number(accepted), accepted_foc_quantity: Number(acceptedFoc), metadata }] }).unwrap(); }, "Receipt created. Confirm it to post stock.");
  };
  const checkInvoice = (invoice: PurchaseInvoice) => { void run(async () => { const result = await getInvoice(invoice.id).unwrap(); selectInvoice(result.data); }, "Invoice details loaded"); };

  return <div className="mx-auto max-w-7xl space-y-6 text-gray-800 dark:text-gray-100"><div><h1 className="text-2xl font-bold">Farm receiving</h1><p className="text-sm text-gray-500">Create animal and equipment purchase invoices, capture receipt identities, then confirm stock</p></div>
    <div className="flex flex-wrap gap-2">{(["batch", "individual", "serial", "quantity"] as Mode[]).map((value) => <button key={value} type="button" aria-pressed={value === mode} onClick={() => onMode(value)} className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize transition-colors ${value === mode ? "bg-green-700 text-white shadow-sm" : "border border-gray-200 bg-white text-gray-700 hover:border-green-300 hover:text-green-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"}`}>{value === "batch" ? "Animal batch" : value === "individual" ? "Individual animals" : value === "serial" ? "Serial equipment" : "Quantity equipment"}</button>)}</div>
    <p className="-mt-3 text-sm text-gray-500 dark:text-gray-400">{modeHelp[mode]}</p>
    <section className={panel}><div className="mb-4 flex items-center gap-3"><span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-800 dark:bg-green-500/20 dark:text-green-300">1</span><div><h2 className="font-semibold">Create purchase invoice</h2><p className="text-xs text-gray-500">Choose the source and destination for this delivery.</p></div></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Field title="Farm"><select className={input} value={farmId} onChange={(e) => setFarmId(e.target.value)}><option value="">Select farm</option>{farms.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field title="Supplier"><select className={input} value={supplierId} onChange={(e) => setSupplierId(e.target.value)}><option value="">Select supplier</option>{(suppliersResponse?.data || []).filter((item) => item.status === "active" && (!item.supplied_categories?.length || item.supplied_categories.includes(category) || (typeof selectedItem?.master_category === "string" && item.supplied_categories.includes(selectedItem.master_category)))).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field title="Receiving warehouse"><select className={input} value={inventoryId} onChange={(e) => setInventoryId(e.target.value)}><option value="">Select warehouse</option>{(inventoriesResponse?.data || []).filter((item) => item.status === "active" && (!farm || item.branch_id === farm.branch_id) && (!item.allowed_item_categories?.length || item.allowed_item_categories.includes(category) || (typeof selectedItem?.master_category === "string" && item.allowed_item_categories.includes(selectedItem.master_category)))).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field title={`${category} item`}><select className={input} value={itemId} onChange={(e) => { const id = e.target.value; setItemId(id); const item = eligibleItems.find((row) => String(row.id) === id); const stockUom = (uomsResponse?.data || []).find((uom) => uom.id === item?.stock_uom_id && uom.status === "active"); setCountUomId(stockUom ? String(stockUom.id) : ""); }}><option value="">Select item</option>{eligibleItems.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select></Field><Field title="Count unit"><select className={input} value={countUomId} onChange={(e) => setCountUomId(e.target.value)}><option value="">Select count unit</option>{(uomsResponse?.data || []).filter((uom) => uom.status === "active").map((uom) => <option key={uom.id} value={uom.id}>{uom.name} ({uom.symbol})</option>)}</select></Field><Field title="Target location"><input className={input} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Farm pen or storage location"/></Field><DatePicker id="farm-receiving-invoice-date" label="Invoice date" defaultDate={invoiceDate} onChange={(_, value) => setInvoiceDate(value)} /><Field title="Quantity"><input className={input} type="number" min="0" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)}/></Field><Field title="FOC quantity"><input className={input} type="number" min="0" step="any" value={focQuantity} onChange={(e) => setFocQuantity(e.target.value)}/></Field><Field title="Unit price"><input className={input} type="number" min="0" step="any" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)}/></Field><Field title="Invoice number (optional)"><input className={input} value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)}/></Field></div>{itemsError && <p className="mt-3 text-sm text-red-600">Unable to load inventory items.</p>}<div className="mt-4"><Button disabled={busy} onClick={saveInvoice}>Create invoice</Button></div></section>
    <section className={panel}><div className="mb-4 flex items-center gap-3"><span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-800 dark:bg-green-500/20 dark:text-green-300">2</span><div><h2 className="font-semibold">Create receipt</h2><p className="text-xs text-gray-500">Confirm the accepted quantity and capture tracking details.</p></div></div>{selectedInvoice && <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm dark:border-green-500/30 dark:bg-green-500/10"><span className="font-medium">Selected invoice: {selectedInvoice.invoice_number}</span><FarmStatusBadge status={selectedInvoice.status}/><span className="text-gray-600 dark:text-gray-300">Expected {selectedLine?.quantity ?? "—"} + {selectedLine?.foc_type === "quantity" ? selectedLine.foc_value ?? 0 : 0} FOC</span></div>}<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Field title="Purchase invoice"><select className={input} value={selectedInvoiceId} onChange={(e) => { const invoice = invoicesResponse?.data.find((item) => String(item.id) === e.target.value); if (invoice) selectInvoice(invoice); else { setSelectedInvoiceId(""); setSelectedInvoiceRecord(null); } }}><option value="">Select invoice</option>{selectedInvoiceRecord && !invoices.some((invoice) => invoice.id === selectedInvoiceRecord.id) && <option value={selectedInvoiceRecord.id}>{selectedInvoiceRecord.invoice_number}</option>}{invoices.map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.invoice_number} · {invoice.status || "—"}</option>)}</select></Field><DatePicker id="farm-receiving-receipt-date" label="Receipt date" defaultDate={receiptDate} onChange={(_, value) => setReceiptDate(value)} /><Field title="Accepted quantity"><input className={input} type="number" min="0" step="any" value={accepted} onChange={(e) => setAccepted(e.target.value)}/></Field><Field title="Accepted FOC quantity"><input className={input} type="number" min="0" step="any" value={acceptedFoc} onChange={(e) => setAcceptedFoc(e.target.value)}/></Field>{mode === "batch" && <><Field title="Batch number"><input className={input} value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)}/></Field><DatePicker id="farm-receiving-dob" label="Date of birth (optional)" defaultDate={dateOfBirth || undefined} onChange={(_, value) => setDateOfBirth(value)} /><Field title="Weight kg (optional)"><input className={input} type="number" min="0" step="any" value={weight} onChange={(e) => setWeight(e.target.value)}/></Field><Field title="Life stage (optional)"><input className={input} value={lifeStage} onChange={(e) => setLifeStage(e.target.value)}/></Field><Field title="Health status (optional)"><input className={input} value={healthStatus} onChange={(e) => setHealthStatus(e.target.value)}/></Field></>}</div>
      {(mode === "individual" || mode === "serial") && <div className="mt-4"><div className="flex items-center gap-3"><p className="text-sm">{count} identities required</p><Button size="sm" variant="outline" onClick={setIdentityCount}>Set identity rows</Button></div><div className="mt-3 grid gap-3 sm:grid-cols-2">{identities.map((identity, index) => <div key={index} className="space-y-2 rounded-lg border border-gray-200 p-3 dark:border-gray-700"><b className="text-sm">Unit {index + 1}</b>{mode === "individual" ? <><input className={input} placeholder="RFID" value={identity.rfid} onChange={(e) => updateIdentity(index, "rfid", e.target.value)}/><select className={input} value={identity.gender} onChange={(e) => updateIdentity(index, "gender", e.target.value)}>{["unknown", "female", "male", "mixed"].map((gender) => <option key={gender}>{gender}</option>)}</select><DatePicker id={`farm-receiving-individual-dob-${index}`} label="Date of birth (optional)" defaultDate={identity.date_of_birth || undefined} onChange={(_, value) => updateIdentity(index, "date_of_birth", value)} /><Field title="Weight (optional)"><input className={input} type="number" min="0" step="any" value={identity.weight} onChange={(e) => updateIdentity(index, "weight", e.target.value)}/></Field><select className={input} value={identity.weight_uom} onChange={(e) => updateIdentity(index, "weight_uom", e.target.value)}>{["kg", "g", "lb"].map((unit) => <option key={unit}>{unit}</option>)}</select></> : <><input className={input} placeholder="Serial number" value={identity.serial_number} onChange={(e) => updateIdentity(index, "serial_number", e.target.value)}/><input className={input} placeholder="Asset tag" value={identity.asset_tag} onChange={(e) => updateIdentity(index, "asset_tag", e.target.value)}/><select className={input} value={identity.condition} onChange={(e) => updateIdentity(index, "condition", e.target.value)}><option value="">Condition (optional)</option>{["new", "good", "fair", "damaged"].map((condition) => <option key={condition}>{condition}</option>)}</select></>}<label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={identity.foc} onChange={(e) => updateIdentity(index, "foc", e.target.checked)}/> FOC unit</label></div>)}</div></div>}
      <div className="mt-4"><Button disabled={busy || !selectedInvoice} onClick={saveReceipt}>Create receipt</Button></div></section>
    <div className="grid gap-4 lg:grid-cols-2"><section className={panel}><h2 className="mb-3 font-semibold">Purchase invoices</h2>{invoicesError ? <p className="text-sm text-red-600">Unable to load invoices.</p> : invoices.length ? <div className="max-h-96 divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800">{invoices.map((invoice) => <div key={invoice.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><div><b>{invoice.invoice_number}</b><p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500"><span>{invoice.invoice_date}</span><FarmStatusBadge status={invoice.status}/></p></div><Button size="sm" variant="outline" disabled={busy} onClick={() => checkInvoice(invoice)}>Select for receipt</Button></div>)}</div> : <p className="text-sm text-gray-500">No animal or equipment invoices found.</p>}</section><section className={panel}><h2 className="font-semibold">Receipts</h2><p className="mb-3 mt-1 text-xs text-gray-500">Confirm a draft to post stock. Verify confirmation checks an already confirmed receipt without posting it again.</p>{receiptsError ? <p className="text-sm text-red-600">Unable to load receipts.</p> : receipts.length ? <div className="max-h-96 divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800">{receipts.map((receipt) => <div key={receipt.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><div><b>{receipt.receipt_number}</b><p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500"><span>Invoice #{receipt.purchase_invoice_id}</span><FarmStatusBadge status={receipt.status}/></p></div><Button size="sm" disabled={busy} variant={receipt.status === "confirmed" ? "outline" : "primary"} onClick={() => void run(() => confirmReceipt(receipt.id).unwrap(), receipt.status === "confirmed" ? "Confirmation checked; stock was not posted twice" : "Receipt confirmed and stock posted")}>{receipt.status === "confirmed" ? "Verify confirmation" : "Confirm"}</Button></div>)}</div> : <p className="text-sm text-gray-500">No receipts found.</p>}</section></div>
  </div>;
}

function Field({ title, children }: { title: string; children: React.ReactNode }) { return <label className="block"><span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{title}</span>{children}</label>; }
