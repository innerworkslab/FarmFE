"use client";

import React, { useMemo, useState } from "react";
import { CheckCircle2, Eye, Pencil, Plus, Search, Send, Utensils, XCircle } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Loading from "@/components/common/Loading";
import { formatReadableDate } from "@/lib/dateFormat";
import { Modal } from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import TableActionButton from "@/components/ui/table/TableActionButton";
import { useGetBranchesQuery } from "@/redux/features/setup/BranchApiSlice";
import { useGetFarmInformationListQuery } from "@/redux/features/setup/FarmInformationApiSlice";
import { useGetFoodsQuery } from "@/redux/features/setup/FoodApiSlice";
import { useGetInventoriesQuery } from "@/redux/features/setup/InventoryApiSlice";
import { useGetUomsQuery } from "@/redux/features/setup/UomApiSlice";
import { useGetInventoryBalancesQuery } from "@/redux/features/inventory/InventoryFoundationApiSlice";
import { useGetFarmAnimalsQuery } from "@/redux/features/farms/FarmAnimalViewApiSlice";
import {
  FarmFeeding,
  FarmFeedingPayload,
  useConfirmFarmFeedingMutation,
  useCreateFarmFeedingMutation,
  useGetFarmFeedingsQuery,
  useLazyGetFarmFeedingQuery,
  useRejectFarmFeedingMutation,
  useSubmitFarmFeedingMutation,
  useUpdateFarmFeedingMutation,
} from "@/redux/features/farms/FarmFeedingApiSlice";

type Option = { value: string; label: string };
type FeedingForm = {
  feeding_date: string;
  feeding_time: string;
  branch_id: string;
  farm_information_id: string;
  animal_balance_id: string;
  notes: string;
  food_item_id: string;
  inventory_id: string;
  stock_lot_id: string;
  source_location: string;
  stock_uom_id: string;
  quantity: string;
  wastage_quantity: string;
  line_notes: string;
};

const today = new Date().toISOString().slice(0, 10);
const blankForm: FeedingForm = {
  feeding_date: today,
  feeding_time: "08:30",
  branch_id: "",
  farm_information_id: "",
  animal_balance_id: "",
  notes: "Morning feed",
  food_item_id: "",
  inventory_id: "",
  stock_lot_id: "",
  source_location: "",
  stock_uom_id: "",
  quantity: "12",
  wastage_quantity: "1.5",
  line_notes: "Normal morning feeding",
};
const statusOptions: Option[] = ["draft", "submitted", "confirmed", "rejected"].map((value) => ({
  value,
  label: value[0].toUpperCase() + value.slice(1),
}));
const value = (item: unknown) =>
  item === null || item === undefined || item === "" ? "-" : String(item);
const statusClass = (status: string) =>
  status === "confirmed"
    ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300"
    : status === "submitted"
      ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
      : status === "rejected"
        ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
const named = (item: { id: number; code?: string; name?: string }): Option => ({
  value: String(item.id),
  label: [item.code, item.name].filter(Boolean).join(" - ") || `#${item.id}`,
});
const errorMessage = (error: unknown) => {
  const item = error as { data?: { message?: string; errors?: Record<string, string[]> } };
  const validation = item.data?.errors ? Object.values(item.data.errors).flat()[0] : undefined;
  return validation || item.data?.message || "Farm feeding request failed";
};

const toForm = (item: FarmFeeding): FeedingForm => {
  const line = item.lines?.[0];
  return {
    feeding_date: item.feeding_date,
    feeding_time: item.feeding_time,
    branch_id: String(item.branch_id),
    farm_information_id: String(item.farm_information_id),
    animal_balance_id: String(item.target?.animal_balance_id || ""),
    notes: item.notes || "",
    food_item_id: String(line?.food_item_id || ""),
    inventory_id: String(line?.inventory_id || ""),
    stock_lot_id: String(line?.stock_lot_id || ""),
    source_location: line?.source_location || "",
    stock_uom_id: String(line?.stock_uom_id || ""),
    quantity: String(line?.quantity || ""),
    wastage_quantity: String(line?.wastage_quantity || 0),
    line_notes: line?.notes || "",
  };
};
const toPayload = (form: FeedingForm): FarmFeedingPayload => ({
  feeding_date: form.feeding_date,
  feeding_time: form.feeding_time,
  branch_id: Number(form.branch_id),
  farm_information_id: Number(form.farm_information_id),
  animal_balance_id: Number(form.animal_balance_id),
  notes: form.notes,
  lines: [
    {
      food_item_id: Number(form.food_item_id),
      inventory_id: Number(form.inventory_id),
      stock_lot_id: Number(form.stock_lot_id),
      source_location: form.source_location,
      stock_uom_id: Number(form.stock_uom_id),
      quantity: Number(form.quantity),
      wastage_quantity: Number(form.wastage_quantity),
      notes: form.line_notes,
    },
  ],
});

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}

export default function FarmFeedingsPage() {
  const [filters, setFilters] = useState({
    farm_information_id: "",
    status: "",
    from_date: "",
    to_date: "",
    search: "",
  });
  const [applied, setApplied] = useState(filters);
  const [form, setForm] = useState<FeedingForm>(blankForm);
  const [formMode, setFormMode] = useState<"create" | "update" | null>(null);
  const [target, setTarget] = useState<FarmFeeding | null>(null);
  const [detail, setDetail] = useState<FarmFeeding | null>(null);
  const [rejectTarget, setRejectTarget] = useState<FarmFeeding | null>(null);
  const [rejectReason, setRejectReason] = useState("Feed stock lot needs recount before posting.");

  const { data, isLoading, isFetching, isError } = useGetFarmFeedingsQuery({
    ...applied,
    per_page: 15,
  });
  const { data: branches } = useGetBranchesQuery({ per_page: 100 });
  const { data: farms } = useGetFarmInformationListQuery({ per_page: 100 });
  const { data: foods } = useGetFoodsQuery({ per_page: 100 });
  const { data: inventories } = useGetInventoriesQuery({ per_page: 100 });
  const { data: uoms } = useGetUomsQuery({ per_page: 100 });
  const { data: balances } = useGetInventoryBalancesQuery(
    { category: "food", item_id: form.food_item_id || undefined, per_page: 15 },
    { skip: !form.food_item_id }
  );
  const { data: animals } = useGetFarmAnimalsQuery(
    { farmId: Number(form.farm_information_id) || 0, view: "all", per_page: 15 },
    { skip: !form.farm_information_id }
  );
  const [showFeeding, showState] = useLazyGetFarmFeedingQuery();
  const [createFeeding, createState] = useCreateFarmFeedingMutation();
  const [updateFeeding, updateState] = useUpdateFarmFeedingMutation();
  const [submitFeeding, submitState] = useSubmitFarmFeedingMutation();
  const [confirmFeeding, confirmState] = useConfirmFarmFeedingMutation();
  const [rejectFeeding, rejectState] = useRejectFarmFeedingMutation();
  const saving =
    createState.isLoading ||
    updateState.isLoading ||
    submitState.isLoading ||
    confirmState.isLoading ||
    rejectState.isLoading;

  const farmOptions = (farms?.data || []).map((farm) => ({
    value: String(farm.id),
    label: [farm.name, farm.branch?.name, farm.house_barn, farm.pen_cage_pond]
      .filter(Boolean)
      .join(" · "),
  }));
  const animalOptions = (animals?.data || []).map((animal) => ({
    value: String(animal.id),
    label: [
      animal.display_name || animal.name,
      animal.tracking_type,
      animal.location?.name || animal.location?.pen_cage_pond,
    ]
      .filter(Boolean)
      .join(" · "),
  }));
  const inventoryOptions = (inventories?.data || [])
    .filter(
      (inventory) =>
        (!form.branch_id || inventory.branch_id === Number(form.branch_id)) &&
        inventory.status === "active" &&
        (inventory.type === "feed" || inventory.allowed_item_categories?.includes("food"))
    )
    .map(named);
  const lotOptions = useMemo(
    () =>
      (balances?.data || [])
        .filter(
          (raw) =>
            (!form.food_item_id || Number(raw.item_id) === Number(form.food_item_id)) &&
            (!form.branch_id || Number(raw.branch_id) === Number(form.branch_id)) &&
            (!form.inventory_id || Number(raw.inventory_id) === Number(form.inventory_id)) &&
            Number(raw.available_quantity || 0) > 0
        )
        .map((raw) => {
          const item = raw as Record<string, unknown>;
          const lot = item.stock_lot as Record<string, unknown> | undefined;
          const id = Number(item.stock_lot_id || lot?.id || item.id);
          return {
            value: String(id),
            label: [
              lot?.receipt_lot_number || item.receipt_lot_number || `Lot #${id}`,
              item.location,
              item.available_quantity ? `Available ${item.available_quantity}` : null,
            ]
              .filter(Boolean)
              .join(" · "),
          };
        })
        .filter((option) => option.value !== "0"),
    [balances, form.branch_id, form.food_item_id, form.inventory_id]
  );

  const setField = (key: keyof FeedingForm, fieldValue: string) =>
    setForm((current) => ({ ...current, [key]: fieldValue }));
  const selectFarm = (farmId: string) => {
    const farm = farms?.data.find((item) => item.id === Number(farmId));
    setForm((current) => ({
      ...current,
      farm_information_id: farmId,
      branch_id: farm?.branch_id ? String(farm.branch_id) : current.branch_id,
      animal_balance_id: "",
      source_location: "",
    }));
  };
  const selectAnimal = (animalBalanceId: string) => {
    const animal = animals?.data.find((item) => item.id === Number(animalBalanceId));
    setForm((current) => ({
      ...current,
      animal_balance_id: animalBalanceId,
      source_location:
        animal?.location?.name ||
        animal?.location?.pen_cage_pond ||
        animal?.location?.house_barn ||
        current.source_location,
    }));
  };
  const selectFood = (foodId: string) => {
    const food = foods?.data.find((item) => item.id === Number(foodId));
    setForm((current) => ({
      ...current,
      food_item_id: foodId,
      stock_uom_id: food?.stock_uom_id ? String(food.stock_uom_id) : current.stock_uom_id,
      stock_lot_id: "",
    }));
  };
  const selectLot = (stockLotId: string) => {
    const balance = balances?.data.find(
      (item) => Number(item.stock_lot_id) === Number(stockLotId)
    ) as Record<string, unknown> | undefined;
    setForm((current) => ({
      ...current,
      stock_lot_id: stockLotId,
      source_location: balance?.location ? String(balance.location) : current.source_location,
      stock_uom_id: balance?.stock_uom_id ? String(balance.stock_uom_id) : current.stock_uom_id,
    }));
  };
  const openCreate = () => {
    const firstFarm = farms?.data?.[0];
    setTarget(null);
    setForm({
      ...blankForm,
      branch_id: firstFarm?.branch_id
        ? String(firstFarm.branch_id)
        : String(branches?.data?.[0]?.id || ""),
      farm_information_id: String(firstFarm?.id || ""),
    });
    setFormMode("create");
  };
  const openUpdate = (item: FarmFeeding) => {
    setTarget(item);
    setForm(toForm(item));
    setFormMode("update");
  };
  const save = async () => {
    try {
      const payload = toPayload(form);
      if (formMode === "update" && target)
        await updateFeeding({ id: target.id, body: payload }).unwrap();
      else await createFeeding(payload).unwrap();
      setFormMode(null);
      toast.success(formMode === "update" ? "Feeding draft updated" : "Feeding draft created");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };
  const run = async (action: "submit" | "confirm", item: FarmFeeding) => {
    try {
      if (action === "submit") await submitFeeding(item.id).unwrap();
      else await confirmFeeding(item.id).unwrap();
      toast.success(
        action === "submit" ? "Feeding submitted" : "Feeding confirmed and stock posted"
      );
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };
  const reject = async () => {
    if (!rejectTarget) return;
    try {
      await rejectFeeding({ id: rejectTarget.id, reason: rejectReason }).unwrap();
      setRejectTarget(null);
      toast.success("Feeding rejected");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };
  const view = async (item: FarmFeeding) => {
    try {
      setDetail((await showFeeding(item.id).unwrap()).data);
    } catch {
      setDetail(item);
    }
  };

  const selectedBalance = balances?.data.find(
    (item) =>
      Number(item.stock_lot_id) === Number(form.stock_lot_id) &&
      Number(item.item_id) === Number(form.food_item_id) &&
      Number(item.branch_id) === Number(form.branch_id) &&
      Number(item.inventory_id) === Number(form.inventory_id) &&
      String(item.location) === form.source_location &&
      Number(item.stock_uom_id) === Number(form.stock_uom_id)
  );
  const availableQuantity = selectedBalance
    ? Number(selectedBalance.available_quantity || 0)
    : null;
  const quantityExceedsStock =
    availableQuantity !== null && Number(form.quantity) > availableQuantity;
  const valid =
    Object.entries(form).every(
      ([key, fieldValue]) =>
        key === "notes" || key === "line_notes" || key === "wastage_quantity" || Boolean(fieldValue)
    ) &&
    Number(form.quantity) > 0 &&
    Number(form.wastage_quantity || 0) >= 0 &&
    !quantityExceedsStock;
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Utensils className="text-[#15803d] dark:text-emerald-400" size={26} />
            <h1 className="text-2xl font-extrabold tracking-tight text-[#1E293B] dark:text-white">
              Farm Feedings
            </h1>
          </div>
          <p className="mt-1 text-sm text-[#64748B] dark:text-gray-400">
            Create feeding drafts and manage submission, confirmation, rejection, and feed stock
            posting.
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus size={16} /> Create Feeding Draft
        </Button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Field label="Farm">
            <Select
              value={filters.farm_information_id}
              onChange={(e) => setFilters({ ...filters, farm_information_id: e.target.value })}
              options={farmOptions}
              placeholder="All farms"
            />
          </Field>
          <Field label="Status">
            <Select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              options={statusOptions}
              placeholder="All statuses"
            />
          </Field>
          <Field label="From Date">
            <Input
              type="date"
              value={filters.from_date}
              onChange={(e) => setFilters({ ...filters, from_date: e.target.value })}
            />
          </Field>
          <Field label="To Date">
            <Input
              type="date"
              value={filters.to_date}
              onChange={(e) => setFilters({ ...filters, to_date: e.target.value })}
            />
          </Field>
          <Field label="Search">
            <Input
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Feeding number"
            />
          </Field>
        </div>
        <div className="mt-4 flex gap-2">
          <Button size="sm" onClick={() => setApplied(filters)}>
            <Search size={15} /> Apply Filters
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const empty = {
                farm_information_id: "",
                status: "",
                from_date: "",
                to_date: "",
                search: "",
              };
              setFilters(empty);
              setApplied(empty);
            }}
          >
            Clear
          </Button>
        </div>
      </div>
      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
          Unable to load farm feedings.
        </div>
      )}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-white/[0.05]">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Feeding Records</h2>
            <p className="text-xs text-gray-500">
              {data?.meta?.total ?? data?.data.length ?? 0} records
            </p>
          </div>
          {isFetching && <span className="text-xs text-gray-400">Refreshing…</span>}
        </div>
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loading />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  {[
                    "No.",
                    "Feeding",
                    "Farm / Target",
                    "Date / Time",
                    "Feed",
                    "Quantity",
                    "Status",
                    "Actions",
                  ].map((head) => (
                    <TableCell
                      key={head}
                      isHeader
                      className={`px-5 py-3 text-xs font-medium text-gray-500 ${["No.", "Quantity"].includes(head) ? "text-right" : "text-start"}`}
                    >
                      {head}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {data?.data.map((item, index) => {
                  const line = item.lines?.[0];
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="px-5 py-3.5 text-right text-sm tabular-nums text-gray-500">
                        {index + 1}
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-right text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
                        {item.feeding_number}
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-sm">
                        <p className="font-medium text-gray-700 dark:text-gray-300">
                          {item.farm?.name || `Farm #${item.farm_information_id}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.target?.animal_type || "Animal"} ·{" "}
                          {item.target?.breed || item.target?.target_type || "-"}
                        </p>
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-sm text-gray-500">
                        {formatReadableDate(item.feeding_date)}
                        <br />
                        <span className="text-xs">{item.feeding_time}</span>
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-300">
                        {line?.food?.name || `Food #${line?.food_item_id || "-"}`}
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-sm font-semibold text-gray-900 dark:text-white">
                        {value(item.totals?.quantity)}
                        <span className="ml-1 text-xs font-normal text-gray-500">
                          ({value(item.totals?.wastage_quantity)} waste)
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-sm">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass(item.status)}`}
                        >
                          {item.status}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-sm">
                        <div className="flex flex-wrap gap-1.5">
                          <TableActionButton
                            label="View"
                            icon={<Eye size={14} />}
                            onClick={() => view(item)}
                          />
                          {(item.status === "draft" || item.status === "rejected") && (
                            <>
                              <TableActionButton
                                label="Update"
                                icon={<Pencil size={14} />}
                                onClick={() => openUpdate(item)}
                              />
                              <TableActionButton
                                label="Submit"
                                tone="blue"
                                icon={<Send size={14} />}
                                onClick={() => run("submit", item)}
                              />
                            </>
                          )}
                          {item.status === "submitted" && (
                            <>
                              <TableActionButton
                                label="Confirm"
                                tone="green"
                                icon={<CheckCircle2 size={14} />}
                                onClick={() => run("confirm", item)}
                              />
                              <TableActionButton
                                label="Reject"
                                tone="red"
                                icon={<XCircle size={14} />}
                                onClick={() => {
                                  setRejectTarget(item);
                                  setRejectReason("Feed stock lot needs recount before posting.");
                                }}
                              />
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {!data?.data.length && (
              <p className="p-8 text-center text-sm text-gray-500">No feeding records found.</p>
            )}
          </div>
        )}
      </div>

      <FeedingFormModal
        mode={formMode}
        form={form}
        saving={saving}
        valid={valid}
        availableQuantity={availableQuantity}
        quantityExceedsStock={quantityExceedsStock}
        branchOptions={(branches?.data || []).map(named)}
        farmOptions={farmOptions}
        animalOptions={animalOptions}
        foodOptions={(foods?.data || []).map(named)}
        inventoryOptions={inventoryOptions}
        lotOptions={lotOptions}
        uomOptions={(uoms?.data || []).map((item) => ({
          value: String(item.id),
          label: `${item.code} - ${item.name} (${item.symbol})`,
        }))}
        onChange={setField}
        onFarmChange={selectFarm}
        onAnimalChange={selectAnimal}
        onFoodChange={selectFood}
        onLotChange={selectLot}
        onClose={() => setFormMode(null)}
        onSave={save}
      />
      <RejectModal
        item={rejectTarget}
        reason={rejectReason}
        saving={saving}
        onReason={setRejectReason}
        onClose={() => setRejectTarget(null)}
        onReject={reject}
      />
      <FeedingDetail item={detail} loading={showState.isFetching} onClose={() => setDetail(null)} />
    </div>
  );
}

function FeedingFormModal({
  mode,
  form,
  saving,
  valid,
  availableQuantity,
  quantityExceedsStock,
  branchOptions,
  farmOptions,
  animalOptions,
  foodOptions,
  inventoryOptions,
  lotOptions,
  uomOptions,
  onChange,
  onFarmChange,
  onAnimalChange,
  onFoodChange,
  onLotChange,
  onClose,
  onSave,
}: {
  mode: "create" | "update" | null;
  form: FeedingForm;
  saving: boolean;
  valid: boolean;
  availableQuantity: number | null;
  quantityExceedsStock: boolean;
  branchOptions: Option[];
  farmOptions: Option[];
  animalOptions: Option[];
  foodOptions: Option[];
  inventoryOptions: Option[];
  lotOptions: Option[];
  uomOptions: Option[];
  onChange: (key: keyof FeedingForm, value: string) => void;
  onFarmChange: (value: string) => void;
  onAnimalChange: (value: string) => void;
  onFoodChange: (value: string) => void;
  onLotChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <Modal isOpen={!!mode} onClose={onClose} className="m-4 max-w-4xl">
      <div className="space-y-5 p-6 sm:p-8">
        <div className="pr-12">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {mode === "update" ? "Update Feeding Draft" : "Create Feeding Draft"}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Fields match the Farm Feeding Postman payload.
          </p>
        </div>
        <div className="grid max-h-[65vh] gap-4 overflow-y-auto pr-2 sm:grid-cols-2">
          <Field label="Feeding Date" required>
            <Input
              type="date"
              value={form.feeding_date}
              onChange={(e) => onChange("feeding_date", e.target.value)}
            />
          </Field>
          <Field label="Feeding Time" required>
            <Input
              type="time"
              value={form.feeding_time}
              onChange={(e) => onChange("feeding_time", e.target.value)}
            />
          </Field>
          <Field label="Branch" required>
            <Select
              value={form.branch_id}
              onChange={(e) => onChange("branch_id", e.target.value)}
              options={branchOptions}
              placeholder="Select branch"
            />
          </Field>
          <Field label="Farm" required>
            <Select
              value={form.farm_information_id}
              onChange={(e) => onFarmChange(e.target.value)}
              options={farmOptions}
              placeholder="Select farm"
            />
          </Field>
          <Field label="Animal / Batch" required>
            <Select
              value={form.animal_balance_id}
              onChange={(e) => onAnimalChange(e.target.value)}
              options={animalOptions}
              placeholder="Select animal or batch"
            />
          </Field>
          <Field label="Food" required>
            <Select
              value={form.food_item_id}
              onChange={(e) => onFoodChange(e.target.value)}
              options={foodOptions}
              placeholder="Select food"
            />
          </Field>
          <Field label="Inventory" required>
            <Select
              value={form.inventory_id}
              onChange={(e) => {
                onChange("inventory_id", e.target.value);
                onChange("stock_lot_id", "");
              }}
              options={inventoryOptions}
              placeholder="Select inventory"
            />
          </Field>
          <Field label="Stock Lot" required>
            <Select
              value={form.stock_lot_id}
              onChange={(e) => onLotChange(e.target.value)}
              options={lotOptions}
              placeholder="Select stock lot"
            />
          </Field>
          <Field label="Source Location" required>
            <Input
              value={form.source_location}
              onChange={(e) => onChange("source_location", e.target.value)}
              placeholder="e.g. Pen F1"
              disabled={Boolean(form.stock_lot_id)}
            />
          </Field>
          <Field label="Stock UOM" required>
            <Select
              value={form.stock_uom_id}
              onChange={(e) => onChange("stock_uom_id", e.target.value)}
              options={uomOptions}
              placeholder="Select UOM"
              disabled={Boolean(form.stock_lot_id)}
            />
          </Field>
          <Field label="Quantity" required>
            <Input
              type="number"
              min="0"
              step="0.001"
              value={form.quantity}
              onChange={(e) => onChange("quantity", e.target.value)}
            />
            {availableQuantity !== null && (
              <p
                className={`mt-1.5 text-xs ${quantityExceedsStock ? "text-red-600 dark:text-red-400" : "text-gray-500"}`}
              >
                Eligible available stock: {availableQuantity}. Quantity cannot exceed this amount.
              </p>
            )}
          </Field>
          <Field label="Wastage Quantity">
            <Input
              type="number"
              min="0"
              step="0.001"
              value={form.wastage_quantity}
              onChange={(e) => onChange("wastage_quantity", e.target.value)}
            />
          </Field>
          <Field label="Feeding Notes">
            <Input value={form.notes} onChange={(e) => onChange("notes", e.target.value)} />
          </Field>
          <Field label="Line Notes">
            <Input
              value={form.line_notes}
              onChange={(e) => onChange("line_notes", e.target.value)}
            />
          </Field>
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-white/[0.05]">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!valid || saving} onClick={onSave}>
            {saving ? "Saving…" : mode === "update" ? "Update Draft" : "Create Draft"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function RejectModal({
  item,
  reason,
  saving,
  onReason,
  onClose,
  onReject,
}: {
  item: FarmFeeding | null;
  reason: string;
  saving: boolean;
  onReason: (value: string) => void;
  onClose: () => void;
  onReject: () => void;
}) {
  return (
    <Modal isOpen={!!item} onClose={onClose} className="m-4 max-w-lg">
      <div className="space-y-5 p-6 sm:p-8">
        <div className="pr-12">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Reject Feeding</h2>
          <p className="mt-1 text-sm text-gray-500">{item?.feeding_number}</p>
        </div>
        <Field label="Rejection Reason" required>
          <Input value={reason} onChange={(e) => onReason(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!reason.trim() || saving} onClick={onReject}>
            Reject Feeding
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function FeedingDetail({
  item,
  loading,
  onClose,
}: {
  item: FarmFeeding | null;
  loading: boolean;
  onClose: () => void;
}) {
  const fields = item
    ? [
        ["Feeding Number", item.feeding_number],
        ["Status", item.status],
        ["Farm", item.farm?.name],
        ["Animal Type", item.target?.animal_type],
        ["Breed", item.target?.breed],
        ["Animal Count", item.target?.animal_count],
        ["Location", item.target?.location],
        ["Date", item.feeding_date ? formatReadableDate(item.feeding_date) : item.feeding_date],
        ["Time", item.feeding_time],
        ["Total Quantity", item.totals?.quantity],
        ["Wastage", item.totals?.wastage_quantity],
        ["Posting Batch", item.posting_batch_id],
        ["Confirmation", item.confirmation?.confirmation_number],
        ["Rejection Reason", item.rejection_reason],
        ["Notes", item.notes],
      ]
    : [];
  return (
    <Modal isOpen={!!item || loading} onClose={onClose} className="m-4 max-w-4xl">
      <div className="p-6 sm:p-8">
        <div className="mb-5 pr-12">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Feeding Details</h2>
          <p className="mt-1 text-sm text-gray-500">Read-only Farm Feeding API response.</p>
        </div>
        {loading ? (
          <Loading />
        ) : (
          <div className="max-h-[65vh] space-y-6 overflow-y-auto pr-2">
            <dl className="grid border-t border-gray-100 dark:border-white/[0.06] sm:grid-cols-2 sm:gap-x-8">
              {fields.map(([label, fieldValue]) => (
                <div
                  key={String(label)}
                  className="border-b border-gray-100 py-3.5 dark:border-white/[0.06]"
                >
                  <dt className="text-xs font-medium text-gray-500">{label}</dt>
                  <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                    {value(fieldValue)}
                  </dd>
                </div>
              ))}
            </dl>
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                Feed Lines
              </h3>
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      {["Food", "Lot", "Inventory", "Quantity", "Wastage", "UOM"].map((head) => (
                        <TableCell
                          key={head}
                          isHeader
                          className={`px-4 py-3 text-xs font-medium text-gray-500 ${["Quantity", "Wastage"].includes(head) ? "text-right" : "text-start"}`}
                        >
                          {head}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {item?.lines?.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell className="px-4 py-3 text-sm">
                          {line.food?.name || `Food #${line.food_item_id}`}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-500">
                          {line.stock_lot?.receipt_lot_number || `#${line.stock_lot_id}`}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-500">
                          #{line.inventory_id}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right text-sm tabular-nums">
                          {line.quantity}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right text-sm tabular-nums">
                          {line.wastage_quantity}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-500">
                          #{line.stock_uom_id}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
