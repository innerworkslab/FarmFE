import { farmApi } from "@/redux/services/farmApi";

export interface Supplier {
  id: number;
  code: string;
  name: string;
  type: "food" | "medicine" | "equipment" | "other" | string;
  phone_number: string;
  preferred_branch_id?: number | null;
  opening_balance_type: string;
  supplied_categories: string[];
  opening_balance?: string | number;
  minimum_order_amount?: string | number | null;
  lead_time_days?: number | null;
  credit_limit?: string | number | null;
  status: "active" | "inactive" | string;
  version?: number;
  created_at: string;
  updated_at: string;
  preferred_branch?: {
    id: number;
    code: string;
    name: string;
  } | null;
}

export interface SupplierListResponse {
  data: Supplier[];
  links?: Record<string, unknown>;
  meta?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
    [key: string]: unknown;
  };
}

export interface SingleSupplierResponse {
  data: Supplier;
}

export interface CreateSupplierPayload {
  code: string;
  name: string;
  type: string;
  phone_number: string;
  preferred_branch_id?: number | null;
  opening_balance_type?: string;
  supplied_categories?: string[];
  opening_balance?: number;
  minimum_order_amount?: number;
  lead_time_days?: number;
  credit_limit?: number;
  status?: string;
}

export type SupplierPayload = CreateSupplierPayload;

export interface UpdateSupplierPayload {
  code?: string;
  name?: string;
  type?: string;
  phone_number?: string;
  status?: string;
  preferred_branch_id?: number | null;
  opening_balance_type?: string;
  supplied_categories?: string[];
  opening_balance?: number;
  minimum_order_amount?: number;
  lead_time_days?: number;
  credit_limit?: number;
}

export const supplierApiSlice = farmApi.injectEndpoints({
  endpoints: (builder) => ({
    getSuppliers: builder.query<
      SupplierListResponse,
      { page?: number; per_page?: number; search?: string } | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append("page", params.page.toString());
        if (params?.per_page) queryParams.append("per_page", params.per_page.toString());
        if (params?.search) queryParams.append("search", params.search);
        const str = queryParams.toString();
        return `setup/suppliers${str ? `?${str}` : ""}`;
      },
      providesTags: ["suppliers"],
    }),

    getSupplier: builder.query<SingleSupplierResponse, number | string>({
      query: (id) => `setup/suppliers/${id}`,
      providesTags: ["suppliers"],
    }),

    createSupplier: builder.mutation<SingleSupplierResponse, CreateSupplierPayload>({
      query: (payload) => ({
        url: "setup/suppliers",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["suppliers"],
    }),

    updateSupplier: builder.mutation<
      SingleSupplierResponse,
      { id: number | string; body?: Partial<UpdateSupplierPayload> } & Partial<UpdateSupplierPayload>
    >({
      query: ({ id, body, ...rest }) => ({
        url: `setup/suppliers/${id}`,
        method: "POST",
        body: body || rest,
      }),
      invalidatesTags: ["suppliers"],
    }),

    toggleSupplierStatus: builder.mutation<SingleSupplierResponse, number | string>({
      query: (id) => ({
        url: `setup/suppliers/${id}/toggle-status`,
        method: "POST",
      }),
      invalidatesTags: ["suppliers"],
    }),

    deleteSupplier: builder.mutation<{ message: string }, number | string>({
      query: (id) => ({
        url: `setup/suppliers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["suppliers"],
    }),
  }),
});

export const {
  useGetSuppliersQuery,
  useGetSupplierQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useToggleSupplierStatusMutation,
  useDeleteSupplierMutation,
} = supplierApiSlice;
