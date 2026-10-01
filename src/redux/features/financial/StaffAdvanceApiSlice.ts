import { farmApi } from "@/redux/services/farmApi";

type QueryValue = string | number | null | undefined;
const withQuery = (url: string, params: Record<string, QueryValue>) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  });
  return query.size ? `${url}?${query.toString()}` : url;
};

export interface StaffAdvanceBalance {
  staff_id: number;
  staff_code: string;
  staff_name: string;
  currency_code: string;
  branch_id: number;
  branch?: { id: number; code: string; name: string } | null;
  employment_status: string;
  status: string;
  total_additions: string | number;
  total_deductions: string | number;
  outstanding_balance: string | number;
}

export interface StaffAdvanceHistoryEntry {
  id: number;
  staff_id: number;
  staff_advance_id?: number | null;
  staff_advance_repayment_id?: number | null;
  cashbook_transaction_id?: number | null;
  reversal_of_entry_id?: number | null;
  reference: string;
  business_date: string;
  entry_type: string;
  effect: "addition" | "deduction" | string;
  addition: string | number;
  deduction: string | number;
  amount: string | number;
  currency_code: string;
  running_balance: string | number;
  description?: string | null;
  created_by_id?: number | null;
  created_at?: string;
}

export interface StaffAdvance {
  id: number;
  reference: string;
  staff_id: number;
  staff: {
    id: number;
    staff_code: string;
    name: string;
    branch_id: number;
    branch_code?: string | null;
    branch_name?: string | null;
  };
  principal_amount: string | number;
  outstanding_amount: string | number;
  business_date: string;
  cashbook_id: number;
  cashbook?: { id: number; name: string; type: string; currency_code: string } | null;
  category_id: number;
  category?: { id: number; name: string; direction: string } | null;
  description: string;
  status: "draft" | "confirmed" | "reversed" | string;
  cashbook_transaction_id?: number | null;
  cashbook_posting_reference?: string | null;
  confirmed_by_id?: number | null;
  confirmed_at?: string | null;
  reversed_by_id?: number | null;
  reversed_at?: string | null;
  reversal_reason?: string | null;
  version?: number;
  repayments?: StaffAdvanceRepayment[];
}

export interface StaffAdvanceRepayment {
  id: number;
  staff_advance_id: number;
  advance_reference?: string | null;
  staff_id: number;
  reference: string;
  amount: string | number;
  business_date: string;
  cashbook_id: number;
  cashbook?: { id: number; name: string; type: string; currency_code: string } | null;
  category_id: number;
  category?: { id: number; name: string; direction: string } | null;
  external_reference?: string | null;
  description: string;
  status: "draft" | "confirmed" | "cancelled" | "reversed" | string;
  cashbook_transaction_id?: number | null;
  cashbook_posting_reference?: string | null;
  confirmed_by_id?: number | null;
  confirmed_at?: string | null;
  cancelled_by_id?: number | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  reversed_by_id?: number | null;
  reversed_at?: string | null;
  reversal_reason?: string | null;
  version?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  links?: Record<string, unknown>;
  meta?: Record<string, unknown>;
}
export interface SingleResponse<T> {
  data: T;
  message?: string;
}

export interface StaffAdvancePayload {
  staff_id: number;
  principal_amount: number | string;
  business_date: string;
  cashbook_id: number;
  category_id: number;
  description: string;
  idempotency_key: string;
}
export interface StaffAdvanceUpdatePayload {
  principal_amount?: number | string;
  description?: string;
}
export interface StaffAdvanceRepaymentPayload {
  amount: number | string;
  business_date: string;
  cashbook_id: number;
  category_id: number;
  external_reference?: string | null;
  description: string;
  idempotency_key: string;
}
export interface StaffAdvanceRepaymentUpdatePayload {
  amount?: number | string;
  description?: string;
}

const invalidateFinancialState = () => [
  { type: "staffAdvanceBalances" as const },
  { type: "staffAdvanceHistory" as const },
  { type: "staffAdvances" as const },
  { type: "staffAdvanceRepayments" as const },
  { type: "cashbooks" as const },
  { type: "cashbookTransactions" as const },
  { type: "cashbookLedger" as const },
  { type: "cashbookReports" as const },
];

export const staffAdvanceApiSlice = farmApi.injectEndpoints({
  endpoints: (builder) => ({
    getStaffAdvanceBalances: builder.query<
      PaginatedResponse<StaffAdvanceBalance>,
      { search?: string; balance_state?: "positive" | "zero"; per_page?: number } | void
    >({
      query: (params) =>
        withQuery("financial/staff-advance-balances", {
          search: params?.search,
          balance_state: params?.balance_state,
          per_page: params?.per_page,
        }),
      providesTags: ["staffAdvanceBalances"],
    }),
    getStaffAdvanceHistory: builder.query<
      PaginatedResponse<StaffAdvanceHistoryEntry> & {
        meta?: Record<string, unknown> & { staff_id?: number; current_balance?: string | number };
      },
      { staff_id: number | string; per_page?: number }
    >({
      query: ({ staff_id, per_page = 30 }) =>
        withQuery(`financial/staff-advance-history/${staff_id}`, { per_page }),
      providesTags: ["staffAdvanceHistory"],
    }),
    getStaffAdvances: builder.query<
      PaginatedResponse<StaffAdvance>,
      { staff_id?: number | string; per_page?: number; page?: number }
    >({
      query: (params) => withQuery("financial/staff-advances", params),
      providesTags: ["staffAdvances"],
    }),
    getStaffAdvance: builder.query<SingleResponse<StaffAdvance>, number | string>({
      query: (id) => `financial/staff-advances/${id}`,
      providesTags: ["staffAdvances"],
    }),
    createStaffAdvance: builder.mutation<SingleResponse<StaffAdvance>, StaffAdvancePayload>({
      query: (body) => ({ url: "financial/staff-advances", method: "POST", body }),
      invalidatesTags: invalidateFinancialState,
    }),
    updateStaffAdvance: builder.mutation<
      SingleResponse<StaffAdvance>,
      { id: number | string; body: StaffAdvanceUpdatePayload }
    >({
      query: ({ id, body }) => ({ url: `financial/staff-advances/${id}`, method: "POST", body }),
      invalidatesTags: invalidateFinancialState,
    }),
    confirmStaffAdvance: builder.mutation<SingleResponse<StaffAdvance>, number | string>({
      query: (id) => ({ url: `financial/staff-advances/${id}/confirm`, method: "POST", body: {} }),
      invalidatesTags: invalidateFinancialState,
    }),
    reverseStaffAdvance: builder.mutation<
      SingleResponse<StaffAdvance>,
      { id: number | string; reason: string }
    >({
      query: ({ id, reason }) => ({
        url: `financial/staff-advances/${id}/reverse`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: invalidateFinancialState,
    }),
    getStaffAdvanceRepayments: builder.query<
      PaginatedResponse<StaffAdvanceRepayment>,
      { staff_advance_id: number | string; per_page?: number }
    >({
      query: ({ staff_advance_id, per_page = 30 }) =>
        withQuery(`financial/staff-advances/${staff_advance_id}/repayments`, { per_page }),
      providesTags: ["staffAdvanceRepayments"],
    }),
    createStaffAdvanceRepayment: builder.mutation<
      SingleResponse<StaffAdvanceRepayment>,
      { staff_advance_id: number | string; body: StaffAdvanceRepaymentPayload }
    >({
      query: ({ staff_advance_id, body }) => ({
        url: `financial/staff-advances/${staff_advance_id}/repayments`,
        method: "POST",
        body,
      }),
      invalidatesTags: invalidateFinancialState,
    }),
    getStaffAdvanceRepayment: builder.query<SingleResponse<StaffAdvanceRepayment>, number | string>(
      {
        query: (id) => `financial/staff-advance-repayments/${id}`,
        providesTags: ["staffAdvanceRepayments"],
      }
    ),
    updateStaffAdvanceRepayment: builder.mutation<
      SingleResponse<StaffAdvanceRepayment>,
      { id: number | string; body: StaffAdvanceRepaymentUpdatePayload }
    >({
      query: ({ id, body }) => ({
        url: `financial/staff-advance-repayments/${id}`,
        method: "POST",
        body,
      }),
      invalidatesTags: invalidateFinancialState,
    }),
    confirmStaffAdvanceRepayment: builder.mutation<
      SingleResponse<StaffAdvanceRepayment>,
      number | string
    >({
      query: (id) => ({
        url: `financial/staff-advance-repayments/${id}/confirm`,
        method: "POST",
        body: {},
      }),
      invalidatesTags: invalidateFinancialState,
    }),
    reverseStaffAdvanceRepayment: builder.mutation<
      SingleResponse<StaffAdvanceRepayment>,
      { id: number | string; reason: string }
    >({
      query: ({ id, reason }) => ({
        url: `financial/staff-advance-repayments/${id}/reverse`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: invalidateFinancialState,
    }),
    cancelStaffAdvanceRepayment: builder.mutation<
      { message: string },
      { id: number | string; reason: string }
    >({
      query: ({ id, reason }) => ({
        url: `financial/staff-advance-repayments/${id}/cancel`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: invalidateFinancialState,
    }),
  }),
});

export const {
  useGetStaffAdvanceBalancesQuery,
  useGetStaffAdvanceHistoryQuery,
  useGetStaffAdvancesQuery,
  useLazyGetStaffAdvanceQuery,
  useCreateStaffAdvanceMutation,
  useUpdateStaffAdvanceMutation,
  useConfirmStaffAdvanceMutation,
  useReverseStaffAdvanceMutation,
  useGetStaffAdvanceRepaymentsQuery,
  useCreateStaffAdvanceRepaymentMutation,
  useLazyGetStaffAdvanceRepaymentQuery,
  useUpdateStaffAdvanceRepaymentMutation,
  useConfirmStaffAdvanceRepaymentMutation,
  useReverseStaffAdvanceRepaymentMutation,
  useCancelStaffAdvanceRepaymentMutation,
} = staffAdvanceApiSlice;
