"use client";

import React, { useState } from "react";
import {
  useGetFoodsQuery,
  useCreateFoodMutation,
  useUpdateFoodMutation,
  useToggleFoodStatusMutation,
  useDeleteFoodMutation,
  Food,
  FoodPayload,
} from "@/redux/features/setup/FoodApiSlice";
import { useGetUomsQuery } from "@/redux/features/setup/UomApiSlice";
import { useGetSuppliersQuery } from "@/redux/features/setup/SupplierApiSlice";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import TableActionButton from "@/components/ui/table/TableActionButton";
import { Modal } from "@/components/ui/modal";
import { Switch } from "@/components/ui/switch";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Loading from "@/components/common/Loading";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Wheat } from "lucide-react";

type FoodForm = Omit<FoodPayload, "purchase_price" | "uom_conversion"> & {
  purchase_price: string;
  uom_conversion: string;
};

export default function FoodsPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, refetch } = useGetFoodsQuery({ search: search || undefined });
  const { data: uomsData } = useGetUomsQuery();
  const { data: suppliersData } = useGetSuppliersQuery();

  const foods = data?.data || [];
  const uoms = uomsData?.data || [];
  const suppliers = suppliersData?.data || [];

  const [createFood, { isLoading: isCreating }] = useCreateFoodMutation();
  const [updateFood, { isLoading: isUpdating }] = useUpdateFoodMutation();
  const [toggleStatus] = useToggleFoodStatusMutation();
  const [deleteFood, { isLoading: isDeleting }] = useDeleteFoodMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Food | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [form, setForm] = useState<FoodForm>({
    code: "",
    name: "",
    category: "feed",
    target_animal_type: "cattle",
    purchase_price: "10",
    uom_conversion: "1",
    consumption_uom_id: 1,
    purchase_uom_id: 1,
    stock_uom_id: 1,
    default_supplier_id: null,
    batch_tracking: true,
    expiry_tracking: true,
    status: "active",
  });

  const handleOpenAdd = () => {
    const defaultUomId = uoms[0]?.id || 1;
    setEditingItem(null);
    setForm({
      code: "",
      name: "",
      category: "feed",
      target_animal_type: "cattle",
      purchase_price: "0",
      uom_conversion: "1",
      consumption_uom_id: defaultUomId,
      purchase_uom_id: defaultUomId,
      stock_uom_id: defaultUomId,
      default_supplier_id: null,
      batch_tracking: true,
      expiry_tracking: true,
      status: "active",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Food) => {
    setEditingItem(item);
    setForm({
      code: item.code,
      name: item.name,
      category: item.category || "feed",
      target_animal_type: item.target_animal_type || "",
      purchase_price: String(item.purchase_price ?? 0),
      uom_conversion: String(item.unit_roles?.conversion_factor ?? item.uom_conversion ?? 1),
      consumption_uom_id: item.consumption_uom_id || 1,
      purchase_uom_id: item.unit_roles?.conversion_unit.id || item.purchase_uom_id || 1,
      stock_uom_id: item.unit_roles?.base_unit.id || item.stock_uom_id || 1,
      default_supplier_id: item.default_supplier_id || null,
      batch_tracking: !!item.batch_tracking,
      expiry_tracking: !!item.expiry_tracking,
      status: item.status || "active",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.purchase_price === "" || form.uom_conversion === "") {
      toast.error("Purchase price and purchase to base conversion are required");
      return;
    }
    const payload: FoodPayload = {
      ...form,
      purchase_price: Number(form.purchase_price),
      uom_conversion: Number(form.uom_conversion),
    };
    try {
      if (editingItem) {
        await updateFood({ id: editingItem.id, ...payload }).unwrap();
        toast.success("Food / Feed updated successfully");
      } else {
        await createFood(payload).unwrap();
        toast.success("Food / Feed created successfully");
      }
      setIsModalOpen(false);
      refetch();
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || "Operation failed");
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await toggleStatus(id).unwrap();
      toast.success("Food status toggled");
      refetch();
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || "Failed to toggle status");
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteFood(deletingId).unwrap();
      toast.success("Food deleted successfully");
      setDeletingId(null);
      refetch();
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || "Failed to delete food");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Wheat className="text-[#15803d] dark:text-emerald-400" size={26} />
            <h1 className="text-2xl font-extrabold text-[#1E293B] dark:text-white tracking-tight">
              Foods & Feed
            </h1>
          </div>
          <p className="text-sm text-[#64748B] dark:text-gray-400 mt-1">
            Manage animal feeds, supplements, UOM conversions, and batch tracking.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 bg-[#15803d] hover:bg-[#14532d] text-white font-medium text-sm px-4 py-2.5 rounded-lg shadow-sm transition-all"
        >
          <Plus size={18} />
          Add Food
        </button>
      </div>

      {/* Filter */}
      <div className="w-full sm:w-80">
        <Input
          type="text"
          placeholder="Search foods..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loading />
          </div>
        ) : foods.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            No foods or feed found.
          </div>
        ) : (
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell
                    isHeader
                    className="px-5 py-3 text-start text-gray-500 font-medium text-xs"
                  >
                    No.
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 text-start text-gray-500 font-medium text-xs"
                  >
                    Code
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 text-start text-gray-500 font-medium text-xs"
                  >
                    Name
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 text-start text-gray-500 font-medium text-xs"
                  >
                    Category
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 text-right text-gray-500 font-medium text-xs"
                  >
                    Price
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 text-start text-gray-500 font-medium text-xs"
                  >
                    Batch Tracking
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 text-start text-gray-500 font-medium text-xs"
                  >
                    Status
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 text-start text-gray-500 font-medium text-xs"
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {foods.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="px-5 py-3.5 text-gray-500 text-sm">{index + 1}</TableCell>
                    <TableCell className="px-5 py-3.5 font-semibold text-gray-900 dark:text-white text-sm">
                      {item.code}
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-gray-900 dark:text-white text-sm">
                      {item.name}
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-gray-500 text-sm capitalize">
                      {item.category}
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-right text-gray-500 text-sm font-mono tabular-nums">
                      {item.purchase_price}
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-sm">
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${item.batch_tracking ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-600"}`}
                      >
                        {item.batch_tracking ? "Enabled" : "Disabled"}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          item.status === "active"
                            ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        {item.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-sm">
                      <div className="flex items-center gap-2">
                        <TableActionButton
                          label="Edit"
                          tone="neutral"
                          onClick={() => handleOpenEdit(item)}
                          icon={<Pencil size={14} />}
                        />
                        <Switch
                          checked={item.status === "active"}
                          onClick={() => handleToggle(item.id)}
                        />
                        <TableActionButton
                          label="Delete"
                          tone="red"
                          onClick={() => setDeletingId(item.id)}
                          icon={<Trash2 size={14} />}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="max-w-[550px] m-4"
      >
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            {editingItem ? "Edit Food / Feed" : "Add New Food / Feed"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Code *
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. FOD-PM"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Food Name *
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Cattle Feed High Protein"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category *
                </label>
                <Select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  options={[
                    { value: "feed", label: "Feed" },
                    { value: "supplement", label: "Supplement" },
                    { value: "mineral", label: "Mineral" },
                    { value: "other", label: "Other" },
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Target Animal Type
                </label>
                <Select
                  value={form.target_animal_type || ""}
                  onChange={(e) => setForm({ ...form, target_animal_type: e.target.value })}
                  options={[
                    { value: "", label: "All Animals" },
                    { value: "cattle", label: "Cattle" },
                    { value: "poultry", label: "Poultry" },
                    { value: "swine", label: "Swine" },
                    { value: "goat", label: "Goat" },
                    { value: "sheep", label: "Sheep" },
                  ]}
                />
              </div>
            </div>

            <section className="space-y-4 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
              <div>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Purchase &amp; stock units</h3>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  <span className="mb-1 block">Purchase / Conversion Unit</span>
                  <Select
                  value={form.purchase_uom_id}
                  onChange={(e) => setForm({ ...form, purchase_uom_id: Number(e.target.value) })}
                    options={uoms.map((u) => ({ value: String(u.id), label: `${u.symbol} (${u.name})` }))}
                  />
                </label>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  <span className="mb-1 block">Base Stock Unit</span>
                  <Select
                  value={form.stock_uom_id}
                  onChange={(e) => setForm({ ...form, stock_uom_id: Number(e.target.value) })}
                    options={uoms.map((u) => ({ value: String(u.id), label: `${u.symbol} (${u.name})` }))}
                  />
                </label>
              </div>
              <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/30">
                <label htmlFor="food-unit-conversion" className="mb-2 block text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  Purchase → base conversion *
                </label>
                <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-gray-800 dark:text-gray-100">
                  <span>1 {uoms.find((unit) => unit.id === form.purchase_uom_id)?.name || "purchase unit"}</span>
                  <span className="text-gray-400">=</span>
                  <div className="w-28">
                    <Input
                      id="food-unit-conversion"
                      type="number"
                      required
                      placeholder="1"
                      min="0.000001"
                      step="any"
                      value={form.uom_conversion}
                      onChange={(event) => setForm({ ...form, uom_conversion: event.target.value })}
                    />
                  </div>
                  <span>{uoms.find((unit) => unit.id === form.stock_uom_id)?.name || "base units"}</span>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                <span className="mb-1 block">Purchase Price *</span>
                <Input
                  type="number"
                  required
                  placeholder="0"
                  value={form.purchase_price}
                  onChange={(event) => setForm({ ...form, purchase_price: event.target.value })}
                />
              </label>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                <span className="mb-1 block">Consumption UOM</span>
                <Select
                  value={form.consumption_uom_id}
                  onChange={(e) => setForm({ ...form, consumption_uom_id: Number(e.target.value) })}
                  options={uoms.map((u) => ({ value: String(u.id), label: `${u.symbol} (${u.name})` }))}
                />
              </label>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Default Supplier
              </label>
              <Select
                value={form.default_supplier_id || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    default_supplier_id: e.target.value ? Number(e.target.value) : null,
                  })
                }
                  options={[
                    { value: "", label: "None" },
                    ...suppliers
                      .filter((supplier) => (supplier.types || [supplier.type]).includes("food"))
                      .map((supplier) => ({ value: String(supplier.id), label: `${supplier.name} (${supplier.code})` })),
                  ]}
              />
            </div>

            <div className="flex items-center gap-6 py-2">
              <label className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                <Switch
                  checked={form.batch_tracking}
                  onClick={() => setForm({ ...form, batch_tracking: !form.batch_tracking })}
                />
                Batch Tracking
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                <Switch
                  checked={form.expiry_tracking}
                  onClick={() => setForm({ ...form, expiry_tracking: !form.expiry_tracking })}
                />
                Expiry Tracking
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isCreating || isUpdating}>
                {isCreating || isUpdating
                  ? "Saving..."
                  : editingItem
                    ? "Update Food"
                    : "Create Food"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        className="max-w-[400px] m-4"
      >
        <div className="p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <Trash2 size={24} />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Delete Food</h3>
          <p className="text-xs text-gray-500">Are you sure you want to delete this food item?</p>
          <div className="flex justify-center gap-3 pt-2">
            <Button size="sm" variant="outline" onClick={() => setDeletingId(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isDeleting}
              onClick={handleDelete}
            >
              {isDeleting ? "Deleting..." : "Yes, Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
