"use client";

import React, { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDownLeft, ArrowUpRight, BookOpen, Eye, Plus, RotateCcw, Wallet } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/button/Button";
import DatePicker from "@/components/form/date-picker";
import { Modal } from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import TableActionButton from "@/components/ui/table/TableActionButton";
import Loading from "@/components/common/Loading";
import { formatReadableDate, formatReadableDateTime } from "@/lib/dateFormat";
import { useGetBranchesQuery } from "@/redux/features/setup/BranchApiSlice";
import {
  Cashbook,
  CashbookTransaction,
  useConfirmCashbookTransactionMutation,
  useCreateCashbookMutation,
  useCreateCashbookTransactionMutation,
  useDeactivateCashbookMutation,
  useGetCashbookDailySummaryQuery,
  useGetCashbookLedgerQuery,
  useGetCashbookTransactionsQuery,
  useGetCashbooksQuery,
  useGetConsolidatedCashbookBalancesQuery,
  useLazyGetCashbookQuery,
  useLazyGetCashbookTransactionQuery,
  useReverseCashbookTransactionMutation,
  useUpdateCashbookMutation,
  useUpdateCashbookTransactionMutation,
} from "@/redux/features/financial/CashbookApiSlice";

type Tab = "cashbooks" | "transactions" | "ledger" | "reports";
type FormKind = "cashbook" | "transaction" | "reverse" | null;
type CashbookForm = {
  branch_id: string;
  type: string;
  name: string;
  currency_code: string;
  opening_balance: string;
  effective_date: string;
  bank_reference: string;
};
type TransactionForm = {
  idempotency_key: string;
  cashbook_id: string;
  business_date: string;
  direction: string;
  amount: string;
  description: string;
  external_reference: string;
};

const today = () => new Date().toISOString().slice(0, 10);
const emptyCashbook = (): CashbookForm => ({
  branch_id: "",
  type: "cash",
  name: "",
  currency_code: "MMK",
  opening_balance: "0.00",
  effective_date: today(),
  bank_reference: "",
});
const emptyTransaction = (cashbookId = ""): TransactionForm => ({
  idempotency_key: createIdempotencyKey(),
  cashbook_id: cashbookId,
  business_date: today(),
  direction: "in",
  amount: "",
  description: "",
  external_reference: "",
});
function createIdempotencyKey() {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `cashbook-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
const money = (value?: string | number | null, currency = "") =>
  `${currency ? `${currency} ` : ""}${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const inputClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white";
const labelClass = "mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300";

export default function FinancialCashbookPage({ section = "cashbooks" }: { section?: Tab }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = section;
  const [selectedCashbook, setSelectedCashbook] = useState(searchParams.get("cashbook_id") || "");
  const [cashbookFilter, setCashbookFilter] = useState("");
  const [asOfDate, setAsOfDate] = useState(today());
  const [fromDate, setFromDate] = useState(today());
  const [toDate, setToDate] = useState(today());
  const [formKind, setFormKind] = useState<FormKind>(null);
  const [editingCashbook, setEditingCashbook] = useState<Cashbook | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<CashbookTransaction | null>(null);
  const [detail, setDetail] = useState<unknown>(null);
  const [reason, setReason] = useState("");
  const [cashbookForm, setCashbookForm] = useState<CashbookForm>(emptyCashbook);
  const [transactionForm, setTransactionForm] = useState<TransactionForm>(emptyTransaction);

  const { data: branchesResponse } = useGetBranchesQuery({ per_page: 100 });
  const { data: cashbooksResponse, isLoading: cashbooksLoading } = useGetCashbooksQuery({
    per_page: 100,
  });
  const cashbooks = cashbooksResponse?.data ?? [];
  const branches = branchesResponse?.data ?? [];
  const activeCashbooks = useMemo(
    () => cashbooks.filter((item) => item.status === "active"),
    [cashbooks]
  );
  const effectiveCashbookId = selectedCashbook || String(activeCashbooks[0]?.id || "");
  const { data: transactionsResponse, isLoading: transactionsLoading } =
    useGetCashbookTransactionsQuery(
      {
        cashbook_id: cashbookFilter || undefined,
        per_page: 50,
      },
      { skip: tab !== "transactions" }
    );
  const { data: ledgerResponse, isLoading: ledgerLoading } = useGetCashbookLedgerQuery(
    {
      id: effectiveCashbookId || "0",
      per_page: 50,
      from_date: fromDate || undefined,
      to_date: toDate || undefined,
    },
    { skip: tab !== "ledger" || !effectiveCashbookId }
  );
  const { data: summaryResponse, isLoading: summaryLoading } = useGetCashbookDailySummaryQuery(
    {
      id: effectiveCashbookId || "0",
      from_date: fromDate,
      to_date: toDate,
    },
    { skip: tab !== "reports" || !effectiveCashbookId }
  );
  const { data: consolidatedResponse, isLoading: consolidatedLoading } =
    useGetConsolidatedCashbookBalancesQuery({ as_of_date: asOfDate }, { skip: tab !== "reports" });

  const [createCashbook, createCashbookState] = useCreateCashbookMutation();
  const [updateCashbook, updateCashbookState] = useUpdateCashbookMutation();
  const [deactivateCashbook] = useDeactivateCashbookMutation();
  const [createTransaction, createTransactionState] = useCreateCashbookTransactionMutation();
  const [updateTransaction, updateTransactionState] = useUpdateCashbookTransactionMutation();
  const [confirmTransaction] = useConfirmCashbookTransactionMutation();
  const [reverseTransaction] = useReverseCashbookTransactionMutation();
  const [fetchCashbook] = useLazyGetCashbookQuery();
  const [fetchTransaction] = useLazyGetCashbookTransactionQuery();

  const closeForm = () => {
    setFormKind(null);
    setEditingCashbook(null);
    setEditingTransaction(null);
  };
  const notifyError = (error: unknown) =>
    toast.error(
      (error as { data?: { message?: string } })?.data?.message ||
        "The request could not be completed."
    );
  const openCashbook = (item?: Cashbook) => {
    setEditingCashbook(item || null);
    setCashbookForm(
      item
        ? {
            branch_id: String(item.branch_id),
            type: item.type,
            name: item.name,
            currency_code: item.currency_code,
            opening_balance: String(item.opening_balance),
            effective_date: item.effective_date,
            bank_reference: item.bank_reference || "",
          }
        : emptyCashbook()
    );
    setFormKind("cashbook");
  };
  const openTransaction = (item?: CashbookTransaction) => {
    setEditingTransaction(item || null);
    setTransactionForm(
      item
        ? {
            idempotency_key: "",
            cashbook_id: String(item.cashbook_id),
            business_date: item.business_date,
            direction: item.direction,
            amount: String(item.amount),
            description: item.description || "",
            external_reference: item.external_reference || "",
          }
        : emptyTransaction(effectiveCashbookId)
    );
    setFormKind("transaction");
  };
  const saveForm = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (formKind === "cashbook") {
        if (!cashbookForm.branch_id || !cashbookForm.name.trim())
          return toast.error("Choose a branch and enter a cashbook name.");
        const body = {
          branch_id: Number(cashbookForm.branch_id),
          type: cashbookForm.type,
          name: cashbookForm.name.trim(),
          currency_code: cashbookForm.currency_code.trim().toUpperCase(),
          opening_balance: cashbookForm.opening_balance,
          effective_date: cashbookForm.effective_date,
          ...(cashbookForm.bank_reference ? { bank_reference: cashbookForm.bank_reference } : {}),
        };
        if (editingCashbook)
          await updateCashbook({
            id: editingCashbook.id,
            body: { name: body.name, bank_reference: body.bank_reference },
          }).unwrap();
        else await createCashbook(body).unwrap();
        toast.success(editingCashbook ? "Cashbook updated." : "Cashbook created.");
      } else if (formKind === "transaction") {
        if (
          !transactionForm.cashbook_id ||
          !transactionForm.amount ||
          !transactionForm.description.trim()
        )
          return toast.error("Complete the required transaction fields.");
        const body = {
          idempotency_key: transactionForm.idempotency_key,
          cashbook_id: Number(transactionForm.cashbook_id),
          business_date: transactionForm.business_date,
          direction: transactionForm.direction as "in" | "out",
          amount: transactionForm.amount,
          description: transactionForm.description.trim(),
          ...(transactionForm.external_reference
            ? { external_reference: transactionForm.external_reference }
            : {}),
        };
        if (editingTransaction)
          await updateTransaction({
            id: editingTransaction.id,
            body: {
              business_date: body.business_date,
              direction: body.direction,
              amount: body.amount,
              description: body.description,
              external_reference: body.external_reference,
            },
          }).unwrap();
        else await createTransaction(body).unwrap();
        toast.success(editingTransaction ? "Draft updated." : "Transaction draft created.");
      }
      closeForm();
    } catch (error) {
      notifyError(error);
    }
  };
  const runAction = async (action: () => Promise<unknown>, success: string) => {
    try {
      await action();
      toast.success(success);
    } catch (error) {
      notifyError(error);
    }
  };
  const currentBranch = (item: Cashbook) =>
    item.branch?.name ||
    branches.find((branch) => branch.id === item.branch_id)?.name ||
    `Branch #${item.branch_id}`;
  const pageTitle: Record<Tab, string> = {
    cashbooks: "Cashbooks",
    transactions: "Cashbook Transactions",
    ledger: "Cashbook Ledger",
    reports: "Cashbook Reports",
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
            <Wallet size={17} className="text-emerald-600" /> Financial management
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{pageTitle[tab]}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage cash and bank balances, transactions, and daily activity.
          </p>
        </div>
        {tab === "cashbooks" && (
          <Button startIcon={<Plus size={16} />} onClick={() => openCashbook()}>
            New cashbook
          </Button>
        )}
        {tab === "transactions" && (
          <Button startIcon={<Plus size={16} />} onClick={() => openTransaction()}>
            New transaction
          </Button>
        )}
      </header>

      {tab === "cashbooks" && (
        <DataPanel
          loading={cashbooksLoading}
          hasData={cashbooks.length > 0}
          empty="No cashbooks found."
        >
          <Table>
            <TableHeader>
              <TableRow>
                {[
                  "Cashbook",
                  "Branch",
                  "Type",
                  "Currency",
                  "Current balance",
                  "Status",
                  "Actions",
                ].map((head) => (
                  <TableCell
                    key={head}
                    isHeader
                    className="px-4 py-3 text-xs font-semibold text-gray-500"
                  >
                    {head}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {cashbooks.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                    {item.name}
                    <div className="mt-0.5 text-xs font-normal text-gray-500">
                      {item.bank_reference || `#${item.id}`}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {currentBranch(item)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm capitalize text-gray-600 dark:text-gray-300">
                    {item.type}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {item.currency_code}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                    {money(item.current_balance ?? item.opening_balance, item.currency_code)}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <StatusBadge status={item.status} />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <TableActionButton
                        label="View"
                        tone="neutral"
                        icon={<Eye size={14} />}
                        onClick={() =>
                          void fetchCashbook(item.id).unwrap().then(setDetail).catch(notifyError)
                        }
                      />
                      {item.status === "active" && (
                        <>
                          <TableActionButton
                            label="Edit"
                            tone="neutral"
                            icon={<BookOpen size={14} />}
                            onClick={() => openCashbook(item)}
                          />
                          <TableActionButton
                            label="Deactivate"
                            tone="red"
                            icon={<RotateCcw size={14} />}
                            onClick={() =>
                              runAction(
                                () =>
                                  deactivateCashbook({
                                    id: item.id,
                                    reason: "Deactivated from cashbook management",
                                  }).unwrap(),
                                "Cashbook deactivated."
                              )
                            }
                          />
                        </>
                      )}
                      <TableActionButton
                        label="Ledger"
                        tone="neutral"
                        icon={<BookOpen size={14} />}
                        onClick={() => {
                          setSelectedCashbook(String(item.id));
                          router.push(`/financial/ledger?cashbook_id=${item.id}`);
                        }}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataPanel>
      )}

      {tab === "transactions" && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Cashbook</label>
            <select
              className={`${inputClass} max-w-sm`}
              value={cashbookFilter}
              onChange={(event) => setCashbookFilter(event.target.value)}
            >
              <option value="">All cashbooks</option>
              {cashbooks.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <span className="text-xs text-gray-500">
              Drafts must be confirmed before they change the ledger balance.
            </span>
          </div>
          <DataPanel
            loading={transactionsLoading}
            hasData={(transactionsResponse?.data.length ?? 0) > 0}
            empty="No transactions found."
          >
            <Table>
              <TableHeader>
                <TableRow>
                  {[
                    "Reference",
                    "Cashbook",
                    "Date",
                    "Direction",
                    "Amount",
                    "Status",
                    "Actions",
                  ].map((head) => (
                    <TableCell
                      key={head}
                      isHeader
                      className="px-4 py-3 text-xs font-semibold text-gray-500"
                    >
                      {head}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(transactionsResponse?.data ?? []).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                      {item.reference || `#${item.id}`}
                      <div className="text-xs font-normal text-gray-500">
                        {item.external_reference || "—"}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {item.cashbook?.name ||
                        cashbooks.find((book) => book.id === item.cashbook_id)?.name ||
                        `#${item.cashbook_id}`}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {formatReadableDate(item.business_date)}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-sm ${item.direction === "in" ? "text-emerald-600" : "text-orange-600"}`}
                      >
                        {item.direction === "in" ? (
                          <ArrowDownLeft size={14} />
                        ) : (
                          <ArrowUpRight size={14} />
                        )}
                        {item.direction}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                      {money(item.amount, item.cashbook?.currency_code)}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <StatusBadge status={item.status} />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <TableActionButton
                          label="View"
                          tone="neutral"
                          icon={<Eye size={14} />}
                          onClick={() =>
                            void fetchTransaction(item.id)
                              .unwrap()
                              .then(setDetail)
                              .catch(notifyError)
                          }
                        />
                        {item.status === "draft" && (
                          <>
                            <TableActionButton
                              label="Edit draft"
                              tone="neutral"
                              icon={<BookOpen size={14} />}
                              onClick={() => openTransaction(item)}
                            />
                            <TableActionButton
                              label="Confirm"
                              tone="green"
                              icon={<ArrowDownLeft size={14} />}
                              onClick={() =>
                                runAction(
                                  () => confirmTransaction(item.id).unwrap(),
                                  "Transaction confirmed."
                                )
                              }
                            />
                          </>
                        )}
                        {item.status === "confirmed" && (
                          <TableActionButton
                            label="Reverse"
                            tone="red"
                            icon={<RotateCcw size={14} />}
                            onClick={() => {
                              setEditingTransaction(item);
                              setReason("");
                              setFormKind("reverse");
                            }}
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataPanel>
        </section>
      )}

      {tab === "ledger" && (
        <section className="space-y-4">
          <FilterBar
            cashbooks={cashbooks}
            cashbookId={effectiveCashbookId}
            onCashbook={setSelectedCashbook}
            fromDate={fromDate}
            toDate={toDate}
            onFromDate={setFromDate}
            onToDate={setToDate}
          />
          <DataPanel
            loading={ledgerLoading}
            hasData={(ledgerResponse?.data.length ?? 0) > 0}
            empty="No ledger entries found for this period."
          >
            <Table>
              <TableHeader>
                <TableRow>
                  {["Date", "Entry", "Direction", "Amount", "Running balance", "Created"].map(
                    (head) => (
                      <TableCell
                        key={head}
                        isHeader
                        className="px-4 py-3 text-xs font-semibold text-gray-500"
                      >
                        {head}
                      </TableCell>
                    )
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(ledgerResponse?.data ?? []).map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {formatReadableDate(entry.entry_date)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {entry.description || entry.reference || `Ledger entry #${entry.id}`}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm capitalize text-gray-600 dark:text-gray-300">
                      {entry.direction}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                      {money(entry.amount)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                      {money(entry.running_balance)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-500">
                      {formatReadableDateTime(entry.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataPanel>
        </section>
      )}

      {tab === "reports" && (
        <section className="space-y-5">
          <FilterBar
            cashbooks={cashbooks}
            cashbookId={effectiveCashbookId}
            onCashbook={setSelectedCashbook}
            fromDate={fromDate}
            toDate={toDate}
            onFromDate={setFromDate}
            onToDate={setToDate}
          />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              title="Opening balance"
              value={
                summaryLoading
                  ? "…"
                  : money(
                      summaryResponse?.data.opening_balance,
                      summaryResponse?.data.currency_code
                    )
              }
            />
            <Metric
              title="Money in"
              value={
                summaryLoading
                  ? "…"
                  : money(summaryResponse?.data.total_in, summaryResponse?.data.currency_code)
              }
              positive
            />
            <Metric
              title="Money out"
              value={
                summaryLoading
                  ? "…"
                  : money(summaryResponse?.data.total_out, summaryResponse?.data.currency_code)
              }
            />
            <Metric
              title="Closing balance"
              value={
                summaryLoading
                  ? "…"
                  : money(
                      summaryResponse?.data.closing_balance,
                      summaryResponse?.data.currency_code
                    )
              }
              positive
            />
          </div>
          <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  Consolidated balances
                </h2>
                <p className="text-sm text-gray-500">
                  Balances grouped by currency at the selected date.
                </p>
              </div>
              <div className="w-48">
                <DatePicker
                  id="cashbook-report-as-of-date"
                  label="As of"
                  defaultDate={asOfDate}
                  placeholder="Select date"
                  onChange={(_, date) => setAsOfDate(date)}
                />
              </div>
            </div>
            {consolidatedLoading ? (
              <div className="flex h-28 items-center justify-center">
                <Loading />
              </div>
            ) : (
              <div className="space-y-4">
                {(consolidatedResponse?.data.currencies ?? []).map((currency) => (
                  <div
                    key={currency.currency_code}
                    className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800"
                  >
                    <div className="flex flex-wrap gap-6 border-b border-gray-200 bg-gray-50 px-4 py-3 text-sm dark:border-gray-800 dark:bg-gray-900">
                      <strong className="text-gray-900 dark:text-white">
                        {currency.currency_code}
                      </strong>
                      <span className="text-gray-600 dark:text-gray-300">
                        Opening {money(currency.total_opening_balance)}
                      </span>
                      <span className="text-emerald-700 dark:text-emerald-400">
                        In {money(currency.total_in)}
                      </span>
                      <span className="text-orange-700 dark:text-orange-400">
                        Out {money(currency.total_out)}
                      </span>
                      <strong className="text-gray-900 dark:text-white">
                        Closing {money(currency.total_closing_balance)}
                      </strong>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {["Cashbook", "Branch", "Type", "Opening", "In", "Out", "Closing"].map(
                            (head) => (
                              <TableCell
                                key={head}
                                isHeader
                                className="px-4 py-3 text-xs font-semibold text-gray-500"
                              >
                                {head}
                              </TableCell>
                            )
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currency.cashbooks.map((book) => (
                          <TableRow key={book.cashbook_id}>
                            <TableCell className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                              {book.name}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                              {book.branch_name}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-sm capitalize text-gray-600 dark:text-gray-300">
                              {book.type}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-sm">
                              {money(book.opening_balance)}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-sm text-emerald-700">
                              {money(book.total_in)}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-sm text-orange-700">
                              {money(book.total_out)}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-sm font-semibold">
                              {money(book.closing_balance)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ))}
                {!consolidatedResponse?.data.currencies?.length && (
                  <p className="py-10 text-center text-sm text-gray-500">
                    No consolidated balances for this date.
                  </p>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      <Modal
        isOpen={formKind === "cashbook" || formKind === "transaction"}
        onClose={closeForm}
        className="m-4 max-w-2xl"
      >
        <form onSubmit={saveForm} className="space-y-5 p-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {formKind === "cashbook"
                ? editingCashbook
                  ? "Edit cashbook"
                  : "Create cashbook"
                : editingTransaction
                  ? "Edit transaction draft"
                  : "Create transaction draft"}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {formKind === "transaction"
                ? "Draft transactions do not affect balances until confirmed. An idempotency key is generated automatically."
                : "Cashbook details and opening balance."}
            </p>
          </div>
          {formKind === "cashbook" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Branch" required>
                <select
                  required
                  className={inputClass}
                  value={cashbookForm.branch_id}
                  onChange={(event) =>
                    setCashbookForm({ ...cashbookForm, branch_id: event.target.value })
                  }
                >
                  <option value="">Select branch</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.code} · {branch.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Type" required>
                <select
                  className={inputClass}
                  value={cashbookForm.type}
                  onChange={(event) =>
                    setCashbookForm({ ...cashbookForm, type: event.target.value })
                  }
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank</option>
                </select>
              </Field>
              <Field label="Name" required>
                <input
                  required
                  className={inputClass}
                  value={cashbookForm.name}
                  onChange={(event) =>
                    setCashbookForm({ ...cashbookForm, name: event.target.value })
                  }
                />
              </Field>
              <Field label="Currency code" required>
                <input
                  required
                  maxLength={3}
                  className={inputClass}
                  value={cashbookForm.currency_code}
                  onChange={(event) =>
                    setCashbookForm({ ...cashbookForm, currency_code: event.target.value })
                  }
                />
              </Field>
              {!editingCashbook && (
                <>
                  <Field label="Opening balance" required>
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      className={inputClass}
                      value={cashbookForm.opening_balance}
                      onChange={(event) =>
                        setCashbookForm({ ...cashbookForm, opening_balance: event.target.value })
                      }
                    />
                  </Field>
                  <Field label="Effective date" required>
                    <DatePicker
                      id="cashbook-effective-date"
                      defaultDate={cashbookForm.effective_date}
                      placeholder="Select effective date"
                      onChange={(_, date) =>
                        setCashbookForm((current) => ({ ...current, effective_date: date }))
                      }
                    />
                  </Field>
                </>
              )}
              <Field label="Bank reference">
                <input
                  className={inputClass}
                  value={cashbookForm.bank_reference}
                  onChange={(event) =>
                    setCashbookForm({ ...cashbookForm, bank_reference: event.target.value })
                  }
                />
              </Field>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Cashbook" required>
                <select
                  required
                  className={inputClass}
                  value={transactionForm.cashbook_id}
                  onChange={(event) =>
                    setTransactionForm({ ...transactionForm, cashbook_id: event.target.value })
                  }
                >
                  {activeCashbooks.map((book) => (
                    <option key={book.id} value={book.id}>
                      {book.name} · {book.currency_code}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Business date" required>
                <DatePicker
                  id="cashbook-transaction-business-date"
                  defaultDate={transactionForm.business_date}
                  placeholder="Select business date"
                  onChange={(_, date) =>
                    setTransactionForm((current) => ({ ...current, business_date: date }))
                  }
                />
              </Field>
              <Field label="Direction" required>
                <select
                  className={inputClass}
                  value={transactionForm.direction}
                  onChange={(event) =>
                    setTransactionForm({ ...transactionForm, direction: event.target.value })
                  }
                >
                  <option value="in">Money in</option>
                  <option value="out">Money out</option>
                </select>
              </Field>
              <Field label="Amount" required>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  className={inputClass}
                  value={transactionForm.amount}
                  onChange={(event) =>
                    setTransactionForm({ ...transactionForm, amount: event.target.value })
                  }
                />
              </Field>
              <Field label="Description" required>
                <input
                  required
                  className={inputClass}
                  value={transactionForm.description}
                  onChange={(event) =>
                    setTransactionForm({ ...transactionForm, description: event.target.value })
                  }
                />
              </Field>
              <Field label="External reference">
                <input
                  className={inputClass}
                  value={transactionForm.external_reference}
                  onChange={(event) =>
                    setTransactionForm({
                      ...transactionForm,
                      external_reference: event.target.value,
                    })
                  }
                />
              </Field>
            </div>
          )}
          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
            <Button type="button" variant="outline" onClick={closeForm}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                createCashbookState.isLoading ||
                updateCashbookState.isLoading ||
                createTransactionState.isLoading ||
                updateTransactionState.isLoading
              }
            >
              Save
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={formKind === "reverse"} onClose={closeForm} className="m-4 max-w-lg">
        <form
          className="space-y-5 p-6"
          onSubmit={(event) => {
            event.preventDefault();
            if (!editingTransaction || !reason.trim()) return;
            void runAction(
              () =>
                reverseTransaction({ id: editingTransaction.id, reason: reason.trim() }).unwrap(),
              "Transaction reversed."
            ).then(closeForm);
          }}
        >
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Reverse transaction</h2>
            <p className="mt-1 text-sm text-gray-500">
              A reversal creates a compensating transaction. Enter the reason for the audit trail.
            </p>
          </div>
          <Field label="Reason" required>
            <textarea
              required
              rows={3}
              className={`${inputClass} h-auto py-3`}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </Field>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={closeForm}>
              Cancel
            </Button>
            <Button type="submit">Reverse transaction</Button>
          </div>
        </form>
      </Modal>
      <Modal isOpen={detail !== null} onClose={() => setDetail(null)} className="m-4 max-w-3xl">
        <div className="space-y-4 p-6">
          <RecordDetails value={detail} />
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

function RecordDetails({ value }: { value: unknown }) {
  const response = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const record =
    response.data && typeof response.data === "object"
      ? (response.data as Record<string, unknown>)
      : response;
  const isCashbook = "currency_code" in record && "opening_balance" in record;
  const isTransaction = "business_date" in record && "amount" in record;
  const fields = isCashbook
    ? [
        "id",
        "branch",
        "branch_id",
        "type",
        "name",
        "currency_code",
        "bank_reference",
        "opening_balance",
        "effective_date",
        "current_balance",
        "status",
        "deactivation_reason",
        "version",
        "created_at",
        "updated_at",
      ]
    : isTransaction
      ? [
          "id",
          "cashbook",
          "cashbook_id",
          "reference",
          "external_reference",
          "business_date",
          "direction",
          "amount",
          "description",
          "source_type",
          "status",
          "ledger_entry_id",
          "reverses_transaction_id",
          "reversed_by_transaction_id",
          "reversal_reason",
          "created_by_id",
          "confirmed_by_id",
          "confirmed_at",
          "reversed_by_id",
          "reversed_at",
          "version",
        ]
      : Object.keys(record);
  const title = isCashbook
    ? "Cashbook details"
    : isTransaction
      ? "Transaction details"
      : "Record details";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
        {typeof record.name === "string" && (
          <p className="mt-1 text-sm text-gray-500">{record.name}</p>
        )}
        {typeof record.reference === "string" && (
          <p className="mt-1 text-sm text-gray-500">{record.reference}</p>
        )}
      </div>
      <div className="grid max-h-[65vh] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
        {fields
          .filter((key) => key in record)
          .map((key) => {
            const item = record[key];
            const displayValue =
              (isCashbook && ["opening_balance", "current_balance"].includes(key)) ||
              (isTransaction && key === "amount")
                ? money(
                    item as string | number | null,
                    typeof record.currency_code === "string"
                      ? record.currency_code
                      : typeof (record.cashbook as Record<string, unknown> | undefined)
                            ?.currency_code === "string"
                        ? String((record.cashbook as Record<string, unknown>).currency_code)
                        : ""
                  )
                : null;
            return (
              <div key={key} className="min-w-0 space-y-1 py-2">
                <p className="text-xs font-medium capitalize text-gray-500 dark:text-gray-400">
                  {key.replace(/_/g, " ")}
                </p>
                {displayValue ? (
                  <p className="break-words text-sm font-medium text-gray-900 dark:text-white">
                    {displayValue}
                  </p>
                ) : (
                  <DetailValue value={item} />
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}

function DetailValue({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === "") {
    return <p className="text-sm text-gray-400">—</p>;
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
      return (
        <p className="break-words text-sm font-medium text-gray-900 dark:text-white">
          {formatReadableDateTime(value)}
        </p>
      );
    }
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return (
        <p className="break-words text-sm font-medium text-gray-900 dark:text-white">
          {formatReadableDate(value)}
        </p>
      );
    }
    return (
      <p className="break-words text-sm font-medium text-gray-900 dark:text-white">
        {String(value)}
      </p>
    );
  }
  if (Array.isArray(value)) {
    return (
      <p className="break-words text-sm text-gray-700 dark:text-gray-300">
        {value
          .map((item) =>
            typeof item === "object" && item !== null
              ? Object.values(item).join(" · ")
              : String(item)
          )
          .join(", ") || "—"}
      </p>
    );
  }
  return (
    <dl className="space-y-1.5">
      {Object.entries(value as Record<string, unknown>).map(([key, item]) => (
        <div key={key} className="grid grid-cols-[auto_1fr] gap-x-2 text-sm">
          <dt className="text-gray-500">{key.replace(/_/g, " ")}:</dt>
          <dd className="min-w-0 break-words font-medium text-gray-900 dark:text-white">
            <DetailValue value={item} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className={labelClass}>
        {label}
        {required ? " *" : ""}
      </span>
      {children}
    </label>
  );
}

function DataPanel({
  loading,
  hasData,
  empty,
  children,
}: {
  loading: boolean;
  hasData: boolean;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      {loading ? (
        <div className="flex h-52 items-center justify-center">
          <Loading />
        </div>
      ) : !hasData ? (
        <div className="flex h-52 items-center justify-center text-sm text-gray-500">{empty}</div>
      ) : (
        <div className="max-w-full overflow-x-auto">{children}</div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const classes =
    status === "active" || status === "confirmed"
      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
      : status === "reversed" || status === "inactive"
        ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
        : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${classes}`}
    >
      {status}
    </span>
  );
}

function FilterBar({
  cashbooks,
  cashbookId,
  onCashbook,
  fromDate,
  toDate,
  onFromDate,
  onToDate,
}: {
  cashbooks: Cashbook[];
  cashbookId: string;
  onCashbook: (value: string) => void;
  fromDate: string;
  toDate: string;
  onFromDate: (value: string) => void;
  onToDate: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <Field label="Cashbook">
        <select
          className={`${inputClass} min-w-56`}
          value={cashbookId}
          onChange={(event) => onCashbook(event.target.value)}
        >
          {cashbooks.map((book) => (
            <option key={book.id} value={book.id}>
              {book.name} · {book.currency_code}
            </option>
          ))}
        </select>
      </Field>
      <Field label="From date">
        <DatePicker
          id="cashbook-period-from-date"
          defaultDate={fromDate}
          placeholder="Select date"
          onChange={(_, date) => onFromDate(date)}
        />
      </Field>
      <Field label="To date">
        <DatePicker
          id="cashbook-period-to-date"
          defaultDate={toDate}
          placeholder="Select date"
          onChange={(_, date) => onToDate(date)}
        />
      </Field>
    </div>
  );
}

function Metric({ title, value, positive }: { title: string; value: string; positive?: boolean }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <p className="text-sm text-gray-500">{title}</p>
      <p
        className={`mt-2 text-xl font-bold ${positive ? "text-emerald-700 dark:text-emerald-400" : "text-gray-900 dark:text-white"}`}
      >
        {value}
      </p>
    </div>
  );
}
