"use client";

import React, { useState } from "react";
import {
  useGetInventoriesQuery,
  useCreateInventoryMutation,
  useUpdateInventoryMutation,
  useToggleInventoryStatusMutation,
  useDeleteInventoryMutation,
  Inventory,
  InventoryPayload,
} from "@/redux/features/setup/InventoryApiSlice";
import { useGetBranchesQuery } from "@/redux/features/setup/BranchApiSlice";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { Switch } from "@/components/ui/switch";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Loading from "@/components/common/Loading";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Warehouse } from "lucide-react";

export default function InventoriesPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, refetch } = useGetInventoriesQuery({ search: search || undefined });
  const { data: branchesData } = useGetBranchesQuery();

  const inventories = data?.data || [];
  const branches = branchesData?.data || [];

  const [createInventory, { isLoading: isCreating }] = useCreateInventoryMutation();
  const [updateInventory, { isLoading: isUpdating }] = useUpdateInventoryMutation();
  const [toggleStatus] = useToggleInventoryStatusMutation();
  const [deleteInventory, { isLoading: isDeleting }] = useDeleteInventoryMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Inventory | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [form, setForm] = useState<InventoryPayload>({
    code: "",
    name: "",
    type: "feed",
    branch_id: 1,
    physical_address: "",
    allowed_item_categories: ["feed"],
    building_zone: "",
    rack_bin: "",
    inventory_gl_account: "",
    status: "active",
  });
  const [allowedCatText, setAllowedCatText] = useState("feed");

  const handleOpenAdd = () => {
    const defaultBranchId = branches[0]?.id || 1;
    setEditingItem(null);
    setForm({
      code: "",
      name: "",
      type: "feed",
      branch_id: defaultBranchId,
      physical_address: "",
      allowed_item_categories: ["feed"],
      building_zone: "",
      rack_bin: "",
      inventory_gl_account: "",
      status: "active",
    });
    setAllowedCatText("feed");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Inventory) => {
    setEditingItem(item);
    setForm({
      code: item.code,
      name: item.name,
      type: item.type || "feed",
      branch_id: item.branch_id || 1,
      physical_address: item.physical_address || "",
      allowed_item_categories: item.allowed_item_categories || [],
      building_zone: item.building_zone || "",
      rack_bin: item.rack_bin || "",
      inventory_gl_account: item.inventory_gl_account || "",
      status: item.status || "active",
    });
    setAllowedCatText((item.allowed_item_categories || []).join(", "));
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allowed_item_categories = allowedCatText
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    const payload: InventoryPayload = {
      ...form,
      allowed_item_categories,
    };

    try {
      if (editingItem) {
        await updateInventory({ id: editingItem.id, body: payload }).unwrap();
        toast.success("Inventory updated successfully");
      } else {
        await createInventory(payload).unwrap();
        toast.success("Inventory created successfully");
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
      toast.success("Inventory status toggled");
      refetch();
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || "Failed to toggle status");
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteInventory(deletingId).unwrap();
      toast.success("Inventory deleted successfully");
      setDeletingId(null);
      refetch();
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || "Failed to delete inventory");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Warehouse className="text-[#15803d] dark:text-emerald-400" size={26} />
            <h1 className="text-2xl font-extrabold text-[#1E293B] dark:text-white tracking-tight">
              Inventories / Warehouses
            </h1>
          </div>
          <p className="text-sm text-[#64748B] dark:text-gray-400 mt-1">
            Manage storage warehouses, stock locations, rack/bins, and allowed item categories.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 bg-[#15803d] hover:bg-[#14532d] text-white font-medium text-sm px-4 py-2.5 rounded-lg shadow-sm transition-all"
        >
          <Plus size={18} />
          Add Inventory
        </button>
      </div>

      {/* Filter */}
      <div className="w-full sm:w-80">
        <Input
          type="text"
          placeholder="Search inventories..."
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
        ) : inventories.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            No inventory warehouses found.
          </div>
        ) : (
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">No.</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Code</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Warehouse Name</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Type</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Branch</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Allowed Categories</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Status</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {inventories.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="px-5 py-3.5 text-gray-500 text-sm">{index + 1}</TableCell>
                    <TableCell className="px-5 py-3.5 font-semibold text-gray-900 dark:text-white text-sm">{item.code}</TableCell>
                    <TableCell className="px-5 py-3.5 text-gray-900 dark:text-white text-sm">{item.name}</TableCell>
                    <TableCell className="px-5 py-3.5 text-gray-500 text-sm capitalize">{item.type}</TableCell>
                    <TableCell className="px-5 py-3.5 text-gray-500 text-sm">{item.branch?.name || `Branch #${item.branch_id}`}</TableCell>
                    <TableCell className="px-5 py-3.5 text-gray-500 text-sm">
                      <div className="flex flex-wrap gap-1">
                        {item.allowed_item_categories?.map((c, i) => (
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
            {editingItem ? "Edit Inventory" : "Add New Inventory"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Warehouse Code *
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. INV-PM"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Warehouse Name *
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Main Feed Warehouse"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Inventory Type *
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="feed">Feed</option>
                  <option value="medicine">Medicine</option>
                  <option value="equipment">Equipment</option>
                  <option value="general">General</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Branch *
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none"
                  value={form.branch_id}
                  onChange={(e) => setForm({ ...form, branch_id: Number(e.target.value) })}
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Physical Address *
              </label>
              <Input
                type="text"
                required
                placeholder="e.g. Beside Barn A"
                value={form.physical_address}
                onChange={(e) => setForm({ ...form, physical_address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Building Zone
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Zone A"
                  value={form.building_zone || ""}
                  onChange={(e) => setForm({ ...form, building_zone: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rack / Bin
                </label>
                <Input
                  type="text"
                  placeholder="e.g. R1-B2"
                  value={form.rack_bin || ""}
                  onChange={(e) => setForm({ ...form, rack_bin: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  GL Account
                </label>
                <Input
                  type="text"
                  placeholder="e.g. 1300-FEED"
                  value={form.inventory_gl_account || ""}
                  onChange={(e) => setForm({ ...form, inventory_gl_account: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Allowed Item Categories (comma-separated)
              </label>
              <Input
                type="text"
                placeholder="e.g. feed, supplement"
                value={allowedCatText}
                onChange={(e) => setAllowedCatText(e.target.value)}
              />
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
                {isCreating || isUpdating ? "Saving..." : editingItem ? "Update Inventory" : "Create Inventory"}
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
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Delete Inventory</h3>
          <p className="text-xs text-gray-500">
            Are you sure you want to delete this inventory warehouse?
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
