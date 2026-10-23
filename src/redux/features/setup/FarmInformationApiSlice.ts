// Compatibility exports keep existing consumers on the canonical ID-based API.
export {
  farmLocationsApiSlice as farmInformationApiSlice,
  useGetFarmInformationRecordsQuery as useGetFarmInformationListQuery,
  useGetFarmInformationRecordQuery as useGetFarmInformationQuery,
  useCreateFarmInformationRecordMutation as useCreateFarmInformationMutation,
  useUpdateFarmInformationRecordMutation as useUpdateFarmInformationMutation,
  useDeleteFarmInformationRecordMutation as useDeleteFarmInformationMutation,
} from "./FarmLocationsApiSlice";
export type {
  FarmInformationRecord as FarmInformation,
  FarmInformationRecordPayload as FarmInformationPayload,
  FarmInformationRecordListQuery,
} from "./FarmLocationsApiSlice";
