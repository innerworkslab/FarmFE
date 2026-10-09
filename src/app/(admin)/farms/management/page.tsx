"use client";

import { useState } from "react";
import { toast } from "sonner";
import DatePicker from "@/components/form/date-picker";
import Button from "@/components/ui/button/Button";
import Loading from "@/components/common/Loading";
import FarmStatusBadge from "@/components/farms/FarmStatusBadge";
import { useGetFarmInformationListQuery } from "@/redux/features/setup/FarmInformationApiSlice";
import { useGetFarmAnimalsQuery } from "@/redux/features/farms/FarmAnimalViewApiSlice";
import { useGetInventoryBalancesQuery, useGetInventoryItemsQuery } from "@/redux/features/inventory/InventoryFoundationApiSlice";
import { useGetUomsQuery } from "@/redux/features/setup/UomApiSlice";
import {
  FarmAlert, FarmSettings,
  useGetFarmSettingsQuery, useSaveFarmSettingsMutation, useToggleFarmStatusMutation,
  useGetFarmFeedingPlansQuery, useSaveFarmFeedingPlanMutation,
  useGetFarmSummaryQuery, useGetFarmMortalityQuery, useGetFarmTimelineQuery,
  useGetFarmAlertsQuery, useGetFarmNotificationsQuery, useInvestigateFarmAlertMutation,
} from "@/redux/features/farms/FarmManagementApiSlice";

type Tab = "overview" | "plans" | "timeline" | "mortality" | "alerts" | "settings";
const today = () => new Date().toLocaleDateString("en-CA");
const input = "h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 outline-none focus:border-green-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100";
const panel = "rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]";
const display = (value: unknown): string => value === null || value === undefined || value === "" ? "—" : typeof value === "object" ? JSON.stringify(value) : String(value);
const errorText = (error: unknown) => { const e = error as { data?: { message?: string; errors?: Record<string, string[]> } }; return (e.data?.errors && Object.values(e.data.errors).flat()[0]) || e.data?.message || "Request failed"; };
const settingsKeys: (keyof FarmSettings)[] = ["daily_mortality_threshold", "cumulative_mortality_threshold", "feed_variance_threshold", "feed_wastage_threshold", "sickness_threshold", "expiry_warning_days"];
const detailLabels: Record<string, string> = {
  animal_balance_id: "Animal / batch",
  food_item_id: "Food",
  item_id: "Item",
  stock_uom_id: "Unit",
  planned_quantity: "Planned feed",
  actual_quantity: "Fed",
  wastage_quantity: "Wasted",
  variance: "Difference",
  variance_percentage: "Difference %",
  wastage_percentage: "Wastage %",
  available_quantity: "Available stock",
  death_quantity: "Deaths",
  daily_mortality_percentage: "Daily mortality %",
  cumulative_mortality_percentage: "Cumulative mortality %",
};
const readable = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.map(readable).join(", ");
  if (typeof value === "object") return Object.entries(value).map(([key, item]) => `${detailLabels[key] || key.replaceAll("_", " ")}: ${readable(item)}`).join(" · ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
};

export default function FarmManagementPage() {
  const [farmId, setFarmId] = useState("");
  const [tab, setTab] = useState<Tab>("overview");
  const [date, setDate] = useState(today);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [animalId, setAnimalId] = useState("");
  const [timelineType, setTimelineType] = useState("");
  const [planAnimal, setPlanAnimal] = useState("");
  const [planFoodBalance, setPlanFoodBalance] = useState("");
  const [planQuantity, setPlanQuantity] = useState("");
  const [planDate, setPlanDate] = useState(today);
  const [settingsForm, setSettingsForm] = useState<Partial<FarmSettings> | null>(null);
  const [investigationAlert, setInvestigationAlert] = useState<FarmAlert | null>(null);
  const [investigationNotes, setInvestigationNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const { data: farmsResponse } = useGetFarmInformationListQuery({ per_page: 100 });
  const farms = farmsResponse?.data || [];
  const selectedId = farmId || String(farms[0]?.id || "");
  const selectedFarm = farms.find((farm) => String(farm.id) === selectedId);
  const skip = !selectedId;
  const { data: summary, isLoading: summaryLoading, isError: summaryError } = useGetFarmSummaryQuery({ farmId: selectedId, date }, { skip });
  const { data: mortality, isError: mortalityError } = useGetFarmMortalityQuery({ farmId: selectedId }, { skip });
  const { data: timeline, isError: timelineError } = useGetFarmTimelineQuery({ farmId: selectedId, from_date: fromDate, to_date: toDate, animal_balance_id: animalId, type: timelineType }, { skip });
  const { data: alerts, isError: alertsError } = useGetFarmAlertsQuery(selectedId, { skip });
  const { data: notifications, isError: notificationsError } = useGetFarmNotificationsQuery();
  const { data: settings, isError: settingsError } = useGetFarmSettingsQuery(selectedId, { skip });
  const { data: plans, isError: plansError } = useGetFarmFeedingPlansQuery({ farmId: selectedId, date }, { skip });
  const { data: animals } = useGetFarmAnimalsQuery({ farmId: Number(selectedId), per_page: 100 }, { skip });
  const { data: foods } = useGetInventoryBalancesQuery({ category: "food", farm_information_id: selectedId, per_page: 100 }, { skip });
  const { data: foodItems } = useGetInventoryItemsQuery({ category: "food", per_page: 100 }, { skip: tab !== "alerts" });
  const { data: units } = useGetUomsQuery({ per_page: 100 }, { skip: tab !== "alerts" });
  const [saveSettings] = useSaveFarmSettingsMutation();
  const [toggleStatus] = useToggleFarmStatusMutation();
  const [savePlan] = useSaveFarmFeedingPlanMutation();
  const [investigate] = useInvestigateFarmAlertMutation();
  const sourceFood = foods?.data.find((balance) => String(balance.id) === planFoodBalance);
  const settingsValue = settingsForm || settings?.data;

  const doAction = async (action: () => Promise<unknown>, success: string) => { setBusy(true); try { await action(); toast.success(success); } catch (error) { toast.error(errorText(error)); } finally { setBusy(false); } };
  const createPlan = () => {
    if (!planAnimal || !sourceFood || !planDate || planQuantity === "" || Number(planQuantity) < 0) return toast.error("Animal, food stock, date and quantity are required.");
    void doAction(() => savePlan({ farmId: selectedId, body: { plan_date: planDate, animal_balance_id: Number(planAnimal), food_item_id: Number(sourceFood.item_id), stock_uom_id: Number(sourceFood.stock_uom_id), quantity: Number(planQuantity) } }).unwrap(), "Feeding plan saved");
  };
  const submitSettings = () => {
    if (!settingsValue?.timezone || settingsValue.expiry_warning_days == null) return toast.error("Timezone and expiry warning days are required.");
    const body: Partial<FarmSettings> = { timezone: settingsValue.timezone, expiry_warning_days: Number(settingsValue.expiry_warning_days) };
    settingsKeys.filter((key) => key !== "expiry_warning_days").forEach((key) => { const value = settingsValue[key]; if (value !== undefined) Object.assign(body, { [key]: value === null || value === "" ? null : Number(value) }); });
    void doAction(async () => { await saveSettings({ farmId: selectedId, body }).unwrap(); setSettingsForm(null); }, "Farm settings saved");
  };
  const investigateAlert = () => {
    if (!investigationAlert?.id || !investigationNotes.trim()) return;
    void doAction(async () => {
      await investigate({ id: investigationAlert.id!, notes: investigationNotes.trim() }).unwrap();
      setInvestigationAlert(null);
      setInvestigationNotes("");
    }, "Investigation saved");
  };
  const metric = (name: string, value: unknown) => <div className={`${panel} border-l-4 border-l-green-600`}><p className="text-xs font-medium uppercase tracking-wide text-gray-500">{name}</p><p className="mt-2 text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">{display(value)}</p></div>;
  const row = (data: Record<string, unknown>) => Object.entries(data).filter(([key]) => !["id", "type", "details", "payload"].includes(key)).slice(0, 6).map(([key, value]) => <span key={key} className="text-xs text-gray-500 dark:text-gray-400"><b className="font-medium text-gray-700 dark:text-gray-200">{key.replaceAll("_", " ")}:</b> {display(value)}</span>);
  const detailValue = (key: string, value: unknown): string => {
    if (key === "animal_balance_id") {
      const animal = animals?.data.find((item) => Number(item.id) === Number(value));
      return animal ? animal.display_name || animal.name || animal.code || `Animal #${value}` : `Animal #${value}`;
    }
    if (key === "food_item_id" || key === "item_id") {
      const item = foodItems?.data.find((food) => Number(food.id) === Number(value));
      return item ? `${item.name} (${item.code})` : `Item #${value}`;
    }
    if (key === "stock_uom_id") {
      const unit = units?.data.find((item) => Number(item.id) === Number(value));
      return unit ? `${unit.name} (${unit.symbol})` : `Unit #${value}`;
    }
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (key.endsWith("_percentage") && value !== null && value !== undefined) return `${value}%`;
    return readable(value);
  };
  const details = (value: unknown) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    return <dl className="mt-3 grid gap-2 sm:grid-cols-2">{Object.entries(value).map(([key, field]) => <div key={key} className="min-w-0 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800/60"><dt className="text-xs font-medium text-gray-500 dark:text-gray-400">{detailLabels[key] || key.replaceAll("_", " ")}</dt><dd className="mt-0.5 break-words text-sm font-semibold text-gray-900 dark:text-gray-100">{field && typeof field === "object" ? readable(field) : detailValue(key, field)}</dd></div>)}</dl>;
  };

  return <div className="mx-auto max-w-7xl space-y-6 text-gray-800 dark:text-gray-100"><div><h1 className="text-2xl font-bold">Farm management</h1><p className="text-sm text-gray-500">Daily performance, plans, alerts and settings</p></div>
    <div className={`${panel} grid gap-4 sm:grid-cols-2`}><Field title="Farm"><select className={input} value={selectedId} onChange={(e) => { setFarmId(e.target.value); setSettingsForm(null); setAnimalId(""); }}><option value="">Select farm</option>{farms.map((farm) => <option key={farm.id} value={farm.id}>{farm.name} · {farm.branch?.name || `Branch #${farm.branch_id}`}</option>)}</select></Field><DatePicker id="farm-management-date" label="Summary / plan date" defaultDate={date} onChange={(_, value) => setDate(value)} /></div>
    <div className="flex flex-wrap gap-2">{(["overview", "plans", "timeline", "mortality", "alerts", "settings"] as Tab[]).map((name) => <button key={name} aria-pressed={tab === name} className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize transition-colors ${tab === name ? "bg-green-700 text-white shadow-sm" : "border border-gray-200 bg-white text-gray-600 hover:border-green-300 hover:text-green-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"}`} onClick={() => setTab(name)}>{name}</button>)}</div>
    {!selectedFarm ? <div className={panel}>Select a farm to view its records.</div> : <>
    {tab === "overview" && <>{summaryLoading ? <Loading/> : summaryError ? <Error text="Unable to load summary"/> : <><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{metric("Animals", summary?.data.total_animal_count)}{metric("Active batches", summary?.data.active_batch_count)}{metric("Sick animals", summary?.data.sick_animal_count)}{metric("Deaths today", summary?.data.deaths_today)}{metric("Mortality rate %", summary?.data.mortality_rate)}{metric("Feed quantity today", (summary?.data.feed_consumption_summary as Record<string, unknown> | undefined)?.today_quantity)}{metric("Feed cost today", (summary?.data.feed_consumption_summary as Record<string, unknown> | undefined)?.today_cost)}{metric("Medicine quantity today", (summary?.data.medicine_usage_summary as Record<string, unknown> | undefined)?.today_quantity)}</div><div className={panel}><h2 className="mb-3 font-semibold">Feed plan vs actual</h2><div className="space-y-2">{(((summary?.data.feed_consumption_summary as Record<string, unknown> | undefined)?.planned_actual_by_animal as Record<string, unknown>[] | undefined) || []).length ? (((summary?.data.feed_consumption_summary as Record<string, unknown> | undefined)?.planned_actual_by_animal as Record<string, unknown>[] | undefined) || []).map((item, index) => <div key={index} className="flex flex-wrap gap-4 border-t border-gray-100 py-2 dark:border-gray-800">{row(item)}</div>) : <p className="text-sm text-gray-500">No planned or confirmed feeding for this date.</p>}</div></div></>}</>}
    {tab === "plans" && <div className="space-y-4"><div className={panel}><h2 className="mb-4 font-semibold">Set feeding plan</h2><div className="grid gap-3 md:grid-cols-2"><DatePicker id="farm-plan-date" label="Plan date" defaultDate={planDate} onChange={(_, value) => setPlanDate(value)} /><Field title="Animal / batch"><select className={input} value={planAnimal} onChange={(e) => setPlanAnimal(e.target.value)}><option value="">Select animal</option>{(animals?.data || []).map((animal) => <option key={animal.id} value={animal.id}>{animal.display_name || animal.name || animal.code || `#${animal.id}`}</option>)}</select></Field><Field title="Food stock"><select className={input} value={planFoodBalance} onChange={(e) => setPlanFoodBalance(e.target.value)}><option value="">Select food</option>{(foods?.data || []).map((food) => <option key={food.id} value={food.id}>{display(food.item_name || (food.item as { name?: string } | undefined)?.name || food.item_id)} · {display(food.available_quantity)} available</option>)}</select></Field><Field title="Planned quantity"><input className={input} type="number" min="0" step="any" value={planQuantity} onChange={(e) => setPlanQuantity(e.target.value)} /></Field></div><div className="mt-4"><Button disabled={busy} onClick={createPlan}>Save plan</Button></div></div><div className={panel}><h2 className="mb-3 font-semibold">Plans for {date}</h2>{plansError ? <Error text="Unable to load feeding plans"/> : (plans?.data || []).length ? <div className="divide-y divide-gray-100 dark:divide-gray-800">{plans?.data.map((plan) => <div key={plan.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span>{animals?.data.find((animal) => animal.id === plan.animal_balance_id)?.display_name || `Animal #${plan.animal_balance_id}`} · {foods?.data.find((food) => Number(food.item_id) === plan.food_item_id)?.item_name as string || `Food item #${plan.food_item_id}`}</span><b>{display(plan.quantity)}</b></div>)}</div> : <p className="text-sm text-gray-500">No plans for this date.</p>}</div></div>}
    {tab === "timeline" && <div className="space-y-4"><div className={`${panel} grid gap-3 md:grid-cols-4`}><DatePicker id="farm-timeline-from" label="From date" defaultDate={fromDate || undefined} onChange={(_, value) => setFromDate(value)} /><DatePicker id="farm-timeline-to" label="To date" defaultDate={toDate || undefined} onChange={(_, value) => setToDate(value)} /><Field title="Animal"><select className={input} value={animalId} onChange={(e) => setAnimalId(e.target.value)}><option value="">All animals</option>{(animals?.data || []).map((animal) => <option key={animal.id} value={animal.id}>{animal.display_name || animal.name || animal.code || `#${animal.id}`}</option>)}</select></Field><Field title="Event type"><select className={input} value={timelineType} onChange={(e) => setTimelineType(e.target.value)}><option value="">All events</option>{["health", "weight", "medication", "mortality", "feeding", "purchase", "transfer", "sale", "production"].map((type) => <option key={type}>{type}</option>)}</select></Field></div>{timelineError ? <Error text="Unable to load timeline"/> : <div className={panel}><h2 className="mb-3 font-semibold">Farm timeline</h2>{(timeline?.data || []).length ? <div className="divide-y divide-gray-100 dark:divide-gray-800">{timeline?.data.map((event, index) => <div key={`${event.reference}-${index}`} className="grid gap-1 py-3 text-sm sm:grid-cols-4"><b>{display(event.date)} {display(event.time)}</b><span className="capitalize">{display(event.type)}</span><span>{display(event.reference)}</span><span className="flex flex-wrap items-center gap-2"><FarmStatusBadge status={String(event.workflow_state || "")}/><span>Qty {display(event.quantity)}</span></span></div>)}</div> : <p className="text-sm text-gray-500">No events found.</p>}</div>}</div>}
    {tab === "mortality" && <div className={panel}><h2 className="mb-3 font-semibold">Mortality rates</h2>{mortalityError ? <Error text="Unable to load mortality rates"/> : (mortality?.data || []).length ? <div className="divide-y divide-gray-100 dark:divide-gray-800">{mortality?.data.map((item, index) => <div key={index} className="grid gap-2 py-3 text-sm sm:grid-cols-5"><span>{display(item.date)}</span><span>Animal #{display(item.animal_balance_id)}</span><span>Deaths {display(item.death_quantity)}</span><span>Daily {display(item.daily_mortality_percentage)}%</span><span>Cumulative {display(item.cumulative_mortality_percentage)}%</span></div>)}</div> : <p className="text-sm text-gray-500">No mortality records found.</p>}</div>}
    {tab === "alerts" && <div className="grid gap-4 lg:grid-cols-2"><div className={panel}><h2 className="mb-3 font-semibold">Farm alerts</h2>{alertsError ? <Error text="Unable to load alerts"/> : (alerts?.data || []).length ? <div className="space-y-3">{alerts?.data.map((alert, index) => <div key={`${alert.id || alert.type}-${index}`} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"><div className="flex justify-between gap-2"><b className="text-sm capitalize">{alert.type.replaceAll("_", " ")}</b>{Boolean(alert.id) && <Button size="sm" variant="outline" disabled={busy} onClick={() => { setInvestigationAlert(alert); setInvestigationNotes(alert.investigation_notes || ""); }}>Investigate</Button>}</div><div className="mt-2 flex flex-wrap gap-2">{row(alert)}</div>{details(alert.details)}</div>)}</div> : <p className="text-sm text-gray-500">No alerts.</p>}</div><div className={panel}><h2 className="mb-3 font-semibold">My farm notifications</h2>{notificationsError ? <Error text="Unable to load notifications"/> : (notifications?.data || []).length ? <div className="space-y-3">{notifications?.data.map((notice) => <div key={notice.id} className="rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700"><b className="capitalize">{notice.type.replaceAll("_", " ")}</b>{details(notice.details)}</div>)}</div> : <p className="text-sm text-gray-500">No notifications.</p>}</div></div>}
    {tab === "settings" && <div className={panel}><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Farm settings</h2><p className="text-sm text-gray-500">Operational status: <FarmStatusBadge status={settings?.data.status}/></p></div><Button variant={settings?.data.status === "active" ? "danger" : "primary"} disabled={busy || settingsError || !settings?.data} onClick={() => void doAction(() => toggleStatus(selectedId).unwrap(), settings?.data.status === "active" ? "Farm deactivated" : "Farm reactivated")}>{busy ? "Updating…" : settings?.data.status === "active" ? "Deactivate farm" : "Reactivate farm"}</Button></div>{settingsError ? <Error text="Unable to load settings"/> : <div className="mt-5 grid gap-4 sm:grid-cols-2"><Field title="Timezone"><input className={input} value={settingsValue?.timezone || ""} onChange={(e) => setSettingsForm({ ...settingsValue, timezone: e.target.value })}/></Field>{settingsKeys.map((key) => <Field key={key} title={key.replaceAll("_", " ")}><input className={input} type="number" min="0" step={key === "expiry_warning_days" ? "1" : "any"} value={settingsValue?.[key] ?? ""} onChange={(e) => setSettingsForm({ ...settingsValue, [key]: e.target.value === "" ? null : Number(e.target.value) })}/></Field>)}<div className="sm:col-span-2"><Button disabled={busy || !settingsValue} onClick={submitSettings}>Save settings</Button></div></div>}</div>}
    </>}
    {investigationAlert && <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4"><div role="dialog" aria-modal="true" aria-labelledby="investigation-title" className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900"><h2 id="investigation-title" className="text-lg font-semibold">Record investigation</h2><p className="mt-1 text-sm capitalize text-gray-500">{investigationAlert.type.replaceAll("_", " ")} alert</p><label htmlFor="investigation-notes" className="mt-5 block text-sm font-medium">Notes <span className="text-red-600">*</span></label><textarea id="investigation-notes" className={`${input} mt-2 h-32 resize-y py-3`} value={investigationNotes} onChange={(e) => setInvestigationNotes(e.target.value)} placeholder="Record findings and action taken"/><div className="mt-5 flex justify-end gap-2"><Button variant="outline" disabled={busy} onClick={() => setInvestigationAlert(null)}>Cancel</Button><Button disabled={busy || !investigationNotes.trim()} onClick={investigateAlert}>{busy ? "Saving…" : "Save investigation"}</Button></div></div></div>}
  </div>;
}

function Field({ title, children }: { title: string; children: React.ReactNode }) { return <label className="block"><span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{title}</span>{children}</label>; }
function Error({ text }: { text: string }) { return <p className="rounded-lg border border-red-200 p-4 text-sm text-red-600">{text}</p>; }
