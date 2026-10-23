import { farmApi } from "@/redux/services/farmApi";
import type { FarmNavigationItem, FarmPage, FarmListQuery } from "../farms/FarmNavigationApiSlice";
import type { FarmFeeding, FarmFeedingListQuery } from "../farms/FarmFeedingApiSlice";

// Wire models for the ID-based farm location contract.
export interface HouseBarn {
  id: number;
  branch_id: number;
  name: string;
  status: "active" | "inactive";
  version: number | null;
  created_at: string;
  updated_at: string;
}

export interface PenCagePond extends HouseBarn {
  house_barn_id: number | null;
}

export interface FarmLocationRelations {
  house_barn_id: number | null;
  pen_cage_pond_id: number | null;
  house_barn?: HouseBarn | null;
  pen_cage_pond?: PenCagePond | null;
}

export interface FarmInformationRecord extends FarmLocationRelations {
  id: number;
  name: string;
  branch_id: number;
  current_animal_id: number | null;
  responsible_employee_id: number | null;
  version?: number | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  branch?: { id: number; code: string; name: string } | null;
  current_animal?: { id: number; code?: string; name: string } | null;
  responsible_employee?: { id: number; name: string } | null;
}

export interface HouseBarnPayload {
  name: string;
  branch_id: number;
}

export interface PenCagePondPayload extends HouseBarnPayload {
  house_barn_id?: number | null;
}

// A standalone pond can have a null barn. The API requires at least one
// location selection and validates branch, active status and parent membership.
export interface FarmInformationRecordPayload extends HouseBarnPayload {
  house_barn_id: number | null;
  pen_cage_pond_id: number | null;
  current_animal_id?: number | null;
  responsible_employee_id?: number | null;
}

export interface FarmLocationListQuery {
  branch_id?: number | string;
  status?: "active" | "inactive";
  search?: string;
  page?: number;
  per_page?: number;
}

export interface PenCagePondListQuery extends FarmLocationListQuery {
  house_barn_id?: number | string;
}

export interface FarmInformationRecordListQuery {
  branch_id?: number | string;
  house_barn_id?: number | string;
  pen_cage_pond_id?: number | string;
  search?: string;
  page?: number;
  per_page?: number;
}

export type FarmLocationNavigationItem = Omit<FarmNavigationItem, "house_barn" | "pen_cage_pond"> &
  FarmLocationRelations;
export type FarmLocationPage = Omit<FarmPage, "house_barn" | "pen_cage_pond"> &
  FarmLocationRelations;
export type FarmLocationFeeding = Omit<FarmFeeding, "farm"> & {
  farm?: ({ id: number; name: string } & FarmLocationRelations) | null;
};

export interface FarmLocationListResponse<T> {
  data: T[];
  links?: Record<string, unknown>;
  meta?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
    [key: string]: unknown;
  };
}
export interface FarmLocationResponse<T> {
  data: T;
  message?: string;
}
type Id = number | string;

const withQuery = (url: string, params?: object | void) => {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  });
  return query.size ? `${url}?${query.toString()}` : url;
};

// Refresh screens whose embedded location names or farm membership changed.
const locationTags = [
  "farmLocations",
  "farmInformation",
  "farmNavigation",
  "farmFeedings",
  "farmAnimalViews",
] as const;

export const farmLocationsApiSlice = farmApi.injectEndpoints({
  endpoints: (builder) => ({
    getLocationNavigationFarms: builder.query<
      FarmLocationListResponse<FarmLocationNavigationItem>,
      FarmListQuery | void
    >({
      query: (params) => withQuery("farms", params),
      providesTags: ["farmNavigation", "farmLocations"],
    }),
    getLocationNavigationFarm: builder.query<FarmLocationResponse<FarmLocationPage>, Id>({
      query: (id) => `farms/${id}`,
      providesTags: ["farmNavigation", "farmLocations"],
    }),
    getLocationFarmFeedings: builder.query<
      FarmLocationListResponse<FarmLocationFeeding>,
      FarmFeedingListQuery | void
    >({
      query: (params) => withQuery("farms/feedings", params),
      providesTags: ["farmFeedings", "farmLocations"],
    }),
    getHouseBarns: builder.query<FarmLocationListResponse<HouseBarn>, FarmLocationListQuery | void>(
      {
        query: (params) => withQuery("setup/house-barns", params),
        providesTags: locationTags,
      }
    ),
    getHouseBarn: builder.query<FarmLocationResponse<HouseBarn>, Id>({
      query: (id) => `setup/house-barns/${id}`,
      providesTags: locationTags,
    }),
    createHouseBarn: builder.mutation<FarmLocationResponse<HouseBarn>, HouseBarnPayload>({
      query: (body) => ({ url: "setup/house-barns", method: "POST", body }),
      invalidatesTags: locationTags,
    }),
    updateHouseBarn: builder.mutation<
      FarmLocationResponse<HouseBarn>,
      { id: Id; body: Partial<HouseBarnPayload> }
    >({
      query: ({ id, body }) => ({ url: `setup/house-barns/${id}`, method: "POST", body }),
      invalidatesTags: locationTags,
    }),
    deleteHouseBarn: builder.mutation<{ message: string }, Id>({
      query: (id) => ({ url: `setup/house-barns/${id}`, method: "DELETE" }),
      invalidatesTags: locationTags,
    }),
    toggleHouseBarnStatus: builder.mutation<FarmLocationResponse<HouseBarn>, Id>({
      query: (id) => ({ url: `setup/house-barns/${id}/toggle-status`, method: "POST" }),
      invalidatesTags: locationTags,
    }),
    getPenCagePonds: builder.query<
      FarmLocationListResponse<PenCagePond>,
      PenCagePondListQuery | void
    >({
      query: (params) => withQuery("setup/pen-cage-ponds", params),
      providesTags: locationTags,
    }),
    getPenCagePond: builder.query<FarmLocationResponse<PenCagePond>, Id>({
      query: (id) => `setup/pen-cage-ponds/${id}`,
      providesTags: locationTags,
    }),
    createPenCagePond: builder.mutation<FarmLocationResponse<PenCagePond>, PenCagePondPayload>({
      query: (body) => ({ url: "setup/pen-cage-ponds", method: "POST", body }),
      invalidatesTags: locationTags,
    }),
    updatePenCagePond: builder.mutation<
      FarmLocationResponse<PenCagePond>,
      { id: Id; body: Partial<PenCagePondPayload> }
    >({
      query: ({ id, body }) => ({ url: `setup/pen-cage-ponds/${id}`, method: "POST", body }),
      invalidatesTags: locationTags,
    }),
    deletePenCagePond: builder.mutation<{ message: string }, Id>({
      query: (id) => ({ url: `setup/pen-cage-ponds/${id}`, method: "DELETE" }),
      invalidatesTags: locationTags,
    }),
    togglePenCagePondStatus: builder.mutation<FarmLocationResponse<PenCagePond>, Id>({
      query: (id) => ({ url: `setup/pen-cage-ponds/${id}/toggle-status`, method: "POST" }),
      invalidatesTags: locationTags,
    }),
    getFarmInformationRecords: builder.query<
      FarmLocationListResponse<FarmInformationRecord>,
      FarmInformationRecordListQuery | void
    >({
      query: (params) => withQuery("setup/farm-information", params),
      providesTags: locationTags,
    }),
    getFarmInformationRecord: builder.query<FarmLocationResponse<FarmInformationRecord>, Id>({
      query: (id) => `setup/farm-information/${id}`,
      providesTags: locationTags,
    }),
    createFarmInformationRecord: builder.mutation<
      FarmLocationResponse<FarmInformationRecord>,
      FarmInformationRecordPayload
    >({
      query: (body) => ({ url: "setup/farm-information", method: "POST", body }),
      invalidatesTags: locationTags,
    }),
    updateFarmInformationRecord: builder.mutation<
      FarmLocationResponse<FarmInformationRecord>,
      { id: Id; body: Partial<FarmInformationRecordPayload> }
    >({
      query: ({ id, body }) => ({ url: `setup/farm-information/${id}`, method: "POST", body }),
      invalidatesTags: locationTags,
    }),
    deleteFarmInformationRecord: builder.mutation<{ message: string }, Id>({
      query: (id) => ({ url: `setup/farm-information/${id}`, method: "DELETE" }),
      invalidatesTags: locationTags,
    }),
  }),
});

export const {
  useGetLocationNavigationFarmsQuery,
  useGetLocationNavigationFarmQuery,
  useGetLocationFarmFeedingsQuery,
  useGetHouseBarnsQuery,
  useGetHouseBarnQuery,
  useLazyGetHouseBarnQuery,
  useCreateHouseBarnMutation,
  useUpdateHouseBarnMutation,
  useDeleteHouseBarnMutation,
  useToggleHouseBarnStatusMutation,
  useGetPenCagePondsQuery,
  useGetPenCagePondQuery,
  useLazyGetPenCagePondQuery,
  useCreatePenCagePondMutation,
  useUpdatePenCagePondMutation,
  useDeletePenCagePondMutation,
  useTogglePenCagePondStatusMutation,
  useGetFarmInformationRecordsQuery,
  useGetFarmInformationRecordQuery,
  useLazyGetFarmInformationRecordQuery,
  useCreateFarmInformationRecordMutation,
  useUpdateFarmInformationRecordMutation,
  useDeleteFarmInformationRecordMutation,
} = farmLocationsApiSlice;
