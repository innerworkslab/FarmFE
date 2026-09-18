import React from 'react';

interface Option {
  value: string;
  label: string;
}

// Allow all standard select props along with our custom ones
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: Option[];
  placeholder?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, placeholder, className, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 ${
          props.value ? 'text-gray-800 dark:text-white/90' : 'text-gray-400 dark:text-gray-400'
        } ${className}`}
        {...props} // Spread all other props like onChange, onBlur, name, value
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
          >
            {option.label}
          </option>
        ))}
      </select>
    );
  }
);

Select.displayName = 'Select';

export default Select;