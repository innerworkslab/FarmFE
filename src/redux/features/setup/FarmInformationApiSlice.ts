// src/redux/features/setup/FarmInformationApiSlice.ts

import { farmApi } from "@/redux/services/farmApi";

export interface FarmInformation {
  id: number;
  name: string;
  branch_id: number;
  house_barn: string;
  pen_cage_pond: string;
  current_animal_id?: number | null;
  responsible_employee_id?: number | null;
  version?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  branch?: {
    id: number;
    code: string;
    name: string;
    phone_number?: string;
  };
}

export interface FarmInformationListResponse {
  data: FarmInformation[];
  links?: Record<string, unknown>;
  meta?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
    [key: string]: unknown;
  };
}

export interface SingleFarmInformationResponse {
  data: FarmInformation;
  message?: string;
}

export interface FarmInformationPayload {
  name: string;
  branch_id: number;
  house_barn: string;
  pen_cage_pond: string;
}

export const farmInformationApiSlice = farmApi.injectEndpoints({
  endpoints: (builder) => ({
    getFarmInformationList: builder.query<
      FarmInformationListResponse,
      { per_page?: number; page?: number; search?: string } | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.per_page) queryParams.append("per_page", params.per_page.toString());
        if (params?.page) queryParams.append("page", params.page.toString());
        if (params?.search) queryParams.append("search", params.search);
        const str = queryParams.toString();
        return `setup/farm-information${str ? `?${str}` : ""}`;
      },
      providesTags: ["farmInformation"],
    }),

    getFarmInformation: builder.query<SingleFarmInformationResponse, number | string>({
      query: (id) => `setup/farm-information/${id}`,
      providesTags: ["farmInformation"],
    }),

    createFarmInformation: builder.mutation<
      SingleFarmInformationResponse,
      FarmInformationPayload
    >({
      query: (payload) => ({
        url: "setup/farm-information",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["farmInformation"],
    }),

    updateFarmInformation: builder.mutation<
      SingleFarmInformationResponse,
      { id: number | string; body?: Partial<FarmInformationPayload> } & Partial<FarmInformationPayload>
    >({
      query: ({ id, body, ...rest }) => ({
        url: `setup/farm-information/${id}`,
        method: "POST",
        body: body || rest,
      }),
      invalidatesTags: ["farmInformation"],
    }),

    deleteFarmInformation: builder.mutation<{ message: string }, number | string>({
      query: (id) => ({
        url: `setup/farm-information/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["farmInformation"],
    }),
  }),
});

export const {
  useGetFarmInformationListQuery,
  useGetFarmInformationQuery,
  useCreateFarmInformationMutation,
  useUpdateFarmInformationMutation,
  useDeleteFarmInformationMutation,
} = farmInformationApiSlice;
