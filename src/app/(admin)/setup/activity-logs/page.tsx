"use client";

import React, { useState } from "react";
import {
  useGetActivityLogsQuery,
  ActivityLogItem,
} from "@/redux/features/setup/ActivityLogApiSlice";
import { useGetSetupAdminsQuery, SetupAdmin } from "@/redux/features/setup/AdminSetupApiSlice";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import TableActionButton from "@/components/ui/table/TableActionButton";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Loading from "@/components/common/Loading";
import { ScrollText, Eye } from "lucide-react";

const formatLogValue = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (Array.isArray(value)) return value.map(formatLogValue).join(", ");
  if (typeof value === "object") return "";
  return String(value);
};

function LogProperties({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data);
  if (entries.length === 0) return <p className="text-sm text-gray-500">No properties recorded.</p>;

  return (
    <div className="space-y-3">
      {entries.map(([key, value]) => (
        <div key={key} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{key}</div>
          {value && typeof value === "object" && !Array.isArray(value) ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {Object.entries(value as Record<string, unknown>).map(([childKey, childValue]) => (
                <label key={childKey} className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  <span className="mb-1 block">{childKey}</span>
                  <Input value={formatLogValue(childValue)} disabled />
                </label>
              ))}
            </div>
          ) : (
            <Input value={formatLogValue(value)} disabled />
          )}
        </div>
      ))}
    </div>
  );
}

export default function ActivityLogsPage() {
  const [logName, setLogName] = useState("setup");
  const { data, isLoading } = useGetActivityLogsQuery({ log_name: logName || undefined });
  const { data: adminsData } = useGetSetupAdminsQuery();

  const logs = data?.data || [];
  const adminMap = React.useMemo(() => new Map<number, string>((adminsData?.data || []).map((a: SetupAdmin) => [a.id, a.name])), [adminsData?.data]);
  const [selectedLog, setSelectedLog] = useState<ActivityLogItem | null>(null);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ScrollText className="text-[#15803d] dark:text-emerald-400" size={26} />
            <h1 className="text-2xl font-extrabold text-[#1E293B] dark:text-white tracking-tight">
              Activity Logs
            </h1>
          </div>
          <p className="text-sm text-[#64748B] dark:text-gray-400 mt-1">
            System audit trail and setup modification logs.
          </p>
        </div>

        {/* Filter */}
        <div className="w-full sm:w-48">
          <select
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none"
            value={logName}
            onChange={(e) => setLogName(e.target.value)}
          >
            <option value="setup">Setup Module</option>
            <option value="auth">Auth Module</option>
            <option value="">All Logs</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loading />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            No activity logs found.
          </div>
        ) : (
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">ID</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Module</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Event</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Subject</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Subject ID</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Causer</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Date</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Details</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {logs.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="px-5 py-3.5 text-gray-500 text-sm">#{item.id}</TableCell>
                    <TableCell className="px-5 py-3.5 text-gray-900 dark:text-white font-medium text-sm">{item.log_name}</TableCell>
                    <TableCell className="px-5 py-3.5 text-sm">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded font-medium border border-blue-200">
                        {item.event}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-gray-500 text-sm truncate max-w-xs">{item.subject_type?.split("\\").pop() || item.subject_type}</TableCell>
                    <TableCell className="px-5 py-3.5 text-gray-500 text-sm">#{item.subject_id}</TableCell>
                    <TableCell className="px-5 py-3.5 text-gray-700 dark:text-gray-300 font-medium text-sm">
                      {adminMap.get(item.causer_id) || `User #${item.causer_id}`}
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-gray-500 text-sm">
                      {item.created_at ? new Date(item.created_at).toLocaleString() : "-"}
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-sm">
                      <TableActionButton label="View" tone="neutral" onClick={() => setSelectedLog(item)} icon={<Eye size={14} />} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      <Modal isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} className="max-w-[550px] m-4">
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Activity Log #{selectedLog?.id}
          </h2>
          {selectedLog && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                <div><span className="text-gray-500">Event:</span> <strong className="text-gray-800 dark:text-gray-200">{selectedLog.event}</strong></div>
                <div><span className="text-gray-500">Module:</span> <strong className="text-gray-800 dark:text-gray-200">{selectedLog.log_name}</strong></div>
                <div><span className="text-gray-500">Subject:</span> <strong className="text-gray-800 dark:text-gray-200">{selectedLog.subject_type}</strong></div>
                <div><span className="text-gray-500">Subject ID:</span> <strong className="text-gray-800 dark:text-gray-200">#{selectedLog.subject_id}</strong></div>
                <div><span className="text-gray-500">Causer:</span> <strong className="text-gray-800 dark:text-gray-200">{adminMap.get(selectedLog.causer_id) || `User #${selectedLog.causer_id}`}</strong></div>
                <div><span className="text-gray-500">Time:</span> <strong className="text-gray-800 dark:text-gray-200">{new Date(selectedLog.created_at).toLocaleString()}</strong></div>
              </div>

              <div>
                <span className="text-gray-500 font-semibold block mb-1">Properties / Changes:</span>
                <LogProperties data={selectedLog.properties || {}} />
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 mt-4 border-t border-gray-100 dark:border-gray-800">
            <Button size="sm" variant="outline" onClick={() => setSelectedLog(null)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
