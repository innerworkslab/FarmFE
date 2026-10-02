"use client";

import { FormEvent, useState } from "react";
import { Pencil, Plus, Power, Tags } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/button/Button";
import Loading from "@/components/common/Loading";
import { Modal } from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import TableActionButton from "@/components/ui/table/TableActionButton";
import {
  AssetCategory,
  useCreateAssetCategoryMutation,
  useGetAssetCategoriesQuery,
  useToggleAssetCategoryStatusMutation,
  useUpdateAssetCategoryMutation,
} from "@/redux/features/financial/DepreciationApiSlice";

const inputClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white";

export default function AssetCategoriesPage() {
  const [editing, setEditing] = useState<AssetCategory | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const { data, isLoading, isFetching, isError } = useGetAssetCategoriesQuery({ per_page: 100 });
  const [createCategory, createState] = useCreateAssetCategoryMutation();
  const [updateCategory, updateState] = useUpdateAssetCategoryMutation();
  const [toggleStatus, toggleState] = useToggleAssetCategoryStatusMutation();
  const categories = data?.data ?? [];

  const openForm = (category?: AssetCategory) => {
    setEditing(category ?? null);
    setName(category?.name ?? "");
    setFormOpen(true);
  };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    try {
      if (editing) await updateCategory({ id: editing.id, name: trimmedName }).unwrap();
      else await createCategory({ name: trimmedName }).unwrap();
      toast.success(editing ? "Asset category updated." : "Asset category created.");
      setFormOpen(false);
    } catch (error) {
      toast.error(
        (error as { data?: { message?: string } })?.data?.message ||
          "Could not save asset category."
      );
    }
  };
  const changeStatus = async (category: AssetCategory) => {
    const status = category.status === "active" ? "inactive" : "active";
    try {
      await toggleStatus({ id: category.id, status }).unwrap();
      toast.success(`Asset category ${status === "active" ? "activated" : "deactivated"}.`);
    } catch (error) {
      toast.error(
        (error as { data?: { message?: string } })?.data?.message ||
          "Could not change asset category status."
      );
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-8">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
            <Tags size={17} />
            <span>Financial management</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Asset Categories
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Organize assets used in depreciation records.
          </p>
        </div>
        <Button onClick={() => openForm()} startIcon={<Plus size={16} />}>
          New asset category
        </Button>
      </header>

      <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200/70 dark:bg-white/[0.03] dark:ring-gray-800">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Categories</h2>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              Only active categories can be chosen for new depreciation drafts.
            </p>
          </div>
          <span className="text-xs text-gray-500">
            {isFetching ? "Updating…" : `${categories.length} categories`}
          </span>
        </div>
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loading />
          </div>
        ) : isError ? (
          <p className="px-5 py-10 text-center text-sm text-red-700 dark:text-red-300">
            Could not load asset categories.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {["Name", "Status", "Actions"].map((heading) => (
                    <TableCell
                      key={heading}
                      isHeader
                      className="bg-gray-50 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-gray-900/60 dark:text-gray-400"
                    >
                      {heading}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow
                    key={category.id}
                    className="transition-colors hover:bg-gray-50/70 dark:hover:bg-white/[0.025]"
                  >
                    <TableCell className="px-5 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                      {category.name}
                    </TableCell>
                    <TableCell className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${category.status === "active" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"}`}
                      >
                        {category.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-3">
                      <div className="flex flex-wrap gap-2">
                        <TableActionButton
                          label="Edit"
                          icon={<Pencil size={14} />}
                          onClick={() => openForm(category)}
                        />
                        <TableActionButton
                          label={category.status === "active" ? "Deactivate" : "Activate"}
                          icon={<Power size={14} />}
                          tone={category.status === "active" ? "red" : "green"}
                          onClick={() => void changeStatus(category)}
                          disabled={toggleState.isLoading}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {categories.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="px-5 py-12 text-center text-sm text-gray-500">
                      No asset categories yet. Create one to use in depreciation drafts.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} className="max-w-md p-6">
        <form onSubmit={save} className="space-y-5">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {editing ? "Edit asset category" : "New asset category"}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Enter a category name for depreciation assets.
            </p>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">
              Name *
            </span>
            <input
              required
              autoFocus
              className={inputClass}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
              Close
            </Button>
            <Button type="submit" disabled={createState.isLoading || updateState.isLoading}>
              {createState.isLoading || updateState.isLoading
                ? "Saving…"
                : editing
                  ? "Save category"
                  : "Create category"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
