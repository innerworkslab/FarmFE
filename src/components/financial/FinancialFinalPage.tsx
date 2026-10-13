"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Download, RefreshCw } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import DatePicker from "@/components/form/date-picker";
import FarmStatusBadge from "@/components/farms/FarmStatusBadge";
import { useGetBranchesQuery } from "@/redux/features/setup/BranchApiSlice";
import { useGetSetupAdminsQuery } from "@/redux/features/setup/AdminSetupApiSlice";
import { useGetPurchaseInvoicesQuery } from "@/redux/features/purchasing/PurchasingFoundationApiSlice";
import { useGetStaffAdvancesQuery } from "@/redux/features/financial/StaffAdvanceApiSlice";
import {
  useGetCashbooksQuery,
  useGetCashLedgerCategoriesQuery,
} from "@/redux/features/financial/CashbookApiSlice";
import {
  Movement,
  Values,
  useGetBranchPolicyQuery,
  useSaveBranchPolicyMutation,
  useGetPostingLimitsQuery,
  useSavePostingLimitMutation,
  useGetFinancialPeriodsQuery,
  useCreateFinancialPeriodMutation,
  useChangeFinancialPeriodMutation,
  useGetInvoicePaymentsQuery,
  useCreateInvoicePaymentMutation,
  useChangeInvoicePaymentMutation,
  useGetPayrollRecoveriesQuery,
  useCreatePayrollRecoveryMutation,
  useChangePayrollRecoveryMutation,
  useGetCashbookTransfersQuery,
  useCreateCashbookTransferMutation,
  useChangeCashbookTransferMutation,
  useGetFinancialReconciliationQuery,
  useGetCashResultQuery,
  useLazyExportCashResultQuery,
  useClassifyCashEntryMutation,
} from "@/redux/features/financial/FinancialFinalApiSlice";
export type FinanceSection =
  | "policy"
  | "periods"
  | "supplier-payments"
  | "payroll-recoveries"
  | "transfers"
  | "reconciliation"
  | "reports";
const sections: { key: FinanceSection; label: string; path: string }[] = [
  { key: "policy", label: "Branch policy", path: "/financial/policy" },
  { key: "periods", label: "Periods", path: "/financial/periods" },
  { key: "supplier-payments", label: "Supplier payments", path: "/financial/supplier-payments" },
  { key: "payroll-recoveries", label: "Payroll recovery", path: "/financial/payroll-recoveries" },
  { key: "transfers", label: "Cashbook transfers", path: "/financial/transfers" },
  { key: "reconciliation", label: "Reconciliation", path: "/financial/reconciliation" },
  { key: "reports", label: "Cash result", path: "/financial/reports" },
];
const input =
  "h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white";
const panel =
  "rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]";
const money = (v: string | number | null | undefined, c = "") =>
  v === null || v === undefined
    ? "—"
    : `${c} ${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`.trim();
const date = (v: string) => v?.slice(0, 10) || "—";
const today = () => new Date().toLocaleDateString("en-CA");
const errorMessage = (e: unknown) => {
  const d = (e as { data?: { message?: string; errors?: Record<string, string[]> } }).data;
  return (d?.errors && Object.values(d.errors).flat()[0]) || d?.message || "Request failed.";
};
type Job = {
  kind:
    | "policy"
    | "limit"
    | "period"
    | "payment"
    | "payroll"
    | "transfer"
    | "period-action"
    | "movement-action"
    | "classify";
  id?: number;
  action?: "close" | "reopen" | "confirm" | "reverse" | "cancel";
  group?: "payment" | "payroll" | "transfer";
  direction?: string;
  excludedOnly?: boolean;
  title: string;
};
type FieldSpec = {
  key: string;
  label: string;
  type?: "date" | "number" | "checkbox" | "textarea";
  options?: { value: string; label: string }[];
  optional?: boolean;
};
export default function FinancialFinalPage({ section = "policy" }: { section?: FinanceSection }) {
  const [branch, setBranch] = useState("");
  const [page, setPage] = useState(1);
  const [invoice, setInvoice] = useState("");
  const [advance, setAdvance] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [job, setJob] = useState<Job | null>(null);
  const [form, setForm] = useState<Values>({});
  const [busy, setBusy] = useState(false);
  const draftRequest = useRef<{ signature: string; key: string } | null>(null);
  const branches = useGetBranchesQuery({ per_page: 100 });
  const users = useGetSetupAdminsQuery(undefined, { skip: section !== "policy" });
  const policy = useGetBranchPolicyQuery(branch, { skip: !branch || section !== "policy" });
  const limits = useGetPostingLimitsQuery(branch, { skip: !branch || section !== "policy" });
  const periods = useGetFinancialPeriodsQuery({ page }, { skip: !branch || section !== "periods" });
  const invoices = useGetPurchaseInvoicesQuery(
    { branch_id: branch, per_page: 100 },
    { skip: !branch || section !== "supplier-payments" }
  );
  const payments = useGetInvoicePaymentsQuery(invoice, {
    skip: !invoice || section !== "supplier-payments",
  });
  const loans = useGetStaffAdvancesQuery(
    { per_page: 100 },
    { skip: section !== "payroll-recoveries" }
  );
  const recoveries = useGetPayrollRecoveriesQuery(advance, {
    skip: !advance || section !== "payroll-recoveries",
  });
  const transfers = useGetCashbookTransfersQuery(
    { page },
    { skip: !branch || section !== "transfers" }
  );
  const reconciliation = useGetFinancialReconciliationQuery(
    { branch_id: branch },
    { skip: !branch || section !== "reconciliation" }
  );
  const result = useGetCashResultQuery(
    { branch_id: branch, from_date: from, to_date: to },
    { skip: !branch || !from || !to || section !== "reports" }
  );
  const cashbookQuery = useGetCashbooksQuery(
    { branch_id: branch, status: "active", per_page: 100 },
    { skip: !branch }
  );
  const categoryQuery = useGetCashLedgerCategoriesQuery({ status: "active", per_page: 100 });
  const books = cashbookQuery.currentData?.data || [];
  const categories = categoryQuery.currentData?.data || [];
  const [savePolicy] = useSaveBranchPolicyMutation();
  const [saveLimit] = useSavePostingLimitMutation();
  const [createPeriod] = useCreateFinancialPeriodMutation();
  const [changePeriod] = useChangeFinancialPeriodMutation();
  const [createPayment] = useCreateInvoicePaymentMutation();
  const [changePayment] = useChangeInvoicePaymentMutation();
  const [createPayroll] = useCreatePayrollRecoveryMutation();
  const [changePayroll] = useChangePayrollRecoveryMutation();
  const [createTransfer] = useCreateCashbookTransferMutation();
  const [changeTransfer] = useChangeCashbookTransferMutation();
  const [classify] = useClassifyCashEntryMutation();
  const [exportReport] = useLazyExportCashResultQuery();
  const open = (next: Job, initial: Values = {}) => {
    draftRequest.current = null;
    setJob(next);
    setForm(initial);
  };
  const execute = async (action: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await action();
      toast.success("Saved successfully.");
      setJob(null);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const options = (direction: string) =>
    categories
      .filter((c) => c.direction === direction)
      .map((c) => ({ value: String(c.id), label: c.name }));
  const bookOptions = books.map((c) => ({
    value: String(c.id),
    label: `${c.name} · ${c.currency_code}`,
  }));
  const paymentCurrency = payments.currentData?.data.currency_code;
  const transferSource = books.find((c) => String(c.id) === String(form.source_cashbook_id));
  const fields: FieldSpec[] =
    job?.kind === "policy"
      ? [
          { key: "default_currency", label: "Default currency (3-letter code)" },
          { key: "enabled_currencies", label: "Enabled currency codes (comma separated)" },
          { key: "timezone", label: "Timezone" },
          {
            key: "require_open_period",
            label: "Require an open period",
            options: [
              { value: "true", label: "Yes" },
              { value: "false", label: "No" },
            ],
          },
          {
            key: "require_approval_limit",
            label: "Require a posting approval limit",
            options: [
              { value: "true", label: "Yes" },
              { value: "false", label: "No" },
            ],
          },
        ]
      : job?.kind === "limit"
        ? [
            {
              key: "user_id",
              label: "Approver",
              options: (users.currentData?.data || [])
                .filter(
                  (u) =>
                    u.account_status === "active" &&
                    (u.branch_ids || u.branches?.map((b) => b.id) || []).includes(Number(branch))
                )
                .map((u) => ({ value: String(u.id), label: u.name })),
            },
            {
              key: "currency_code",
              label: "Currency",
              options: (policy.currentData?.data?.enabled_currencies || []).map((c) => ({
                value: c,
                label: c,
              })),
            },
            { key: "maximum_amount", label: "Maximum posting amount", type: "number" },
            {
              key: "allow_self_approval",
              label: "Allow creator self-confirmation",
              options: [
                { value: "true", label: "Yes" },
                { value: "false", label: "No" },
              ],
            },
          ]
        : job?.kind === "period"
          ? [
              { key: "name", label: "Period name" },
              { key: "from_date", label: "From date", type: "date" },
              { key: "to_date", label: "To date", type: "date" },
            ]
          : job?.kind === "payment"
            ? [
                {
                  key: "cashbook_id",
                  label: "Payment cashbook",
                  options: books
                    .filter((b) => b.currency_code === paymentCurrency)
                    .map((b) => ({ value: String(b.id), label: `${b.name} · ${b.currency_code}` })),
                },
                { key: "category_id", label: "Cash-out category", options: options("out") },
                {
                  key: "amount",
                  label: `Payment amount (${paymentCurrency || ""})`,
                  type: "number",
                },
                { key: "business_date", label: "Payment date", type: "date" },
                { key: "description", label: "Description" },
              ]
            : job?.kind === "payroll"
              ? [
                  { key: "amount", label: "Recovery amount", type: "number" },
                  { key: "business_date", label: "Payroll deduction date", type: "date" },
                  { key: "payroll_reference", label: "Payroll reference" },
                  { key: "evidence_reference", label: "Approved payslip / evidence reference" },
                  { key: "description", label: "Description" },
                ]
              : job?.kind === "transfer"
                ? [
                    { key: "source_cashbook_id", label: "Source cashbook", options: bookOptions },
                    {
                      key: "destination_cashbook_id",
                      label: "Destination cashbook",
                      options: books
                        .filter(
                          (b) =>
                            String(b.id) !== String(form.source_cashbook_id) &&
                            (!transferSource || b.currency_code === transferSource.currency_code)
                        )
                        .map((b) => ({
                          value: String(b.id),
                          label: `${b.name} · ${b.currency_code}`,
                        })),
                    },
                    { key: "out_category_id", label: "Cash-out category", options: options("out") },
                    { key: "in_category_id", label: "Cash-in category", options: options("in") },
                    { key: "amount", label: "Transfer amount", type: "number" },
                    { key: "business_date", label: "Transfer date", type: "date" },
                    { key: "description", label: "Description" },
                  ]
                : job?.kind === "classify"
                  ? [
                      {
                        key: "report_treatment",
                        label: "Report treatment",
                        options: [
                          { value: "income", label: "Income" },
                          { value: "expense", label: "Expense" },
                          { value: "excluded", label: "Excluded" },
                        ].filter(
                          (option) =>
                            option.value === "excluded" ||
                            (!job.excludedOnly &&
                              (job.direction === "in"
                                ? option.value === "income"
                                : option.value === "expense"))
                        ),
                      },
                      { key: "reason", label: "Finance verification reason", type: "textarea" },
                    ]
                  : job?.group === "payroll" && job.action === "confirm"
                    ? [
                        {
                          key: "verification_note",
                          label: "Verification against approved payroll evidence",
                          type: "textarea",
                        },
                      ]
                    : job?.action === "reverse" || job?.kind === "period-action"
                      ? [{ key: "reason", label: "Reason", type: "textarea" }]
                      : [];
  const submit = () => {
    if (!job || busy) return;
    if (
      fields.some((f) => f.type !== "checkbox" && !f.optional && !String(form[f.key] ?? "").trim())
    )
      return toast.error("Complete all required fields.");
    const body = Object.fromEntries(
      fields.map((f) => [f.key, form[f.key] ?? (f.type === "checkbox" ? false : "")])
    ) as Values;
    if ("business_date" in body) {
      const signature = JSON.stringify({ branch, invoice, advance, kind: job.kind, body });
      if (draftRequest.current?.signature !== signature) {
        draftRequest.current = { signature, key: crypto.randomUUID() };
      }
      body.idempotency_key = draftRequest.current.key;
    }
    void execute(async () => {
      if (job.kind === "policy")
        await savePolicy({
          branchId: branch,
          body: {
            default_currency: String(form.default_currency).trim().toUpperCase(),
            enabled_currencies: String(form.enabled_currencies)
              .split(",")
              .map((c) => c.trim().toUpperCase())
              .filter(Boolean),
            timezone: String(form.timezone).trim(),
            require_open_period: form.require_open_period === "true",
            require_approval_limit: form.require_approval_limit === "true",
          },
        }).unwrap();
      else if (job.kind === "limit")
        await saveLimit({
          branchId: branch,
          body: {
            user_id: Number(form.user_id),
            currency_code: String(form.currency_code),
            maximum_amount: String(form.maximum_amount),
            allow_self_approval: form.allow_self_approval === "true",
          },
        }).unwrap();
      else if (job.kind === "period")
        await createPeriod({
          branch_id: Number(branch),
          name: String(form.name),
          from_date: String(form.from_date),
          to_date: String(form.to_date),
        }).unwrap();
      else if (job.kind === "period-action")
        await changePeriod({
          id: job.id!,
          action: job.action as "close" | "reopen",
          reason: String(form.reason),
        }).unwrap();
      else if (job.kind === "payment")
        await createPayment({
          invoiceId: invoice,
          body: { ...body, invoice_currency_code: paymentCurrency },
        }).unwrap();
      else if (job.kind === "payroll") await createPayroll({ advanceId: advance, body }).unwrap();
      else if (job.kind === "transfer") await createTransfer(body).unwrap();
      else if (job.kind === "classify")
        await classify({
          id: job.id!,
          report_treatment: String(form.report_treatment),
          reason: String(form.reason),
        }).unwrap();
      else {
        const args = {
          id: job.id!,
          action: job.action as "confirm" | "reverse" | "cancel",
          reason: form.reason ? String(form.reason) : undefined,
          verification_note: form.verification_note ? String(form.verification_note) : undefined,
        };
        if (job.group === "payment") await changePayment(args).unwrap();
        else if (job.group === "payroll") await changePayroll(args).unwrap();
        else await changeTransfer(args).unwrap();
      }
    });
  };
  const movementActions = (row: Movement, group: "payment" | "payroll" | "transfer") => (
    <div className="flex justify-end gap-2">
      {row.state === "draft" && (
        <>
          <Button
            size="sm"
            disabled={busy}
            onClick={() =>
              open({
                kind: "movement-action",
                group,
                id: row.id,
                action: "confirm",
                title: `Confirm ${row.reference}`,
              })
            }
          >
            Confirm
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() =>
              open({
                kind: "movement-action",
                group,
                id: row.id,
                action: "cancel",
                title: `Cancel ${row.reference}`,
              })
            }
          >
            Cancel draft
          </Button>
        </>
      )}
      {row.state === "confirmed" && (
        <Button
          size="sm"
          variant="danger"
          disabled={busy}
          onClick={() =>
            open({
              kind: "movement-action",
              group,
              id: row.id,
              action: "reverse",
              title: `Reverse ${row.reference}`,
            })
          }
        >
          Reverse
        </Button>
      )}
    </div>
  );
  const movementTable = (rows: Movement[], group: "payment" | "payroll" | "transfer") => (
    <Grid
      headings={["Reference", "Date", "Amount", "Details", "Status", "Actions"]}
      rows={rows.map((r) => [
        r.reference,
        date(r.business_date),
        money(r.amount, r.currency_code),
        group === "payroll" ? (
          <div>
            <p>{r.payroll_reference}</p>
            <p className="text-xs text-gray-500">Evidence: {r.evidence_reference}</p>
            {r.verification_note && <p className="text-xs">Verified: {r.verification_note}</p>}
          </div>
        ) : group === "transfer" ? (
          <div>
            {books.find((b) => b.id === Number(r.source_cashbook_id))?.name ||
              `#${r.source_cashbook_id}`}{" "}
            →{" "}
            {books.find((b) => b.id === Number(r.destination_cashbook_id))?.name ||
              `#${r.destination_cashbook_id}`}
            <p className="text-xs text-gray-500">{r.description}</p>
          </div>
        ) : (
          r.description || "—"
        ),
        <FarmStatusBadge key="status" status={r.state} />,
        movementActions(r, group),
      ])}
    />
  );
  const exportCsv = async () => {
    setBusy(true);
    try {
      const csv = await exportReport({ branch_id: branch, from_date: from, to_date: to }).unwrap();
      const u = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = u;
      a.download = `cash-result-${from}-${to}.csv`;
      a.click();
      URL.revokeObjectURL(u);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const mainQuery =
    section === "policy"
      ? policy
      : section === "periods"
        ? periods
        : section === "supplier-payments"
          ? payments
          : section === "payroll-recoveries"
            ? recoveries
            : section === "transfers"
              ? transfers
              : section === "reconciliation"
                ? reconciliation
                : result;
  return (
    <main className="mx-auto max-w-7xl space-y-6 text-gray-800 dark:text-gray-100">
      <div>
        <h1 className="text-2xl font-bold">{sections.find((s) => s.key === section)?.label}</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage branch finance, approvals and verified cash activity.
        </p>
      </div>
      <nav className="flex flex-wrap gap-2">
        {sections.map((s) => (
          <Link
            key={s.key}
            href={s.path}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${s.key === section ? "bg-green-700 text-white" : "border border-gray-200 dark:border-gray-700"}`}
          >
            {s.label}
          </Link>
        ))}
      </nav>
      <section className={`${panel} grid gap-4 sm:grid-cols-3`}>
        <Field label="Branch">
          <select
            className={input}
            value={branch}
            onChange={(e) => {
              setBranch(e.target.value);
              setPage(1);
              setInvoice("");
              setAdvance("");
            }}
          >
            <option value="">Select branch</option>
            {(branches.currentData?.data || []).map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </Field>
        {section === "supplier-payments" && (
          <Field label="Purchase invoice">
            <select
              className={input}
              disabled={!branch}
              value={invoice}
              onChange={(e) => setInvoice(e.target.value)}
            >
              <option value="">Select invoice</option>
              {(invoices.currentData?.data || []).map((i) => (
                <option key={i.id} value={i.id}>
                  {i.invoice_number} · {i.status}
                </option>
              ))}
            </select>
          </Field>
        )}
        {section === "payroll-recoveries" && (
          <Field label="Staff loan">
            <select
              className={input}
              disabled={!branch}
              value={advance}
              onChange={(e) => setAdvance(e.target.value)}
            >
              <option value="">Select loan</option>
              {(loans.currentData?.data || [])
                .filter((l) => Number(l.staff?.branch_id) === Number(branch))
                .map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.staff?.name} · {l.reference} · {l.status}
                  </option>
                ))}
            </select>
          </Field>
        )}
        {section === "reports" && (
          <>
            <DatePicker
              id="cash-result-from"
              label="From date"
              defaultDate={from || undefined}
              onChange={(_, v) => setFrom(v)}
            />
            <DatePicker
              id="cash-result-to"
              label="To date"
              defaultDate={to || undefined}
              onChange={(_, v) => setTo(v)}
            />
          </>
        )}
      </section>
      {!branch && (
        <p className="text-sm text-gray-500">Select a branch to view and manage its finances.</p>
      )}
      {branch && mainQuery.isError && (
        <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/30">
          Unable to load this section. Check access permissions and try again.
        </p>
      )}
      {branch && mainQuery.isFetching && <p className="text-sm text-gray-500">Loading…</p>}
      {branch && section === "policy" && (
        <>
          <section className={panel}>
            <div className="mb-4 flex justify-between gap-4">
              <h2 className="font-semibold">Branch financial policy</h2>
              <Button
                disabled={busy}
                onClick={() => {
                  const p = policy.currentData?.data;
                  open(
                    { kind: "policy", title: "Configure branch financial policy" },
                    {
                      default_currency: p?.default_currency || "",
                      enabled_currencies: p?.enabled_currencies?.join(", ") || "",
                      timezone: p?.timezone || "",
                      require_open_period: p ? String(p.require_open_period) : "",
                      require_approval_limit: p ? String(p.require_approval_limit) : "",
                    }
                  );
                }}
              >
                Configure policy
              </Button>
            </div>
            {policy.currentData?.data ? (
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <p>
                  Default currency: <b>{policy.currentData.data.default_currency}</b>
                </p>
                <p>
                  Enabled currencies: <b>{policy.currentData.data.enabled_currencies.join(", ")}</b>
                </p>
                <p>
                  Timezone: <b>{policy.currentData.data.timezone}</b>
                </p>
                <p>
                  Open period required:{" "}
                  <b>{policy.currentData.data.require_open_period ? "Yes" : "No"}</b>
                </p>
                <p>
                  Approval limit required:{" "}
                  <b>{policy.currentData.data.require_approval_limit ? "Yes" : "No"}</b>
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No policy configured. Enter the financial policy approved for this branch.
              </p>
            )}
          </section>
          <section className={panel}>
            <div className="mb-4 flex justify-between">
              <h2 className="font-semibold">Posting limits</h2>
              <Button
                disabled={!policy.currentData?.data || busy}
                onClick={() => open({ kind: "limit", title: "Set approved posting limit" })}
              >
                <Plus size={15} />
                Set limit
              </Button>
            </div>
            {limits.isError && <p className="text-red-600">Unable to load posting limits.</p>}
            <Grid
              headings={["Approver", "Currency", "Maximum amount", "Creator can confirm"]}
              rows={(limits.currentData?.data || []).map((l) => [
                users.currentData?.data.find((u) => u.id === Number(l.user_id))?.name ||
                  `User #${l.user_id}`,
                l.currency_code,
                money(l.maximum_amount, l.currency_code),
                l.allow_self_approval ? "Yes" : "No",
              ])}
            />
          </section>
        </>
      )}
      {branch && section === "periods" && (
        <section className={panel}>
          <div className="mb-4 flex justify-between">
            <h2 className="font-semibold">Financial periods</h2>
            <Button onClick={() => open({ kind: "period", title: "New financial period" })}>
              <Plus size={15} />
              New period
            </Button>
          </div>
          <Grid
            headings={["Period", "From", "To", "Status", "Actions"]}
            rows={(periods.currentData?.data || [])
              .filter((p) => Number(p.branch_id) === Number(branch))
              .map((p) => [
                p.name,
                date(p.from_date),
                date(p.to_date),
                <FarmStatusBadge key="state" status={p.state} />,
                <Button
                  key="action"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    open({
                      kind: "period-action",
                      id: p.id,
                      action: p.state === "open" ? "close" : "reopen",
                      title: `${p.state === "open" ? "Close" : "Reopen"} ${p.name}`,
                    })
                  }
                >
                  {p.state === "open" ? "Close period" : "Reopen period"}
                </Button>,
              ])}
          />
        </section>
      )}
      {invoice && section === "supplier-payments" && (
        <section className={panel}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Supplier invoice payments</h2>
              <p className="text-sm text-gray-500">
                Total {money(payments.currentData?.data.total_amount, paymentCurrency)} · Paid{" "}
                {money(payments.currentData?.data.paid_amount, paymentCurrency)} · Outstanding{" "}
                {money(payments.currentData?.data.outstanding_amount, paymentCurrency)}
              </p>
            </div>
            <Button
              disabled={!payments.currentData}
              onClick={() =>
                open(
                  { kind: "payment", title: "New supplier payment draft" },
                  { business_date: today() }
                )
              }
            >
              <Plus size={15} />
              New payment
            </Button>
          </div>
          {movementTable(payments.currentData?.data.payments || [], "payment")}
        </section>
      )}
      {advance && section === "payroll-recoveries" && (
        <section className={panel}>
          <div className="mb-4 flex justify-between gap-3">
            <div>
              <h2 className="font-semibold">Payroll recoveries</h2>
              <p className="text-sm text-gray-500">
                Salary deductions reduce the staff loan without moving cash. Verify approved payroll
                evidence before confirmation.
              </p>
            </div>
            <Button
              onClick={() =>
                open(
                  { kind: "payroll", title: "New payroll recovery draft" },
                  { business_date: today() }
                )
              }
            >
              <Plus size={15} />
              New recovery
            </Button>
          </div>
          {movementTable(recoveries.currentData?.data || [], "payroll")}
        </section>
      )}
      {branch && section === "transfers" && (
        <section className={panel}>
          <div className="mb-4 flex justify-between">
            <h2 className="font-semibold">Internal cashbook transfers</h2>
            <Button
              onClick={() =>
                open(
                  { kind: "transfer", title: "New cashbook transfer draft" },
                  { business_date: today() }
                )
              }
            >
              <Plus size={15} />
              New transfer
            </Button>
          </div>
          {movementTable(
            (transfers.currentData?.data || []).filter(
              (t) => Number(t.branch_id) === Number(branch)
            ),
            "transfer"
          )}
        </section>
      )}
      {branch && section === "reconciliation" && reconciliation.currentData && (
        <section className={panel}>
          <div className="mb-4 flex justify-between">
            <div>
              <h2 className="font-semibold">Integrity checks</h2>
              <p
                className={
                  reconciliation.currentData.data.passed ? "text-green-700" : "text-red-600"
                }
              >
                {reconciliation.currentData.data.passed ? "All checks passed" : "Issues found"} ·{" "}
                {reconciliation.currentData.data.checks.length} checks
              </p>
            </div>
            <Button
              variant="outline"
              disabled={reconciliation.isFetching}
              onClick={() => void reconciliation.refetch()}
            >
              <RefreshCw size={15} />
              Refresh
            </Button>
          </div>
          <Grid
            headings={["Check", "Record", "Currency", "Expected", "Actual", "Difference", "Result"]}
            rows={reconciliation.currentData.data.checks.map((c) => [
              c.check.replaceAll("_", " "),
              `${c.record_type} #${c.record_id}`,
              c.currency_code || "—",
              c.expected,
              c.actual,
              c.delta,
              c.passed ? "Passed" : "Issue",
            ])}
          />
        </section>
      )}
      {branch && section === "reports" && (
        <>
          {(!from || !to) && (
            <p className="text-sm text-gray-500">
              Choose a date range to view the classified cash result.
            </p>
          )}
          {result.currentData && (
            <>
              <section className={panel}>
                <div className="flex justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">Classified cash result</h2>
                    <p className="text-sm text-gray-500">
                      {result.currentData.data.is_complete
                        ? "Classification complete"
                        : "Incomplete: entries still require classification"}{" "}
                      · Reconciliation{" "}
                      {result.currentData.data.reconciliation_passed ? "passed" : "has issues"}
                    </p>
                  </div>
                  <Button variant="outline" disabled={busy} onClick={() => void exportCsv()}>
                    <Download size={15} />
                    Export CSV
                  </Button>
                </div>
              </section>
              {result.currentData.data.currencies.map((c) => (
                <section key={c.currency_code} className={panel}>
                  <h2 className="mb-4 font-semibold">{c.currency_code}</h2>
                  <div className="mb-5 grid gap-3 sm:grid-cols-4">
                    {[
                      ["Income", c.income],
                      ["Expense", c.expense],
                      ["Unclassified receipts", c.unclassified_in],
                      ["Unclassified payments", c.unclassified_out],
                      ["Excluded receipts", c.excluded_in],
                      ["Excluded payments", c.excluded_out],
                      ["Net cash result", c.net_cash_result],
                    ].map(([k, v]) => (
                      <div key={k} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                        <p className="text-xs text-gray-500">{k}</p>
                        <p className="mt-1 font-semibold">{money(v, c.currency_code)}</p>
                      </div>
                    ))}
                  </div>
                  <Grid
                    headings={["Category", "Treatment", "Entries", "Amount"]}
                    rows={c.lines.map((l) => [
                      l.category_name,
                      l.report_treatment,
                      l.entry_count,
                      money(l.amount, c.currency_code),
                    ])}
                  />
                  <h3 className="mb-3 mt-5 font-semibold">Original entries and reversals</h3>
                  <Grid
                    headings={[
                      "Date",
                      "Reference",
                      "Source",
                      "Treatment",
                      "Amount",
                      "Report effect",
                      "Actions",
                    ]}
                    rows={(c.entries || []).map((e) => [
                      date(e.business_date),
                      e.reference,
                      e.source_type,
                      e.report_treatment,
                      money(e.amount, c.currency_code),
                      money(e.report_effect, c.currency_code),
                      e.reversal_of_entry_id === null &&
                      e.source_type !== "opening_balance" &&
                      e.report_treatment === "unclassified" ? (
                        <Button
                          key="classify"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            open(
                              {
                                kind: "classify",
                                id: e.id,
                                title: `Classify ${e.reference}`,
                                direction: e.direction,
                                excludedOnly: [
                                  "staff_advance_disbursement",
                                  "staff_advance_repayment",
                                  "cashbook_transfer",
                                ].includes(e.source_type),
                              },
                              {
                                report_treatment: ["income", "expense", "excluded"].includes(
                                  e.report_treatment
                                )
                                  ? e.report_treatment
                                  : "",
                              }
                            )
                          }
                        >
                          Classify
                        </Button>
                      ) : e.reversal_of_entry_id === null ? (
                        "Classified"
                      ) : (
                        "Reversal"
                      ),
                    ])}
                  />
                </section>
              ))}
            </>
          )}
        </>
      )}
      {branch && (section === "periods" || section === "transfers") && (
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            disabled={page <= 1 || mainQuery.isFetching}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="py-3 text-sm">
            Page {page} of{" "}
            {(section === "periods"
              ? periods.currentData?.meta?.last_page
              : transfers.currentData?.meta?.last_page) || 1}
          </span>
          <Button
            variant="outline"
            disabled={
              page >=
                ((section === "periods"
                  ? periods.currentData?.meta?.last_page
                  : transfers.currentData?.meta?.last_page) || 1) || mainQuery.isFetching
            }
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
      <Modal
        isOpen={!!job}
        onClose={() => {
          if (!busy) setJob(null);
        }}
        className="m-4 max-w-2xl"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="space-y-5 p-6 sm:p-8"
        >
          <h2 className="pr-12 text-lg font-bold">{job?.title}</h2>
          {job?.kind === "movement-action" && (
            <p className="text-sm text-gray-500">
              {job.action === "confirm"
                ? "Confirm this draft after reviewing its details."
                : job.action === "cancel"
                  ? "Cancel this unposted draft."
                  : "Reverse the confirmed movement using its audit reason."}
            </p>
          )}
          <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-2">
            {fields.map((f) =>
              f.type === "date" ? (
                <DatePicker
                  key={f.key}
                  id={`financial-${f.key}`}
                  label={f.label}
                  static={false}
                  defaultDate={String(form[f.key] || "") || undefined}
                  onChange={(_, v) => setForm((old) => ({ ...old, [f.key]: v }))}
                />
              ) : f.type === "checkbox" ? (
                <label key={f.key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!form[f.key]}
                    onChange={(e) => setForm((old) => ({ ...old, [f.key]: e.target.checked }))}
                  />
                  {f.label}
                </label>
              ) : (
                <Field key={f.key} label={f.label}>
                  {f.options ? (
                    <select
                      required
                      className={input}
                      value={String(form[f.key] || "")}
                      onChange={(e) =>
                        setForm((old) => ({
                          ...old,
                          [f.key]: e.target.value,
                          ...(f.key === "source_cashbook_id"
                            ? { destination_cashbook_id: "" }
                            : {}),
                        }))
                      }
                    >
                      <option value="">Select {f.label.toLowerCase()}</option>
                      {f.options.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : f.type === "textarea" ? (
                    <textarea
                      required
                      minLength={3}
                      className={`${input} h-28 py-3`}
                      value={String(form[f.key] || "")}
                      onChange={(e) => setForm((old) => ({ ...old, [f.key]: e.target.value }))}
                    />
                  ) : (
                    <input
                      required
                      type={f.type === "number" ? "number" : "text"}
                      min={f.type === "number" ? "0" : ""}
                      step="0.01"
                      className={input}
                      value={String(form[f.key] ?? "")}
                      onChange={(e) => setForm((old) => ({ ...old, [f.key]: e.target.value }))}
                    />
                  )}
                </Field>
              )
            )}
          </div>
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
            <Button type="button" variant="outline" disabled={busy} onClick={() => setJob(null)}>
              Back
            </Button>
            <Button
              type="submit"
              variant={job?.action === "reverse" || job?.action === "cancel" ? "danger" : "primary"}
              disabled={busy}
            >
              {busy
                ? "Saving…"
                : job?.action
                  ? job.action.charAt(0).toUpperCase() + job.action.slice(1)
                  : "Save"}
            </Button>
          </div>
        </form>
      </Modal>
    </main>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
function Grid({ headings, rows }: { headings: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-xs text-gray-500 dark:bg-gray-900">
          <tr>
            {headings.map((h) => (
              <th key={h} className="whitespace-nowrap px-3 py-3 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
              {r.map((c, j) => (
                <td key={j} className="px-3 py-3">
                  {c}
                </td>
              ))}
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td className="p-8 text-center text-gray-500" colSpan={headings.length}>
                No records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
