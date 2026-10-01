"use client";

import { useState } from "react";
import { Eye, Pencil, Plus, Tags } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Loading from "@/components/common/Loading";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import TableActionButton from "@/components/ui/table/TableActionButton";
import {
  CashLedgerCategory,
  CashLedgerCategoryPayload,
  useCreateCashLedgerCategoryMutation,
  useGetCashLedgerCategoriesQuery,
  useLazyGetCashLedgerCategoryQuery,
  useSetCashLedgerCategoryStatusMutation,
  useUpdateCashLedgerCategoryMutation,
} from "@/redux/features/financial/CashbookApiSlice";

const inputClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white";
const statusBadgeClass = (status: string) =>
  status === "active"
    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
    : status === "inactive"
      ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
      : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";

export default function CashLedgerCategoriesPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CashLedgerCategory | null>(null);
  const [detail, setDetail] = useState<CashLedgerCategory | null>(null);
  const [form, setForm] = useState<CashLedgerCategoryPayload>({
    name: "",
    direction: "in",
    reversal_category_id: null,
  });
  const { data, isLoading } = useGetCashLedgerCategoriesQuery({ per_page: 100 });
  const [createCategory, createState] = useCreateCashLedgerCategoryMutation();
  const [updateCategory, updateState] = useUpdateCashLedgerCategoryMutation();
  const [setStatus] = useSetCashLedgerCategoryStatusMutation();
  const [getCategory] = useLazyGetCashLedgerCategoryQuery();
  const categories = data?.data ?? [];
  const reversalOptions = (data?.data ?? []).filter(
    (item) =>
      item.id !== editing?.id && item.direction !== form.direction && item.status === "active"
  );
  const startCreate = () => {
    setEditing(null);
    setForm({ name: "", direction: "in", reversal_category_id: null });
    setOpen(true);
  };
  const startEdit = (item: CashLedgerCategory) => {
    setEditing(item);
    setForm({
      name: item.name,
      direction: item.direction as "in" | "out",
      reversal_category_id: item.reversal_category_id ?? null,
    });
    setOpen(true);
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const body: CashLedgerCategoryPayload = {
        name: form.name?.trim(),
        direction: form.direction,
        ...(form.reversal_category_id
          ? { reversal_category_id: form.reversal_category_id }
          : editing?.reversal_category_id
            ? { reversal_category_id: null }
            : {}),
      };
      if (editing) await updateCategory({ id: editing.id, body }).unwrap();
      else
        await createCategory(
          body as Required<Pick<CashLedgerCategoryPayload, "name" | "direction">> &
            Pick<CashLedgerCategoryPayload, "reversal_category_id">
        ).unwrap();
      toast.success(editing ? "Category updated." : "Category created.");
      setOpen(false);
    } catch (error) {
      toast.error(
        (error as { data?: { message?: string } })?.data?.message || "Could not save category."
      );
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Tags className="text-emerald-700" size={24} />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Cash Ledger Categories
            </h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Manage transaction categories and their reversal pairs.
          </p>
        </div>
        <Button onClick={startCreate}>
          <Plus size={16} /> Add category
        </Button>
      </header>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loading />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {["Category", "Direction", "Reversal category", "Status", "Actions"].map((h) => (
                  <TableCell
                    key={h}
                    isHeader
                    className="px-4 py-3 text-xs font-semibold text-gray-500"
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                    {item.name}
                  </TableCell>
                  <TableCell
                    className={`px-4 py-3 text-sm font-medium ${item.direction === "in" ? "text-emerald-700" : "text-red-700"}`}
                  >
                    {item.direction === "in" ? "Money in" : "Money out"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {item.reversal_category?.name || "—"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusBadgeClass(item.status)}`}
                    >
                      {item.status}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <TableActionButton
                        label="View"
                        tone="neutral"
                        icon={<Eye size={14} />}
                        onClick={() =>
                          void getCategory(item.id)
                            .unwrap()
                            .then((r) => setDetail(r.data))
                            .catch(() => toast.error("Could not load category."))
                        }
                      />
                      <TableActionButton
                        label="Edit"
                        tone="neutral"
                        icon={<Pencil size={14} />}
                        onClick={() => startEdit(item)}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className={
                          item.status === "active"
                            ? "!bg-red-50 !text-red-700 !ring-red-200 hover:!bg-red-100 dark:!bg-red-950/40 dark:!text-red-300 dark:!ring-red-900"
                            : "!bg-emerald-50 !text-emerald-700 !ring-emerald-200 hover:!bg-emerald-100 dark:!bg-emerald-950/40 dark:!text-emerald-300 dark:!ring-emerald-900"
                        }
                        onClick={async () => {
                          try {
                            await setStatus({
                              id: item.id,
                              status: item.status === "active" ? "inactive" : "active",
                            }).unwrap();
                            toast.success("Category status updated.");
                          } catch (error) {
                            toast.error(
                              (error as { data?: { message?: string } })?.data?.message ||
                                "Could not update status."
                            );
                          }
                        }}
                      >
                        {item.status === "active" ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {!isLoading && !categories.length && (
          <p className="py-12 text-center text-sm text-gray-500">No categories found.</p>
        )}
      </div>
      <Modal isOpen={open} onClose={() => setOpen(false)} className="m-4 max-w-lg">
        <form onSubmit={submit} className="space-y-4 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {editing ? "Edit category" : "Create category"}
          </h2>
          <label className="block text-xs font-medium text-gray-600">
            Name
            <Input
              required
              maxLength={120}
              value={form.name ?? ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label className="block text-xs font-medium text-gray-600">
            Direction
            <select
              className={inputClass}
              value={form.direction}
              onChange={(e) =>
                setForm({
                  ...form,
                  direction: e.target.value as "in" | "out",
                  reversal_category_id: null,
                })
              }
            >
              <option value="in">Money in</option>
              <option value="out">Money out</option>
            </select>
          </label>
          <label className="block text-xs font-medium text-gray-600">
            Reversal category
            <select
              className={inputClass}
              value={form.reversal_category_id ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  reversal_category_id: e.target.value ? Number(e.target.value) : null,
                })
              }
            >
              <option value="">None</option>
              {reversalOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.direction})
                </option>
              ))}
            </select>
          </label>
          <p className="text-xs text-gray-500">
            To pair categories, assign each category as the other’s reversal category.
          </p>
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createState.isLoading || updateState.isLoading}>
              {editing ? "Save changes" : "Create category"}
            </Button>
          </div>
        </form>
      </Modal>
      <Modal isOpen={!!detail} onClose={() => setDetail(null)} className="m-4 max-w-md">
        <div className="space-y-3 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Category details</h2>
          {detail && (
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <dt className="text-gray-500">Name</dt>
              <dd>{detail.name}</dd>
              <dt className="text-gray-500">Direction</dt>
              <dd>{detail.direction}</dd>
              <dt className="text-gray-500">Reversal category</dt>
              <dd>{detail.reversal_category?.name ?? "—"}</dd>
              <dt className="text-gray-500">Status</dt>
              <dd>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusBadgeClass(detail.status)}`}
                >
                  {detail.status}
                </span>
              </dd>
            </dl>
          )}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setDetail(null)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
