"use client";

import React, { useMemo, useState } from "react";
import { Eye, Pencil, Plus, RotateCcw, Wallet } from "lucide-react";
import { toast } from "sonner";
import DatePicker from "@/components/form/date-picker";
import Input from "@/components/form/input/InputField";
import Loading from "@/components/common/Loading";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import TableActionButton from "@/components/ui/table/TableActionButton";
import {
  useGetCashbooksQuery,
  useGetCashLedgerCategoriesQuery,
} from "@/redux/features/financial/CashbookApiSlice";
import {
  StaffAdvance,
  StaffAdvancePayload,
  StaffAdvanceRepayment,
  StaffAdvanceRepaymentPayload,
  StaffAdvanceUpdatePayload,
  useCancelStaffAdvanceRepaymentMutation,
  useConfirmStaffAdvanceMutation,
  useConfirmStaffAdvanceRepaymentMutation,
  useCreateStaffAdvanceMutation,
  useCreateStaffAdvanceRepaymentMutation,
  useGetStaffAdvanceRepaymentsQuery,
  useGetStaffAdvancesQuery,
  useLazyGetStaffAdvanceQuery,
  useLazyGetStaffAdvanceRepaymentQuery,
  useReverseStaffAdvanceMutation,
  useReverseStaffAdvanceRepaymentMutation,
  useUpdateStaffAdvanceMutation,
  useUpdateStaffAdvanceRepaymentMutation,
} from "@/redux/features/financial/StaffAdvanceApiSlice";
import { useGetStaffQuery } from "@/redux/features/setup/StaffApiSlice";
import { formatReadableDate, formatReadableDateTime } from "@/lib/dateFormat";

type AdvanceForm = {
  staff_id: string;
  principal_amount: string;
  business_date: string;
  cashbook_id: string;
  category_id: string;
  description: string;
  idempotency_key: string;
};
type RepaymentForm = {
  amount: string;
  business_date: string;
  cashbook_id: string;
  category_id: string;
  external_reference: string;
  description: string;
  idempotency_key: string;
};
type ReverseTarget = { kind: "advance" | "repayment" | "cancel"; id: number } | null;

const localToday = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const newKey = (prefix: string) =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const money = (value?: number | string | null, currency = "") =>
  `${currency ? `${currency} ` : ""}${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const inputClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white";
const labelClass = "mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300";
const emptyAdvance = (staffId = "", cashbookId = "", categoryId = ""): AdvanceForm => ({
  staff_id: staffId,
  principal_amount: "",
  business_date: localToday(),
  cashbook_id: cashbookId,
  category_id: categoryId,
  description: "",
  idempotency_key: newKey("staff-advance"),
});
const emptyRepayment = (cashbookId = "", categoryId = ""): RepaymentForm => ({
  amount: "",
  business_date: localToday(),
  cashbook_id: cashbookId,
  category_id: categoryId,
  external_reference: "",
  description: "",
  idempotency_key: newKey("staff-repayment"),
});

function Status({ value }: { value: string }) {
  const tone =
    value === "confirmed"
      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
      : value === "draft"
        ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${tone}`}
    >
      {value}
    </span>
  );
}

export default function StaffAdvancesPage() {
  const [staffFilter, setStaffFilter] = useState("");
  const [advanceFormOpen, setAdvanceFormOpen] = useState(false);
  const [repaymentFormOpen, setRepaymentFormOpen] = useState(false);
  const [editingAdvance, setEditingAdvance] = useState<StaffAdvance | null>(null);
  const [editingRepayment, setEditingRepayment] = useState<StaffAdvanceRepayment | null>(null);
  const [selectedAdvance, setSelectedAdvance] = useState<StaffAdvance | null>(null);
  const [repaymentAdvance, setRepaymentAdvance] = useState<StaffAdvance | null>(null);
  const [repaymentDetail, setRepaymentDetail] = useState<StaffAdvanceRepayment | null>(null);
  const [reverseTarget, setReverseTarget] = useState<ReverseTarget>(null);
  const [reverseReason, setReverseReason] = useState("");
  const [advanceForm, setAdvanceForm] = useState<AdvanceForm>(() => emptyAdvance());
  const [repaymentForm, setRepaymentForm] = useState<RepaymentForm>(() => emptyRepayment());

  const { data: staffResponse } = useGetStaffQuery({
    status: "active",
    employment_status: "employed",
    per_page: 100,
  });
  const staff = staffResponse?.data ?? [];
  const { data: cashbookResponse } = useGetCashbooksQuery({ status: "active", per_page: 100 });
  const cashbooks = cashbookResponse?.data ?? [];
  const activeCashbooks = useMemo(
    () => cashbooks.filter((book) => book.status === "active"),
    [cashbooks]
  );
  const { data: categoryResponse } = useGetCashLedgerCategoriesQuery({ per_page: 100 });
  const categories = categoryResponse?.data ?? [];
  const cashOutCategories = categories.filter(
    (category) => category.direction === "out" && category.status === "active"
  );
  const cashInCategories = categories.filter(
    (category) => category.direction === "in" && category.status === "active"
  );
  const { data: advancesResponse, isLoading: advancesLoading } = useGetStaffAdvancesQuery({
    staff_id: staffFilter || undefined,
    per_page: 30,
  });
  const { data: repaymentsResponse, isLoading: repaymentsLoading } =
    useGetStaffAdvanceRepaymentsQuery(
      { staff_advance_id: selectedAdvance?.id ?? 0, per_page: 30 },
      { skip: !selectedAdvance }
    );

  const [createAdvance, createAdvanceState] = useCreateStaffAdvanceMutation();
  const [updateAdvance, updateAdvanceState] = useUpdateStaffAdvanceMutation();
  const [confirmAdvance] = useConfirmStaffAdvanceMutation();
  const [reverseAdvance] = useReverseStaffAdvanceMutation();
  const [createRepayment, createRepaymentState] = useCreateStaffAdvanceRepaymentMutation();
  const [updateRepayment, updateRepaymentState] = useUpdateStaffAdvanceRepaymentMutation();
  const [confirmRepayment] = useConfirmStaffAdvanceRepaymentMutation();
  const [reverseRepayment] = useReverseStaffAdvanceRepaymentMutation();
  const [cancelRepayment] = useCancelStaffAdvanceRepaymentMutation();
  const [getAdvance] = useLazyGetStaffAdvanceQuery();
  const [getRepayment] = useLazyGetStaffAdvanceRepaymentQuery();

  const notifyError = (error: unknown) =>
    toast.error((error as { data?: { message?: string } })?.data?.message || "Request failed.");
  const openCreateAdvance = () => {
    setEditingAdvance(null);
    setAdvanceForm(
      emptyAdvance(
        staffFilter || String(staff[0]?.id ?? ""),
        String(activeCashbooks[0]?.id ?? ""),
        String(cashOutCategories[0]?.id ?? "")
      )
    );
    setAdvanceFormOpen(true);
  };
  const openEditAdvance = (advance: StaffAdvance) => {
    setEditingAdvance(advance);
    setAdvanceForm({
      staff_id: String(advance.staff_id),
      principal_amount: String(advance.principal_amount),
      business_date: advance.business_date,
      cashbook_id: String(advance.cashbook_id),
      category_id: String(advance.category_id),
      description: advance.description,
      idempotency_key: newKey("staff-advance"),
    });
    setAdvanceFormOpen(true);
  };
  const saveAdvance = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (editingAdvance) {
        const body: StaffAdvanceUpdatePayload = {
          principal_amount: advanceForm.principal_amount,
          description: advanceForm.description.trim(),
        };
        await updateAdvance({ id: editingAdvance.id, body }).unwrap();
      } else {
        const body: StaffAdvancePayload = {
          staff_id: Number(advanceForm.staff_id),
          principal_amount: advanceForm.principal_amount,
          business_date: advanceForm.business_date,
          cashbook_id: Number(advanceForm.cashbook_id),
          category_id: Number(advanceForm.category_id),
          description: advanceForm.description.trim(),
          idempotency_key: advanceForm.idempotency_key,
        };
        await createAdvance(body).unwrap();
      }
      toast.success(editingAdvance ? "Loan draft updated." : "Loan draft created.");
      setAdvanceFormOpen(false);
    } catch (error) {
      notifyError(error);
    }
  };
  const openCreateRepayment = (advance: StaffAdvance) => {
    setEditingRepayment(null);
    setRepaymentAdvance(advance);
    setSelectedAdvance(null);
    setRepaymentForm(
      emptyRepayment(String(activeCashbooks[0]?.id ?? ""), String(cashInCategories[0]?.id ?? ""))
    );
    setRepaymentFormOpen(true);
  };
  const openEditRepayment = (repayment: StaffAdvanceRepayment) => {
    setEditingRepayment(repayment);
    setRepaymentAdvance(null);
    setRepaymentForm({
      amount: String(repayment.amount),
      business_date: repayment.business_date,
      cashbook_id: String(repayment.cashbook_id),
      category_id: String(repayment.category_id),
      external_reference: repayment.external_reference ?? "",
      description: repayment.description,
      idempotency_key: newKey("staff-repayment"),
    });
    setSelectedAdvance(null);
    setRepaymentFormOpen(true);
  };
  const saveRepayment = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (editingRepayment) {
        await updateRepayment({
          id: editingRepayment.id,
          body: { amount: repaymentForm.amount, description: repaymentForm.description.trim() },
        }).unwrap();
        toast.success("Repayment draft updated.");
      } else {
        if (!repaymentAdvance) return toast.error("Choose a loan for this repayment.");
        const body: StaffAdvanceRepaymentPayload = {
          amount: repaymentForm.amount,
          business_date: repaymentForm.business_date,
          cashbook_id: Number(repaymentForm.cashbook_id),
          category_id: Number(repaymentForm.category_id),
          external_reference: repaymentForm.external_reference.trim() || null,
          description: repaymentForm.description.trim(),
          idempotency_key: repaymentForm.idempotency_key,
        };
        await createRepayment({ staff_advance_id: repaymentAdvance.id, body }).unwrap();
        toast.success("Repayment draft created.");
        setSelectedAdvance(repaymentAdvance);
        setRepaymentAdvance(null);
      }
      setRepaymentFormOpen(false);
      setEditingRepayment(null);
    } catch (error) {
      notifyError(error);
    }
  };
  const confirmLoan = async (advance: StaffAdvance) => {
    try {
      await confirmAdvance(advance.id).unwrap();
      toast.success("Loan disbursed.");
    } catch (error) {
      notifyError(error);
    }
  };
  const confirmPayment = async (repayment: StaffAdvanceRepayment) => {
    try {
      await confirmRepayment(repayment.id).unwrap();
      toast.success("Repayment confirmed.");
    } catch (error) {
      notifyError(error);
    }
  };
  const submitReverse = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!reverseTarget) return;
    try {
      if (reverseTarget.kind === "advance") {
        await reverseAdvance({ id: reverseTarget.id, reason: reverseReason.trim() }).unwrap();
        toast.success("Loan disbursement reversed.");
      } else if (reverseTarget.kind === "repayment") {
        await reverseRepayment({ id: reverseTarget.id, reason: reverseReason.trim() }).unwrap();
        toast.success("Repayment reversed.");
      } else {
        await cancelRepayment({ id: reverseTarget.id, reason: reverseReason.trim() }).unwrap();
        toast.success("Repayment draft cancelled.");
      }
      setReverseTarget(null);
      setReverseReason("");
    } catch (error) {
      notifyError(error);
    }
  };
  const openLoanDetails = async (advance: StaffAdvance) => {
    try {
      const result = await getAdvance(advance.id).unwrap();
      setSelectedAdvance(result.data);
    } catch (error) {
      notifyError(error);
    }
  };
  const openRepaymentDetails = async (repayment: StaffAdvanceRepayment) => {
    try {
      const result = await getRepayment(repayment.id).unwrap();
      setRepaymentDetail(result.data);
    } catch (error) {
      notifyError(error);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
            <Wallet size={17} />
            <span>Financial management</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Staff Loans & Repayments
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create and manage staff loans, then record repayments against confirmed advances.
          </p>
        </div>
        <Button onClick={openCreateAdvance}>
          <Plus size={16} /> New loan draft
        </Button>
      </header>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Loans</h2>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              Draft, confirm, and reverse staff loans.
            </p>
          </div>
          <label className="w-full max-w-xs">
            <span className={labelClass}>Staff filter</span>
            <select
              className={inputClass}
              value={staffFilter}
              onChange={(event) => setStaffFilter(event.target.value)}
            >
              <option value="">All staff</option>
              {staff.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.staff_code} · {person.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-gray-200/70 dark:bg-white/[0.03] dark:ring-gray-800">
          {advancesLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loading />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {[
                    "Reference",
                    "Staff",
                    "Date",
                    "Principal",
                    "Outstanding",
                    "Status",
                    "Actions",
                  ].map((head) => (
                    <TableCell
                      key={head}
                      isHeader
                      className={`px-4 py-3 text-xs font-semibold text-gray-500 ${["Principal", "Outstanding"].includes(head) ? "text-right" : ""}`}
                    >
                      {head}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(advancesResponse?.data ?? []).map((advance) => (
                  <TableRow
                    key={advance.id}
                    className="transition-colors hover:bg-gray-50/80 dark:hover:bg-white/[0.03]"
                  >
                    <TableCell className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                      {advance.reference}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                      {advance.staff.name}
                      <div className="text-xs text-gray-500">{advance.staff.staff_code}</div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {formatReadableDate(advance.business_date)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums">
                      <span className="whitespace-nowrap">
                        {money(advance.principal_amount, advance.cashbook?.currency_code)}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold tabular-nums">
                      <span className="whitespace-nowrap">
                        {money(advance.outstanding_amount, advance.cashbook?.currency_code)}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Status value={advance.status} />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1">
                        <TableActionButton
                          label="View loan and repayments"
                          tone="neutral"
                          icon={<Eye size={14} />}
                          onClick={() => void openLoanDetails(advance)}
                        />
                        {advance.status === "draft" && (
                          <>
                            <TableActionButton
                              label="Edit draft"
                              tone="neutral"
                              icon={<Pencil size={14} />}
                              onClick={() => openEditAdvance(advance)}
                            />
                            <Button size="sm" onClick={() => void confirmLoan(advance)}>
                              Confirm
                            </Button>
                          </>
                        )}
                        {advance.status === "confirmed" && (
                          <TableActionButton
                            label="Reverse loan"
                            tone="red"
                            icon={<RotateCcw size={14} />}
                            onClick={() => {
                              setReverseTarget({ kind: "advance", id: advance.id });
                              setReverseReason("");
                            }}
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!advancesLoading && !advancesResponse?.data.length && (
            <p className="py-10 text-center text-sm text-gray-500">No staff loans found.</p>
          )}
        </div>
      </section>

      <Modal
        isOpen={advanceFormOpen}
        onClose={() => setAdvanceFormOpen(false)}
        className="m-4 max-w-2xl"
      >
        <form onSubmit={saveAdvance} className="space-y-4 p-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {editingAdvance ? "Edit loan draft" : "Create loan draft"}
            </h2>
            <p className="text-sm text-gray-500">
              Loan drafts do not post to the cashbook until confirmed.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className={labelClass}>Staff *</span>
              <select
                required
                disabled={!!editingAdvance}
                className={inputClass}
                value={advanceForm.staff_id}
                onChange={(e) => setAdvanceForm({ ...advanceForm, staff_id: e.target.value })}
              >
                <option value="">Select staff</option>
                {staff.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.staff_code} · {person.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className={labelClass}>Principal amount *</span>
              <Input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={advanceForm.principal_amount}
                onChange={(e) =>
                  setAdvanceForm({ ...advanceForm, principal_amount: e.target.value })
                }
              />
            </label>
            {!editingAdvance && (
              <>
                <label>
                  <span className={labelClass}>Business date *</span>
                  <DatePicker
                    id="staff-advance-business-date"
                    defaultDate={advanceForm.business_date}
                    onChange={(_, date) =>
                      setAdvanceForm((current) => ({ ...current, business_date: date }))
                    }
                  />
                </label>
                <label>
                  <span className={labelClass}>Cashbook *</span>
                  <select
                    required
                    className={inputClass}
                    value={advanceForm.cashbook_id}
                    onChange={(e) =>
                      setAdvanceForm({ ...advanceForm, cashbook_id: e.target.value })
                    }
                  >
                    <option value="">Select cashbook</option>
                    {activeCashbooks.map((book) => (
                      <option key={book.id} value={book.id}>
                        {book.name} · {book.currency_code}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className={labelClass}>Cash out category *</span>
                  <select
                    required
                    className={inputClass}
                    value={advanceForm.category_id}
                    onChange={(e) =>
                      setAdvanceForm({ ...advanceForm, category_id: e.target.value })
                    }
                  >
                    <option value="">Select category</option>
                    {cashOutCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
            <label className="sm:col-span-2">
              <span className={labelClass}>Description *</span>
              <Input
                required
                value={advanceForm.description}
                onChange={(e) => setAdvanceForm({ ...advanceForm, description: e.target.value })}
              />
            </label>
          </div>
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
            <Button type="button" variant="outline" onClick={() => setAdvanceFormOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createAdvanceState.isLoading || updateAdvanceState.isLoading}
            >
              {editingAdvance ? "Save draft" : "Create draft"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!selectedAdvance}
        onClose={() => setSelectedAdvance(null)}
        className="m-4 max-w-5xl"
      >
        <div className="space-y-4 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Loan {selectedAdvance?.reference}
              </h2>
              <p className="text-sm text-gray-500">
                {selectedAdvance?.staff.name} · {selectedAdvance?.staff.staff_code}
              </p>
            </div>
            {selectedAdvance?.status === "confirmed" && (
              <Button
                size="sm"
                onClick={() => selectedAdvance && openCreateRepayment(selectedAdvance)}
              >
                <Plus size={15} /> Record repayment
              </Button>
            )}
          </div>
          {selectedAdvance && (
            <div className="grid gap-3 rounded-lg bg-gray-50 p-4 text-sm dark:bg-gray-900/50 sm:grid-cols-4">
              <div>
                <p className="text-xs text-gray-500">Principal</p>
                <p className="font-semibold">
                  {money(selectedAdvance.principal_amount, selectedAdvance.cashbook?.currency_code)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Outstanding</p>
                <p className="font-semibold">
                  {money(
                    selectedAdvance.outstanding_amount,
                    selectedAdvance.cashbook?.currency_code
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Cashbook</p>
                <p>{selectedAdvance.cashbook?.name ?? `#${selectedAdvance.cashbook_id}`}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <Status value={selectedAdvance.status} />
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">Repayments</h3>
          </div>
          {repaymentsLoading ? (
            <div className="flex h-28 items-center justify-center">
              <Loading />
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg ring-1 ring-gray-200/70 dark:ring-gray-800">
              <Table>
                <TableHeader>
                  <TableRow>
                    {["Reference", "Date", "Amount", "Status", "Actions"].map((head) => (
                      <TableCell
                        key={head}
                        isHeader
                        className={`px-3 py-2 text-xs font-semibold text-gray-500 ${head === "Amount" ? "text-right" : ""}`}
                      >
                        {head}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(repaymentsResponse?.data ?? []).map((repayment) => (
                    <TableRow
                      key={repayment.id}
                      className="transition-colors hover:bg-gray-50/80 dark:hover:bg-white/[0.03]"
                    >
                      <TableCell className="px-3 py-2 text-sm font-medium">
                        {repayment.reference}
                      </TableCell>
                      <TableCell className="px-3 py-2 text-sm">
                        {formatReadableDate(repayment.business_date)}
                      </TableCell>
                      <TableCell className="px-3 py-2 text-right text-sm tabular-nums">
                        {money(repayment.amount, repayment.cashbook?.currency_code)}
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <Status value={repayment.status} />
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <div className="flex flex-wrap items-center gap-1">
                          <TableActionButton
                            label="View repayment"
                            tone="neutral"
                            icon={<Eye size={13} />}
                            onClick={() => void openRepaymentDetails(repayment)}
                          />
                          {repayment.status === "draft" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditRepayment(repayment)}
                              >
                                Edit
                              </Button>
                              <Button size="sm" onClick={() => void confirmPayment(repayment)}>
                                Confirm
                              </Button>
                              <TableActionButton
                                label="Cancel repayment"
                                tone="red"
                                icon={<RotateCcw size={13} />}
                                onClick={() => {
                                  setReverseTarget({ kind: "cancel", id: repayment.id });
                                  setReverseReason("");
                                }}
                              />
                            </>
                          )}
                          {repayment.status === "confirmed" && (
                            <TableActionButton
                              label="Reverse repayment"
                              tone="red"
                              icon={<RotateCcw size={13} />}
                              onClick={() => {
                                setReverseTarget({ kind: "repayment", id: repayment.id });
                                setReverseReason("");
                              }}
                            />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {!repaymentsResponse?.data.length && (
                <p className="py-6 text-center text-sm text-gray-500">
                  No repayments for this loan.
                </p>
              )}
            </div>
          )}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setSelectedAdvance(null)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={repaymentFormOpen}
        onClose={() => setRepaymentFormOpen(false)}
        className="m-4 max-w-2xl"
      >
        <form onSubmit={saveRepayment} className="space-y-4 p-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {editingRepayment ? "Edit repayment draft" : "Create repayment draft"}
            </h2>
            <p className="text-sm text-gray-500">
              {repaymentAdvance
                ? `For loan ${repaymentAdvance.reference}`
                : "Update the selected draft repayment."}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className={labelClass}>Amount *</span>
              <Input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={repaymentForm.amount}
                onChange={(e) => setRepaymentForm({ ...repaymentForm, amount: e.target.value })}
              />
            </label>
            {!editingRepayment && (
              <>
                <label>
                  <span className={labelClass}>Business date *</span>
                  <DatePicker
                    id="staff-repayment-business-date"
                    defaultDate={repaymentForm.business_date}
                    onChange={(_, date) =>
                      setRepaymentForm((current) => ({ ...current, business_date: date }))
                    }
                  />
                </label>
                <label>
                  <span className={labelClass}>Cashbook *</span>
                  <select
                    required
                    className={inputClass}
                    value={repaymentForm.cashbook_id}
                    onChange={(e) =>
                      setRepaymentForm({ ...repaymentForm, cashbook_id: e.target.value })
                    }
                  >
                    <option value="">Select cashbook</option>
                    {activeCashbooks.map((book) => (
                      <option key={book.id} value={book.id}>
                        {book.name} · {book.currency_code}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className={labelClass}>Cash in category *</span>
                  <select
                    required
                    className={inputClass}
                    value={repaymentForm.category_id}
                    onChange={(e) =>
                      setRepaymentForm({ ...repaymentForm, category_id: e.target.value })
                    }
                  >
                    <option value="">Select category</option>
                    {cashInCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className={labelClass}>External reference</span>
                  <Input
                    value={repaymentForm.external_reference}
                    onChange={(e) =>
                      setRepaymentForm({ ...repaymentForm, external_reference: e.target.value })
                    }
                  />
                </label>
              </>
            )}
            <label className="sm:col-span-2">
              <span className={labelClass}>Description *</span>
              <Input
                required
                value={repaymentForm.description}
                onChange={(e) =>
                  setRepaymentForm({ ...repaymentForm, description: e.target.value })
                }
              />
            </label>
          </div>
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
            <Button type="button" variant="outline" onClick={() => setRepaymentFormOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createRepaymentState.isLoading || updateRepaymentState.isLoading}
            >
              {editingRepayment ? "Save draft" : "Create repayment"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!repaymentDetail}
        onClose={() => setRepaymentDetail(null)}
        className="m-4 max-w-xl"
      >
        <div className="space-y-3 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Repayment {repaymentDetail?.reference}
          </h2>
          {repaymentDetail && (
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <dt className="text-gray-500">Loan</dt>
              <dd>{repaymentDetail.advance_reference ?? repaymentDetail.staff_advance_id}</dd>
              <dt className="text-gray-500">Date</dt>
              <dd>{formatReadableDate(repaymentDetail.business_date)}</dd>
              <dt className="text-gray-500">Amount</dt>
              <dd>{money(repaymentDetail.amount, repaymentDetail.cashbook?.currency_code)}</dd>
              <dt className="text-gray-500">Cashbook</dt>
              <dd>{repaymentDetail.cashbook?.name ?? repaymentDetail.cashbook_id}</dd>
              <dt className="text-gray-500">Category</dt>
              <dd>{repaymentDetail.category?.name ?? repaymentDetail.category_id}</dd>
              <dt className="text-gray-500">Status</dt>
              <dd>
                <Status value={repaymentDetail.status} />
              </dd>
              <dt className="text-gray-500">Description</dt>
              <dd>{repaymentDetail.description}</dd>
              <dt className="text-gray-500">Created/confirmed</dt>
              <dd>{formatReadableDateTime(repaymentDetail.confirmed_at)}</dd>
            </dl>
          )}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setRepaymentDetail(null)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!reverseTarget}
        onClose={() => setReverseTarget(null)}
        className="m-4 max-w-md"
      >
        <form onSubmit={submitReverse} className="space-y-4 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {reverseTarget?.kind === "cancel" ? "Cancel repayment draft" : "Reverse transaction"}
          </h2>
          <label>
            <span className={labelClass}>Reason *</span>
            <Input
              required
              minLength={3}
              value={reverseReason}
              onChange={(e) => setReverseReason(e.target.value)}
              placeholder="Enter a reason"
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setReverseTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" className="!bg-red-700 !text-white hover:!bg-red-800">
              Confirm
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
