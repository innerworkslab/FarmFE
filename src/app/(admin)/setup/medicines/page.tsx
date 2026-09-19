"use client";

import React, { useState } from "react";
import {
  useGetMedicinesQuery,
  useCreateMedicineMutation,
  useUpdateMedicineMutation,
  useToggleMedicineStatusMutation,
  useDeleteMedicineMutation,
  Medicine,
  MedicinePayload,
} from "@/redux/features/setup/MedicineApiSlice";
import { useGetUomsQuery } from "@/redux/features/setup/UomApiSlice";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import TableActionButton from "@/components/ui/table/TableActionButton";
import { Modal } from "@/components/ui/modal";
import { Switch } from "@/components/ui/switch";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Loading from "@/components/common/Loading";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Pill } from "lucide-react";

export default function MedicinesPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, refetch } = useGetMedicinesQuery({ search: search || undefined });
  const { data: uomsData } = useGetUomsQuery();

  const medicines = data?.data || [];
  const uoms = uomsData?.data || [];

  const [createMedicine, { isLoading: isCreating }] = useCreateMedicineMutation();
  const [updateMedicine, { isLoading: isUpdating }] = useUpdateMedicineMutation();
  const [toggleStatus] = useToggleMedicineStatusMutation();
  const [deleteMedicine, { isLoading: isDeleting }] = useDeleteMedicineMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Medicine | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [form, setForm] = useState<MedicinePayload>({
    code: "",
    name: "",
    type: "vaccine",
    category: "injection",
    usage_uom_id: 1,
    stock_uom_id: 1,
    purchase_uom_id: 1,
    uom_conversion: 1,
    batch_tracking: true,
    cold_chain_required: false,
    expiry_tracking: true,
    status: "active",
  });

  const handleOpenAdd = () => {
    const defaultUomId = uoms[0]?.id || 1;
    setEditingItem(null);
    setForm({
      code: "",
      name: "",
      type: "vaccine",
      category: "injection",
      usage_uom_id: defaultUomId,
      stock_uom_id: defaultUomId,
      purchase_uom_id: defaultUomId,
      uom_conversion: 1,
      batch_tracking: true,
      cold_chain_required: false,
      expiry_tracking: true,
      status: "active",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Medicine) => {
    setEditingItem(item);
    setForm({
      code: item.code,
      name: item.name,
      type: item.type || "vaccine",
      category: item.category || "injection",
      usage_uom_id: item.usage_uom_id || 1,
      stock_uom_id: item.stock_uom_id || 1,
      purchase_uom_id: item.purchase_uom_id || 1,
      uom_conversion: Number(item.uom_conversion || 1),
      batch_tracking: !!item.batch_tracking,
      cold_chain_required: !!item.cold_chain_required,
      expiry_tracking: !!item.expiry_tracking,
      status: item.status || "active",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateMedicine({ id: editingItem.id, ...form }).unwrap();
        toast.success("Medicine updated successfully");
      } else {
        await createMedicine(form).unwrap();
        toast.success("Medicine created successfully");
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
      toast.success("Medicine status toggled");
      refetch();
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || "Failed to toggle status");
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteMedicine(deletingId).unwrap();
      toast.success("Medicine deleted successfully");
      setDeletingId(null);
      refetch();
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || "Failed to delete medicine");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Pill className="text-[#15803d] dark:text-emerald-400" size={26} />
            <h1 className="text-2xl font-extrabold text-[#1E293B] dark:text-white tracking-tight">
              Medicines & Vaccines
            </h1>
          </div>
          <p className="text-sm text-[#64748B] dark:text-gray-400 mt-1">
            Manage veterinary medicines, vaccines, cold chain requirements, and UOM usage.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 bg-[#15803d] hover:bg-[#14532d] text-white font-medium text-sm px-4 py-2.5 rounded-lg shadow-sm transition-all"
        >
          <Plus size={18} />
          Add Medicine
        </button>
      </div>

      {/* Filter */}
      <div className="w-full sm:w-80">
        <Input
          type="text"
          placeholder="Search medicines..."
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
        ) : medicines.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            No medicines found.
          </div>
        ) : (
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">No.</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Code</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Name</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Type</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Category</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Cold Chain</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Status</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {medicines.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="px-5 py-3.5 text-gray-500 text-sm">{index + 1}</TableCell>
                    <TableCell className="px-5 py-3.5 font-semibold text-gray-900 dark:text-white text-sm">{item.code}</TableCell>
                    <TableCell className="px-5 py-3.5 text-gray-900 dark:text-white text-sm">{item.name}</TableCell>
                    <TableCell className="px-5 py-3.5 text-gray-500 text-sm capitalize">{item.type}</TableCell>
                    <TableCell className="px-5 py-3.5 text-gray-500 text-sm capitalize">{item.category}</TableCell>
                    <TableCell className="px-5 py-3.5 text-sm">
                      <span className={`px-2 py-0.5 rounded text-xs ${item.cold_chain_required ? "bg-cyan-50 text-cyan-700 font-medium border border-cyan-200" : "text-gray-400"}`}>
                        {item.cold_chain_required ? "Required" : "No"}
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
                        <TableActionButton label="Edit" tone="neutral" onClick={() => handleOpenEdit(item)} icon={<Pencil size={14} />} />
                        <Switch
                          checked={item.status === "active"}
                          onClick={() => handleToggle(item.id)}
                        />
                        <TableActionButton label="Delete" tone="red" onClick={() => setDeletingId(item.id)} icon={<Trash2 size={14} />} />
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
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} className="max-w-[550px] m-4">
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            {editingItem ? "Edit Medicine" : "Add New Medicine"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Medicine Code *
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. MED-PM"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Medicine Name *
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. FMD Vaccine 50ml"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Medicine Type *
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="vaccine">Vaccine</option>
                  <option value="antibiotic">Antibiotic</option>
                  <option value="vitamin">Vitamin</option>
                  <option value="dewormer">Dewormer</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Administration Category *
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option value="injection">Injection</option>
                  <option value="oral">Oral</option>
                  <option value="topical">Topical</option>
                  <option value="spray">Spray</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Purchase UOM
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none"
                  value={form.purchase_uom_id}
                  onChange={(e) => setForm({ ...form, purchase_uom_id: Number(e.target.value) })}
                >
                  {uoms.map((u) => (
                    <option key={u.id} value={u.id}>{u.symbol} ({u.name})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Stock UOM
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none"
                  value={form.stock_uom_id}
                  onChange={(e) => setForm({ ...form, stock_uom_id: Number(e.target.value) })}
                >
                  {uoms.map((u) => (
                    <option key={u.id} value={u.id}>{u.symbol} ({u.name})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Usage UOM
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none"
                  value={form.usage_uom_id}
                  onChange={(e) => setForm({ ...form, usage_uom_id: Number(e.target.value) })}
                >
                  {uoms.map((u) => (
                    <option key={u.id} value={u.id}>{u.symbol} ({u.name})</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                UOM Conversion Ratio
              </label>
              <Input
                type="number"
                value={form.uom_conversion}
                onChange={(e) => setForm({ ...form, uom_conversion: Number(e.target.value) })}
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

              <label className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                <Switch
                  checked={form.cold_chain_required}
                  onClick={() => setForm({ ...form, cold_chain_required: !form.cold_chain_required })}
                />
                Cold Chain
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <Button type="button" size="sm" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isCreating || isUpdating}>
                {isCreating || isUpdating ? "Saving..." : editingItem ? "Update Medicine" : "Create Medicine"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deletingId} onClose={() => setDeletingId(null)} className="max-w-[400px] m-4">
        <div className="p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <Trash2 size={24} />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Delete Medicine</h3>
          <p className="text-xs text-gray-500">
            Are you sure you want to delete this medicine?
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button size="sm" variant="outline" onClick={() => setDeletingId(null)}>
              Cancel
            </Button>
            <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" disabled={isDeleting} onClick={handleDelete}>
              {isDeleting ? "Deleting..." : "Yes, Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
