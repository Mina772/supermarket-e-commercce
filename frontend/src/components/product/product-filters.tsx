'use client';

import { useCategories, useBrands } from '@/hooks/use-products';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RatingStars } from '@/components/shared/rating-stars';

export interface FilterState {
  category?: string;
  brand?: string;
  minPrice?: string;
  maxPrice?: string;
  minRating?: string;
  inStock?: string;
  onDeal?: string;
}

interface Props {
  value: FilterState;
  onChange: (patch: Partial<FilterState>) => void;
  onReset: () => void;
}

export function ProductFilters({ value, onChange, onReset }: Props): JSX.Element {
  const { data: cats } = useCategories();
  const { data: brands } = useBrands();

  return (
    <aside className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Filters</h2>
        <Button variant="ghost" size="sm" onClick={onReset}>
          Reset
        </Button>
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-1 text-sm font-medium">Category</legend>
        <div className="max-h-48 space-y-1 overflow-y-auto pr-1">
          <button
            className={`block w-full rounded-md px-2 py-1.5 text-left text-sm ${!value.category ? 'bg-primary/10 font-medium text-primary' : 'hover:bg-muted'}`}
            onClick={() => onChange({ category: undefined })}
          >
            All categories
          </button>
          {cats?.items.map((c) => (
            <button
              key={c._id}
              className={`block w-full rounded-md px-2 py-1.5 text-left text-sm ${value.category === c.slug ? 'bg-primary/10 font-medium text-primary' : 'hover:bg-muted'}`}
              onClick={() => onChange({ category: c.slug })}
            >
              {c.name}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="mb-1 text-sm font-medium">Brand</legend>
        <select
          className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
          value={value.brand ?? ''}
          onChange={(e) => onChange({ brand: e.target.value || undefined })}
        >
          <option value="">All brands</option>
          {brands?.items.map((b) => (
            <option key={b._id} value={b.slug}>
              {b.name}
            </option>
          ))}
        </select>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="mb-1 text-sm font-medium">Price range</legend>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            placeholder="Min"
            value={value.minPrice ?? ''}
            onChange={(e) => onChange({ minPrice: e.target.value || undefined })}
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            min={0}
            placeholder="Max"
            value={value.maxPrice ?? ''}
            onChange={(e) => onChange({ maxPrice: e.target.value || undefined })}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="mb-1 text-sm font-medium">Minimum rating</legend>
        <div className="space-y-1">
          {[4, 3, 2, 1].map((r) => (
            <button
              key={r}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm ${value.minRating === String(r) ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
              onClick={() => onChange({ minRating: value.minRating === String(r) ? undefined : String(r) })}
            >
              <RatingStars value={r} size={14} /> &amp; up
            </button>
          ))}
        </div>
      </fieldset>

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border"
            checked={value.inStock === 'true'}
            onChange={(e) => onChange({ inStock: e.target.checked ? 'true' : undefined })}
          />
          In stock only
        </Label>
        <Label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border"
            checked={value.onDeal === 'true'}
            onChange={(e) => onChange({ onDeal: e.target.checked ? 'true' : undefined })}
          />
          On deal
        </Label>
      </div>
    </aside>
  );
}
