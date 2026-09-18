// src/redux/features/setup/FoodApiSlice.ts

import { farmApi } from "@/redux/services/farmApi";

export interface Food {
  id: number;
  code: string;
  name: string;
  category: "feed" | "supplement" | "other" | string;
  target_animal_type?: string | null;
  purchase_price: string | number;
  uom_conversion: number;
  consumption_uom_id: number;
  purchase_uom_id: number;
  stock_uom_id: number;
  default_supplier_id?: number | null;
  batch_tracking: boolean;
  expiry_tracking: boolean;
  status: "active" | "inactive";
  version?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  consumption_uom?: { id: number; name: string; symbol: string };
  purchase_uom?: { id: number; name: string; symbol: string };
  stock_uom?: { id: number; name: string; symbol: string };
  default_supplier?: { id: number; name: string; code: string } | null;
}

export interface FoodListResponse {
  data: Food[];
  links?: Record<string, unknown>;
  meta?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
    [key: string]: unknown;
  };
}

export interface SingleFoodResponse {
  data: Food;
  message?: string;
}

export interface FoodPayload {
  code: string;
  name: string;
  category: string;
  target_animal_type?: string | null;
  purchase_price?: number;
  uom_conversion: number;
  consumption_uom_id: number;
  purchase_uom_id: number;
  stock_uom_id: number;
  default_supplier_id?: number | null;
  batch_tracking: boolean;
  expiry_tracking: boolean;
  status?: "active" | "inactive";
}

export const foodApiSlice = farmApi.injectEndpoints({
  endpoints: (builder) => ({
    getFoods: builder.query<
      FoodListResponse,
      { per_page?: number; page?: number; search?: string } | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.per_page) queryParams.append("per_page", params.per_page.toString());
        if (params?.page) queryParams.append("page", params.page.toString());
        if (params?.search) queryParams.append("search", params.search);
        const str = queryParams.toString();
        return `setup/foods${str ? `?${str}` : ""}`;
      },
      providesTags: ["foods"],
    }),

    getFood: builder.query<SingleFoodResponse, number | string>({
      query: (id) => `setup/foods/${id}`,
      providesTags: ["foods"],
    }),

    createFood: builder.mutation<SingleFoodResponse, FoodPayload>({
      query: (payload) => ({
        url: "setup/foods",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["foods"],
    }),

    updateFood: builder.mutation<
      SingleFoodResponse,
      { id: number | string } & Partial<FoodPayload>
    >({
      query: ({ id, ...payload }) => ({
        url: `setup/foods/${id}`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["foods"],
    }),

    toggleFoodStatus: builder.mutation<SingleFoodResponse, number | string>({
      query: (id) => ({
        url: `setup/foods/${id}/toggle-status`,
        method: "POST",
      }),
      invalidatesTags: ["foods"],
    }),

    deleteFood: builder.mutation<{ message: string }, number | string>({
      query: (id) => ({
        url: `setup/foods/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["foods"],
    }),
  }),
});

export const {
  useGetFoodsQuery,
  useGetFoodQuery,
  useCreateFoodMutation,
  useUpdateFoodMutation,
  useToggleFoodStatusMutation,
  useDeleteFoodMutation,
} = foodApiSlice;
