import { farmApi } from "@/redux/services/farmApi";

type QueryValue = string | number | boolean | null | undefined;

const withQuery = (url: string, params?: Record<string, QueryValue>) => {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  });
  return query.size ? `${url}?${query.toString()}` : url;
};

export type FarmAnimalView = "all" | "batch" | "individual";

export interface FarmAnimalViewQuery {
  farmId: number | string;
  view?: FarmAnimalView;
  search?: string;
  animal_type?: string;
  breed?: string;
  location?: string;
  health_status?: string;
  life_stage?: string;
  per_page?: number;
  page?: number;
}

export interface FarmAnimalLocation {
  name?: string | null;
  house_barn?: string | null;
  pen_cage_pond?: string | null;
}

export interface FarmAnimalViewRow {
  id: number;
  item_id?: number | null;
  animal_id?: number | null;
  tracking_type?: string | null;
  display_name?: string | null;
  name?: string | null;
  code?: string | null;
  batch_number?: string | null;
  rfid?: string | null;
  ear_tag?: string | null;
  batch?: { batch_name?: string | null; batch_number?: string | null; initial_animal_count?: number | null; current_animal_count?: number | null } | null;
  individual?: { rfid?: string | null; ear_tag?: string | null; animal_name?: string | null; current_weight?: number | string | null } | null;
  animal_type?: string | null;
  category?: string | null;
  breed?: string | null;
  gender?: string | null;
  color_marking?: string | null;
  age?: string | null;
  life_stage?: string | null;
  average_weight?: number | string | null;
  current_quantity?: number | string | null;
  available_quantity?: number | string | null;
  reserved_quantity?: number | string | null;
  farm_information_id?: number | null;
  inventory_id?: number | null;
  location?: FarmAnimalLocation | null;
  stock_lot_id?: number | null;
  health_status?: string | null;
  animal_status?: string | null;
  can_receive_operations?: boolean;
  actions?: Record<string, { enabled?: boolean; href?: string | null }> | null;
  history_summary?: { latest_food_at?: string | null; latest_medicine_at?: string | null; defects_deaths_count?: number | null } | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface FarmAnimalViewSummary {
  farm?: { id?: number; farm_code?: string; name?: string; branch?: { id?: number; code?: string; name?: string } | null; house_barn?: string | null; pen_cage_pond?: string | null };
  tabs?: Record<FarmAnimalView, number>;
  filter_options?: Record<string, string[]>;
  selected_filters?: Record<string, string | null>;
  actions?: { views?: { key: FarmAnimalView; label: string }[]; row_actions?: string[] };
}

export interface PaginatedFarmAnimals {
  data: FarmAnimalViewRow[];
  links?: Record<string, unknown>;
  meta?: { current_page?: number; last_page?: number; per_page?: number; total?: number };
}

export const farmAnimalViewApiSlice = farmApi.injectEndpoints({
  endpoints: (builder) => ({
    getFarmAnimalViewSummary: builder.query<{ data: FarmAnimalViewSummary }, FarmAnimalViewQuery>({
      query: ({ farmId, ...params }) => withQuery(`farms/${farmId}/animal-view-summary`, params),
      providesTags: ["farmAnimalViews"],
    }),
    getFarmAnimals: builder.query<PaginatedFarmAnimals, FarmAnimalViewQuery>({
      query: ({ farmId, ...params }) => withQuery(`farms/${farmId}/animals`, params),
      providesTags: ["farmAnimalViews"],
    }),
    getFarmAnimal: builder.query<{ data: FarmAnimalViewRow }, { farmId: number | string; animalBalanceId: number | string }>({
      query: ({ farmId, animalBalanceId }) => `farms/${farmId}/animals/${animalBalanceId}`,
      providesTags: ["farmAnimalViews"],
    }),
  }),
});

export const { useGetFarmAnimalViewSummaryQuery, useGetFarmAnimalsQuery, useLazyGetFarmAnimalQuery } = farmAnimalViewApiSlice;
