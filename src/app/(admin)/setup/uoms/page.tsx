"use client";

import React, { useState } from "react";
import {
  useGetUomsQuery,
  useCreateUomMutation,
  useUpdateUomMutation,
  useToggleUomStatusMutation,
  useDeleteUomMutation,
  Uom,
  UomPayload,
} from "@/redux/features/setup/UomApiSlice";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { Switch } from "@/components/ui/switch";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Loading from "@/components/common/Loading";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Ruler } from "lucide-react";

export default function UomsPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, refetch } = useGetUomsQuery({ search: search || undefined });

  const uoms = data?.data || [];

  const [createUom, { isLoading: isCreating }] = useCreateUomMutation();
  const [updateUom, { isLoading: isUpdating }] = useUpdateUomMutation();
  const [toggleStatus] = useToggleUomStatusMutation();
  const [deleteUom, { isLoading: isDeleting }] = useDeleteUomMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Uom | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [form, setForm] = useState<UomPayload>({
    code: "",
    name: "",
    symbol: "",
    category: "weight",
    status: "active",
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setForm({
      code: "",
      name: "",
      symbol: "",
      category: "weight",
      status: "active",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Uom) => {
    setEditingItem(item);
    setForm({
      code: item.code,
      name: item.name,
      symbol: item.symbol,
      category: item.category || "weight",
      status: item.status || "active",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateUom({ id: editingItem.id, ...form }).unwrap();
        toast.success("UOM updated successfully");
      } else {
        await createUom(form).unwrap();
        toast.success("UOM created successfully");
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
      toast.success("UOM status toggled");
      refetch();
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || "Failed to toggle status");
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteUom(deletingId).unwrap();
      toast.success("UOM deleted successfully");
      setDeletingId(null);
      refetch();
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || "Failed to delete UOM");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Ruler className="text-[#15803d] dark:text-emerald-400" size={26} />
            <h1 className="text-2xl font-extrabold text-[#1E293B] dark:text-white tracking-tight">
              Units of Measure (UOMs)
            </h1>
          </div>
          <p className="text-sm text-[#64748B] dark:text-gray-400 mt-1">
            Manage measurement units, symbols, and unit categories.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 bg-[#15803d] hover:bg-[#14532d] text-white font-medium text-sm px-4 py-2.5 rounded-lg shadow-sm transition-all"
        >
          <Plus size={18} />
          Add UOM
        </button>
      </div>

      {/* Filter */}
      <div className="w-full sm:w-80">
        <Input
          type="text"
          placeholder="Search UOMs..."
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
        ) : uoms.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            No units of measure found.
          </div>
        ) : (
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">No.</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Code</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Name</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Symbol</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Category</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Status</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {uoms.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="px-5 py-3.5 text-gray-500 text-sm">{index + 1}</TableCell>
                    <TableCell className="px-5 py-3.5 font-semibold text-gray-900 dark:text-white text-sm">{item.code}</TableCell>
                    <TableCell className="px-5 py-3.5 text-gray-900 dark:text-white text-sm">{item.name}</TableCell>
                    <TableCell className="px-5 py-3.5 text-gray-500 text-sm font-mono">{item.symbol}</TableCell>
                    <TableCell className="px-5 py-3.5 text-gray-500 text-sm capitalize">{item.category}</TableCell>
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
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-gray-600 hover:text-[#15803d] hover:bg-green-50 dark:hover:bg-green-950/20 rounded-md transition"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <Switch
                          checked={item.status === "active"}
                          onClick={() => handleToggle(item.id)}
                        />
                        <button
                          onClick={() => setDeletingId(item.id)}
                          className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
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
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} className="max-w-[480px] m-4">
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            {editingItem ? "Edit UOM" : "Add New UOM"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                UOM Code *
              </label>
              <Input
                type="text"
                required
                placeholder="e.g. PM-KG"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name *
              </label>
              <Input
                type="text"
                required
                placeholder="e.g. Kilogram"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Symbol *
              </label>
              <Input
                type="text"
                required
                placeholder="e.g. kg, L, pcs"
                value={form.symbol}
                onChange={(e) => setForm({ ...form, symbol: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category *
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="weight">Weight (kg, g, ton)</option>
                <option value="volume">Volume (L, mL)</option>
                <option value="count">Count (pcs, dose, bag)</option>
                <option value="length">Length (m, cm)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "inactive" })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <Button type="button" size="sm" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isCreating || isUpdating}>
                {isCreating || isUpdating ? "Saving..." : editingItem ? "Update UOM" : "Create UOM"}
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
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Delete UOM</h3>
          <p className="text-xs text-gray-500">
            Are you sure you want to delete this unit of measure?
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
