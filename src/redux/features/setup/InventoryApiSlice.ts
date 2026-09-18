// src/redux/features/setup/InventoryApiSlice.ts

import { farmApi } from "@/redux/services/farmApi";

export interface Inventory {
  id: number;
  code: string;
  name: string;
  type: "feed" | "medicine" | "equipment" | "general" | string;
  branch_id: number;
  physical_address: string;
  building_zone?: string | null;
  rack_bin?: string | null;
  allowed_item_categories: string[];
  inventory_gl_account?: string | null;
  status: "active" | "inactive";
  version?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  branch?: {
    id: number;
    code: string;
    name: string;
    phone_number?: string;
    address?: string;
  };
}

export interface InventoryListResponse {
  data: Inventory[];
  links?: Record<string, unknown>;
  meta?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
    [key: string]: unknown;
  };
}

export interface SingleInventoryResponse {
  data: Inventory;
  message?: string;
}

export interface InventoryPayload {
  code: string;
  name: string;
  type: string;
  branch_id: number;
  physical_address: string;
  allowed_item_categories: string[];
  building_zone?: string;
  rack_bin?: string;
  inventory_gl_account?: string;
  status?: "active" | "inactive";
}

export const inventoryApiSlice = farmApi.injectEndpoints({
  endpoints: (builder) => ({
    getInventories: builder.query<
      InventoryListResponse,
      { per_page?: number; page?: number; search?: string } | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.per_page) queryParams.append("per_page", params.per_page.toString());
        if (params?.page) queryParams.append("page", params.page.toString());
        if (params?.search) queryParams.append("search", params.search);
        const str = queryParams.toString();
        return `setup/inventories${str ? `?${str}` : ""}`;
      },
      providesTags: ["inventories"],
    }),

    getInventory: builder.query<SingleInventoryResponse, number | string>({
      query: (id) => `setup/inventories/${id}`,
      providesTags: ["inventories"],
    }),

    createInventory: builder.mutation<SingleInventoryResponse, InventoryPayload>({
      query: (payload) => ({
        url: "setup/inventories",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["inventories"],
    }),

    updateInventory: builder.mutation<
      SingleInventoryResponse,
      { id: number | string; body?: Partial<InventoryPayload> } & Partial<InventoryPayload>
    >({
      query: ({ id, body, ...rest }) => ({
        url: `setup/inventories/${id}`,
        method: "POST",
        body: body || rest,
      }),
      invalidatesTags: ["inventories"],
    }),

    toggleInventoryStatus: builder.mutation<SingleInventoryResponse, number | string>({
      query: (id) => ({
        url: `setup/inventories/${id}/toggle-status`,
        method: "POST",
      }),
      invalidatesTags: ["inventories"],
    }),

    deleteInventory: builder.mutation<{ message: string }, number | string>({
      query: (id) => ({
        url: `setup/inventories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["inventories"],
    }),
  }),
});

export const {
  useGetInventoriesQuery,
  useGetInventoryQuery,
  useCreateInventoryMutation,
  useUpdateInventoryMutation,
  useToggleInventoryStatusMutation,
  useDeleteInventoryMutation,
} = inventoryApiSlice;
