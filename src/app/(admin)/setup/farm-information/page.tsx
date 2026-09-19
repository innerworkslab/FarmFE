"use client";

import React, { useState } from "react";
import {
  useGetFarmInformationListQuery,
  useCreateFarmInformationMutation,
  useUpdateFarmInformationMutation,
  useDeleteFarmInformationMutation,
  FarmInformation,
  FarmInformationPayload,
} from "@/redux/features/setup/FarmInformationApiSlice";
import { useGetBranchesQuery } from "@/redux/features/setup/BranchApiSlice";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import TableActionButton from "@/components/ui/table/TableActionButton";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Loading from "@/components/common/Loading";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Home } from "lucide-react";

export default function FarmInformationPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, refetch } = useGetFarmInformationListQuery({ search: search || undefined });
  const { data: branchesData } = useGetBranchesQuery();

  const farmList = data?.data || [];
  const branches = branchesData?.data || [];

  const [createFarmInfo, { isLoading: isCreating }] = useCreateFarmInformationMutation();
  const [updateFarmInfo, { isLoading: isUpdating }] = useUpdateFarmInformationMutation();
  const [deleteFarmInfo, { isLoading: isDeleting }] = useDeleteFarmInformationMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FarmInformation | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [form, setForm] = useState<FarmInformationPayload>({
    name: "",
    branch_id: 1,
    house_barn: "",
    pen_cage_pond: "",
  });

  const handleOpenAdd = () => {
    const defaultBranchId = branches[0]?.id || 1;
    setEditingItem(null);
    setForm({
      name: "",
      branch_id: defaultBranchId,
      house_barn: "",
      pen_cage_pond: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: FarmInformation) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      branch_id: item.branch_id || 1,
      house_barn: item.house_barn || "",
      pen_cage_pond: item.pen_cage_pond || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateFarmInfo({ id: editingItem.id, body: form }).unwrap();
        toast.success("Farm location updated successfully");
      } else {
        await createFarmInfo(form).unwrap();
        toast.success("Farm location created successfully");
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
      await deleteFarmInfo(deletingId).unwrap();
      toast.success("Farm location deleted successfully");
      setDeletingId(null);
      refetch();
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || "Failed to delete farm location");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Home className="text-[#15803d] dark:text-emerald-400" size={26} />
            <h1 className="text-2xl font-extrabold text-[#1E293B] dark:text-white tracking-tight">
              Farm Information & Housing
            </h1>
          </div>
          <p className="text-sm text-[#64748B] dark:text-gray-400 mt-1">
            Manage barns, houses, pens, cages, and ponds mapped to branches.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 bg-[#15803d] hover:bg-[#14532d] text-white font-medium text-sm px-4 py-2.5 rounded-lg shadow-sm transition-all"
        >
          <Plus size={18} />
          Add Farm House
        </button>
      </div>

      {/* Filter */}
      <div className="w-full sm:w-80">
        <Input
          type="text"
          placeholder="Search farm housing..."
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
        ) : farmList.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            No farm housing records found.
          </div>
        ) : (
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">No.</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">House / Location Name</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Branch</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">House / Barn</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Pen / Cage / Pond</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {farmList.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="px-5 py-3.5 text-gray-500 text-sm">{index + 1}</TableCell>
                    <TableCell className="px-5 py-3.5 font-semibold text-gray-900 dark:text-white text-sm">{item.name}</TableCell>
                    <TableCell className="px-5 py-3.5 text-gray-700 dark:text-gray-300 font-medium text-sm">
                      {branches.find((b) => b.id === item.branch_id)?.name || item.branch?.name || `Branch #${item.branch_id}`}
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-gray-500 text-sm">{item.house_barn || "-"}</TableCell>
                    <TableCell className="px-5 py-3.5 text-gray-500 text-sm">{item.pen_cage_pond || "-"}</TableCell>
                    <TableCell className="px-5 py-3.5 text-sm">
                      <div className="flex items-center gap-2">
                        <TableActionButton label="Edit" tone="neutral" onClick={() => handleOpenEdit(item)} icon={<Pencil size={14} />} />
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
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} className="max-w-[480px] m-4">
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            {editingItem ? "Edit Farm House" : "Add Farm House"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Housing / Name *
              </label>
              <Input
                type="text"
                required
                placeholder="e.g. Yangon Barn A"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  House / Barn *
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Barn PM"
                  value={form.house_barn}
                  onChange={(e) => setForm({ ...form, house_barn: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pen / Cage / Pond *
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Pen PM"
                  value={form.pen_cage_pond}
                  onChange={(e) => setForm({ ...form, pen_cage_pond: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <Button type="button" size="sm" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isCreating || isUpdating}>
                {isCreating || isUpdating ? "Saving..." : editingItem ? "Update Housing" : "Create Housing"}
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
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Delete Farm Housing</h3>
          <p className="text-xs text-gray-500">
            Are you sure you want to delete this farm housing entry?
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
