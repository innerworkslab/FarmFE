import { farmApi } from "@/redux/services/farmApi";
type Id = number | string;
export type Values = Record<string, string | number | boolean | null | undefined>;
const url = (path: string, values?: Values) => {
  const p = new URLSearchParams();
  Object.entries(values || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  });
  return p.size ? `${path}?${p}` : path;
};
export interface Policy {
  branch_id: number;
  default_currency: string;
  enabled_currencies: string[];
  timezone: string;
  require_open_period: boolean;
  require_approval_limit: boolean;
}
export interface PostingLimit {
  id: number;
  user_id: number;
  branch_id: number;
  currency_code: string;
  maximum_amount: string;
  allow_self_approval: boolean;
}
export interface Period {
  id: number;
  branch_id: number;
  name: string;
  from_date: string;
  to_date: string;
  state: string;
}
export interface Movement {
  id: number;
  reference: string;
  state: string;
  amount: string;
  currency_code: string;
  business_date: string;
  description?: string;
  branch_id?: number;
  purchase_invoice_id?: number;
  staff_advance_id?: number;
  payroll_reference?: string;
  evidence_reference?: string;
  verification_note?: string;
  source_cashbook_id?: number;
  destination_cashbook_id?: number;
  out_transaction_id?: number;
  in_transaction_id?: number;
}
export interface PaymentSummary {
  eligible_cashbooks?: { id: number; name: string; currency_code: string; branch_id: number }[];
  invoice_id: number;
  currency_code: string;
  total_amount: string;
  paid_amount: string;
  outstanding_amount: string;
  payments: Movement[];
}
export interface Reconciliation {
  generated_at: string;
  passed: boolean;
  checks: {
    check: string;
    record_type: string;
    record_id: number;
    currency_code: string | null;
    expected: string;
    actual: string;
    delta: string;
    passed: boolean;
  }[];
}
export interface ResultEntry {
  id: number;
  cashbook_id: number;
  business_date: string;
  reference: string;
  source_type: string;
  description: string;
  category_id: number;
  report_treatment: string;
  direction: string;
  amount: string;
  report_effect: string | null;
  reversal_of_entry_id: number | null;
}
export interface CashResult {
  basis: string;
  from_date: string;
  to_date: string;
  generated_at: string;
  reconciliation_passed: boolean;
  reconciliation_issue_count: number;
  is_complete: boolean;
  currencies: {
    currency_code: string;
    income: string;
    expense: string;
    excluded_in: string;
    excluded_out: string;
    unclassified_in: string;
    unclassified_out: string;
    unclassified_count: number;
    is_complete: boolean;
    net_cash_result: string | null;
    entries?: ResultEntry[];
    lines: {
      category_id: number;
      category_name: string;
      report_treatment: string;
      amount: string;
      entry_count: number;
    }[];
  }[];
}
interface One<T> {
  data: T;
}
interface Many<T> {
  data: T[];
  meta?: { last_page?: number; current_page?: number; total?: number };
}
const changed = [
  "financialFinal",
  "cashbooks",
  "cashbookTransactions",
  "cashbookLedger",
  "cashbookReports",
  "staffAdvances",
  "staffAdvanceBalances",
  "staffAdvanceHistory",
  "purchaseInvoices",
] as const;
export const financialFinalApi = farmApi.injectEndpoints({
  endpoints: (b) => ({
    getBranchPolicy: b.query<One<Policy | null> & { configured?: boolean }, Id>({
      query: (id) => `financial/branch-settings/${id}`,
      providesTags: ["financialFinal"],
    }),
    saveBranchPolicy: b.mutation<One<Policy>, { branchId: Id; body: Omit<Policy, "branch_id"> }>({
      query: ({ branchId, body }) => ({
        url: `financial/branch-settings/${branchId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["financialFinal"],
    }),
    getPostingLimits: b.query<Many<PostingLimit>, Id>({
      query: (id) => `financial/posting-limits/${id}`,
      providesTags: ["financialFinal"],
    }),
    savePostingLimit: b.mutation<
      One<PostingLimit>,
      {
        branchId: Id;
        body: {
          user_id: number;
          currency_code: string;
          maximum_amount: string;
          allow_self_approval: boolean;
        };
      }
    >({
      query: ({ branchId, body }) => ({
        url: `financial/posting-limits/${branchId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["financialFinal"],
    }),
    getFinancialPeriods: b.query<Many<Period>, Values>({
      query: (p) => url("financial/periods", p),
      providesTags: ["financialFinal"],
    }),
    createFinancialPeriod: b.mutation<
      One<Period>,
      { branch_id: number; name: string; from_date: string; to_date: string }
    >({
      query: (body) => ({ url: "financial/periods", method: "POST", body }),
      invalidatesTags: ["financialFinal"],
    }),
    changeFinancialPeriod: b.mutation<
      One<Period>,
      { id: Id; action: "close" | "reopen"; reason: string }
    >({
      query: ({ id, action, reason }) => ({
        url: `financial/periods/${id}/${action}`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["financialFinal"],
    }),
    getInvoicePayments: b.query<One<PaymentSummary>, Id>({
      query: (id) => `purchasing/invoices/${id}/payments`,
      providesTags: ["financialFinal", "purchaseInvoices", "cashbookTransactions"],
    }),
    createInvoicePayment: b.mutation<One<Movement>, { invoiceId: Id; body: Values }>({
      query: ({ invoiceId, body }) => ({
        url: `purchasing/invoices/${invoiceId}/payments`,
        method: "POST",
        body,
      }),
      invalidatesTags: [...changed],
    }),
    changeInvoicePayment: b.mutation<
      One<Movement>,
      { id: Id; action: "confirm" | "reverse" | "cancel"; reason?: string }
    >({
      query: ({ id, action, reason }) => ({
        url: `purchasing/payments/${id}/${action}`,
        method: "POST",
        body: action === "reverse" ? { reason } : {},
      }),
      invalidatesTags: [...changed],
    }),
    getPayrollRecoveries: b.query<Many<Movement>, Id>({
      query: (id) => `financial/staff-advances/${id}/payroll-recoveries`,
      providesTags: ["financialFinal", "staffAdvances"],
    }),
    createPayrollRecovery: b.mutation<One<Movement>, { advanceId: Id; body: Values }>({
      query: ({ advanceId, body }) => ({
        url: `financial/staff-advances/${advanceId}/payroll-recoveries`,
        method: "POST",
        body,
      }),
      invalidatesTags: [...changed],
    }),
    changePayrollRecovery: b.mutation<
      One<Movement>,
      {
        id: Id;
        action: "confirm" | "reverse" | "cancel";
        reason?: string;
        verification_note?: string;
      }
    >({
      query: ({ id, action, reason, verification_note }) => ({
        url: `financial/payroll-recoveries/${id}/${action}`,
        method: "POST",
        body: action === "reverse" ? { reason } : action === "confirm" ? { verification_note } : {},
      }),
      invalidatesTags: [...changed],
    }),
    getCashbookTransfers: b.query<Many<Movement>, Values>({
      query: (p) => url("financial/cashbook-transfers", p),
      providesTags: ["financialFinal"],
    }),
    createCashbookTransfer: b.mutation<One<Movement>, Values>({
      query: (body) => ({ url: "financial/cashbook-transfers", method: "POST", body }),
      invalidatesTags: [...changed],
    }),
    changeCashbookTransfer: b.mutation<
      One<Movement>,
      { id: Id; action: "confirm" | "reverse" | "cancel"; reason?: string }
    >({
      query: ({ id, action, reason }) => ({
        url: `financial/cashbook-transfers/${id}/${action}`,
        method: "POST",
        body: action === "reverse" ? { reason } : {},
      }),
      invalidatesTags: [...changed],
    }),
    cancelManualTransaction: b.mutation<One<unknown>, { id: Id; reason: string }>({
      query: ({ id, reason }) => ({
        url: `financial/cashbook-transactions/${id}/cancel`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: [...changed],
    }),
    getFinancialReconciliation: b.query<One<Reconciliation>, Values>({
      query: (p) => url("financial/reconciliation", p),
      providesTags: [...changed, "depreciations", "cashLedgerCategories"],
    }),
    getCashResult: b.query<One<CashResult>, Values>({
      query: (p) => url("financial/reports/cash-result", p),
      providesTags: [...changed, "depreciations", "cashLedgerCategories"],
    }),
    exportCashResult: b.query<string, Values>({
      query: (p) => ({
        url: url("financial/reports/cash-result/export", p),
        responseHandler: (r) => r.text(),
      }),
    }),
    classifyCashEntry: b.mutation<
      One<unknown>,
      { id: Id; report_treatment: string; reason: string }
    >({
      query: ({ id, ...body }) => ({
        url: `financial/cashbook-ledger-entries/${id}/classify`,
        method: "POST",
        body,
      }),
      invalidatesTags: [...changed],
    }),
  }),
});
export const {
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
  useCancelManualTransactionMutation,
  useGetFinancialReconciliationQuery,
  useGetCashResultQuery,
  useLazyExportCashResultQuery,
  useClassifyCashEntryMutation,
} = financialFinalApi;
