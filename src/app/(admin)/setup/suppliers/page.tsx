"use client";

import React, { useState } from "react";
import {
  useGetSuppliersQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useToggleSupplierStatusMutation,
  useDeleteSupplierMutation,
  Supplier,
  SupplierPayload,
} from "@/redux/features/setup/SupplierApiSlice";
import { useGetBranchesQuery } from "@/redux/features/setup/BranchApiSlice";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { Switch } from "@/components/ui/switch";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Loading from "@/components/common/Loading";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Truck } from "lucide-react";

export default function SuppliersPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, refetch } = useGetSuppliersQuery({ search: search || undefined });
  const { data: branchesData } = useGetBranchesQuery();

  const suppliers = data?.data || [];
  const branches = branchesData?.data || [];

  const [createSupplier, { isLoading: isCreating }] = useCreateSupplierMutation();
  const [updateSupplier, { isLoading: isUpdating }] = useUpdateSupplierMutation();
  const [toggleStatus] = useToggleSupplierStatusMutation();
  const [deleteSupplier, { isLoading: isDeleting }] = useDeleteSupplierMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Supplier | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [form, setForm] = useState<SupplierPayload>({
    code: "",
    name: "",
    type: "food",
    phone_number: "",
    preferred_branch_id: null,
    opening_balance_type: "none",
    supplied_categories: ["feed"],
    opening_balance: 0,
    minimum_order_amount: 0,
    status: "active",
  });
  const [categoryText, setCategoryText] = useState("feed");

  const handleOpenAdd = () => {
    setEditingItem(null);
    setForm({
      code: "",
      name: "",
      type: "food",
      phone_number: "",
      preferred_branch_id: null,
      opening_balance_type: "none",
      supplied_categories: ["feed"],
      opening_balance: 0,
      minimum_order_amount: 0,
      status: "active",
    });
    setCategoryText("feed");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Supplier) => {
    setEditingItem(item);
    setForm({
      code: item.code,
      name: item.name,
      type: item.type || "food",
      phone_number: item.phone_number || "",
      preferred_branch_id: item.preferred_branch_id || null,
      opening_balance_type: item.opening_balance_type || "none",
      supplied_categories: item.supplied_categories || [],
      opening_balance: Number(item.opening_balance || 0),
      minimum_order_amount: Number(item.minimum_order_amount || 0),
      status: item.status || "active",
    });
    setCategoryText((item.supplied_categories || []).join(", "));
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supplied_categories = categoryText
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    const payload: SupplierPayload = {
      ...form,
      supplied_categories,
    };

    try {
      if (editingItem) {
        await updateSupplier({ id: editingItem.id, body: payload }).unwrap();
        toast.success("Supplier updated successfully");
      } else {
        await createSupplier(payload).unwrap();
        toast.success("Supplier created successfully");
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
      toast.success("Supplier status toggled");
      refetch();
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || "Failed to toggle status");
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteSupplier(deletingId).unwrap();
      toast.success("Supplier deleted successfully");
      setDeletingId(null);
      refetch();
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || "Failed to delete supplier");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="text-[#15803d] dark:text-emerald-400" size={26} />
            <h1 className="text-2xl font-extrabold text-[#1E293B] dark:text-white tracking-tight">
              Suppliers
            </h1>
          </div>
          <p className="text-sm text-[#64748B] dark:text-gray-400 mt-1">
            Manage vendors, supply types (food, medicine, equipment), and order terms.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 bg-[#15803d] hover:bg-[#14532d] text-white font-medium text-sm px-4 py-2.5 rounded-lg shadow-sm transition-all"
        >
          <Plus size={18} />
          Add Supplier
        </button>
      </div>

      {/* Filter */}
      <div className="w-full sm:w-80">
        <Input
          type="text"
          placeholder="Search suppliers..."
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
        ) : suppliers.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            No suppliers found.
          </div>
        ) : (
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">No.</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Code</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Supplier Name</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Type</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Phone</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Categories</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Status</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {suppliers.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="px-5 py-3.5 text-gray-500 text-sm">{index + 1}</TableCell>
                    <TableCell className="px-5 py-3.5 font-semibold text-gray-900 dark:text-white text-sm">{item.code}</TableCell>
                    <TableCell className="px-5 py-3.5 text-gray-900 dark:text-white text-sm">{item.name}</TableCell>
                    <TableCell className="px-5 py-3.5 text-gray-500 text-sm uppercase text-xs font-semibold">{item.type}</TableCell>
                    <TableCell className="px-5 py-3.5 text-gray-500 text-sm">{item.phone_number || "-"}</TableCell>
                    <TableCell className="px-5 py-3.5 text-gray-500 text-sm">
                      <div className="flex flex-wrap gap-1">
                        {item.supplied_categories?.map((c, i) => (
                          <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                            {c}
                          </span>
                        )) || "-"}
                      </div>
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
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} className="max-w-[550px] m-4">
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            {editingItem ? "Edit Supplier" : "Add New Supplier"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Supplier Code *
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. SUP-PM"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Supplier Name *
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. CP Feeds Ltd"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Supplier Type *
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as "food" | "medicine" | "equipment" | "other" })}
                >
                  <option value="food">Food / Feed</option>
                  <option value="medicine">Medicine / Vaccine</option>
                  <option value="equipment">Equipment</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number *
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. +95 9 800000001"
                  value={form.phone_number}
                  onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Preferred Branch
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none"
                  value={form.preferred_branch_id || ""}
                  onChange={(e) => setForm({ ...form, preferred_branch_id: e.target.value ? Number(e.target.value) : null })}
                >
                  <option value="">Any Branch</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Supplied Categories
                </label>
                <Input
                  type="text"
                  placeholder="e.g. feed, minerals"
                  value={categoryText}
                  onChange={(e) => setCategoryText(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Opening Balance Type
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none"
                  value={form.opening_balance_type || "none"}
                  onChange={(e) => setForm({ ...form, opening_balance_type: e.target.value as "none" | "debit" | "credit" })}
                >
                  <option value="none">None</option>
                  <option value="debit">Debit</option>
                  <option value="credit">Credit</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Min Order Amount
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.minimum_order_amount}
                  onChange={(e) => setForm({ ...form, minimum_order_amount: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <Button type="button" size="sm" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isCreating || isUpdating}>
                {isCreating || isUpdating ? "Saving..." : editingItem ? "Update Supplier" : "Create Supplier"}
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
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Delete Supplier</h3>
          <p className="text-xs text-gray-500">
            Are you sure you want to delete this supplier?
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
