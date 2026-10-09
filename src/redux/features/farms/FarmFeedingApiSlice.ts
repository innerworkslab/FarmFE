import { farmApi } from "@/redux/services/farmApi";

type QueryValue = string | number | null | undefined;

const withQuery = (url: string, params?: Record<string, QueryValue>) => {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  });
  return query.size ? `${url}?${query.toString()}` : url;
};

export interface FarmFeedingLinePayload {
  food_item_id: number;
  inventory_id: number;
  stock_lot_id?: number | null;
  source_location: string;
  stock_uom_id: number;
  quantity: number;
  wastage_quantity: number;
  notes: string;
}

export interface FarmFeedingPayload {
  feeding_date: string;
  feeding_time: string;
  branch_id: number;
  farm_information_id: number;
  animal_balance_id?: number;
  animal_balance_ids?: number[];
  notes: string;
  lines: FarmFeedingLinePayload[];
}

export interface FarmFeedingLine extends FarmFeedingLinePayload {
  id: number;
  line_number: number;
  food?: { id: number; code: string; name: string; category: string } | null;
  stock_lot?: {
    id: number;
    receipt_lot_number?: string | null;
    supplier_batch_number?: string | null;
    expiry_date?: string | null;
    lot_status?: string | null;
  } | null;
  quantity_per_animal?: number | string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
}

export interface FarmFeeding {
  id: number;
  feeding_number: string;
  feeding_date: string;
  feeding_time: string;
  branch_id: number;
  farm_information_id: number;
  farm?: {
    id: number;
    name: string;
    house_barn?: string | null;
    pen_cage_pond?: string | null;
  } | null;
  target?: {
    animal_balance_id: number;
    animal_item_id?: number | null;
    animal_id?: number | null;
    target_type?: string | null;
    animal_type?: string | null;
    breed?: string | null;
    animal_count?: number | null;
    location?: string | null;
  } | null;
  additional_animal_balance_ids?: number[];
  status: "draft" | "submitted" | "confirmed" | "rejected" | string;
  notes?: string | null;
  totals?: { quantity?: number | string | null; wastage_quantity?: number | string | null } | null;
  posting_batch_id?: string | null;
  version?: number;
  submitted_at?: string | null;
  confirmed_at?: string | null;
  rejected_at?: string | null;
  rejection_reason?: string | null;
  lines?: FarmFeedingLine[];
  confirmation?: {
    id: number;
    confirmation_number?: string;
    status?: string;
    submitted_at?: string | null;
    confirmed_at?: string | null;
    rejected_at?: string | null;
    rejection_reason?: string | null;
    posting_batch_id?: string | null;
  } | null;
  created_at?: string;
  updated_at?: string;
}

export interface FarmFeedingListQuery {
  farm_information_id?: number | string;
  animal_balance_id?: number | string;
  status?: string;
  from_date?: string;
  to_date?: string;
  search?: string;
  per_page?: number;
  page?: number;
}

interface SingleResponse {
  data: FarmFeeding;
  message?: string;
}
interface ListResponse {
  data: FarmFeeding[];
  links?: Record<string, unknown>;
  meta?: { current_page?: number; last_page?: number; per_page?: number; total?: number };
}

export const farmFeedingApiSlice = farmApi.injectEndpoints({
  endpoints: (builder) => ({
    getFarmFeedings: builder.query<ListResponse, FarmFeedingListQuery | void>({
      query: (params) => withQuery("farms/feedings", params ? { ...params } : undefined),
      providesTags: ["farmFeedings"],
    }),
    getFarmFeeding: builder.query<SingleResponse, number | string>({
      query: (id) => `farms/feedings/${id}`,
      providesTags: ["farmFeedings"],
    }),
    createFarmFeeding: builder.mutation<SingleResponse, FarmFeedingPayload>({
      query: (body) => ({ url: "farms/feedings", method: "POST", body }),
      invalidatesTags: ["farmFeedings", "farmReports", "farmAlerts"],
    }),
    updateFarmFeeding: builder.mutation<
      SingleResponse,
      { id: number | string; body: FarmFeedingPayload }
    >({
      query: ({ id, body }) => ({ url: `farms/feedings/${id}`, method: "POST", body }),
      invalidatesTags: ["farmFeedings", "farmReports", "farmAlerts"],
    }),
    submitFarmFeeding: builder.mutation<SingleResponse, number | string>({
      query: (id) => ({ url: `farms/feedings/${id}/submit`, method: "POST" }),
      invalidatesTags: ["farmFeedings", "inventoryConfirmations"],
    }),
    confirmFarmFeeding: builder.mutation<SingleResponse, number | string>({
      query: (id) => ({ url: `farms/feedings/${id}/confirm`, method: "POST" }),
      invalidatesTags: [
        "farmFeedings",
        "farmReports",
        "farmAlerts",
        "farmNavigation",
        "farmAnimalViews",
        "inventoryBalances",
        "inventoryLedger",
        "inventoryConfirmations",
      ],
    }),
    rejectFarmFeeding: builder.mutation<SingleResponse, { id: number | string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `farms/feedings/${id}/reject`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["farmFeedings", "inventoryConfirmations"],
    }),
  }),
});

export const {
  useGetFarmFeedingsQuery,
  useLazyGetFarmFeedingQuery,
  useCreateFarmFeedingMutation,
  useUpdateFarmFeedingMutation,
  useSubmitFarmFeedingMutation,
  useConfirmFarmFeedingMutation,
  useRejectFarmFeedingMutation,
} = farmFeedingApiSlice;
