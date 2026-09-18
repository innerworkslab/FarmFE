"use client";

import React, { useEffect, useRef } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import { Calendar } from "lucide-react";

interface ReportDatePickerProps {
  value: string;
  onChange: (dateStr: string) => void;
  placeholder?: string;
  className?: string;
}

export default function ReportDatePicker({
  value,
  onChange,
  placeholder = "YYYY-MM-DD",
  className = "",
}: ReportDatePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fpRef = useRef<flatpickr.Instance | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!inputRef.current) return;

    fpRef.current = flatpickr(inputRef.current, {
      dateFormat: "Y-m-d",
      defaultDate: value || undefined,
      monthSelectorType: "static",
      allowInput: false,
      onChange: (_selectedDates, dateStr) => {
        onChangeRef.current(dateStr);
      },
    });

    return () => {
      fpRef.current?.destroy();
      fpRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Synchronize when value is changed or reset externally
  useEffect(() => {
    if (fpRef.current) {
      fpRef.current.setDate(value || "", false);
    }
  }, [value]);

  return (
    <div className="relative inline-flex items-center">
      <Calendar
        size={14}
        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"
      />
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        defaultValue={value}
        className={`pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-gray-800 text-xs rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 cursor-pointer w-32 focus:outline-none focus:ring-2 focus:ring-[#15803d]/30 transition-all ${className}`}
      />
    </div>
  );
}
