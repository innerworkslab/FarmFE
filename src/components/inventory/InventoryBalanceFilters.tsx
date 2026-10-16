import Input from "@/components/form/input/InputField";
import DatePicker from "@/components/form/date-picker";
import Select from "@/components/form/Select";

export type BalanceFilters = {
  from_date: string;
  to_date: string;
  inventory_id: string;
  item_id: string;
  location: string;
};

export default function InventoryBalanceFilters({
  value,
  onChange,
  inventories,
  items,
  showItemAndLocation = true,
}: {
  value: BalanceFilters;
  onChange: (value: BalanceFilters) => void;
  inventories: { id: number; name: string }[];
  items: { id: number; code: string; name: string }[];
  showItemAndLocation?: boolean;
}) {
  const update = (key: keyof BalanceFilters, nextValue: string) =>
    onChange({ ...value, [key]: nextValue });
  return (
    <div className="flex flex-wrap gap-3">
      <label className="text-sm">
        From date
        <DatePicker
          id="inventory-filter-from-date"
          value={value.from_date}
          placeholder="Select date"
          static={false}
          onChange={(_, dateString) => update("from_date", dateString)}
        />
      </label>
      <label className="text-sm">
        To date
        <DatePicker
          id="inventory-filter-to-date"
          value={value.to_date}
          placeholder="Select date"
          static={false}
          onChange={(_, dateString) => update("to_date", dateString)}
        />
      </label>
      <label className="text-sm">
        Warehouse
        <Select
          value={value.inventory_id}
          onChange={(event) => update("inventory_id", event.target.value)}
          options={[
            { value: "", label: "All warehouses" },
            ...inventories.map((inventory) => ({
              value: String(inventory.id),
              label: inventory.name,
            })),
          ]}
        />
      </label>
      {showItemAndLocation && (
        <>
          <label className="text-sm">
            Item
            <Select
              value={value.item_id}
              onChange={(event) => update("item_id", event.target.value)}
              options={[
                { value: "", label: "All items" },
                ...items.map((item) => ({
                  value: String(item.id),
                  label: `${item.code} - ${item.name}`,
                })),
              ]}
            />
          </label>
          <label className="text-sm">
            Location
            <Input
              value={value.location}
              onChange={(event) => update("location", event.target.value)}
            />
          </label>
        </>
      )}
    </div>
  );
}
