import { useEffect, useRef } from 'react';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.css';
import Label from './Label';
import { CalenderIcon } from '../../icons';
import Hook = flatpickr.Options.Hook;
import DateOption = flatpickr.Options.DateOption;
import Instance = flatpickr.Instance;

type PropsType = {
  id: string;
  mode?: "single" | "multiple" | "range" | "time";
  onChange?: Hook | Hook[];
  defaultDate?: DateOption;
  value?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  static?: boolean;
};

export default function DatePicker({
  id,
  mode,
  onChange,
  label,
  defaultDate,
  value,
  placeholder,
  required,
  static: isStatic = true,
}: PropsType) {
  const pickerRef = useRef<Instance | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const flatPickr = flatpickr(`#${id}`, {
      mode: mode || "single",
      static: isStatic,
      monthSelectorType: "static",
      dateFormat: "Y-m-d",
      defaultDate: value !== undefined ? value || undefined : defaultDate,
      onChange: (selectedDates, dateString, instance) => {
        const callback = onChangeRef.current;
        if (Array.isArray(callback)) {
          callback.forEach((handler) => handler(selectedDates, dateString, instance));
        } else {
          callback?.(selectedDates, dateString, instance);
        }
      },
    });
    pickerRef.current = Array.isArray(flatPickr) ? null : flatPickr;

    return () => {
      if (!Array.isArray(flatPickr)) {
        flatPickr.destroy();
      }
      pickerRef.current = null;
    };
  }, [mode, id, isStatic]);

  useEffect(() => {
    const picker = pickerRef.current;
    if (!picker) return;
    const date = value !== undefined ? value : defaultDate;
    if (date === undefined || date === "") picker.clear();
    else picker.setDate(date, false);
  }, [value, defaultDate]);

  return (
    <div>
      {label && <Label htmlFor={id}>{label}</Label>}

      <div className="relative">
        <input
          id={id}
          placeholder={placeholder}
          required={required}
          className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3  dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30  bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700  dark:focus:border-brand-800"
        />

        <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
          <CalenderIcon className="size-6" />
        </span>
      </div>
    </div>
  );
}
