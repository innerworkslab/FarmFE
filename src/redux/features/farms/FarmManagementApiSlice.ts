import { farmApi } from "@/redux/services/farmApi";

type Id = number | string;
type Query = Record<string, string | number | undefined | null>;
const withQuery = (path: string, params?: Query) => {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") query.set(key, String(value));
  });
  return query.size ? `${path}?${query}` : path;
};

export type OperationType = "health" | "weight" | "medication" | "mortality";
export interface FarmOperationPayload {
  type: OperationType;
  branch_id: number;
  farm_information_id: number;
  activity_date: string;
  activity_time?: string;
  idempotency_key: string;
  targets: { animal_balance_id: number; quantity: number }[];
  payload: Record<string, unknown>;
}
export interface FarmOperation extends Omit<FarmOperationPayload, "type"> {
  id: number;
  type: OperationType | "correction";
  reference?: string;
  workflow_state: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}
export interface FarmSettings {
  farm_information_id: number;
  status: "active" | "inactive";
  timezone: string;
  daily_mortality_threshold: number | null;
  cumulative_mortality_threshold: number | null;
  feed_variance_threshold: number | null;
  feed_wastage_threshold: number | null;
  sickness_threshold: number | null;
  expiry_warning_days: number;
  veterinarian_id?: number | null;
}
export interface FeedingPlan {
  id: number;
  plan_date: string;
  animal_balance_id: number;
  food_item_id: number;
  stock_uom_id: number;
  quantity: number | string;
}
export type ReportRow = Record<string, unknown>;
export interface FarmAlert extends ReportRow {
  id?: number;
  type: string;
  alert_date?: string;
  operation_id?: number;
  animal_balance_id?: number;
  investigation_notes?: string | null;
}
export interface FarmNotification extends ReportRow {
  id: number;
  type: string;
  details?: ReportRow;
}
type One<T> = { data: T; message?: string };
type Many<T> = { data: T[]; meta?: Record<string, unknown> };
type FarmQuery = { farmId: Id } & Query;
type Action = { id: Id; reason: string };

export const farmManagementApiSlice = farmApi.injectEndpoints({
  endpoints: (builder) => ({
    getFarmSettings: builder.query<One<FarmSettings>, Id>({
      query: (farmId) => `farms/${farmId}/settings`, providesTags: ["farmSettings"],
    }),
    saveFarmSettings: builder.mutation<One<FarmSettings>, { farmId: Id; body: Partial<FarmSettings> }>({
      query: ({ farmId, body }) => ({ url: `farms/${farmId}/settings`, method: "POST", body }),
      invalidatesTags: ["farmSettings", "farmReports", "farmAlerts", "farmNavigation"],
    }),
    toggleFarmStatus: builder.mutation<One<FarmSettings>, Id>({
      query: (farmId) => ({ url: `farms/${farmId}/toggle-status`, method: "POST" }),
      invalidatesTags: ["farmSettings", "farmNavigation", "farmReports"],
    }),
    getFarmFeedingPlans: builder.query<Many<FeedingPlan>, FarmQuery>({
      query: ({ farmId, ...params }) => withQuery(`farms/${farmId}/feeding-plans`, params),
      providesTags: ["farmFeedingPlans"],
    }),
    saveFarmFeedingPlan: builder.mutation<One<FeedingPlan>, { farmId: Id; body: Omit<FeedingPlan, "id"> }>({
      query: ({ farmId, body }) => ({ url: `farms/${farmId}/feeding-plans`, method: "POST", body }),
      invalidatesTags: ["farmFeedingPlans", "farmReports", "farmAlerts"],
    }),
    getFarmOperations: builder.query<Many<FarmOperation>, Query>({
      query: (params) => withQuery("farms/operations", params), providesTags: ["farmOperations"],
    }),
    getFarmOperation: builder.query<One<FarmOperation>, Id>({
      query: (id) => `farms/operations/${id}`, providesTags: ["farmOperations"],
    }),
    createFarmOperation: builder.mutation<One<FarmOperation>, FarmOperationPayload>({
      query: (body) => ({ url: "farms/operations", method: "POST", body }),
      invalidatesTags: ["farmOperations"],
    }),
    updateFarmOperation: builder.mutation<One<FarmOperation>, { id: Id; body: FarmOperationPayload }>({
      query: ({ id, body }) => ({ url: `farms/operations/${id}`, method: "POST", body }),
      invalidatesTags: ["farmOperations"],
    }),
    submitFarmOperation: builder.mutation<One<FarmOperation>, Id>({
      query: (id) => ({ url: `farms/operations/${id}/submit`, method: "POST" }),
      invalidatesTags: ["farmOperations", "farmAlerts"],
    }),
    confirmFarmOperation: builder.mutation<One<FarmOperation>, Id>({
      query: (id) => ({ url: `farms/operations/${id}/confirm`, method: "POST" }),
      invalidatesTags: ["farmOperations", "farmReports", "farmAlerts", "farmNavigation", "farmAnimalViews", "inventoryBalances", "inventoryLedger"],
    }),
    rejectFarmOperation: builder.mutation<One<FarmOperation>, Action>({
      query: ({ id, reason }) => ({ url: `farms/operations/${id}/reject`, method: "POST", body: { reason } }),
      invalidatesTags: ["farmOperations", "farmAlerts"],
    }),
    reverseFarmOperation: builder.mutation<One<FarmOperation>, Action>({
      query: ({ id, reason }) => ({ url: `farms/operations/${id}/reverse`, method: "POST", body: { reason } }),
      invalidatesTags: ["farmOperations", "farmReports", "farmAlerts", "farmNavigation", "farmAnimalViews", "inventoryBalances", "inventoryLedger"],
    }),
    completeFarmFollowUp: builder.mutation<One<FarmOperation>, { id: Id; notes: string }>({
      query: ({ id, notes }) => ({ url: `farms/operations/${id}/complete-follow-up`, method: "POST", body: { notes } }),
      invalidatesTags: ["farmOperations", "farmReports", "farmAlerts", "farmNavigation"],
    }),
    getFarmSummary: builder.query<One<ReportRow>, FarmQuery>({
      query: ({ farmId, ...params }) => withQuery(`farms/${farmId}/summary`, params), providesTags: ["farmReports"],
    }),
    getFarmMortality: builder.query<One<ReportRow[]>, FarmQuery>({
      query: ({ farmId, ...params }) => withQuery(`farms/${farmId}/mortality`, params), providesTags: ["farmReports"],
    }),
    getFarmTimeline: builder.query<One<ReportRow[]>, FarmQuery>({
      query: ({ farmId, ...params }) => withQuery(`farms/${farmId}/timeline`, params), providesTags: ["farmReports"],
    }),
    getFarmAlerts: builder.query<One<FarmAlert[]>, Id>({
      query: (farmId) => `farms/${farmId}/alerts`, providesTags: ["farmAlerts"],
    }),
    getFarmNotifications: builder.query<One<FarmNotification[]>, void>({
      query: () => "farms/notifications", providesTags: ["farmAlerts"],
    }),
    investigateFarmAlert: builder.mutation<One<FarmAlert>, { id: Id; notes: string }>({
      query: ({ id, notes }) => ({ url: `farms/alerts/${id}/investigation`, method: "POST", body: { notes } }),
      invalidatesTags: ["farmAlerts"],
    }),
    reverseFarmFeeding: builder.mutation<One<unknown>, Action>({
      query: ({ id, reason }) => ({ url: `farms/feedings/${id}/reverse`, method: "POST", body: { reason } }),
      invalidatesTags: ["farmFeedings", "farmReports", "farmAlerts", "farmNavigation", "farmAnimalViews", "inventoryBalances", "inventoryLedger"],
    }),
  }),
});

export const {
  useGetFarmSettingsQuery, useSaveFarmSettingsMutation, useToggleFarmStatusMutation,
  useGetFarmFeedingPlansQuery, useSaveFarmFeedingPlanMutation,
  useGetFarmOperationsQuery, useLazyGetFarmOperationQuery, useCreateFarmOperationMutation,
  useUpdateFarmOperationMutation, useSubmitFarmOperationMutation, useConfirmFarmOperationMutation,
  useRejectFarmOperationMutation, useReverseFarmOperationMutation, useCompleteFarmFollowUpMutation,
  useGetFarmSummaryQuery, useGetFarmMortalityQuery, useGetFarmTimelineQuery,
  useGetFarmAlertsQuery, useGetFarmNotificationsQuery, useInvestigateFarmAlertMutation,
  useReverseFarmFeedingMutation,
} = farmManagementApiSlice;
