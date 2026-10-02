"use client";

import { FormEvent, useMemo, useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  Layers3,
  Pencil,
  Plus,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/button/Button";
import DatePicker from "@/components/form/date-picker";
import Loading from "@/components/common/Loading";
import { Modal } from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import TableActionButton from "@/components/ui/table/TableActionButton";
import {
  useGetCashbooksQuery,
  useGetCashLedgerCategoriesQuery,
  useGetCashbookTransactionsQuery,
  useGetCashbookLedgerQuery,
  useGetCashbookCategorySummaryQuery,
} from "@/redux/features/financial/CashbookApiSlice";
import {
  Depreciation,
  DepreciationPayload,
  useActivateDepreciationMutation,
  useCancelDepreciationMutation,
  useCreateDepreciationMutation,
  useGetDepreciationScheduleQuery,
  useGetDepreciationsQuery,
  useGetAssetCategoriesQuery,
  useLazyGetDepreciationQuery,
  usePostDepreciationScheduleLineMutation,
  useReverseDepreciationScheduleLineMutation,
  useUpdateDepreciationMutation,
} from "@/redux/features/financial/DepreciationApiSlice";

const inputClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white";
const labelClass = "mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300";
const newKey = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `depreciation-${Date.now()}`;
const localToday = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const money = (value?: string | number | null, currency = "") =>
  value === undefined || value === null || value === ""
    ? "—"
    : `${currency ? `${currency} ` : ""}${Number(value).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
type DepreciationForm = {
  asset_name: string;
  asset_category_id: string;
  asset_price: string;
  monthly_amount: string;
  start_date: string;
  cashbook_id: string;
  category_id: string;
  description: string;
};
const emptyForm = (): DepreciationForm => ({
  asset_name: "",
  asset_category_id: "",
  asset_price: "",
  monthly_amount: "",
  start_date: localToday(),
  cashbook_id: "",
  category_id: "",
  description: "",
});
const statusClass = (status: string) =>
  status === "active" || status === "posted" || status === "completed"
    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
    : status === "draft" || status === "pending"
      ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
      : status === "failed"
        ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300";

export default function DepreciationsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Depreciation | null>(null);
  const [form, setForm] = useState<DepreciationForm>(emptyForm);
  const [selected, setSelected] = useState<Depreciation | null>(null);
  const [verificationRecord, setVerificationRecord] = useState<Depreciation | null>(null);
  const [verificationFrom, setVerificationFrom] = useState(localToday());
  const [verificationTo, setVerificationTo] = useState(localToday());
  const [reasonTarget, setReasonTarget] = useState<"cancel" | "reverse" | null>(null);
  const [reasonLineId, setReasonLineId] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const { data, isLoading, isError } = useGetDepreciationsQuery({
    status: statusFilter || undefined,
    search: search.trim() || undefined,
    per_page: 30,
  });
  const { data: cashbookData } = useGetCashbooksQuery({ status: "active", per_page: 100 });
  const { data: categoryData } = useGetCashLedgerCategoriesQuery({
    direction: "out",
    status: "active",
    per_page: 100,
  });
  const { data: assetCategoryData } = useGetAssetCategoriesQuery({ per_page: 100 });
  const assetCategories = assetCategoryData?.data ?? [];
  const activeAssetCategories = assetCategories.filter((category) => category.status === "active");
  const cashbooks = useMemo(
    () => (cashbookData?.data || []).filter((item) => item.status === "active"),
    [cashbookData]
  );
  const categories = useMemo(
    () =>
      (categoryData?.data || []).filter(
        (item) => item.status === "active" && item.direction === "out"
      ),
    [categoryData]
  );
  const { data: scheduleData, isLoading: scheduleLoading } = useGetDepreciationScheduleQuery(
    selected ? { id: selected.id, per_page: 50 } : skipToken
  );
  const { data: verificationSchedule } = useGetDepreciationScheduleQuery(
    verificationRecord ? { id: verificationRecord.id, per_page: 50 } : skipToken
  );
  const {
    data: postedTransactions,
    isLoading: transactionsLoading,
    isError: transactionsError,
  } = useGetCashbookTransactionsQuery(
    {
      cashbook_id: verificationRecord?.cashbook_id,
      direction: "out",
      search: verificationRecord?.reference,
      per_page: 30,
    },
    { skip: !verificationRecord }
  );
  const {
    data: depreciationLedger,
    isLoading: ledgerLoading,
    isError: ledgerError,
  } = useGetCashbookLedgerQuery(
    verificationRecord
      ? { id: verificationRecord.cashbook_id, source_type: "depreciation", per_page: 30 }
      : skipToken
  );
  const {
    data: categorySummary,
    isLoading: summaryLoading,
    isError: summaryError,
  } = useGetCashbookCategorySummaryQuery(
    { from_date: verificationFrom, to_date: verificationTo, direction: "out" },
    { skip: !verificationRecord }
  );
  const [fetchDepreciation] = useLazyGetDepreciationQuery();
  const [createDepreciation, createState] = useCreateDepreciationMutation();
  const [updateDepreciation, updateState] = useUpdateDepreciationMutation();
  const [activateDepreciation] = useActivateDepreciationMutation();
  const [cancelDepreciation] = useCancelDepreciationMutation();
  const [postLine] = usePostDepreciationScheduleLineMutation();
  const [reverseLine] = useReverseDepreciationScheduleLineMutation();
  const records = data?.data ?? [];
  const draftCount = records.filter((record) => record.status === "draft").length;
  const activeCount = records.filter((record) => record.status === "active").length;
  const postedCount = records.filter(
    (record) => record.total_posted_amount !== undefined && Number(record.total_posted_amount) > 0
  ).length;
  const selectedTransactionIds = new Set(
    (verificationSchedule?.data ?? [])
      .map((line) => line.cashbook_transaction_id)
      .filter((id): id is number => typeof id === "number")
  );
  const recordTransactions = (postedTransactions?.data ?? []).filter(
    (entry) =>
      selectedTransactionIds.has(entry.id) ||
      entry.external_reference?.startsWith(`${verificationRecord?.reference}-`)
  );
  const recordTransactionReferences = new Set(recordTransactions.map((entry) => entry.reference));
  const recordLedgerEntries = (depreciationLedger?.data ?? []).filter(
    (entry) =>
      (entry.cashbook_transaction_id != null &&
        selectedTransactionIds.has(entry.cashbook_transaction_id)) ||
      recordTransactionReferences.has(entry.reference)
  );
  const depreciationCategoryTotals =
    categorySummary?.data.currencies.flatMap((currency) =>
      currency.categories
        .filter((category) => category.category_id === verificationRecord?.category_id)
        .map((category) => ({ ...category, currency_code: currency.currency_code }))
    ) ?? [];

  const startCreate = () => {
    setEditing(null);
    setForm({
      ...emptyForm(),
      asset_category_id: String(activeAssetCategories[0]?.id ?? ""),
      cashbook_id: String(cashbooks[0]?.id ?? ""),
      category_id: String(categories[0]?.id ?? ""),
    });
    setFormOpen(true);
  };
  const startEdit = (record: Depreciation) => {
    setEditing(record);
    setForm({
      asset_name: record.asset_name,
      asset_category_id: String(
        record.asset_category_id ??
          (typeof record.asset_category === "object"
            ? record.asset_category?.id
            : assetCategories.find((category) => category.name === record.asset_category)?.id) ??
          ""
      ),
      asset_price: String(record.asset_price),
      monthly_amount: String(record.monthly_amount),
      start_date: record.start_date,
      cashbook_id: String(record.cashbook_id),
      category_id: String(record.category_id),
      description: record.description ?? "",
    });
    setFormOpen(true);
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const body: DepreciationPayload = {
        ...form,
        asset_name: form.asset_name.trim(),
        asset_category_id: Number(form.asset_category_id),
        cashbook_id: Number(form.cashbook_id),
        category_id: Number(form.category_id),
      };
      if (editing) await updateDepreciation({ id: editing.id, body }).unwrap();
      else await createDepreciation({ ...body, idempotency_key: newKey() }).unwrap();
      toast.success(editing ? "Depreciation draft updated." : "Depreciation draft created.");
      setFormOpen(false);
    } catch (error) {
      toast.error(
        (error as { data?: { message?: string } })?.data?.message || "Could not save depreciation."
      );
    }
  };
  const activate = async (record: Depreciation) => {
    try {
      await activateDepreciation(record.id).unwrap();
      toast.success("Depreciation activated and schedule generated.");
    } catch (error) {
      toast.error(
        (error as { data?: { message?: string } })?.data?.message ||
          "Could not activate depreciation."
      );
    }
  };
  const post = async (id: number) => {
    try {
      await postLine(id).unwrap();
      toast.success("Schedule line posted to cashbook.");
      if (selected) {
        try {
          setSelected((await fetchDepreciation(selected.id).unwrap()).data);
        } catch {
          // The schedule query still refreshes through tag invalidation.
        }
      }
    } catch (error) {
      toast.error(
        (error as { data?: { message?: string } })?.data?.message || "Could not post schedule line."
      );
    }
  };
  const openSchedule = async (record: Depreciation) => {
    try {
      setSelected((await fetchDepreciation(record.id).unwrap()).data);
    } catch (error) {
      toast.error(
        (error as { data?: { message?: string } })?.data?.message ||
          "Could not load depreciation record."
      );
    }
  };
  const openVerification = (record: Depreciation) => {
    setVerificationFrom(record.start_date);
    setVerificationTo(localToday());
    setVerificationRecord(record);
  };
  const closeReasonDialog = () => {
    if (reasonTarget === "cancel") setSelected(null);
    setReasonTarget(null);
    setReasonLineId(null);
    setReason("");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-8">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
            <CalendarDays size={17} />
            <span>Financial management</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Asset Depreciation
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            Track asset value over time and post due monthly deductions directly to a cashbook.
          </p>
        </div>
        <Button onClick={startCreate} startIcon={<Plus size={16} />}>
          New depreciation draft
        </Button>
      </header>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: "Records on page",
            value: data ? records.length : "—",
            icon: Layers3,
            tone: "text-sky-700 bg-sky-50 dark:bg-sky-950/40 dark:text-sky-300",
          },
          {
            title: "Drafts",
            value: data ? draftCount : "—",
            icon: Clock3,
            tone: "text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300",
          },
          {
            title: "Active",
            value: data ? activeCount : "—",
            icon: CheckCircle2,
            tone: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300",
          },
          {
            title: "Assets with postings",
            value:
              data && records.every((record) => record.total_posted_amount !== undefined)
                ? postedCount
                : "—",
            icon: CalendarDays,
            tone: "text-violet-700 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-300",
          },
        ].map(({ title, value, icon: Icon, tone }) => (
          <div
            key={title}
            className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200/70 dark:bg-white/[0.03] dark:ring-gray-800"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}>
                <Icon size={17} />
              </span>
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
              {value}
            </p>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200/70 dark:bg-white/[0.03] dark:ring-gray-800">
        <div className="flex flex-col gap-4 border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Depreciation records</h2>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              Review assets and manage their posting schedules.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative block sm:w-64">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                aria-label="Search depreciation records"
                placeholder="Search assets or references"
                className={`${inputClass} pl-9`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <select
              aria-label="Filter by status"
              className={`${inputClass} sm:w-40`}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Loading />
            </div>
          ) : isError ? (
            <p className="px-5 py-12 text-center text-sm text-red-700 dark:text-red-300">
              Could not load depreciation records.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {[
                    "Reference",
                    "Asset",
                    "Category",
                    "Asset price",
                    "Monthly",
                    "Start date",
                    "Cashbook",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <TableCell
                      key={h}
                      isHeader
                      className="whitespace-nowrap bg-gray-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-gray-900/60 dark:text-gray-400"
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow
                    key={record.id}
                    className="transition-colors hover:bg-gray-50/70 dark:hover:bg-white/[0.025]"
                  >
                    <TableCell className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300">
                      {record.reference}
                    </TableCell>
                    <TableCell className="min-w-40 px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                      {record.asset_name}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200">
                      {typeof record.asset_category === "string"
                        ? record.asset_category
                        : (record.asset_category?.name ?? "—")}
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums text-gray-700 dark:text-gray-200">
                      {money(record.asset_price, record.currency_code)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium tabular-nums text-gray-900 dark:text-white">
                      {money(record.monthly_amount, record.currency_code)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                      {record.start_date}
                    </TableCell>
                    <TableCell className="min-w-36 px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                      {record.cashbook?.name ?? `#${record.cashbook_id}`}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClass(record.status)}`}
                      >
                        {record.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <TableActionButton
                          label="Schedule"
                          icon={<Eye size={14} />}
                          tone="blue"
                          title="View schedule"
                          onClick={() => void openSchedule(record)}
                        />
                        <TableActionButton
                          label="Verify"
                          icon={<Search size={14} />}
                          title="Verify cashbook postings"
                          onClick={() => openVerification(record)}
                        />
                        {record.status === "draft" && (
                          <>
                            <TableActionButton
                              label="Edit"
                              icon={<Pencil size={14} />}
                              title="Edit draft"
                              onClick={() => startEdit(record)}
                            />
                            <TableActionButton
                              label="Activate"
                              icon={<CheckCircle2 size={14} />}
                              tone="green"
                              onClick={() => void activate(record)}
                            />
                          </>
                        )}
                        {(record.status === "draft" || record.status === "active") && (
                          <TableActionButton
                            label="Cancel"
                            icon={<Clock3 size={14} />}
                            tone="red"
                            onClick={() => {
                              setSelected(record);
                              setReasonTarget("cancel");
                            }}
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {records.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="py-16 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                          <CalendarDays size={21} />
                        </span>
                        <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
                          No records found
                        </p>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          Try another search or create a depreciation draft to get started.
                        </p>
                        {!search && !statusFilter && (
                          <Button
                            className="mt-4"
                            size="sm"
                            onClick={startCreate}
                            startIcon={<Plus size={14} />}
                          >
                            Create draft
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </section>

      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} className="max-w-2xl p-6">
        <form onSubmit={submit} className="space-y-5">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {editing ? "Edit depreciation draft" : "New depreciation draft"}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Provide the asset value and monthly cashbook deduction.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ["Asset name", "asset_name", "text"],
                ["Asset price", "asset_price", "number"],
                ["Monthly amount", "monthly_amount", "number"],
              ] as const
            ).map(([label, key, type]) => (
              <label key={key}>
                <span className={labelClass}>{label} *</span>
                <input
                  required
                  min={type === "number" ? "0.01" : undefined}
                  step={type === "number" ? "0.01" : undefined}
                  type={type}
                  className={inputClass}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </label>
            ))}
            <div>
              <span className={labelClass}>Start date *</span>
              <DatePicker
                id="depreciation-start-date"
                defaultDate={form.start_date}
                onChange={(_, date) => setForm((current) => ({ ...current, start_date: date }))}
              />
            </div>
            <label>
              <span className="mb-1.5 flex items-center justify-between gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
                Asset category *
                <Link
                  href="/financial/asset-categories"
                  className="font-medium text-brand-600 hover:underline dark:text-brand-400"
                >
                  Manage categories
                </Link>
              </span>
              <select
                required
                className={inputClass}
                value={form.asset_category_id}
                onChange={(e) => setForm({ ...form, asset_category_id: e.target.value })}
              >
                <option value="">Select asset category</option>
                {activeAssetCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className={labelClass}>Cashbook *</span>
              <select
                required
                className={inputClass}
                value={form.cashbook_id}
                onChange={(e) => setForm({ ...form, cashbook_id: e.target.value })}
              >
                <option value="">Select cashbook</option>
                {cashbooks.map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.name} ({book.currency_code})
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className={labelClass}>Cash-out category *</span>
              <select
                required
                className={inputClass}
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                Use a depreciation cash-out category so category reports stay clear.
              </span>
            </label>
            <label className="sm:col-span-2">
              <span className={labelClass}>Description</span>
              <textarea
                className={`${inputClass} h-24 py-3`}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </label>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setFormOpen(false)}>
              Close
            </Button>
            <Button type="submit" disabled={createState.isLoading || updateState.isLoading}>
              {createState.isLoading || updateState.isLoading
                ? "Saving…"
                : editing
                  ? "Save draft"
                  : "Create draft"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!selected && reasonTarget !== "cancel"}
        onClose={() => setSelected(null)}
        className="max-w-4xl p-6"
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {selected.asset_name} schedule
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {selected.reference} ·{" "}
                  {selected.cashbook?.name ?? `Cashbook #${selected.cashbook_id}`}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClass(selected.status)}`}
              >
                {selected.status}
              </span>
            </div>
            <div className="grid gap-4 rounded-xl bg-gray-50 p-4 text-sm dark:bg-gray-900 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <span className="text-gray-500">Asset price</span>
                <p className="mt-1 font-semibold tabular-nums">
                  {money(selected.asset_price, selected.currency_code)}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Monthly deduction</span>
                <p className="mt-1 font-semibold tabular-nums">
                  {money(selected.monthly_amount, selected.currency_code)}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Posted to date</span>
                <p className="mt-1 font-semibold tabular-nums">
                  {money(selected.total_posted_amount, selected.currency_code)}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Remaining</span>
                <p className="mt-1 font-semibold tabular-nums">
                  {money(selected.remaining_amount, selected.currency_code)}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Start date</span>
                <p className="mt-1 font-semibold">{selected.start_date}</p>
              </div>
            </div>
            <div className="max-h-[55vh] overflow-auto rounded-lg border border-gray-200 dark:border-gray-800">
              {scheduleLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loading />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {["Period", "Due date", "Amount", "Status", "Cashbook ref", "Action"].map(
                        (h) => (
                          <TableCell
                            key={h}
                            isHeader
                            className="whitespace-nowrap bg-gray-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-gray-900/60 dark:text-gray-400"
                          >
                            {h}
                          </TableCell>
                        )
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(scheduleData?.data ?? []).map((line) => (
                      <TableRow
                        key={line.id}
                        className="transition-colors hover:bg-gray-50/70 dark:hover:bg-white/[0.025]"
                      >
                        <TableCell className="px-4 py-3 text-sm font-medium text-gray-500">
                          {line.sequence_number}
                        </TableCell>
                        <TableCell className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                          {line.due_date}
                        </TableCell>
                        <TableCell className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium tabular-nums">
                          {money(line.amount, selected.currency_code)}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClass(line.status)}`}
                          >
                            {line.status}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                          {line.cashbook_posting_reference ?? "—"}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          {(line.status === "pending" || line.status === "failed") &&
                            (line.due_date <= localToday() ? (
                              <TableActionButton
                                label="Post"
                                icon={<CheckCircle2 size={14} />}
                                tone="green"
                                onClick={() => void post(line.id)}
                              />
                            ) : (
                              <span className="text-xs text-gray-500">Not due</span>
                            ))}
                          {line.status === "posted" && (
                            <TableActionButton
                              label="Reverse"
                              icon={<Eye size={14} />}
                              tone="red"
                              onClick={() => {
                                setReasonTarget("reverse");
                                setReasonLineId(line.id);
                                setReason("");
                              }}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(scheduleData?.data ?? []).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="py-8 text-center text-sm text-gray-500">
                          No schedule lines available.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setSelected(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!verificationRecord}
        onClose={() => setVerificationRecord(null)}
        className="max-h-[90vh] max-w-5xl overflow-y-auto p-6"
      >
        {verificationRecord && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Cashbook verification
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {verificationRecord.asset_name} · {verificationRecord.reference} ·{" "}
                {verificationRecord.cashbook?.name ?? `Cashbook #${verificationRecord.cashbook_id}`}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <span className={labelClass}>Summary from date</span>
                <DatePicker
                  id="depreciation-summary-from-date"
                  defaultDate={verificationFrom}
                  onChange={(_, date) => setVerificationFrom(date)}
                />
              </div>
              <div>
                <span className={labelClass}>Summary to date</span>
                <DatePicker
                  id="depreciation-summary-to-date"
                  defaultDate={verificationTo}
                  onChange={(_, date) => setVerificationTo(date)}
                />
              </div>
            </div>
            <section>
              <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                Depreciation cashbook transactions
              </h3>
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
                {transactionsLoading ? (
                  <div className="flex h-24 items-center justify-center">
                    <Loading />
                  </div>
                ) : transactionsError ? (
                  <p className="px-4 py-6 text-center text-sm text-red-700 dark:text-red-300">
                    Could not load cashbook transactions.
                  </p>
                ) : (
                  <Table className="min-w-[820px]">
                    <TableHeader>
                      <TableRow>
                        {["Date", "Reference", "Asset reference", "Amount", "Status"].map(
                          (heading) => (
                            <TableCell
                              key={heading}
                              isHeader
                              scope="col"
                              className={`whitespace-nowrap border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:border-gray-800 dark:bg-gray-900/60 dark:text-gray-300 ${heading === "Amount" ? "text-right" : "text-left"}`}
                            >
                              {heading}
                            </TableCell>
                          )
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recordTransactions.map((entry) => (
                        <TableRow
                          key={entry.id}
                          className="border-b border-gray-100 last:border-0 dark:border-gray-800"
                        >
                          <TableCell className="whitespace-nowrap px-3 py-2 text-sm">
                            {entry.business_date}
                          </TableCell>
                          <TableCell className="whitespace-nowrap px-3 py-2 text-xs">
                            {entry.reference}
                          </TableCell>
                          <TableCell className="whitespace-nowrap px-3 py-2 text-xs">
                            {entry.external_reference ?? "—"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap px-3 py-2 text-right text-sm tabular-nums">
                            {money(entry.amount, entry.cashbook?.currency_code)}
                          </TableCell>
                          <TableCell className="px-3 py-2 text-sm capitalize">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(entry.status)}`}
                            >
                              {entry.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                      {recordTransactions.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="px-3 py-5 text-center text-sm text-gray-500"
                          >
                            No posted transactions linked to this depreciation record.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </div>
            </section>
            <section>
              <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                Depreciation ledger entries
              </h3>
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
                {ledgerLoading ? (
                  <div className="flex h-24 items-center justify-center">
                    <Loading />
                  </div>
                ) : ledgerError ? (
                  <p className="px-4 py-6 text-center text-sm text-red-700 dark:text-red-300">
                    Could not load depreciation ledger entries.
                  </p>
                ) : (
                  <Table className="min-w-[740px]">
                    <TableHeader>
                      <TableRow>
                        {["Date", "Reference", "Direction", "Amount", "Running balance"].map(
                          (heading) => (
                            <TableCell
                              key={heading}
                              isHeader
                              scope="col"
                              className={`whitespace-nowrap border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:border-gray-800 dark:bg-gray-900/60 dark:text-gray-300 ${heading === "Amount" || heading === "Running balance" ? "text-right" : "text-left"}`}
                            >
                              {heading}
                            </TableCell>
                          )
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recordLedgerEntries.map((entry) => (
                        <TableRow
                          key={entry.id}
                          className="border-b border-gray-100 last:border-0 dark:border-gray-800"
                        >
                          <TableCell className="whitespace-nowrap px-3 py-2 text-sm">
                            {entry.entry_date}
                          </TableCell>
                          <TableCell className="whitespace-nowrap px-3 py-2 text-xs">
                            {entry.reference}
                          </TableCell>
                          <TableCell className="px-3 py-2 text-sm capitalize">
                            {entry.direction}
                          </TableCell>
                          <TableCell className="whitespace-nowrap px-3 py-2 text-right text-sm tabular-nums">
                            {money(entry.amount, verificationRecord.cashbook?.currency_code)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap px-3 py-2 text-right text-sm tabular-nums">
                            {money(
                              entry.running_balance,
                              verificationRecord.cashbook?.currency_code
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {recordLedgerEntries.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="px-3 py-5 text-center text-sm text-gray-500"
                          >
                            No ledger entries linked to this depreciation record.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </div>
            </section>
            <section>
              <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                Cash-out category summary
              </h3>
              <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                Category-wide cash-out totals for the selected dates include every source that uses
                this category.
              </p>
              {summaryLoading ? (
                <div className="flex h-20 items-center justify-center">
                  <Loading />
                </div>
              ) : summaryError ? (
                <p className="rounded-lg bg-red-50 px-4 py-5 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
                  Could not load the category summary.
                </p>
              ) : depreciationCategoryTotals.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-emerald-50 p-4 dark:bg-emerald-950/30">
                    <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                      This asset · posted to date
                    </p>
                    <p className="mt-1 text-lg font-semibold tabular-nums text-emerald-900 dark:text-emerald-100">
                      {money(
                        verificationRecord.total_posted_amount,
                        verificationRecord.currency_code
                      )}
                    </p>
                  </div>
                  {depreciationCategoryTotals.map((total) => (
                    <div
                      key={`${total.currency_code}-${total.category_id}`}
                      className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900"
                    >
                      <p className="text-xs font-medium text-gray-500">
                        {total.category_name} · category total · {total.entry_count} entries
                      </p>
                      <p className="mt-1 text-lg font-semibold tabular-nums text-gray-900 dark:text-white">
                        {money(total.total_amount, total.currency_code)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg bg-gray-50 px-4 py-5 text-sm text-gray-500 dark:bg-gray-900">
                  No cash-out totals for this category and date range.
                </p>
              )}
            </section>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setVerificationRecord(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={reasonTarget === "cancel" || reasonTarget === "reverse"}
        onClose={closeReasonDialog}
        className="max-w-md p-6"
      >
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            if (!reason.trim() || !selected) return;
            try {
              if (reasonTarget === "cancel") {
                await cancelDepreciation({ id: selected.id, reason: reason.trim() }).unwrap();
                toast.success("Depreciation cancelled.");
                setSelected(null);
              } else if (reasonLineId) {
                await reverseLine({ id: reasonLineId, reason: reason.trim() }).unwrap();
                toast.success("Schedule line reversed.");
                try {
                  setSelected((await fetchDepreciation(selected.id).unwrap()).data);
                } catch {
                  // The schedule query still refreshes through tag invalidation.
                }
              }
              setReasonTarget(null);
              setReason("");
              setReasonLineId(null);
            } catch (error) {
              toast.error(
                (error as { data?: { message?: string } })?.data?.message ||
                  "Action could not be completed."
              );
            }
          }}
          className="space-y-4"
        >
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {reasonTarget === "cancel" ? "Cancel depreciation" : "Reverse schedule line"}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Enter a reason to keep the financial audit trail clear.
            </p>
          </div>
          <label>
            <span className={labelClass}>Reason *</span>
            <textarea
              required
              autoFocus
              className={`${inputClass} h-24 py-3`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={closeReasonDialog}>
              Close
            </Button>
            <Button type="submit">Confirm</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
