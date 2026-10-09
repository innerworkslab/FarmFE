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

export interface PurchaseInvoiceLinePayload {
  category: "food" | "medicine" | string;
  item_id: number;
  purchase_uom_id: number;
  stock_uom_id: number;
  conversion_factor: number;
  quantity: number;
  unit_price: number;
  discount_type?: "percentage" | "amount" | string;
  discount_value?: number;
  foc_type?: "quantity" | "amount" | string;
  foc_value?: number;
  tax_rate?: number;
  target_inventory_id?: number;
  target_farm_information_id?: number;
  target_location?: string;
  metadata?: Record<string, unknown>;
}

export interface PurchaseInvoicePayload {
  invoice_number?: string;
  invoice_date: string;
  supplier_id: number;
  branch_id: number;
  notes?: string | null;
  lines: PurchaseInvoiceLinePayload[];
}

export interface PurchaseInvoiceLine extends PurchaseInvoiceLinePayload {
  id: number;
  [key: string]: unknown;
}

export interface PurchaseInvoice {
  id: number;
  invoice_number: string;
  invoice_date: string;
  supplier_id: number;
  branch_id: number;
  status?: string;
  notes?: string | null;
  lines?: PurchaseInvoiceLine[];
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface PurchaseReceiptLinePayload {
  purchase_invoice_line_id: number;
  accepted_quantity: number;
  accepted_foc_quantity?: number;
  rejected_quantity?: number;
  target_inventory_id?: number;
  target_farm_information_id?: number;
  target_location?: string;
  metadata?: Record<string, unknown>;
  supplier_batch_number?: string | null;
  receipt_lot_number?: string | null;
  manufacturing_date?: string | null;
  expiry_date?: string | null;
  cold_chain_required?: boolean;
  cold_chain_status?: "breached" | "ok" | string;
  observed_temperature?: number;
  temperature_uom?: string;
  exception_reason?: string | null;
}

export interface PurchaseReceiptPayload {
  receipt_number?: string;
  purchase_invoice_id: number;
  receipt_date: string;
  idempotency_key: string;
  notes?: string | null;
  lines: PurchaseReceiptLinePayload[];
}

export interface PurchaseReceiptLine extends PurchaseReceiptLinePayload {
  id: number;
  category?: string;
  [key: string]: unknown;
}

export interface PurchaseReceipt {
  id: number;
  receipt_number: string;
  purchase_invoice_id: number;
  receipt_date: string;
  status?: string;
  idempotency_key?: string;
  notes?: string | null;
  lines?: PurchaseReceiptLine[];
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export const purchasingFoundationApiSlice = farmApi.injectEndpoints({
  endpoints: (builder) => ({
    getPurchaseInvoices: builder.query<PaginatedResponse<PurchaseInvoice>, QueryParams | void>({
      query: (params) => withQuery("purchasing/invoices", params || undefined),
      providesTags: ["purchaseInvoices"],
    }),

    createPurchaseInvoice: builder.mutation<
      SingleResponse<PurchaseInvoice>,
      PurchaseInvoicePayload
    >({
      query: (body) => ({
        url: "purchasing/invoices",
        method: "POST",
        body,
      }),
      invalidatesTags: ["purchaseInvoices"],
    }),

    getPurchaseInvoice: builder.query<SingleResponse<PurchaseInvoice>, number | string>({
      query: (id) => `purchasing/invoices/${id}`,
      providesTags: ["purchaseInvoices"],
    }),

    updatePurchaseInvoice: builder.mutation<
      SingleResponse<PurchaseInvoice>,
      { id: number | string; body: PurchaseInvoicePayload }
    >({
      query: ({ id, body }) => ({
        url: `purchasing/invoices/${id}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["purchaseInvoices"],
    }),

    cancelPurchaseInvoice: builder.mutation<
      SingleResponse<PurchaseInvoice>,
      { id: number | string; reason: string }
    >({
      query: ({ id, reason }) => ({
        url: `purchasing/invoices/${id}/cancel`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["purchaseInvoices"],
    }),

    getPurchaseReceipts: builder.query<PaginatedResponse<PurchaseReceipt>, QueryParams | void>({
      query: (params) => withQuery("purchasing/receipts", params || undefined),
      providesTags: ["purchaseReceipts"],
    }),

    createPurchaseReceipt: builder.mutation<
      SingleResponse<PurchaseReceipt>,
      PurchaseReceiptPayload
    >({
      query: (body) => ({
        url: "purchasing/receipts",
        method: "POST",
        body,
      }),
      invalidatesTags: ["purchaseReceipts"],
    }),

    getPurchaseReceipt: builder.query<SingleResponse<PurchaseReceipt>, number | string>({
      query: (id) => `purchasing/receipts/${id}`,
      providesTags: ["purchaseReceipts"],
    }),

    confirmPurchaseReceipt: builder.mutation<SingleResponse<PurchaseReceipt>, number | string>({
      query: (id) => ({
        url: `purchasing/receipts/${id}/confirm`,
        method: "POST",
      }),
      invalidatesTags: [
        "purchaseReceipts",
        "purchaseInvoices",
        "inventoryBalances",
        "inventoryLedger",
        "farmNavigation",
        "farmAnimalViews",
        "farmReports",
        "farmAlerts",
      ],
    }),
  }),
});

export const {
  useGetPurchaseInvoicesQuery,
  useCreatePurchaseInvoiceMutation,
  useGetPurchaseInvoiceQuery,
  useLazyGetPurchaseInvoiceQuery,
  useUpdatePurchaseInvoiceMutation,
  useCancelPurchaseInvoiceMutation,
  useGetPurchaseReceiptsQuery,
  useCreatePurchaseReceiptMutation,
  useGetPurchaseReceiptQuery,
  useLazyGetPurchaseReceiptQuery,
  useConfirmPurchaseReceiptMutation,
} = purchasingFoundationApiSlice;
