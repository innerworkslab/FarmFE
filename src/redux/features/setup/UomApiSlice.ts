// src/redux/features/setup/UomApiSlice.ts

import { farmApi } from "@/redux/services/farmApi";

export interface Uom {
  id: number;
  code: string;
  name: string;
  symbol: string;
  category: "weight" | "volume" | "count" | "length" | string;
  status: "active" | "inactive";
  version?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface UomListResponse {
  data: Uom[];
  links?: Record<string, unknown>;
  meta?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
    [key: string]: unknown;
  };
}

export interface SingleUomResponse {
  data: Uom;
  message?: string;
}

export interface UomPayload {
  code: string;
  name: string;
  symbol: string;
  category: "weight" | "volume" | "count" | "length" | string;
  status?: "active" | "inactive";
}

export const uomApiSlice = farmApi.injectEndpoints({
  endpoints: (builder) => ({
    getUoms: builder.query<
      UomListResponse,
      { per_page?: number; page?: number; search?: string } | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.per_page) queryParams.append("per_page", params.per_page.toString());
        if (params?.page) queryParams.append("page", params.page.toString());
        if (params?.search) queryParams.append("search", params.search);
        const str = queryParams.toString();
        return `setup/uoms${str ? `?${str}` : ""}`;
      },
      providesTags: ["uoms"],
    }),

    getUom: builder.query<SingleUomResponse, number | string>({
      query: (id) => `setup/uoms/${id}`,
      providesTags: ["uoms"],
    }),

    createUom: builder.mutation<SingleUomResponse, UomPayload>({
      query: (payload) => ({
        url: "setup/uoms",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["uoms"],
    }),

    updateUom: builder.mutation<
      SingleUomResponse,
      { id: number | string } & Partial<UomPayload>
    >({
      query: ({ id, ...payload }) => ({
        url: `setup/uoms/${id}`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["uoms"],
    }),

    toggleUomStatus: builder.mutation<SingleUomResponse, number | string>({
      query: (id) => ({
        url: `setup/uoms/${id}/toggle-status`,
        method: "POST",
      }),
      invalidatesTags: ["uoms"],
    }),

    deleteUom: builder.mutation<{ message: string }, number | string>({
      query: (id) => ({
        url: `setup/uoms/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["uoms"],
    }),
  }),
});

export const {
  useGetUomsQuery,
  useGetUomQuery,
  useCreateUomMutation,
  useUpdateUomMutation,
  useToggleUomStatusMutation,
  useDeleteUomMutation,
} = uomApiSlice;
