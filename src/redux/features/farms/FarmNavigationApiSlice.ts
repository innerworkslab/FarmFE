import { farmApi } from "@/redux/services/farmApi";
import type { FarmAnimalViewRow } from "./FarmAnimalViewApiSlice";

type QueryValue = string | number | null | undefined;
const withQuery = (url: string, params?: Record<string, QueryValue>) => {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  });
  return query.size ? `${url}?${query.toString()}` : url;
};

export interface FarmNavigationItem {
  id: number;
  farm_code: string;
  name: string;
  farm_type?: string | null;
  animal_type?: string | null;
  branch?: { id: number; code: string; name: string; status?: string } | null;
  house_barn?: string | null;
  pen_cage_pond?: string | null;
  animal_count?: number;
  active_batch_count?: number;
  individual_animal_count?: number;
  farm_manager?: { id: number; name: string; email?: string | null } | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FarmPage extends FarmNavigationItem {
  current_animal?: {
    id: number;
    code: string;
    name: string;
    tracking_type?: string | null;
    type?: string | null;
    category?: string | null;
    breed?: string | null;
  } | null;
  metrics?: {
    total_animal_count?: number;
    active_batch_count?: number;
    individual_animal_count?: number;
    sick_animal_count?: number;
    death_count?: number;
    feed_consumption_summary?: {
      today_quantity?: number | string;
      today_cost?: number | string;
      records_today?: number;
    };
    medicine_usage_summary?: {
      today_quantity?: number | string;
      records_today?: number;
      follow_ups_due?: number;
    };
  } | null;
  animals?: FarmAnimalViewRow[];
}

export interface FarmListQuery {
  branch_id?: number | string;
  search?: string;
  animal_type?: string;
  farm_type?: string;
  status?: string;
  per_page?: number;
  page?: number;
}
export interface FarmNavigationAnimalQuery {
  farmId: number | string;
  tracking_type?: string;
  search?: string;
  animal_type?: string;
  breed?: string;
  location?: string;
  per_page?: number;
  page?: number;
}
interface ListResponse<T> {
  data: T[];
  links?: Record<string, unknown>;
  meta?: { current_page?: number; last_page?: number; per_page?: number; total?: number };
}

export const farmNavigationApiSlice = farmApi.injectEndpoints({
  endpoints: (builder) => ({
    getNavigationFarms: builder.query<ListResponse<FarmNavigationItem>, FarmListQuery | void>({
      query: (params) => withQuery("farms", params ? { ...params } : undefined),
      providesTags: ["farmNavigation"],
    }),
    getNavigationFarm: builder.query<{ data: FarmPage }, number | string>({
      query: (id) => `farms/${id}`,
      providesTags: ["farmNavigation"],
    }),
    getNavigationFarmAnimals: builder.query<
      ListResponse<FarmAnimalViewRow>,
      FarmNavigationAnimalQuery
    >({
      query: ({ farmId, ...params }) => withQuery(`farms/${farmId}/animals`, params),
      providesTags: ["farmNavigation"],
    }),
  }),
});

export const {
  useGetNavigationFarmsQuery,
  useGetNavigationFarmQuery,
  useGetNavigationFarmAnimalsQuery,
} = farmNavigationApiSlice;
