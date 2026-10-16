import Input from "@/components/form/input/InputField";

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
}: {
  value: BalanceFilters;
  onChange: (value: BalanceFilters) => void;
  inventories: { id: number; name: string }[];
  items: { id: number; code: string; name: string }[];
}) {
  const update = (key: keyof BalanceFilters, nextValue: string) =>
    onChange({ ...value, [key]: nextValue });
  const selectClass = "block rounded-lg border border-gray-300 p-2 dark:bg-gray-800";

  return (
    <div className="flex flex-wrap gap-3">
      <label className="text-sm">
        From date
        <Input
          type="date"
          value={value.from_date}
          onChange={(event) => update("from_date", event.target.value)}
        />
      </label>
      <label className="text-sm">
        To date
        <Input
          type="date"
          value={value.to_date}
          onChange={(event) => update("to_date", event.target.value)}
        />
      </label>
      <label className="text-sm">
        Warehouse
        <select
          className={selectClass}
          value={value.inventory_id}
          onChange={(event) => update("inventory_id", event.target.value)}
        >
          <option value="">All warehouses</option>
          {inventories.map((inventory) => (
            <option key={inventory.id} value={inventory.id}>
              {inventory.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        Item
        <select
          className={selectClass}
          value={value.item_id}
          onChange={(event) => update("item_id", event.target.value)}
        >
          <option value="">All items</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.code} - {item.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        Location
        <Input
          value={value.location}
          onChange={(event) => update("location", event.target.value)}
        />
      </label>
    </div>
  );
}
