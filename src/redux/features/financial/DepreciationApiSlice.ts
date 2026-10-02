import { farmApi } from "@/redux/services/farmApi";
import type { Cashbook, CashLedgerCategory } from "./CashbookApiSlice";

type QueryValue = string | number | null | undefined;

const withQuery = (url: string, params?: Record<string, QueryValue>) => {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  });
  return query.size ? `${url}?${query.toString()}` : url;
};

export interface DepreciationScheduleLine {
  id: number;
  depreciation_id: number;
  sequence_number: number;
  due_date: string;
  amount: string | number;
  status: "pending" | "failed" | "posted" | "reversed" | string;
  cashbook_transaction_id?: number | null;
  cashbook_posting_reference?: string | null;
  posted_by_id?: number | null;
  posted_at?: string | null;
  failure_reason?: string | null;
  reversed_by_id?: number | null;
  reversed_at?: string | null;
  reversal_reason?: string | null;
  version?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Depreciation {
  id: number;
  reference: string;
  asset_name: string;
  asset_category: string | { id: number; name: string; status?: string };
  asset_price: string | number;
  monthly_amount: string | number;
  total_posted_amount?: string | number;
  remaining_amount?: string | number;
  currency_code?: string;
  start_date: string;
  next_posting_date?: string | null;
  asset_category_id?: number;
  branch_id?: number;
  branch?: { id: number; code?: string; name: string } | null;
  end_date?: string | null;
  description?: string | null;
  cashbook_id: number;
  cashbook?: Pick<Cashbook, "id" | "name" | "type" | "currency_code"> | null;
  category_id: number;
  category?: Pick<CashLedgerCategory, "id" | "name" | "direction"> | null;
  status: "draft" | "active" | "cancelled" | string;
  cancellation_reason?: string | null;
  activated_by_id?: number | null;
  activated_at?: string | null;
  cancelled_by_id?: number | null;
  cancelled_at?: string | null;
  version?: number;
  schedule_lines?: DepreciationScheduleLine[];
  created_at?: string;
  updated_at?: string;
}

export interface AssetCategory {
  id: number;
  name: string;
  status: "active" | "inactive" | string;
  created_by_id?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface DepreciationResponse<T> {
  data: T;
  message?: string;
}

export interface DepreciationListResponse<T> {
  data: T[];
  links?: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

interface DepreciationFields {
  asset_name: string;
  asset_price: number | string;
  monthly_amount: number | string;
  start_date: string;
  cashbook_id: number;
  category_id: number;
  description?: string;
}

export type DepreciationPayload = DepreciationFields &
  (
    | { asset_category_id: number | string; asset_category?: never }
    | { asset_category: string; asset_category_id?: never }
  );

export type CreateDepreciationPayload = DepreciationPayload & { idempotency_key: string };

export const depreciationApiSlice = farmApi.injectEndpoints({
  endpoints: (builder) => ({
    getAssetCategories: builder.query<
      DepreciationListResponse<AssetCategory>,
      { per_page?: number; page?: number } | void
    >({
      query: (params) => withQuery("financial/asset-categories", params || undefined),
      providesTags: ["assetCategories"],
    }),
    createAssetCategory: builder.mutation<DepreciationResponse<AssetCategory>, { name: string }>({
      query: (body) => ({ url: "financial/asset-categories", method: "POST", body }),
      invalidatesTags: ["assetCategories"],
    }),
    updateAssetCategory: builder.mutation<
      DepreciationResponse<AssetCategory>,
      { id: number | string; name: string }
    >({
      query: ({ id, name }) => ({
        url: `financial/asset-categories/${id}`,
        method: "POST",
        body: { name },
      }),
      invalidatesTags: ["assetCategories", "depreciations"],
    }),
    toggleAssetCategoryStatus: builder.mutation<
      DepreciationResponse<AssetCategory>,
      { id: number | string; status: "active" | "inactive" }
    >({
      query: ({ id, status }) => ({
        url: `financial/asset-categories/${id}/toggle-status`,
        method: "POST",
        body: { status },
      }),
      invalidatesTags: ["assetCategories", "depreciations"],
    }),
    getDepreciations: builder.query<
      DepreciationListResponse<Depreciation>,
      {
        branch_id?: number | string;
        cashbook_id?: number | string;
        category_id?: number | string;
        status?: "draft" | "active" | "completed" | "cancelled" | string;
        from_date?: string;
        to_date?: string;
        search?: string;
        per_page?: number;
        page?: number;
      } | void
    >({
      query: (params) => withQuery("financial/depreciations", params || undefined),
      providesTags: ["depreciations"],
    }),
    getDepreciation: builder.query<DepreciationResponse<Depreciation>, number | string>({
      query: (id) => `financial/depreciations/${id}`,
      providesTags: ["depreciations"],
    }),
    createDepreciation: builder.mutation<
      DepreciationResponse<Depreciation>,
      CreateDepreciationPayload
    >({
      query: (body) => ({
        url: "financial/depreciations",
        method: "POST",
        headers: { "Idempotency-Key": body.idempotency_key },
        body,
      }),
      invalidatesTags: ["depreciations"],
    }),
    updateDepreciation: builder.mutation<
      DepreciationResponse<Depreciation>,
      { id: number | string; body: Partial<DepreciationPayload> }
    >({
      query: ({ id, body }) => ({
        url: `financial/depreciations/${id}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["depreciations"],
    }),
    activateDepreciation: builder.mutation<DepreciationResponse<Depreciation>, number | string>({
      query: (id) => ({
        url: `financial/depreciations/${id}/activate`,
        method: "POST",
        body: {},
      }),
      invalidatesTags: ["depreciations", "depreciationSchedule", "cashbooks"],
    }),
    cancelDepreciation: builder.mutation<
      DepreciationResponse<Depreciation>,
      { id: number | string; reason: string }
    >({
      query: ({ id, reason }) => ({
        url: `financial/depreciations/${id}/cancel`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["depreciations", "depreciationSchedule", "cashbooks"],
    }),
    getDepreciationSchedule: builder.query<
      DepreciationListResponse<DepreciationScheduleLine>,
      { id: number | string; per_page?: number; page?: number }
    >({
      query: ({ id, ...params }) => withQuery(`financial/depreciations/${id}/schedule`, params),
      providesTags: ["depreciationSchedule"],
    }),
    postDepreciationScheduleLine: builder.mutation<
      DepreciationResponse<DepreciationScheduleLine>,
      number | string
    >({
      query: (id) => ({
        url: `financial/depreciation-schedule-lines/${id}/post`,
        method: "POST",
        body: {},
      }),
      invalidatesTags: [
        "depreciations",
        "depreciationSchedule",
        "cashbooks",
        "cashbookTransactions",
        "cashbookLedger",
        "cashbookReports",
      ],
    }),
    reverseDepreciationScheduleLine: builder.mutation<
      DepreciationResponse<DepreciationScheduleLine>,
      { id: number | string; reason: string }
    >({
      query: ({ id, reason }) => ({
        url: `financial/depreciation-schedule-lines/${id}/reverse`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: [
        "depreciations",
        "depreciationSchedule",
        "cashbooks",
        "cashbookTransactions",
        "cashbookLedger",
        "cashbookReports",
      ],
    }),
  }),
});

export const {
  useGetAssetCategoriesQuery,
  useCreateAssetCategoryMutation,
  useUpdateAssetCategoryMutation,
  useToggleAssetCategoryStatusMutation,
  useGetDepreciationsQuery,
  useLazyGetDepreciationQuery,
  useCreateDepreciationMutation,
  useUpdateDepreciationMutation,
  useActivateDepreciationMutation,
  useCancelDepreciationMutation,
  useGetDepreciationScheduleQuery,
  usePostDepreciationScheduleLineMutation,
  useReverseDepreciationScheduleLineMutation,
} = depreciationApiSlice;
