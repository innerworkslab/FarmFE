"use client";

import React, { useState } from "react";
import {
  useGetAnimalsQuery,
  useCreateAnimalMutation,
  useUpdateAnimalMutation,
  useDeleteAnimalMutation,
  Animal,
  AnimalPayload,
} from "@/redux/features/setup/AnimalApiSlice";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Loading from "@/components/common/Loading";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, PawPrint } from "lucide-react";

export default function AnimalsPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, refetch } = useGetAnimalsQuery({ search: search || undefined });

  const animals = data?.data || [];

  const [createAnimal, { isLoading: isCreating }] = useCreateAnimalMutation();
  const [updateAnimal, { isLoading: isUpdating }] = useUpdateAnimalMutation();
  const [deleteAnimal, { isLoading: isDeleting }] = useDeleteAnimalMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Animal | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [form, setForm] = useState<AnimalPayload>({
    code: "",
    name: "",
    type: "cattle",
    category: "beef",
    breed: "Brahman",
    gender: "mixed",
    tracking_type: "batch",
    batch_flock_number: "BATCH-01",
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setForm({
      code: "",
      name: "",
      type: "cattle",
      category: "beef",
      breed: "",
      gender: "mixed",
      tracking_type: "batch",
      batch_flock_number: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Animal) => {
    setEditingItem(item);
    setForm({
      code: item.code,
      name: item.name,
      type: item.type || "cattle",
      category: item.category || "",
      breed: item.breed || "",
      gender: (item.gender as "male" | "female" | "mixed") || "mixed",
      tracking_type: (item.tracking_type as "individual" | "batch") || "batch",
      batch_flock_number: item.batch_flock_number || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateAnimal({ id: editingItem.id, ...form }).unwrap();
        toast.success("Animal master updated successfully");
      } else {
        await createAnimal(form).unwrap();
        toast.success("Animal master created successfully");
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
      await deleteAnimal(deletingId).unwrap();
      toast.success("Animal deleted successfully");
      setDeletingId(null);
      refetch();
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || "Failed to delete animal");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <PawPrint className="text-[#15803d] dark:text-emerald-400" size={26} />
            <h1 className="text-2xl font-extrabold text-[#1E293B] dark:text-white tracking-tight">
              Animals Master
            </h1>
          </div>
          <p className="text-sm text-[#64748B] dark:text-gray-400 mt-1">
            Manage livestock species, breeds, categories, gender, and individual/batch tracking.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 bg-[#15803d] hover:bg-[#14532d] text-white font-medium text-sm px-4 py-2.5 rounded-lg shadow-sm transition-all"
        >
          <Plus size={18} />
          Add Animal
        </button>
      </div>

      {/* Filter */}
      <div className="w-full sm:w-80">
        <Input
          type="text"
          placeholder="Search animals..."
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
        ) : animals.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            No animals found.
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
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Breed</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Gender</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Tracking</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {animals.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="px-5 py-3.5 text-gray-500 text-sm">{index + 1}</TableCell>
                    <TableCell className="px-5 py-3.5 font-semibold text-gray-900 dark:text-white text-sm">{item.code}</TableCell>
                    <TableCell className="px-5 py-3.5 text-gray-900 dark:text-white text-sm">{item.name}</TableCell>
                    <TableCell className="px-5 py-3.5 text-gray-500 text-sm capitalize">{item.type}</TableCell>
                    <TableCell className="px-5 py-3.5 text-gray-500 text-sm capitalize">{item.category}</TableCell>
                    <TableCell className="px-5 py-3.5 text-gray-500 text-sm">{item.breed || "-"}</TableCell>
                    <TableCell className="px-5 py-3.5 text-gray-500 text-sm capitalize">{item.gender}</TableCell>
                    <TableCell className="px-5 py-3.5 text-sm">
                      <span className="px-2 py-0.5 bg-green-50 text-green-800 text-xs rounded border border-green-200 capitalize">
                        {item.tracking_type} {item.batch_flock_number ? `(${item.batch_flock_number})` : ""}
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
            {editingItem ? "Edit Animal" : "Add New Animal"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Animal Code *
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. ANM-PM"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name / Batch Title *
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Brahman Batch 1"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type *
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="cattle">Cattle</option>
                  <option value="poultry">Poultry / Chicken</option>
                  <option value="swine">Swine / Pig</option>
                  <option value="sheep">Sheep</option>
                  <option value="goat">Goat</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category *
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. beef, dairy, broiler, layer"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Breed
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Brahman, Angus, Cobb 500"
                  value={form.breed}
                  onChange={(e) => setForm({ ...form, breed: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Gender *
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value as "male" | "female" | "mixed" })}
                >
                  <option value="mixed">Mixed</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tracking Type *
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none"
                  value={form.tracking_type}
                  onChange={(e) => setForm({ ...form, tracking_type: e.target.value as "individual" | "batch" })}
                >
                  <option value="batch">Batch / Flock Tracking</option>
                  <option value="individual">Individual (Ear Tag / RFID)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Batch / Flock Number
                </label>
                <Input
                  type="text"
                  placeholder="e.g. BATCH-PM-01"
                  value={form.batch_flock_number || ""}
                  onChange={(e) => setForm({ ...form, batch_flock_number: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <Button type="button" size="sm" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isCreating || isUpdating}>
                {isCreating || isUpdating ? "Saving..." : editingItem ? "Update Animal" : "Create Animal"}
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
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Delete Animal</h3>
          <p className="text-xs text-gray-500">
            Are you sure you want to delete this animal record?
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
