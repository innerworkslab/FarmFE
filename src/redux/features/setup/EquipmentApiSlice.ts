// src/redux/features/setup/EquipmentApiSlice.ts

import { farmApi } from "@/redux/services/farmApi";

export interface Equipment {
  id: number;
  code: string;
  name: string;
  category: "weighing" | "feeding" | "transport" | "other" | string;
  brand: string;
  model: string;
  serial_number?: string | null;
  manufacturer?: string | null;
  supplier_id?: number | null;
  purchase_cost: string | number;
  attachment_path?: string | null;
  version?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  supplier?: { id: number; name: string } | null;
}

export interface EquipmentListResponse {
  data: Equipment[];
  links?: Record<string, unknown>;
  meta?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
    [key: string]: unknown;
  };
}

export interface SingleEquipmentResponse {
  data: Equipment;
  message?: string;
}

export interface EquipmentPayload {
  code: string;
  name: string;
  category: string;
  brand: string;
  model: string;
  purchase_cost: number;
  serial_number?: string;
  manufacturer?: string;
  supplier_id?: number | null;
}

export const equipmentApiSlice = farmApi.injectEndpoints({
  endpoints: (builder) => ({
    getEquipmentList: builder.query<
      EquipmentListResponse,
      { per_page?: number; page?: number; search?: string } | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.per_page) queryParams.append("per_page", params.per_page.toString());
        if (params?.page) queryParams.append("page", params.page.toString());
        if (params?.search) queryParams.append("search", params.search);
        const str = queryParams.toString();
        return `setup/equipment${str ? `?${str}` : ""}`;
      },
      providesTags: ["equipment"],
    }),

    getEquipment: builder.query<SingleEquipmentResponse, number | string>({
      query: (id) => `setup/equipment/${id}`,
      providesTags: ["equipment"],
    }),

    createEquipment: builder.mutation<SingleEquipmentResponse, EquipmentPayload>({
      query: (payload) => ({
        url: "setup/equipment",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["equipment"],
    }),

    updateEquipment: builder.mutation<
      SingleEquipmentResponse,
      { id: number | string; body?: Partial<EquipmentPayload> } & Partial<EquipmentPayload>
    >({
      query: ({ id, body, ...rest }) => ({
        url: `setup/equipment/${id}`,
        method: "POST",
        body: body || rest,
      }),
      invalidatesTags: ["equipment"],
    }),

    deleteEquipment: builder.mutation<{ message: string }, number | string>({
      query: (id) => ({
        url: `setup/equipment/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["equipment"],
    }),
  }),
});

export const {
  useGetEquipmentListQuery,
  useGetEquipmentQuery,
  useCreateEquipmentMutation,
  useUpdateEquipmentMutation,
  useDeleteEquipmentMutation,
} = equipmentApiSlice;
