import { farmApi } from "@/redux/services/farmApi";

type Id = number | string;
type QueryValue = string | number | undefined;
const queryString = (values: Record<string, QueryValue>) => {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  return params.size ? `?${params.toString()}` : "";
};

export interface SaleCustomer {
  id: number; code: string; name: string; contact_person?: string | null;
  phone_number?: string | null; preferred_branch_id?: number | null;
  price_level?: string | null; payment_terms?: string | null; credit_limit?: string | number;
  township?: string | null; state_region?: string | null; delivery_address?: string | null;
}
export interface SaleFarm { id: number; name: string; branch_id: number; branch?: { id: number; name: string } }
export interface SaleBatch {
  id: number; batch_number?: string; animal_type?: string; item_name?: string;
  branch_id: number; farm_information_id: number; on_hand_quantity: number | string;
  reserved_quantity: number | string; available_quantity: number | string; health_status?: string | null;
  item?: { id?: number; name?: string; code?: string } | null;
}
export interface Sale {
  id: number; sale_number: string; idempotency_key: string; branch_id: number;
  farm_information_id: number; inventory_balance_id: number; customer_id: number;
  sale_date: string; quantity: number | string; foc_quantity: number | string;
  unit_price: number | string; discount_type: string; discount_value: number | string;
  gross_amount: number | string; discount_amount: number | string; total_amount: number | string;
  paid_amount: number | string; ar_amount: number | string; payment_status: string; status: string;
  customer_snapshot?: Record<string, unknown> | null; cashbook_id?: number | null; cash_category_id?: number | null;
  cancellation_reason?: string | null; confirmed_at?: string | null; cancelled_at?: string | null;
  customer?: SaleCustomer; farm?: SaleFarm; balance?: SaleBatch; receivable_entries?: ReceivableEntry[];
  [key: string]: unknown;
}
export interface ReceivableEntry {
  id: number; customer_id: number; sale_id: number; branch_id: number;
  cashbook_transaction_id?: number | null; entry_type: string; amount: number | string;
  reference: string; idempotency_key: string; created_at: string;
}
export interface SalePayload {
  idempotency_key?: string; branch_id?: number; farm_information_id?: number;
  inventory_balance_id?: number; customer_id?: number; quantity?: number;
  foc_quantity?: number; unit_price?: number | string; discount_type?: string;
  discount_value?: number | string; paid_amount?: number | string;
  cashbook_id?: number | null; cash_category_id?: number | null;
}
export interface SalesQuery {
  branch_id?: Id | ""; farm_information_id?: Id | ""; status?: string;
  payment_status?: string; search?: string; per_page?: number; page?: number;
}
interface One<T> { data: T; message?: string }
interface Many<T> { data: T[]; meta?: Record<string, unknown>; links?: Record<string, unknown> }
export interface SaleInvoice {
  document_type: string; sale: Sale; customer: Record<string, unknown>;
  farm: string | SaleFarm; batch: string | Record<string, unknown>;
  [key: string]: unknown;
}

export const salesApiSlice = farmApi.injectEndpoints({
  endpoints: (builder) => ({
    getSales: builder.query<Many<Sale>, SalesQuery>({
      query: (params) => `sales${queryString({ ...params })}`, providesTags: ["sales"],
    }),
    getSale: builder.query<One<Sale>, Id>({
      query: (id) => `sales/${id}`, providesTags: ["sales"],
    }),
    getSaleCustomers: builder.query<Many<SaleCustomer>, { branch_id: Id; search?: string }>({
      query: (params) => `sales/customers${queryString(params)}`, providesTags: ["sales"],
    }),
    getSaleFarms: builder.query<Many<SaleFarm>, { branch_id: Id }>({
      query: (params) => `sales/farms${queryString(params)}`, providesTags: ["sales"],
    }),
    getSaleBatches: builder.query<Many<SaleBatch>, { farm_information_id: Id }>({
      query: (params) => `sales/batches${queryString(params)}`, providesTags: ["sales"],
    }),
    createSale: builder.mutation<One<Sale>, SalePayload>({
      query: (body) => ({ url: "sales", method: "POST", body }), invalidatesTags: ["sales"],
    }),
    updateSale: builder.mutation<One<Sale>, { id: Id; body: Partial<SalePayload> }>({
      query: ({ id, body }) => ({ url: `sales/${id}`, method: "POST", body }), invalidatesTags: ["sales"],
    }),
    confirmSale: builder.mutation<One<Sale>, Id>({
      query: (id) => ({ url: `sales/${id}/confirm`, method: "POST", body: {} }), invalidatesTags: ["sales", "inventoryBalances", "cashbooks", "cashbookTransactions"],
    }),
    getSaleInvoice: builder.query<One<SaleInvoice>, Id>({
      query: (id) => `sales/${id}/invoice`, providesTags: ["sales"],
    }),
    applySaleReceipt: builder.mutation<One<Sale>, { id: Id; body: { amount: number | string; cashbook_id: number; cash_category_id: number; idempotency_key: string } }>({
      query: ({ id, body }) => ({ url: `sales/${id}/receipts`, method: "POST", body }), invalidatesTags: ["sales", "cashbooks", "cashbookTransactions", "cashbookLedger", "cashbookReports"],
    }),
    cancelSale: builder.mutation<One<Sale>, { id: Id; reason: string }>({
      query: ({ id, reason }) => ({ url: `sales/${id}/cancel`, method: "POST", body: { reason } }), invalidatesTags: ["sales", "inventoryBalances", "cashbooks", "cashbookTransactions", "cashbookLedger"],
    }),
    deleteSale: builder.mutation<{ message: string }, Id>({
      query: (id) => ({ url: `sales/${id}`, method: "DELETE" }), invalidatesTags: ["sales"],
    }),
  }),
});

export const {
  useGetSalesQuery, useGetSaleQuery, useGetSaleCustomersQuery, useGetSaleFarmsQuery,
  useGetSaleBatchesQuery, useCreateSaleMutation, useUpdateSaleMutation,
  useConfirmSaleMutation, useGetSaleInvoiceQuery, useApplySaleReceiptMutation,
  useCancelSaleMutation, useDeleteSaleMutation,
} = salesApiSlice;
