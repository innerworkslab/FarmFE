"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  useGetAnimalsQuery,
  useCreateAnimalMutation,
  useUpdateAnimalMutation,
  useDeleteAnimalMutation,
  Animal,
  AnimalPayload,
} from "@/redux/features/setup/AnimalApiSlice";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import TableActionButton from "@/components/ui/table/TableActionButton";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Loading from "@/components/common/Loading";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, PawPrint } from "lucide-react";
import { AnimalClassificationKind, useCreateAnimalClassificationMutation, useGetAnimalClassificationsQuery } from "@/redux/features/setup/AnimalClassificationApiSlice";

type AnimalForm = Omit<AnimalPayload, "animal_type_id" | "animal_category_id" | "animal_breed_id"> & {
  animal_type_id: string;
  animal_category_id: string;
  animal_breed_id: string;
};

export default function AnimalsPage() {
  const [search, setSearch] = useState("");
  const [filterTypeId, setFilterTypeId] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [filterBreedId, setFilterBreedId] = useState("");
  const [filterTracking, setFilterTracking] = useState<"" | "individual" | "batch">("");
  const { data, isLoading, refetch } = useGetAnimalsQuery({ search: search || undefined, animal_type_id: filterTypeId ? Number(filterTypeId) : undefined, animal_category_id: filterCategoryId ? Number(filterCategoryId) : undefined, animal_breed_id: filterBreedId ? Number(filterBreedId) : undefined, tracking_type: filterTracking || undefined });
  const { data: typesData } = useGetAnimalClassificationsQuery({ kind: "animal-types", params: { status: "active", per_page: 100 } });
  const { data: categoriesData } = useGetAnimalClassificationsQuery({ kind: "animal-categories", params: { status: "active", per_page: 100 } });
  const { data: breedsData } = useGetAnimalClassificationsQuery({ kind: "animal-breeds", params: { status: "active", per_page: 100 } });

  const animals = data?.data || [];
  const animalTypes = typesData?.data || [];
  const filterCategories = (categoriesData?.data || []).filter((item) => !filterTypeId || item.animal_type_id === Number(filterTypeId));
  const filterBreeds = (breedsData?.data || []).filter((item) => !filterTypeId || item.animal_type_id === Number(filterTypeId));

  const [createAnimal, { isLoading: isCreating }] = useCreateAnimalMutation();
  const [updateAnimal, { isLoading: isUpdating }] = useUpdateAnimalMutation();
  const [deleteAnimal, { isLoading: isDeleting }] = useDeleteAnimalMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Animal | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [quickCreateKind, setQuickCreateKind] = useState<AnimalClassificationKind | null>(null);
  const [quickCreateName, setQuickCreateName] = useState("");
  const [createClassification, { isLoading: isCreatingClassification }] = useCreateAnimalClassificationMutation();

  const [form, setForm] = useState<AnimalForm>({
    code: "",
    name: "",
    animal_type_id: "",
    animal_category_id: "",
    animal_breed_id: "",
    gender: "mixed",
    tracking_type: "batch",
    ear_tag_rfid_number: "",
    batch_flock_number: "BATCH-01",
  });
  const animalCategories = (categoriesData?.data || []).filter((item) => item.animal_type_id === Number(form.animal_type_id));
  const animalBreeds = (breedsData?.data || []).filter((item) => item.animal_type_id === Number(form.animal_type_id));

  const handleOpenAdd = () => {
    setEditingItem(null);
    setForm({
      code: "",
      name: "",
      animal_type_id: String(animalTypes[0]?.id || ""),
      animal_category_id: "",
      animal_breed_id: "",
      gender: "mixed",
      tracking_type: "batch",
      ear_tag_rfid_number: "",
      batch_flock_number: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Animal) => {
    setEditingItem(item);
    setForm({
      code: item.code,
      name: item.name,
      animal_type_id: String(item.animal_type_id || item.animal_type?.id || ""),
      animal_category_id: String(item.animal_category_id || item.animal_category?.id || ""),
      animal_breed_id: String(item.animal_breed_id || item.animal_breed?.id || ""),
      gender: (item.gender as "male" | "female" | "mixed") || "mixed",
      tracking_type: (item.tracking_type as "individual" | "batch") || "batch",
      ear_tag_rfid_number: item.ear_tag_rfid_number || "",
      batch_flock_number: item.batch_flock_number || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: AnimalPayload = {
      ...form,
      animal_type_id: Number(form.animal_type_id),
      animal_category_id: Number(form.animal_category_id),
      animal_breed_id: Number(form.animal_breed_id),
      ...(form.tracking_type === "individual"
        ? { ear_tag_rfid_number: form.ear_tag_rfid_number?.trim(), batch_flock_number: null }
        : { ear_tag_rfid_number: null, batch_flock_number: form.batch_flock_number?.trim() }),
    };
    try {
      if (editingItem) {
        await updateAnimal({ id: editingItem.id, ...payload }).unwrap();
        toast.success("Animal master updated successfully");
      } else {
        await createAnimal(payload).unwrap();
        toast.success("Animal master created successfully");
      }
      setIsModalOpen(false);
      refetch();
    } catch (error: unknown) {
      const err = error as { data?: { message?: string; errors?: Record<string, string[]> } };
      toast.error(err?.data?.message || Object.values(err?.data?.errors || {}).flat()[0] || "Operation failed");
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

  const handleQuickCreateClassification = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!quickCreateKind) return;
    const body = {
      name: quickCreateName.trim(),
      ...(quickCreateKind !== "animal-types" ? { animal_type_id: Number(form.animal_type_id) } : {}),
    };
    try {
      const created = await createClassification({ kind: quickCreateKind, body }).unwrap();
      if (quickCreateKind === "animal-types") setForm((current) => ({ ...current, animal_type_id: String(created.data.id), animal_category_id: "", animal_breed_id: "" }));
      if (quickCreateKind === "animal-categories") setForm((current) => ({ ...current, animal_category_id: String(created.data.id), animal_breed_id: "" }));
      if (quickCreateKind === "animal-breeds") setForm((current) => ({ ...current, animal_breed_id: String(created.data.id) }));
      toast.success("Classification created and selected.");
      setQuickCreateKind(null);
      setQuickCreateName("");
    } catch (error) {
      const err = error as { data?: { message?: string; errors?: Record<string, string[]> } };
      toast.error(err.data?.message || Object.values(err.data?.errors || {}).flat()[0] || "Unable to create classification.");
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
        <Link href="/setup/animal-classifications" className="text-sm font-medium text-green-700 hover:text-green-800 dark:text-green-400">Manage types, categories &amp; breeds →</Link>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 bg-[#15803d] hover:bg-[#14532d] text-white font-medium text-sm px-4 py-2.5 rounded-lg shadow-sm transition-all"
        >
          <Plus size={18} />
          Add Animal
        </button>
      </div>

      {/* Filter */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Input
          type="text"
          placeholder="Search animals..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select aria-label="Filter animal type" className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900" value={filterTypeId} onChange={(e) => { setFilterTypeId(e.target.value); setFilterCategoryId(""); setFilterBreedId(""); }}><option value="">All types</option>{animalTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</select>
        <select aria-label="Filter animal category" className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900" value={filterCategoryId} onChange={(e) => setFilterCategoryId(e.target.value)}><option value="">All categories</option>{filterCategories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <select aria-label="Filter animal breed" className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900" value={filterBreedId} onChange={(e) => setFilterBreedId(e.target.value)}><option value="">All breeds</option>{filterBreeds.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <select aria-label="Filter tracking type" className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900" value={filterTracking} onChange={(e) => setFilterTracking(e.target.value as "" | "individual" | "batch")}><option value="">All tracking types</option><option value="batch">Batch</option><option value="individual">Individual</option></select>
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
                    <TableCell className="px-5 py-3.5 text-gray-500 text-sm capitalize">{item.animal_type?.name || item.type || "-"}</TableCell>
                    <TableCell className="px-5 py-3.5 text-gray-500 text-sm capitalize">{item.animal_category?.name || item.category || "-"}</TableCell>
                    <TableCell className="px-5 py-3.5 text-gray-500 text-sm">{item.animal_breed?.name || item.breed || "-"}</TableCell>
                    <TableCell className="px-5 py-3.5 text-gray-500 text-sm capitalize">{item.gender}</TableCell>
                    <TableCell className="px-5 py-3.5 text-sm">
                      <span className="px-2 py-0.5 bg-green-50 text-green-800 text-xs rounded border border-green-200 capitalize">
                        {item.tracking_type} {item.batch_flock_number ? `(${item.batch_flock_number})` : ""}
                      </span>
                    </TableCell>
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
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} className="max-w-4xl m-4">
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            {editingItem ? "Edit Animal" : "Add New Animal"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Animal Code <span className="text-red-500 dark:text-red-400">*</span>
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
                  Name / Batch Title <span className="text-red-500 dark:text-red-400">*</span>
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
                <label className="flex items-center justify-between text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type <span className="text-red-500 dark:text-red-400">*</span>
                  <button type="button" aria-label="Add animal type" title="Add animal type" onClick={() => { setQuickCreateName(""); setQuickCreateKind("animal-types"); }} className="inline-flex size-7 items-center justify-center rounded-md border border-green-200 text-green-700 hover:bg-green-50 dark:border-green-900 dark:text-green-400"><Plus size={15}/></button>
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none"
                  required
                  value={form.animal_type_id}
                  onChange={(e) => {
                    setForm({
                      ...form,
                      animal_type_id: e.target.value,
                      animal_category_id: "",
                      animal_breed_id: "",
                    });
                  }}
                >
                  <option value="">Select animal type</option>
                  {animalTypes.filter((item) => item.status === "active").map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
                {animalTypes.length === 0 && <Link className="mt-1 inline-block text-xs text-green-700" href="/setup/animal-classifications">Add animal types</Link>}
              </div>

              <div>
                <label className="flex items-center justify-between text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category <span className="text-red-500 dark:text-red-400">*</span>
                  <button type="button" aria-label="Add animal category" title="Add animal category" disabled={!form.animal_type_id} onClick={() => { setQuickCreateName(""); setQuickCreateKind("animal-categories"); }} className="inline-flex size-7 items-center justify-center rounded-md border border-green-200 text-green-700 hover:bg-green-50 disabled:opacity-40 dark:border-green-900 dark:text-green-400"><Plus size={15}/></button>
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none"
                  required
                  value={form.animal_category_id}
                  onChange={(e) => setForm({ ...form, animal_category_id: e.target.value, animal_breed_id: "" })}
                >
                  <option value="">Select category</option>
                  {(categoriesData?.data || []).filter((category) => category.animal_type_id === Number(form.animal_type_id) && category.status === "active").map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
                {animalCategories.length === 0 && <Link className="mt-1 inline-block text-xs text-green-700" href="/setup/animal-classifications">Add categories for this type</Link>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="flex items-center justify-between text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Breed <span className="text-red-500 dark:text-red-400">*</span>
                  <button type="button" aria-label="Add animal breed" title="Add animal breed" disabled={!form.animal_type_id} onClick={() => { setQuickCreateName(""); setQuickCreateKind("animal-breeds"); }} className="inline-flex size-7 items-center justify-center rounded-md border border-green-200 text-green-700 hover:bg-green-50 disabled:opacity-40 dark:border-green-900 dark:text-green-400"><Plus size={15}/></button>
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none"
                  required
                  value={form.animal_breed_id}
                  onChange={(e) => setForm({ ...form, animal_breed_id: e.target.value })}
                >
                  <option value="">Select breed</option>
                  {(breedsData?.data || []).filter((breed) => breed.animal_type_id === Number(form.animal_type_id) && breed.status === "active").map((breed) => <option key={breed.id} value={breed.id}>{breed.name}</option>)}
                </select>
                {animalBreeds.length === 0 && <Link className="mt-1 inline-block text-xs text-green-700" href="/setup/animal-classifications">Add breeds for this type</Link>}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Gender <span className="text-red-500 dark:text-red-400">*</span>
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
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Color / Marking</label>
                <Input type="text" value={form.color_marking || ""} onChange={(e) => setForm({ ...form, color_marking: e.target.value })} placeholder="e.g. Brown and white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Photo path</label>
                <Input type="text" value={form.photo_path || ""} onChange={(e) => setForm({ ...form, photo_path: e.target.value || null })} placeholder="Optional image path" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tracking Type <span className="text-red-500 dark:text-red-400">*</span>
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

              {form.tracking_type === "individual" ? (
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ear Tag / RFID Number <span className="text-red-500 dark:text-red-400">*</span>
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. RFID-000123"
                    value={form.ear_tag_rfid_number || ""}
                    onChange={(e) => setForm({ ...form, ear_tag_rfid_number: e.target.value })}
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Batch / Flock Number
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. BATCH-PM-01"
                    value={form.batch_flock_number || ""}
                    onChange={(e) => setForm({ ...form, batch_flock_number: e.target.value })}
                  />
                </div>
              )}
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

      <Modal isOpen={!!quickCreateKind} onClose={() => setQuickCreateKind(null)} className="max-w-md m-4">
        <form onSubmit={handleQuickCreateClassification} className="space-y-4 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Add {quickCreateKind === "animal-types" ? "Animal Type" : quickCreateKind === "animal-categories" ? "Animal Category" : "Animal Breed"}</h2>
          {quickCreateKind !== "animal-types" && <p className="text-sm text-gray-500">For {animalTypes.find((type) => String(type.id) === form.animal_type_id)?.name || "selected animal type"}</p>}
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name<Input required autoFocus value={quickCreateName} onChange={(event) => setQuickCreateName(event.target.value)} placeholder="Enter name" /></label>
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setQuickCreateKind(null)}>Cancel</Button><Button type="submit" disabled={isCreatingClassification}>{isCreatingClassification ? "Creating…" : "Create and Select"}</Button></div>
        </form>
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
