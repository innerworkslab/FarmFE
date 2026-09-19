import { farmApi } from "@/redux/services/farmApi";

type QueryValue = string | number | boolean | null | undefined;
type QueryParams = Record<string, QueryValue>;

const withQuery = (url: string, params?: QueryParams) => {
  const queryParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      queryParams.append(key, value.toString());
    }
  });
  const query = queryParams.toString();
  return query ? `${url}?${query}` : url;
};

export interface PaginatedResponse<T> {
  data: T[];
  links?: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

export interface SingleResponse<T> {
  data: T;
  message?: string;
  links?: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

export type InventoryAdjustmentStatus =
  | "draft"
  | "submitted"
  | "confirmed"
  | "rejected"
  | "reversed"
  | string;

export type InventoryAdjustmentDirection = "in" | "out" | string;

export interface InventoryAdjustmentLinePayload {
  category: "food" | "medicine" | "animal" | "equipment" | string;
  item_id: number;
  location: string;
  stock_uom_id: number;
  adjustment_quantity: number;
  direction: InventoryAdjustmentDirection;
  stock_lot_id?: number | null;
  new_identity?: boolean;
  supplier_id?: number | null;
  supplier_batch_number?: string | null;
  receipt_lot_number?: string | null;
  manufacturing_date?: string | null;
  expiry_date?: string | null;
  lot_status?: "available" | "quarantine" | "blocked" | string | null;
}

export interface InventoryAdjustmentPayload {
  type: "opening_balance" | "data_correction" | "other" | string;
  adjustment_date: string;
  branch_id: number;
  inventory_id: number;
  reason_type: string;
  reason: string;
  notes?: string | null;
  lines: InventoryAdjustmentLinePayload[];
}

export interface InventoryAdjustmentLine extends InventoryAdjustmentLinePayload {
  id: number;
  line_number: number;
  item_type?: string;
  stock_lot_id?: number | null;
  equipment_instance_id?: number | null;
  system_quantity?: string | number | null;
  counted_quantity?: string | number | null;
  metadata?: Record<string, unknown> | null;
}

export interface InventoryConfirmation {
  id: number;
  confirmation_number: string;
  source_module: string;
  source_type: string;
  source_id: number;
  submission_version?: number;
  status: InventoryAdjustmentStatus;
  submitted_by_id?: number | null;
  submitted_at?: string | null;
  confirmed_by_id?: number | null;
  confirmed_at?: string | null;
  rejected_by_id?: number | null;
  rejected_at?: string | null;
  rejection_reason?: string | null;
  posting_batch_id?: string | null;
  validation_snapshot?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryAdjustment {
  id: number;
  adjustment_number: string;
  type: string;
  adjustment_date: string;
  branch_id: number;
  inventory_id: number;
  farm_information_id?: number | null;
  status: InventoryAdjustmentStatus;
  reason_type: string;
  reason: string;
  notes?: string | null;
  posting_batch_id?: string | null;
  version?: number;
  submitted_at?: string | null;
  confirmed_at?: string | null;
  rejected_at?: string | null;
  rejection_reason?: string | null;
  lines?: InventoryAdjustmentLine[];
  confirmation?: InventoryConfirmation | null;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryBalance {
  id: number;
  [key: string]: unknown;
}

export interface InventoryLedgerEntry {
  id: number;
  [key: string]: unknown;
}

export const inventoryFoundationApiSlice = farmApi.injectEndpoints({
  endpoints: (builder) => ({
    getInventoryAdjustments: builder.query<
      PaginatedResponse<InventoryAdjustment>,
      QueryParams | void
    >({
      query: (params) => withQuery("inventory/adjustments", params || undefined),
      providesTags: ["inventoryAdjustments"],
    }),

    createInventoryAdjustment: builder.mutation<
      SingleResponse<InventoryAdjustment>,
      InventoryAdjustmentPayload
    >({
      query: (body) => ({
        url: "inventory/adjustments",
        method: "POST",
        body,
      }),
      invalidatesTags: ["inventoryAdjustments", "inventoryBalances", "inventoryLedger"],
    }),

    getInventoryAdjustment: builder.query<SingleResponse<InventoryAdjustment>, number | string>({
      query: (id) => `inventory/adjustments/${id}`,
      providesTags: ["inventoryAdjustments"],
    }),

    updateInventoryAdjustment: builder.mutation<
      SingleResponse<InventoryAdjustment>,
      { id: number | string; body: InventoryAdjustmentPayload }
    >({
      query: ({ id, body }) => ({
        url: `inventory/adjustments/${id}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["inventoryAdjustments"],
    }),

    submitInventoryAdjustment: builder.mutation<
      SingleResponse<InventoryAdjustment>,
      number | string
    >({
      query: (id) => ({
        url: `inventory/adjustments/${id}/submit`,
        method: "POST",
      }),
      invalidatesTags: ["inventoryAdjustments", "inventoryConfirmations"],
    }),

    confirmInventoryAdjustment: builder.mutation<
      SingleResponse<InventoryAdjustment>,
      number | string
    >({
      query: (id) => ({
        url: `inventory/adjustments/${id}/confirm`,
        method: "POST",
      }),
      invalidatesTags: [
        "inventoryAdjustments",
        "inventoryBalances",
        "inventoryLedger",
        "inventoryConfirmations",
      ],
    }),

    reverseInventoryAdjustment: builder.mutation<
      SingleResponse<InventoryAdjustment>,
      { id: number | string; reason: string }
    >({
      query: ({ id, reason }) => ({
        url: `inventory/adjustments/${id}/reverse`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: [
        "inventoryAdjustments",
        "inventoryBalances",
        "inventoryLedger",
        "inventoryConfirmations",
      ],
    }),

    rejectInventoryAdjustment: builder.mutation<
      SingleResponse<InventoryAdjustment>,
      { id: number | string; reason: string }
    >({
      query: ({ id, reason }) => ({
        url: `inventory/adjustments/${id}/reject`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["inventoryAdjustments", "inventoryConfirmations"],
    }),

    getInventoryBalances: builder.query<PaginatedResponse<InventoryBalance>, QueryParams | void>({
      query: (params) => withQuery("inventory/balances", params || undefined),
      providesTags: ["inventoryBalances"],
    }),

    getInventoryLedger: builder.query<
      PaginatedResponse<InventoryLedgerEntry>,
      QueryParams | void
    >({
      query: (params) => withQuery("inventory/ledger", params || undefined),
      providesTags: ["inventoryLedger"],
    }),

    getInventoryConfirmations: builder.query<
      PaginatedResponse<InventoryConfirmation>,
      QueryParams | void
    >({
      query: (params) => withQuery("inventory/confirmations", params || undefined),
      providesTags: ["inventoryConfirmations"],
    }),

    getInventoryConfirmation: builder.query<
      SingleResponse<InventoryConfirmation>,
      number | string
    >({
      query: (id) => `inventory/confirmations/${id}`,
      providesTags: ["inventoryConfirmations"],
    }),
  }),
});

export const {
  useGetInventoryAdjustmentsQuery,
  useLazyGetInventoryAdjustmentQuery,
  useCreateInventoryAdjustmentMutation,
  useGetInventoryAdjustmentQuery,
  useUpdateInventoryAdjustmentMutation,
  useSubmitInventoryAdjustmentMutation,
  useConfirmInventoryAdjustmentMutation,
  useReverseInventoryAdjustmentMutation,
  useRejectInventoryAdjustmentMutation,
  useGetInventoryBalancesQuery,
  useGetInventoryLedgerQuery,
  useGetInventoryConfirmationsQuery,
  useGetInventoryConfirmationQuery,
  useLazyGetInventoryConfirmationQuery,
} = inventoryFoundationApiSlice;
