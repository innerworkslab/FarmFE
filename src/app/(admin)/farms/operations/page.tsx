"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Eye, Plus } from "lucide-react";
import Button from "@/components/ui/button/Button";
import DatePicker from "@/components/form/date-picker";
import Loading from "@/components/common/Loading";
import { Modal } from "@/components/ui/modal";
import FarmStatusBadge from "@/components/farms/FarmStatusBadge";
import { useGetFarmInformationListQuery } from "@/redux/features/setup/FarmInformationApiSlice";
import { useGetSetupAdminsQuery } from "@/redux/features/setup/AdminSetupApiSlice";
import { useGetFarmAnimalsQuery } from "@/redux/features/farms/FarmAnimalViewApiSlice";
import { useGetInventoryBalancesQuery } from "@/redux/features/inventory/InventoryFoundationApiSlice";
import {
  FarmOperation, FarmOperationPayload, OperationType,
  useGetFarmOperationsQuery, useLazyGetFarmOperationQuery,
  useCreateFarmOperationMutation, useUpdateFarmOperationMutation,
  useSubmitFarmOperationMutation, useConfirmFarmOperationMutation,
  useRejectFarmOperationMutation, useReverseFarmOperationMutation,
  useCompleteFarmFollowUpMutation,
} from "@/redux/features/farms/FarmManagementApiSlice";

const today = () => new Date().toLocaleDateString("en-CA");
const input = "h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 outline-none focus:border-green-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100";
const label = "mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300";
type Form = {
  type: OperationType; farmId: string; animalId: string; quantity: string; date: string; time: string;
  reason: string; healthStatus: string; severity: string; symptoms: string; action: string;
  isolation: boolean; veterinarian: boolean; veterinarianId: string; veterinarianNotes: string; followUp: string; weight: string; weightUom: string;
  medicineBalanceId: string; dosage: string; medicineQuantity: string; route: string; withdrawal: string;
  disposalMethod: string; disposalLocation: string; cause: string;
};
const blank = (): Form => ({
  type: "health", farmId: "", animalId: "", quantity: "1", date: today(), time: "09:00",
  reason: "", healthStatus: "under_observation", severity: "mild", symptoms: "", action: "",
  isolation: false, veterinarian: false, veterinarianId: "", veterinarianNotes: "", followUp: "", weight: "", weightUom: "kg",
  medicineBalanceId: "", dosage: "", medicineQuantity: "", route: "oral", withdrawal: "0",
  disposalMethod: "", disposalLocation: "", cause: "",
});
const show = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};
const errorText = (error: unknown) => {
  const e = error as { data?: { message?: string; errors?: Record<string, string[]> } };
  return (e.data?.errors && Object.values(e.data.errors).flat()[0]) || e.data?.message || "Request failed";
};

export default function FarmOperationsPage() {
  const [farmId, setFarmId] = useState("");
  const [animalFilter, setAnimalFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [form, setForm] = useState<Form>(blank);
  const [editing, setEditing] = useState<FarmOperation | null>(null);
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<FarmOperation | null>(null);
  const [actionDialog, setActionDialog] = useState<{ action: "reject" | "reverse" | "followup"; item: FarmOperation } | null>(null);
  const [actionText, setActionText] = useState("");
  const [busy, setBusy] = useState(false);
  const { data: farmsResponse } = useGetFarmInformationListQuery({ per_page: 100 });
  const farms = farmsResponse?.data || [];
  const { data: adminsResponse } = useGetSetupAdminsQuery();
  const { data: response, isLoading, isError } = useGetFarmOperationsQuery({ farm_information_id: farmId, animal_balance_id: animalFilter, type: typeFilter, per_page: 100 });
  const { data: filterAnimals } = useGetFarmAnimalsQuery({ farmId: Number(farmId), per_page: 100 }, { skip: !farmId });
  const { data: animalsResponse } = useGetFarmAnimalsQuery({ farmId: Number(form.farmId), per_page: 100 }, { skip: !form.farmId });
  const { data: medicineResponse } = useGetInventoryBalancesQuery({ category: "medicine", farm_information_id: form.farmId, per_page: 100 }, { skip: !form.farmId || form.type !== "medication" });
  const [getDetail] = useLazyGetFarmOperationQuery();
  const [create] = useCreateFarmOperationMutation();
  const [update] = useUpdateFarmOperationMutation();
  const [submit] = useSubmitFarmOperationMutation();
  const [confirm] = useConfirmFarmOperationMutation();
  const [reject] = useRejectFarmOperationMutation();
  const [reverse] = useReverseFarmOperationMutation();
  const [complete] = useCompleteFarmFollowUpMutation();
  const operations = response?.data || [];
  const selectedBalance = medicineResponse?.data.find((item) => String(item.id) === form.medicineBalanceId);
  const operationFarm = farms.find((farm) => String(farm.id) === form.farmId);
  const branchVeterinarians = (adminsResponse?.data || []).filter((admin) =>
    admin.account_status === "active" && (admin.branch_ids || admin.branches?.map((branch) => branch.id) || []).includes(Number(operationFarm?.branch_id))
  );
  useEffect(() => {
    if (!editing || editing.type !== "medication" || form.medicineBalanceId || !medicineResponse?.data.length) return;
    const line = (editing.payload.lines as Record<string, unknown>[] | undefined)?.[0];
    const match = medicineResponse.data.find((balance) => Number(balance.item_id) === Number(line?.medicine_item_id) && Number(balance.inventory_id) === Number(line?.inventory_id) && Number(balance.stock_lot_id || 0) === Number(line?.stock_lot_id || 0));
    if (match) setForm((old) => ({ ...old, medicineBalanceId: String(match.id) }));
  }, [editing, form.medicineBalanceId, medicineResponse]);
  const field = (key: keyof Form, value: string | boolean) => setForm((old) => ({ ...old, [key]: value }));

  const payload = (): FarmOperationPayload => {
    const common = {
      type: form.type, branch_id: Number(farms.find((farm) => String(farm.id) === form.farmId)?.branch_id),
      farm_information_id: Number(form.farmId), activity_date: form.date, activity_time: form.time,
      idempotency_key: editing?.idempotency_key || crypto.randomUUID(),
      targets: [{ animal_balance_id: Number(form.animalId), quantity: Number(form.quantity) }],
    };
    const data: Record<string, unknown> = { reason: form.reason };
    if (form.type === "health") Object.assign(data, { health_status: form.healthStatus, severity: form.severity, symptoms: form.symptoms, action_taken: form.action, isolation_required: form.isolation, veterinarian_required: form.veterinarian, ...(form.veterinarianId ? { veterinarian_id: Number(form.veterinarianId) } : {}), ...(form.veterinarianNotes ? { veterinarian_notes: form.veterinarianNotes } : {}), ...(form.followUp ? { follow_up_date: form.followUp } : {}) });
    if (form.type === "weight") Object.assign(data, { weight: Number(form.weight), weight_uom: form.weightUom });
    if (form.type === "mortality") Object.assign(data, { disposal_method: form.disposalMethod, disposal_location: form.disposalLocation, suspected_cause: form.cause });
    if (form.type === "medication") Object.assign(data, { administration_route: form.route, withdrawal_days: Number(form.withdrawal), ...(form.followUp ? { follow_up_date: form.followUp } : {}), lines: [{ medicine_item_id: Number(selectedBalance?.item_id), inventory_id: Number(selectedBalance?.inventory_id), stock_lot_id: selectedBalance?.stock_lot_id ? Number(selectedBalance.stock_lot_id) : null, source_location: String(selectedBalance?.location || ""), stock_uom_id: Number(selectedBalance?.stock_uom_id), dosage: Number(form.dosage), dosage_uom_id: Number(selectedBalance?.stock_uom_id), quantity: Number(form.medicineQuantity) }] });
    return { ...common, payload: data };
  };
  const save = async () => {
    if (!form.farmId || !form.animalId || !form.date || !form.reason || Number(form.quantity) <= 0) return toast.error("Farm, animal, date, quantity and reason are required.");
    if (form.type === "medication" && (!selectedBalance || !form.dosage || !form.medicineQuantity)) return toast.error("Select medicine stock and enter dosage and quantity.");
    if (form.type === "health" && form.veterinarian && !form.veterinarianId) return toast.error("Select an active veterinarian assigned to this farm’s branch.");
    if (form.type === "weight" && !form.weight) return toast.error("Enter the measured weight.");
    if (form.type === "mortality" && !form.disposalMethod) return toast.error("Enter the disposal method.");
    setBusy(true);
    try {
      const result = editing ? await update({ id: editing.id, body: payload() }).unwrap() : await create(payload()).unwrap();
      toast.success(editing ? "Draft updated" : "Draft created"); setOpen(false); setEditing(null); setDetail(result.data);
    } catch (error) { toast.error(errorText(error)); } finally { setBusy(false); }
  };
  const run = async (action: "submit" | "confirm" | "reject" | "reverse" | "followup", item: FarmOperation, text?: string) => {
    const reason = action === "reject" || action === "reverse" ? text?.trim() : undefined;
    const notes = action === "followup" ? text?.trim() : undefined;
    if ((action === "reject" || action === "reverse") && !reason?.trim()) return;
    if (action === "followup" && !notes?.trim()) return;
    setBusy(true);
    try {
      const result = action === "submit" ? await submit(item.id).unwrap() : action === "confirm" ? await confirm(item.id).unwrap() : action === "reject" ? await reject({ id: item.id, reason: reason!.trim() }).unwrap() : action === "reverse" ? await reverse({ id: item.id, reason: reason!.trim() }).unwrap() : await complete({ id: item.id, notes: notes!.trim() }).unwrap();
      setDetail(action === "reverse" ? (await getDetail(item.id).unwrap()).data : result.data);
      setActionDialog(null);
      setActionText("");
      toast.success(`${action} completed`);
    } catch (error) { toast.error(errorText(error)); } finally { setBusy(false); }
  };
  const inspect = async (item: FarmOperation) => {
    try { setDetail((await getDetail(item.id).unwrap()).data); } catch (error) { toast.error(errorText(error)); }
  };
  const openAction = (action: "reject" | "reverse" | "followup", item: FarmOperation) => {
    setActionText("");
    setActionDialog({ action, item });
  };
  const edit = (item: FarmOperation) => {
    const p = item.payload || {}; const target = item.targets?.[0];
    setForm({ ...blank(), type: item.type === "correction" ? "health" : item.type, farmId: String(item.farm_information_id), animalId: String(target?.animal_balance_id || ""), quantity: String(target?.quantity || 1), date: item.activity_date, time: item.activity_time || "09:00", reason: String(p.reason || ""), healthStatus: String(p.health_status || "under_observation"), severity: String(p.severity || "mild"), symptoms: String(p.symptoms || ""), action: String(p.action_taken || ""), isolation: Boolean(p.isolation_required), veterinarian: Boolean(p.veterinarian_required), veterinarianId: String(p.veterinarian_id || ""), veterinarianNotes: String(p.veterinarian_notes || ""), followUp: String(p.follow_up_date || ""), weight: String(p.weight || ""), weightUom: String(p.weight_uom || "kg"), medicineBalanceId: "", dosage: String((p.lines as Record<string, unknown>[] | undefined)?.[0]?.dosage || ""), medicineQuantity: String((p.lines as Record<string, unknown>[] | undefined)?.[0]?.quantity || ""), route: String(p.administration_route || "oral"), withdrawal: String(p.withdrawal_days ?? 0), disposalMethod: String(p.disposal_method || ""), disposalLocation: String(p.disposal_location || ""), cause: String(p.suspected_cause || "") });
    setDetail(null); setEditing(item); setOpen(true);
  };
  const renderActions = (item: FarmOperation) => <div className="flex flex-wrap gap-2">
    {(item.workflow_state === "draft" || item.workflow_state === "rejected") && <><Button size="sm" variant="outline" disabled={busy} onClick={() => edit(item)}>Edit</Button><Button size="sm" disabled={busy} onClick={() => void run("submit", item)}>Submit</Button></>}
    {item.workflow_state === "submitted" && <><Button size="sm" disabled={busy} onClick={() => void run("confirm", item)}>Confirm</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => openAction("reject", item)}>Reject</Button></>}
    {item.workflow_state === "confirmed" && item.type !== "correction" && <><Button size="sm" variant="outline" disabled={busy} onClick={() => void run("confirm", item)}>Retry confirm</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => openAction("reverse", item)}>Reverse</Button>{["health", "medication"].includes(item.type) && Boolean(item.payload?.follow_up_date) && !item.payload?.follow_up_completed_at && <Button size="sm" variant="outline" disabled={busy} onClick={() => openAction("followup", item)}>Complete follow-up</Button>}</>}
  </div>;

  return <div className="mx-auto max-w-7xl space-y-6 text-gray-800 dark:text-gray-100">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><Link href="/farms" className="inline-flex items-center gap-1 text-sm text-green-700 dark:text-green-400"><ArrowLeft size={15}/> Farms</Link><h1 className="mt-2 text-2xl font-bold">Farm operations</h1><p className="text-sm text-gray-500">Health, weight, medication and mortality records</p></div><Button onClick={() => { setForm({ ...blank(), farmId }); setEditing(null); setOpen(true); }}><Plus size={16}/> New operation</Button></div>
    <div className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] sm:grid-cols-3"><Field title="Farm"><select className={input} value={farmId} onChange={(e) => { setFarmId(e.target.value); setAnimalFilter(""); }}><option value="">All farms</option>{farms.map((farm) => <option key={farm.id} value={farm.id}>{farm.name}</option>)}</select></Field><Field title="Animal / batch"><select className={input} value={animalFilter} disabled={!farmId} onChange={(e) => setAnimalFilter(e.target.value)}><option value="">All animals</option>{(filterAnimals?.data || []).map((animal) => <option key={animal.id} value={animal.id}>{animal.display_name || animal.name || animal.code || `#${animal.id}`}</option>)}</select></Field><Field title="Type"><select className={input} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}><option value="">All types</option>{["health", "weight", "medication", "mortality"].map((type) => <option key={type} value={type}>{type}</option>)}</select></Field></div>
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">{isLoading ? <div className="p-12"><Loading/></div> : isError ? <p className="p-6 text-red-600">Unable to load farm operations.</p> : <table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-gray-50 text-gray-600 dark:bg-gray-900 dark:text-gray-300"><tr>{["Reference", "Date", "Farm", "Type", "Animals", "Status", "Actions"].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead><tbody>{operations.map((item) => <tr key={item.id} className="border-t border-gray-100 transition-colors hover:bg-gray-50/80 dark:border-gray-800 dark:hover:bg-white/[0.04]"><td className="px-4 py-3 font-medium">{show(item.reference)}</td><td className="px-4 py-3">{show(item.activity_date)}</td><td className="px-4 py-3">{farms.find((farm) => farm.id === item.farm_information_id)?.name || `#${item.farm_information_id}`}</td><td className="px-4 py-3 capitalize">{item.type}</td><td className="px-4 py-3">{item.targets?.map((target) => `#${target.animal_balance_id} × ${target.quantity}`).join(", ") || "—"}</td><td className="px-4 py-3"><FarmStatusBadge status={item.workflow_state}/></td><td className="px-4 py-3"><button className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-500/10" onClick={() => void inspect(item)}><Eye size={15}/> Open</button></td></tr>)}{!operations.length && <tr><td colSpan={7} className="p-8 text-center text-gray-500">No operations found.</td></tr>}</tbody></table>}</div>
    {detail && <Modal isOpen={!!detail} onClose={() => setDetail(null)} className="m-4 max-w-3xl"><div className="space-y-5 p-6 sm:p-8"><div className="pr-12"><h2 className="text-lg font-bold text-gray-900 dark:text-white">{detail.reference || `Operation #${detail.id}`}</h2><p className="mt-1 text-sm text-gray-500">Farm operation details</p></div><div className="max-h-[65vh] space-y-5 overflow-y-auto pr-2"><div className="grid gap-3 rounded-xl border border-gray-200 p-4 text-sm dark:border-gray-800 sm:grid-cols-2"><p>Type: <b className="capitalize">{detail.type}</b></p><p className="flex items-center gap-2">Status: <FarmStatusBadge status={detail.workflow_state}/></p><p>Date: <b>{detail.activity_date}</b></p><p>Farm: <b>{farms.find((farm) => farm.id === detail.farm_information_id)?.name || `#${detail.farm_information_id}`}</b></p><p className="sm:col-span-2">Targets: <b>{detail.targets?.map((target) => `#${target.animal_balance_id} × ${target.quantity}`).join(", ") || "—"}</b></p></div><div className="grid gap-3 text-sm sm:grid-cols-2">{Object.entries(detail.payload || {}).filter(([key]) => key !== "posted_lines").map(([key, value]) => <div key={key} className="min-w-0 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/60"><span className="block text-xs font-medium capitalize text-gray-500">{key.replaceAll("_", " ")}</span><pre className="mt-1 whitespace-pre-wrap break-words font-sans text-sm text-gray-800 dark:text-gray-100">{typeof value === "object" && value !== null ? JSON.stringify(value, null, 2) : show(value)}</pre></div>)}</div></div><div className="flex justify-end border-t border-gray-100 pt-4 dark:border-white/[0.06]">{renderActions(detail)}</div></div></Modal>}
    <Modal isOpen={open} onClose={() => setOpen(false)} className="m-4 max-w-3xl"><div className="space-y-5 p-6 sm:p-8"><div className="pr-12"><h2 className="text-lg font-bold text-gray-900 dark:text-white">{editing ? "Edit operation draft" : "New operation draft"}</h2><p className="mt-1 text-sm text-gray-500">Record a farm activity and the animals it affects.</p></div><div className="max-h-[65vh] overflow-y-auto pr-2"><div className="grid gap-4 sm:grid-cols-2"><Field title="Type"><select className={input} value={form.type} onChange={(e) => field("type", e.target.value)}>{["health", "weight", "medication", "mortality"].map((type) => <option key={type} value={type}>{type}</option>)}</select></Field><Field title="Farm"><select className={input} value={form.farmId} onChange={(e) => { field("farmId", e.target.value); field("animalId", ""); }}><option value="">Select farm</option>{farms.map((farm) => <option key={farm.id} value={farm.id}>{farm.name}</option>)}</select></Field><Field title="Animal / batch"><select className={input} value={form.animalId} onChange={(e) => field("animalId", e.target.value)}><option value="">Select animal</option>{(animalsResponse?.data || []).map((animal) => <option key={animal.id} value={animal.id}>{animal.display_name || animal.name || animal.code || `#${animal.id}`} · {animal.current_quantity ?? "—"} available</option>)}</select></Field><Field title="Affected quantity"><input className={input} type="number" min="1" step="1" value={form.quantity} onChange={(e) => field("quantity", e.target.value)}/></Field><DatePicker id="farm-operation-date" label="Activity date" static={false} defaultDate={form.date} onChange={(_, date) => field("date", date)} /><Field title="Time"><input className={input} type="time" value={form.time} onChange={(e) => field("time", e.target.value)}/></Field><Field title="Reason"><input className={input} value={form.reason} onChange={(e) => field("reason", e.target.value)}/></Field>
      {form.type === "health" && <><Field title="Health status"><select className={input} value={form.healthStatus} onChange={(e) => field("healthStatus", e.target.value)}>{["healthy", "under_observation", "sick", "under_treatment", "quarantine", "critical", "recovered"].map((v) => <option key={v} value={v}>{v.replaceAll("_", " ")}</option>)}</select></Field><Field title="Severity"><select className={input} value={form.severity} onChange={(e) => field("severity", e.target.value)}>{["mild", "moderate", "severe", "critical"].map((v) => <option key={v}>{v}</option>)}</select></Field><Field title="Symptoms"><input className={input} value={form.symptoms} onChange={(e) => field("symptoms", e.target.value)}/></Field><Field title="Action taken"><input className={input} value={form.action} onChange={(e) => field("action", e.target.value)}/></Field><label className="text-sm"><input type="checkbox" checked={form.isolation} onChange={(e) => field("isolation", e.target.checked)}/> Isolation required</label><label className="text-sm"><input type="checkbox" checked={form.veterinarian} onChange={(e) => { field("veterinarian", e.target.checked); if (!e.target.checked) { field("veterinarianId", ""); field("veterinarianNotes", ""); } }}/> Veterinarian required</label>{form.veterinarian && <><Field title="Veterinarian"><select className={input} value={form.veterinarianId} onChange={(e) => field("veterinarianId", e.target.value)}><option value="">Select veterinarian</option>{branchVeterinarians.map((admin) => <option key={admin.id} value={admin.id}>{admin.name} · {admin.email}</option>)}</select></Field><Field title="Veterinarian notes"><input className={input} value={form.veterinarianNotes} onChange={(e) => field("veterinarianNotes", e.target.value)} /></Field>{branchVeterinarians.length === 0 && <p className="text-sm text-amber-700 dark:text-amber-400">No active users are assigned to this farm’s branch. Assign a veterinarian in Setup → Admins first.</p>}</>}</>}
      {form.type === "weight" && <><Field title="Weight"><input className={input} type="number" min="0" step="any" value={form.weight} onChange={(e) => field("weight", e.target.value)}/></Field><Field title="Unit"><select className={input} value={form.weightUom} onChange={(e) => field("weightUom", e.target.value)}>{["kg", "g", "lb"].map((v) => <option key={v}>{v}</option>)}</select></Field></>}
      {form.type === "mortality" && <><Field title="Disposal method"><input className={input} value={form.disposalMethod} onChange={(e) => field("disposalMethod", e.target.value)}/></Field><Field title="Disposal location"><input className={input} value={form.disposalLocation} onChange={(e) => field("disposalLocation", e.target.value)}/></Field><Field title="Suspected cause"><input className={input} value={form.cause} onChange={(e) => field("cause", e.target.value)}/></Field></>}
      {form.type === "medication" && <><Field title="Medicine stock"><select className={input} value={form.medicineBalanceId} onChange={(e) => field("medicineBalanceId", e.target.value)}><option value="">Select stock balance</option>{(medicineResponse?.data || []).map((balance) => <option key={balance.id} value={balance.id}>{show(balance.item_name || (balance.item as { name?: string } | undefined)?.name || balance.item_id)} · {show(balance.location)} · {show(balance.available_quantity)} available</option>)}</select></Field><Field title="Dosage"><input className={input} type="number" min="0" step="any" value={form.dosage} onChange={(e) => field("dosage", e.target.value)}/></Field><Field title="Stock quantity"><input className={input} type="number" min="0" step="any" value={form.medicineQuantity} onChange={(e) => field("medicineQuantity", e.target.value)}/></Field><Field title="Administration route"><input className={input} value={form.route} onChange={(e) => field("route", e.target.value)}/></Field><Field title="Withdrawal days"><input className={input} type="number" min="0" value={form.withdrawal} onChange={(e) => field("withdrawal", e.target.value)}/></Field></>}
      {(form.type === "health" || form.type === "medication") && <DatePicker id="farm-operation-followup" label="Follow-up date" static={false} defaultDate={form.followUp || undefined} onChange={(_, date) => field("followUp", date)} />}
    </div></div><div className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-white/[0.06]"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={busy || !form.farmId} onClick={() => void save()}>{busy ? "Saving…" : "Save draft"}</Button></div></div></Modal>
    {actionDialog && <Modal isOpen={!!actionDialog} onClose={() => setActionDialog(null)} className="m-4 max-w-lg"><div className="space-y-5 p-6 sm:p-8"><h2 id="farm-action-title" className="text-lg font-semibold capitalize">{actionDialog.action === "followup" ? "Complete follow-up" : `${actionDialog.action} operation`}</h2><p className="mt-1 text-sm text-gray-500">{actionDialog.item.reference || `Operation #${actionDialog.item.id}`}</p><label className="mt-5 block text-sm font-medium" htmlFor="farm-action-note">{actionDialog.action === "followup" ? "Follow-up notes" : "Reason"} <span className="text-red-600">*</span></label><textarea id="farm-action-note" className={`${input} mt-2 h-28 resize-y py-3`} value={actionText} onChange={(e) => setActionText(e.target.value)} placeholder="Enter a clear explanation"/><div className="mt-5 flex justify-end gap-2"><Button variant="outline" disabled={busy} onClick={() => setActionDialog(null)}>Cancel</Button><Button disabled={busy || !actionText.trim()} onClick={() => void run(actionDialog.action, actionDialog.item, actionText)}>{busy ? "Saving…" : "Confirm"}</Button></div></div></Modal>}
  </div>;
}

function Field({ title, children }: { title: string; children: React.ReactNode }) { return <label className="block"><span className={label}>{title}</span>{children}</label>; }
