// src/redux/features/setup/AnimalApiSlice.ts

import { farmApi } from "@/redux/services/farmApi";

export interface Animal {
  id: number;
  code: string;
  name: string;
  type: "cattle" | "poultry" | "swine" | "other" | string;
  category: string;
  breed: string;
  gender: "male" | "female" | "mixed";
  tracking_type: "individual" | "batch";
  batch_flock_number?: string | null;
  version?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface AnimalListResponse {
  data: Animal[];
  links?: Record<string, unknown>;
  meta?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
    [key: string]: unknown;
  };
}

export interface SingleAnimalResponse {
  data: Animal;
  message?: string;
}

export interface AnimalPayload {
  code: string;
  name: string;
  type: string;
  category: string;
  breed: string;
  gender: "male" | "female" | "mixed";
  tracking_type: "individual" | "batch";
  batch_flock_number?: string;
}

export const animalApiSlice = farmApi.injectEndpoints({
  endpoints: (builder) => ({
    getAnimals: builder.query<
      AnimalListResponse,
      { per_page?: number; page?: number; search?: string } | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.per_page) queryParams.append("per_page", params.per_page.toString());
        if (params?.page) queryParams.append("page", params.page.toString());
        if (params?.search) queryParams.append("search", params.search);
        const str = queryParams.toString();
        return `setup/animals${str ? `?${str}` : ""}`;
      },
      providesTags: ["animals"],
    }),

    getAnimal: builder.query<SingleAnimalResponse, number | string>({
      query: (id) => `setup/animals/${id}`,
      providesTags: ["animals"],
    }),

    createAnimal: builder.mutation<SingleAnimalResponse, AnimalPayload>({
      query: (payload) => ({
        url: "setup/animals",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["animals"],
    }),

    updateAnimal: builder.mutation<
      SingleAnimalResponse,
      { id: number | string } & Partial<AnimalPayload>
    >({
      query: ({ id, ...payload }) => ({
        url: `setup/animals/${id}`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["animals"],
    }),

    deleteAnimal: builder.mutation<{ message: string }, number | string>({
      query: (id) => ({
        url: `setup/animals/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["animals"],
    }),
  }),
});

export const {
  useGetAnimalsQuery,
  useGetAnimalQuery,
  useCreateAnimalMutation,
  useUpdateAnimalMutation,
  useDeleteAnimalMutation,
} = animalApiSlice;
