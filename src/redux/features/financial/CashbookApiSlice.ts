import { farmApi } from "@/redux/services/farmApi";

type QueryValue = string | number | null | undefined;

const withQuery = (url: string, params?: Record<string, QueryValue>) => {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  });
  return query.size ? `${url}?${query.toString()}` : url;
};

export interface CashbookBranch {
  id: number;
  code?: string;
  name: string;
}

export interface Cashbook {
  id: number;
  branch_id: number;
  branch?: CashbookBranch | null;
  type: "cash" | "bank" | string;
  name: string;
  currency_code: string;
  bank_reference?: string | null;
  opening_balance: string | number;
  effective_date: string;
  current_balance?: string | number;
  status: "active" | "inactive" | string;
  deactivation_reason?: string | null;
  version?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CashbookListQuery {
  branch_id?: number | string;
  type?: string;
  status?: string;
  search?: string;
  per_page?: number;
  page?: number;
}

export interface CashbookPayload {
  branch_id: number;
  type: "cash" | "bank" | string;
  name: string;
  currency_code: string;
  opening_balance: number | string;
  effective_date: string;
  bank_reference?: string | null;
}

export interface CashbookTransaction {
  id: number;
  cashbook_id: number;
  category_id?: number;
  category?: Pick<CashLedgerCategory, "id" | "name" | "direction"> | null;
  cashbook?: Pick<Cashbook, "id" | "name" | "type" | "currency_code"> | null;
  reference?: string;
  external_reference?: string | null;
  business_date: string;
  direction: "in" | "out" | string;
  amount: string | number;
  description?: string | null;
  source_type?: string;
  status: "draft" | "confirmed" | "reversed" | string;
  ledger_entry_id?: number | null;
  reverses_transaction_id?: number | null;
  reversed_by_transaction_id?: number | null;
  reversal_reason?: string | null;
  created_by_id?: number | null;
  confirmed_by_id?: number | null;
  confirmed_at?: string | null;
  reversed_by_id?: number | null;
  reversed_at?: string | null;
  version?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CashbookTransactionPayload {
  idempotency_key: string;
  cashbook_id: number;
  category_id: number;
  business_date: string;
  direction: "in" | "out";
  amount: number | string;
  description: string;
  external_reference?: string | null;
}

export interface CashLedgerCategory {
  id: number;
  name: string;
  direction: "in" | "out" | string;
  reversal_category_id?: number | null;
  reversal_category?: Pick<CashLedgerCategory, "id" | "name" | "direction" | "status"> | null;
  status: "active" | "inactive" | string;
  created_by_id?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface CashLedgerCategoryPayload {
  name?: string;
  direction?: "in" | "out";
  reversal_category_id?: number | null;
}

export interface CashbookCategorySummary {
  from_date: string;
  to_date: string;
  currencies: Array<{
    currency_code: string;
    categories: Array<{
      category_id: number;
      category_name: string;
      direction: "in" | "out" | string;
      total_amount: string | number;
      entry_count: number;
    }>;
  }>;
}

export interface CashbookTransactionUpdatePayload {
  business_date?: string;
  direction?: "in" | "out";
  amount?: number | string;
  description?: string;
  external_reference?: string | null;
}

export interface CashbookLedgerEntry {
  id: number;
  cashbook_id: number;
  cashbook_transaction_id?: number | null;
  category_id?: number | null;
  category_name?: string | null;
  reversal_of_entry_id?: number | null;
  reference: string;
  entry_date: string;
  source_type?: string;
  direction: "in" | "out" | string;
  amount: string | number;
  running_balance: string | number;
  description?: string | null;
  created_by_id?: number | null;
  created_at?: string;
}

export interface CashbookLedgerQuery {
  from_date?: string;
  to_date?: string;
  source_type?: string;
  per_page?: number;
  page?: number;
}

export interface CashbookDailySummary {
  cashbook_id: number;
  cashbook_name: string;
  currency_code: string;
  from_date: string;
  to_date: string;
  opening_balance: string | number;
  total_in: string | number;
  total_out: string | number;
  closing_balance: string | number;
}

export interface ConsolidatedCashbookBalances {
  as_of_date: string;
  currencies: Array<{
    currency_code: string;
    total_opening_balance: string | number;
    total_in: string | number;
    total_out: string | number;
    total_closing_balance: string | number;
    cashbooks: Array<{
      cashbook_id: number;
      branch_id: number;
      branch_name: string;
      type: string;
      name: string;
      opening_balance: string | number;
      total_in: string | number;
      total_out: string | number;
      closing_balance: string | number;
    }>;
  }>;
}

export interface CashbookSingleResponse<T> {
  data: T;
  message?: string;
}

export interface CashbookListResponse<T> {
  data: T[];
  links?: {
    first?: string | null;
    last?: string | null;
    prev?: string | null;
    next?: string | null;
  };
  meta?: {
    current_page?: number;
    from?: number | null;
    last_page?: number;
    links?: Array<{
      url?: string | null;
      label?: string;
      page?: number | null;
      active?: boolean;
    }>;
    path?: string;
    per_page?: number;
    to?: number | null;
    total?: number;
  };
}

export const cashbookApiSlice = farmApi.injectEndpoints({
  endpoints: (builder) => ({
    getCashLedgerCategories: builder.query<
      CashbookListResponse<CashLedgerCategory>,
      {
        direction?: "in" | "out";
        status?: "active" | "inactive";
        search?: string;
        per_page?: number;
        page?: number;
      } | void
    >({
      query: (params) => withQuery("financial/cash-ledger-categories", params || undefined),
      providesTags: ["cashLedgerCategories"],
    }),
    getCashLedgerCategory: builder.query<
      CashbookSingleResponse<CashLedgerCategory>,
      number | string
    >({
      query: (id) => `financial/cash-ledger-categories/${id}`,
      providesTags: ["cashLedgerCategories"],
    }),
    createCashLedgerCategory: builder.mutation<
      CashbookSingleResponse<CashLedgerCategory>,
      Required<Pick<CashLedgerCategoryPayload, "name" | "direction">> &
        Pick<CashLedgerCategoryPayload, "reversal_category_id">
    >({
      query: (body) => ({ url: "financial/cash-ledger-categories", method: "POST", body }),
      invalidatesTags: ["cashLedgerCategories"],
    }),
    updateCashLedgerCategory: builder.mutation<
      CashbookSingleResponse<CashLedgerCategory>,
      { id: number | string; body: CashLedgerCategoryPayload }
    >({
      query: ({ id, body }) => ({
        url: `financial/cash-ledger-categories/${id}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["cashLedgerCategories"],
    }),
    setCashLedgerCategoryStatus: builder.mutation<
      CashbookSingleResponse<CashLedgerCategory>,
      { id: number | string; status: "active" | "inactive" }
    >({
      query: ({ id, status }) => ({
        url: `financial/cash-ledger-categories/${id}/toggle-status`,
        method: "POST",
        body: { status },
      }),
      invalidatesTags: ["cashLedgerCategories"],
    }),
    getCashbooks: builder.query<CashbookListResponse<Cashbook>, CashbookListQuery | void>({
      query: (params) => withQuery("financial/cashbooks", params ? { ...params } : undefined),
      providesTags: ["cashbooks"],
    }),
    getCashbook: builder.query<CashbookSingleResponse<Cashbook>, number | string>({
      query: (id) => `financial/cashbooks/${id}`,
      providesTags: ["cashbooks"],
    }),
    createCashbook: builder.mutation<CashbookSingleResponse<Cashbook>, CashbookPayload>({
      query: (body) => ({ url: "financial/cashbooks", method: "POST", body }),
      invalidatesTags: ["cashbooks", "cashbookReports"],
    }),
    updateCashbook: builder.mutation<
      CashbookSingleResponse<Cashbook>,
      { id: number | string; body: Partial<Pick<Cashbook, "name" | "bank_reference">> }
    >({
      query: ({ id, body }) => ({ url: `financial/cashbooks/${id}`, method: "POST", body }),
      invalidatesTags: ["cashbooks", "cashbookReports"],
    }),
    deactivateCashbook: builder.mutation<
      { data?: Cashbook; message?: string },
      { id: number | string; reason?: string }
    >({
      query: ({ id, reason }) => ({
        url: `financial/cashbooks/${id}/deactivate`,
        method: "POST",
        body: reason === undefined ? undefined : { reason },
      }),
      invalidatesTags: ["cashbooks", "cashbookReports"],
    }),
    getCashbookLedger: builder.query<
      CashbookListResponse<CashbookLedgerEntry>,
      { id: number | string } & CashbookLedgerQuery
    >({
      query: ({ id, ...params }) => withQuery(`financial/cashbooks/${id}/ledger`, params),
      providesTags: ["cashbookLedger"],
    }),
    getCashbookDailySummary: builder.query<
      CashbookSingleResponse<CashbookDailySummary>,
      { id: number | string; from_date?: string; to_date?: string }
    >({
      query: ({ id, from_date, to_date }) =>
        withQuery(`financial/cashbooks/${id}/daily-summary`, { from_date, to_date }),
      providesTags: ["cashbookReports"],
    }),
    getCashbookTransactions: builder.query<
      CashbookListResponse<CashbookTransaction>,
      {
        cashbook_id?: number | string;
        direction?: "in" | "out";
        status?: string;
        search?: string;
        from_date?: string;
        to_date?: string;
        per_page?: number;
        page?: number;
      }
    >({
      query: (params) => withQuery("financial/cashbook-transactions", params),
      providesTags: ["cashbookTransactions"],
    }),
    createCashbookTransaction: builder.mutation<
      CashbookSingleResponse<CashbookTransaction>,
      CashbookTransactionPayload
    >({
      query: ({ idempotency_key, ...body }) => ({
        url: "financial/cashbook-transactions",
        method: "POST",
        headers: { "Idempotency-Key": idempotency_key },
        body,
      }),
      invalidatesTags: ["cashbookTransactions"],
    }),
    getCashbookTransaction: builder.query<
      CashbookSingleResponse<CashbookTransaction>,
      number | string
    >({
      query: (id) => `financial/cashbook-transactions/${id}`,
      providesTags: ["cashbookTransactions"],
    }),
    updateCashbookTransaction: builder.mutation<
      CashbookSingleResponse<CashbookTransaction>,
      { id: number | string; body: CashbookTransactionUpdatePayload }
    >({
      query: ({ id, body }) => ({
        url: `financial/cashbook-transactions/${id}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["cashbookTransactions"],
    }),
    confirmCashbookTransaction: builder.mutation<
      CashbookSingleResponse<CashbookTransaction>,
      number | string
    >({
      query: (id) => ({ url: `financial/cashbook-transactions/${id}/confirm`, method: "POST" }),
      invalidatesTags: ["cashbookTransactions", "cashbooks", "cashbookLedger", "cashbookReports"],
    }),
    reverseCashbookTransaction: builder.mutation<
      CashbookSingleResponse<CashbookTransaction>,
      { id: number | string; reason: string }
    >({
      query: ({ id, reason }) => ({
        url: `financial/cashbook-transactions/${id}/reverse`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["cashbookTransactions", "cashbooks", "cashbookLedger", "cashbookReports"],
    }),
    getConsolidatedCashbookBalances: builder.query<
      CashbookSingleResponse<ConsolidatedCashbookBalances>,
      { as_of_date?: string } | void
    >({
      query: (params) => withQuery("financial/cashbook-reports/consolidated", params || undefined),
      providesTags: ["cashbookReports"],
    }),
    getCashbookCategorySummary: builder.query<
      CashbookSingleResponse<CashbookCategorySummary>,
      { from_date: string; to_date: string; direction?: "in" | "out" }
    >({
      query: (params) => withQuery("financial/cashbook-reports/categories", params),
      providesTags: ["cashbookReports"],
    }),
  }),
});

export const {
  useGetCashbooksQuery,
  useGetCashLedgerCategoriesQuery,
  useLazyGetCashLedgerCategoryQuery,
  useCreateCashLedgerCategoryMutation,
  useUpdateCashLedgerCategoryMutation,
  useSetCashLedgerCategoryStatusMutation,
  useLazyGetCashbookQuery,
  useCreateCashbookMutation,
  useUpdateCashbookMutation,
  useDeactivateCashbookMutation,
  useGetCashbookLedgerQuery,
  useGetCashbookDailySummaryQuery,
  useGetCashbookTransactionsQuery,
  useCreateCashbookTransactionMutation,
  useLazyGetCashbookTransactionQuery,
  useUpdateCashbookTransactionMutation,
  useConfirmCashbookTransactionMutation,
  useReverseCashbookTransactionMutation,
  useGetConsolidatedCashbookBalancesQuery,
  useGetCashbookCategorySummaryQuery,
} = cashbookApiSlice;
