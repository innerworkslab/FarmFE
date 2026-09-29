"use client";

import React, { useState } from "react";
import {
  useGetEquipmentListQuery,
  useCreateEquipmentMutation,
  useUpdateEquipmentMutation,
  useDeleteEquipmentMutation,
  Equipment,
  EquipmentPayload,
} from "@/redux/features/setup/EquipmentApiSlice";
import { useGetSuppliersQuery } from "@/redux/features/setup/SupplierApiSlice";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import TableActionButton from "@/components/ui/table/TableActionButton";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Loading from "@/components/common/Loading";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Wrench } from "lucide-react";

export default function EquipmentPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, refetch } = useGetEquipmentListQuery({ search: search || undefined });
  const { data: suppliersData } = useGetSuppliersQuery();

  const equipmentList = data?.data || [];
  const suppliers = suppliersData?.data || [];

  const [createEquipment, { isLoading: isCreating }] = useCreateEquipmentMutation();
  const [updateEquipment, { isLoading: isUpdating }] = useUpdateEquipmentMutation();
  const [deleteEquipment, { isLoading: isDeleting }] = useDeleteEquipmentMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [form, setForm] = useState<EquipmentPayload>({
    code: "",
    name: "",
    category: "weighing",
    brand: "FarmTech",
    model: "PM-100",
    purchase_cost: 1000,
    serial_number: "",
    manufacturer: "",
    supplier_id: null,
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setForm({
      code: "",
      name: "",
      category: "weighing",
      brand: "",
      model: "",
      purchase_cost: 0,
      serial_number: "",
      manufacturer: "",
      supplier_id: null,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Equipment) => {
    setEditingItem(item);
    setForm({
      code: item.code,
      name: item.name,
      category: item.category || "weighing",
      brand: item.brand || "",
      model: item.model || "",
      purchase_cost: Number(item.purchase_cost || 0),
      serial_number: item.serial_number || "",
      manufacturer: item.manufacturer || "",
      supplier_id: item.supplier_id || null,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateEquipment({ id: editingItem.id, body: form }).unwrap();
        toast.success("Equipment updated successfully");
      } else {
        await createEquipment(form).unwrap();
        toast.success("Equipment created successfully");
      }
      setIsModalOpen(false);
      refetch();
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteEquipment(deletingId).unwrap();
      toast.success("Equipment deleted successfully");
      setDeletingId(null);
      refetch();
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || "Failed to delete equipment");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Wrench className="text-[#15803d] dark:text-emerald-400" size={26} />
            <h1 className="text-2xl font-extrabold text-[#1E293B] dark:text-white tracking-tight">
              Equipment
            </h1>
          </div>
          <p className="text-sm text-[#64748B] dark:text-gray-400 mt-1">
            Manage farm machinery, weighing scales, feeding systems, and models.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 bg-[#15803d] hover:bg-[#14532d] text-white font-medium text-sm px-4 py-2.5 rounded-lg shadow-sm transition-all"
        >
          <Plus size={18} />
          Add Equipment
        </button>
      </div>

      {/* Filter */}
      <div className="w-full sm:w-80">
        <Input
          type="text"
          placeholder="Search equipment..."
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
        ) : equipmentList.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            No equipment found.
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
                    Equipment Name
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 text-start text-gray-500 font-medium text-xs"
                  >
                    Category
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 text-start text-gray-500 font-medium text-xs"
                  >
                    Brand & Model
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 text-right text-gray-500 font-medium text-xs"
                  >
                    Purchase Cost
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 text-start text-gray-500 font-medium text-xs"
                  >
                    Supplier
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
                {equipmentList.map((item, index) => (
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
                    <TableCell className="px-5 py-3.5 text-gray-500 text-sm">
                      {item.brand} {item.model ? `(${item.model})` : ""}
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-right text-gray-500 text-sm font-mono tabular-nums">
                      {item.purchase_cost}
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-gray-700 dark:text-gray-300 text-sm font-medium">
                      {suppliers.find((s) => s.id === item.supplier_id)?.name ||
                        item.supplier?.name ||
                        "-"}
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-sm">
                      <div className="flex items-center gap-2">
                        <TableActionButton
                          label="Edit"
                          tone="neutral"
                          onClick={() => handleOpenEdit(item)}
                          icon={<Pencil size={14} />}
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
            {editingItem ? "Edit Equipment" : "Add New Equipment"}
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
                  placeholder="e.g. EQP-PM"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Equipment Name *
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Digital Livestock Scale"
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
                <select
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option value="weighing">Weighing</option>
                  <option value="feeding">Feeding</option>
                  <option value="transport">Transport</option>
                  <option value="milking">Milking</option>
                  <option value="medical">Medical</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Purchase Cost *
                </label>
                <Input
                  type="number"
                  required
                  placeholder="0"
                  value={form.purchase_cost}
                  onChange={(e) => setForm({ ...form, purchase_cost: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Brand *
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. FarmTech"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Model *
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. PM-100"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Serial Number
                </label>
                <Input
                  type="text"
                  placeholder="e.g. FT100-MM-001"
                  value={form.serial_number || ""}
                  onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Manufacturer
                </label>
                <Input
                  type="text"
                  placeholder="e.g. FarmTech Global"
                  value={form.manufacturer || ""}
                  onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Supplier
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none"
                value={form.supplier_id || ""}
                onChange={(e) =>
                  setForm({ ...form, supplier_id: e.target.value ? Number(e.target.value) : null })
                }
              >
                <option value="">None / Not specified</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
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
                    ? "Update Equipment"
                    : "Create Equipment"}
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
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Delete Equipment</h3>
          <p className="text-xs text-gray-500">Are you sure you want to delete this equipment?</p>
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
