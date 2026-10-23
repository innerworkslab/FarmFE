// src/redux/features/setup/AnimalApiSlice.ts

import { farmApi } from "@/redux/services/farmApi";

export interface Animal {
  id: number;
  code: string;
  name: string;
  type?: string;
  category?: string;
  breed?: string;
  animal_type_id?: number;
  animal_category_id?: number;
  animal_breed_id?: number;
  animal_type?: { id: number; name: string };
  animal_category?: { id: number; name: string };
  animal_breed?: { id: number; name: string };
  gender: "male" | "female" | "mixed";
  tracking_type: "individual" | "batch";
  ear_tag_rfid_number?: string | null;
  batch_flock_number?: string | null;
  color_marking?: string | null;
  photo_path?: string | null;
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
  animal_type_id: number;
  animal_category_id: number;
  animal_breed_id: number;
  gender: "male" | "female" | "mixed";
  tracking_type: "individual" | "batch";
  ear_tag_rfid_number?: string | null;
  batch_flock_number?: string | null;
  color_marking?: string;
  photo_path?: string | null;
}

export interface AnimalListParams {
  per_page?: number;
  page?: number;
  search?: string;
  animal_type_id?: number;
  animal_category_id?: number;
  animal_breed_id?: number;
  tracking_type?: "individual" | "batch";
}

export const animalApiSlice = farmApi.injectEndpoints({
  endpoints: (builder) => ({
    getAnimals: builder.query<
      AnimalListResponse,
      AnimalListParams | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.per_page) queryParams.append("per_page", params.per_page.toString());
        if (params?.page) queryParams.append("page", params.page.toString());
        if (params?.search) queryParams.append("search", params.search);
        if (params?.animal_type_id) queryParams.append("animal_type_id", String(params.animal_type_id));
        if (params?.animal_category_id) queryParams.append("animal_category_id", String(params.animal_category_id));
        if (params?.animal_breed_id) queryParams.append("animal_breed_id", String(params.animal_breed_id));
        if (params?.tracking_type) queryParams.append("tracking_type", params.tracking_type);
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
