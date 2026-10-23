"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PawPrint, Plus, Pencil, Trash2, Power } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Loading from "@/components/common/Loading";
import { Modal } from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import TableActionButton from "@/components/ui/table/TableActionButton";
import {
  AnimalClassification,
  AnimalClassificationKind,
  useCreateAnimalClassificationMutation,
  useDeleteAnimalClassificationMutation,
  useGetAnimalClassificationsQuery,
  useToggleAnimalClassificationMutation,
  useUpdateAnimalClassificationMutation,
} from "@/redux/features/setup/AnimalClassificationApiSlice";

const kinds: { key: AnimalClassificationKind; label: string }[] = [
  { key: "animal-types", label: "Types" },
  { key: "animal-categories", label: "Categories" },
  { key: "animal-breeds", label: "Breeds" },
];

export default function AnimalClassificationsPage() {
  const [kind, setKind] = useState<AnimalClassificationKind>("animal-types");
  const [typeFilter, setTypeFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AnimalClassification | null>(null);
  const [name, setName] = useState("");
  const [typeId, setTypeId] = useState("");
  const queryArgs = { params: { per_page: 100 } };
  const { data: typesResponse, isLoading: typesLoading } = useGetAnimalClassificationsQuery({ kind: "animal-types", ...queryArgs });
  const { data: categoriesResponse, isLoading: categoriesLoading } = useGetAnimalClassificationsQuery({ kind: "animal-categories", ...queryArgs });
  const { data: breedsResponse, isLoading: breedsLoading } = useGetAnimalClassificationsQuery({ kind: "animal-breeds", ...queryArgs });
  const [createRecord, { isLoading: creating }] = useCreateAnimalClassificationMutation();
  const [updateRecord, { isLoading: updating }] = useUpdateAnimalClassificationMutation();
  const [toggleRecord] = useToggleAnimalClassificationMutation();
  const [deleteRecord] = useDeleteAnimalClassificationMutation();
  const types = typesResponse?.data || [];
  const sourceRows = kind === "animal-types" ? types : kind === "animal-categories" ? categoriesResponse?.data || [] : breedsResponse?.data || [];
  const rows = typeFilter && kind !== "animal-types" ? sourceRows.filter((row) => String(row.animal_type_id) === typeFilter) : sourceRows;
  const loading = kind === "animal-types" ? typesLoading : kind === "animal-categories" ? categoriesLoading : breedsLoading;
  const needsType = kind !== "animal-types";

  const openCreate = () => {
    setEditing(null);
    setName("");
    setTypeId(typeFilter || String(types.find((item) => item.status === "active")?.id || ""));
    setModalOpen(true);
  };
  const openEdit = (row: AnimalClassification) => {
    setEditing(row);
    setName(row.name);
    setTypeId(String(row.animal_type_id || ""));
    setModalOpen(true);
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const body = { name: name.trim(), ...(needsType ? { animal_type_id: Number(typeId) } : {}) };
    try {
      if (editing) await updateRecord({ kind, id: editing.id, body }).unwrap();
      else await createRecord({ kind, body }).unwrap();
      toast.success(`${kinds.find((item) => item.key === kind)?.label.slice(0, -1)} ${editing ? "updated" : "created"}.`);
      setModalOpen(false);
    } catch (error) {
      const e = error as { data?: { message?: string; errors?: Record<string, string[]> } };
      toast.error(e.data?.message || Object.values(e.data?.errors || {}).flat()[0] || "Unable to save classification.");
    }
  };
  const toggle = async (row: AnimalClassification) => {
    try {
      await toggleRecord({ kind, id: row.id }).unwrap();
      toast.success(`${row.name} ${row.status === "active" ? "deactivated" : "activated"}.`);
    } catch {
      toast.error("Unable to change status.");
    }
  };
  const remove = async (row: AnimalClassification) => {
    if (!window.confirm(`Delete ${row.name}?`)) return;
    try {
      await deleteRecord({ kind, id: row.id }).unwrap();
      toast.success("Classification deleted.");
    } catch (error) {
      const e = error as { data?: { message?: string } };
      toast.error(e.data?.message || "Unable to delete classification. It may be in use; deactivate it instead.");
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2"><PawPrint className="text-green-700" size={25} /><div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Animal Classifications</h1><p className="text-sm text-gray-500">Manage animal types, categories, and breeds used when creating animals.</p></div></div>
        <Button onClick={openCreate}><Plus size={16} className="mr-1 inline" /> Add {kinds.find((item) => item.key === kind)?.label.slice(0, -1)}</Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {kinds.map((item) => <button key={item.key} type="button" onClick={() => setKind(item.key)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${kind === item.key ? "bg-green-700 text-white" : "border border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"}`}>{item.label}</button>)}
        {needsType && <select aria-label="Filter by animal type" className="h-11 min-w-48 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="">All animal types</option>{types.filter((item) => item.status === "active").map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>}
      </div>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {loading ? <div className="flex h-52 items-center justify-center"><Loading /></div> : <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableCell isHeader className="px-5 py-3 text-left text-xs text-gray-500">Name</TableCell>{kind !== "animal-types" && <TableCell isHeader className="px-5 py-3 text-left text-xs text-gray-500">Animal Type</TableCell>}<TableCell isHeader className="px-5 py-3 text-left text-xs text-gray-500">Status</TableCell><TableCell isHeader className="px-5 py-3 text-left text-xs text-gray-500">Actions</TableCell></TableRow></TableHeader><TableBody>{rows.map((row) => <TableRow key={row.id}><TableCell className="px-5 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.name}</TableCell>{kind !== "animal-types" && <TableCell className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">{row.animal_type?.name || types.find((item) => item.id === row.animal_type_id)?.name || "-"}</TableCell>}<TableCell className="px-5 py-3 text-sm"><span className={row.status === "active" ? "text-green-700" : "text-gray-500"}>{row.status}</span></TableCell><TableCell className="px-5 py-3"><div className="flex gap-2"><TableActionButton label="Edit" tone="neutral" icon={<Pencil size={14}/>} onClick={() => openEdit(row)}/><TableActionButton label={row.status === "active" ? "Deactivate" : "Activate"} tone="amber" icon={<Power size={14}/>} onClick={() => void toggle(row)}/><TableActionButton label="Delete" tone="red" icon={<Trash2 size={14}/>} onClick={() => void remove(row)}/></div></TableCell></TableRow>)}{rows.length === 0 && <TableRow><TableCell colSpan={kind === "animal-types" ? 3 : 4} className="px-5 py-10 text-center text-sm text-gray-500">No classifications found.</TableCell></TableRow>}</TableBody></Table></div>}
      </div>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} className="max-w-lg m-4"><form onSubmit={save} className="space-y-4 p-6"><h2 className="text-lg font-bold text-gray-900 dark:text-white">{editing ? "Edit" : "Add"} {kinds.find((item) => item.key === kind)?.label.slice(0, -1)}</h2><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name<Input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter name" /></label>{needsType && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Animal Type<select required className="mt-1 h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900" value={typeId} onChange={(event) => setTypeId(event.target.value)}><option value="">Select animal type</option>{types.filter((item) => item.status === "active").map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}<div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button><Button type="submit" disabled={creating || updating || (needsType && !typeId)}>{creating || updating ? "Saving…" : editing ? "Save Changes" : "Create"}</Button></div></form></Modal>
    </div>
  );
}
