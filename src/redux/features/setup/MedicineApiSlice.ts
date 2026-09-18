// src/redux/features/setup/MedicineApiSlice.ts

import { farmApi } from "@/redux/services/farmApi";

export interface Medicine {
  id: number;
  code: string;
  name: string;
  type: "vaccine" | "antibiotic" | "vitamin" | "other" | string;
  category: "injection" | "oral" | "topical" | string;
  usage_uom_id: number;
  stock_uom_id: number;
  purchase_uom_id?: number;
  uom_conversion: number | string;
  batch_tracking: boolean;
  cold_chain_required: boolean;
  expiry_tracking?: boolean;
  status: "active" | "inactive";
  version?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  usage_uom?: { id: number; name: string; symbol: string; code?: string };
  stock_uom?: { id: number; name: string; symbol: string; code?: string };
  purchase_uom?: { id: number; name: string; symbol: string; code?: string };
}

export interface MedicineListResponse {
  data: Medicine[];
  links?: Record<string, unknown>;
  meta?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
    [key: string]: unknown;
  };
}

export interface SingleMedicineResponse {
  data: Medicine;
  message?: string;
}

export interface MedicinePayload {
  code: string;
  name: string;
  type: string;
  category: string;
  usage_uom_id: number;
  stock_uom_id: number;
  purchase_uom_id?: number;
  uom_conversion: number | string;
  batch_tracking: boolean;
  cold_chain_required: boolean;
  expiry_tracking?: boolean;
  status?: "active" | "inactive";
}

export const medicineApiSlice = farmApi.injectEndpoints({
  endpoints: (builder) => ({
    getMedicines: builder.query<
      MedicineListResponse,
      { per_page?: number; page?: number; search?: string } | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.per_page) queryParams.append("per_page", params.per_page.toString());
        if (params?.page) queryParams.append("page", params.page.toString());
        if (params?.search) queryParams.append("search", params.search);
        const str = queryParams.toString();
        return `setup/medicines${str ? `?${str}` : ""}`;
      },
      providesTags: ["medicines"],
    }),

    getMedicine: builder.query<SingleMedicineResponse, number | string>({
      query: (id) => `setup/medicines/${id}`,
      providesTags: ["medicines"],
    }),

    createMedicine: builder.mutation<SingleMedicineResponse, MedicinePayload>({
      query: (payload) => ({
        url: "setup/medicines",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["medicines"],
    }),

    updateMedicine: builder.mutation<
      SingleMedicineResponse,
      { id: number | string } & Partial<MedicinePayload>
    >({
      query: ({ id, ...payload }) => ({
        url: `setup/medicines/${id}`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["medicines"],
    }),

    toggleMedicineStatus: builder.mutation<SingleMedicineResponse, number | string>({
      query: (id) => ({
        url: `setup/medicines/${id}/toggle-status`,
        method: "POST",
      }),
      invalidatesTags: ["medicines"],
    }),

    deleteMedicine: builder.mutation<{ message: string }, number | string>({
      query: (id) => ({
        url: `setup/medicines/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["medicines"],
    }),
  }),
});

export const {
  useGetMedicinesQuery,
  useGetMedicineQuery,
  useCreateMedicineMutation,
  useUpdateMedicineMutation,
  useToggleMedicineStatusMutation,
  useDeleteMedicineMutation,
} = medicineApiSlice;
