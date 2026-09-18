import { farmApi } from "@/redux/services/farmApi";

export interface Customer {
  id: number;
  code: string;
  name: string;
  type: "retail" | "wholesale" | string;
  phone_number: string;
  state_region?: string | null;
  township?: string | null;
  payment_terms?: string | null;
  price_level?: "standard" | "wholesale" | "vip" | string;
  opening_balance?: string | number;
  delivery_address?: string | null;
  credit_limit?: string | number;
  preferred_branch_id?: number | null;
  status: "active" | "inactive" | string;
  version?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  preferred_branch?: {
    id: number;
    code: string;
    name: string;
  } | null;
}

export interface CustomerListResponse {
  data: Customer[];
  links?: Record<string, unknown>;
  meta?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
    [key: string]: unknown;
  };
}

export interface SingleCustomerResponse {
  data: Customer;
  message?: string;
}

export interface CreateCustomerPayload {
  code: string;
  name: string;
  type: "retail" | "wholesale" | string;
  phone_number: string;
  state_region?: string;
  township?: string;
  payment_terms?: string;
  price_level?: string;
  opening_balance?: number;
  delivery_address?: string;
  credit_limit?: number;
  preferred_branch_id?: number | null;
  status?: "active" | "inactive" | string;
}

export type CustomerPayload = CreateCustomerPayload;

export interface UpdateCustomerPayload {
  code?: string;
  name?: string;
  type?: string;
  phone_number?: string;
  state_region?: string;
  township?: string;
  payment_terms?: string;
  price_level?: string;
  opening_balance?: number;
  delivery_address?: string;
  credit_limit?: number;
  preferred_branch_id?: number | null;
  status?: string;
}

export const customerApiSlice = farmApi.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query<
      CustomerListResponse,
      { page?: number; per_page?: number; search?: string } | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append("page", params.page.toString());
        if (params?.per_page) queryParams.append("per_page", params.per_page.toString());
        if (params?.search) queryParams.append("search", params.search);
        const str = queryParams.toString();
        return `setup/customers${str ? `?${str}` : ""}`;
      },
      providesTags: ["customers"],
    }),

    getCustomer: builder.query<SingleCustomerResponse, number | string>({
      query: (id) => `setup/customers/${id}`,
      providesTags: ["customers"],
    }),

    createCustomer: builder.mutation<SingleCustomerResponse, CreateCustomerPayload>({
      query: (payload) => ({
        url: "setup/customers",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["customers"],
    }),

    updateCustomer: builder.mutation<
      SingleCustomerResponse,
      { id: number | string; body?: Partial<UpdateCustomerPayload> } & Partial<UpdateCustomerPayload>
    >({
      query: ({ id, body, ...rest }) => ({
        url: `setup/customers/${id}`,
        method: "POST",
        body: body || rest,
      }),
      invalidatesTags: ["customers"],
    }),

    toggleCustomerStatus: builder.mutation<SingleCustomerResponse, number | string>({
      query: (id) => ({
        url: `setup/customers/${id}/toggle-status`,
        method: "POST",
      }),
      invalidatesTags: ["customers"],
    }),

    deleteCustomer: builder.mutation<{ message: string }, number | string>({
      query: (id) => ({
        url: `setup/customers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["customers"],
    }),
  }),
});

export const {
  useGetCustomersQuery,
  useGetCustomerQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useToggleCustomerStatusMutation,
  useDeleteCustomerMutation,
} = customerApiSlice;
