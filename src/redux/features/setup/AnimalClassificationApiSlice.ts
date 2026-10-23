import { farmApi } from "@/redux/services/farmApi";

export type AnimalClassificationKind = "animal-types" | "animal-categories" | "animal-breeds";

export interface AnimalClassification {
  id: number;
  name: string;
  animal_type_id?: number;
  animal_type?: { id: number; name: string; status?: string };
  status: "active" | "inactive" | string;
  version?: number;
}

export interface AnimalClassificationList {
  data: AnimalClassification[];
  meta?: { total?: number; current_page?: number; last_page?: number };
}

type ClassificationBody = { name: string; animal_type_id?: number };
type ListArgs = { status?: string; per_page?: number; animal_type_id?: number } | void;

const queryString = (params?: ListArgs) => {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.per_page) query.set("per_page", String(params.per_page));
  if (params?.animal_type_id) query.set("animal_type_id", String(params.animal_type_id));
  const value = query.toString();
  return value ? `?${value}` : "";
};

export const animalClassificationApi = farmApi.injectEndpoints({
  endpoints: (builder) => ({
    getAnimalClassifications: builder.query<AnimalClassificationList, { kind: AnimalClassificationKind; params?: ListArgs }>({
      query: ({ kind, params }) => `setup/${kind}${queryString(params)}`,
      providesTags: ["animalClassifications"],
    }),
    createAnimalClassification: builder.mutation<{ data: AnimalClassification }, { kind: AnimalClassificationKind; body: ClassificationBody }>({
      query: ({ kind, body }) => ({ url: `setup/${kind}`, method: "POST", body }),
      invalidatesTags: ["animalClassifications"],
    }),
    updateAnimalClassification: builder.mutation<{ data: AnimalClassification }, { kind: AnimalClassificationKind; id: number; body: ClassificationBody }>({
      query: ({ kind, id, body }) => ({ url: `setup/${kind}/${id}`, method: "POST", body }),
      invalidatesTags: ["animalClassifications"],
    }),
    toggleAnimalClassification: builder.mutation<{ data: AnimalClassification }, { kind: AnimalClassificationKind; id: number }>({
      query: ({ kind, id }) => ({ url: `setup/${kind}/${id}/toggle-status`, method: "POST" }),
      invalidatesTags: ["animalClassifications"],
    }),
    deleteAnimalClassification: builder.mutation<{ message: string }, { kind: AnimalClassificationKind; id: number }>({
      query: ({ kind, id }) => ({ url: `setup/${kind}/${id}`, method: "DELETE" }),
      invalidatesTags: ["animalClassifications"],
    }),
  }),
});

export const {
  useGetAnimalClassificationsQuery,
  useCreateAnimalClassificationMutation,
  useUpdateAnimalClassificationMutation,
  useToggleAnimalClassificationMutation,
  useDeleteAnimalClassificationMutation,
} = animalClassificationApi;
