'use client';

import { Select } from './select';

export interface OptionSelectItem {
  id: string;
  label: string;
}

interface OptionSelectProps {
  value: string;
  items: OptionSelectItem[];
  isDisabled?: boolean;
  className?: string;
  'aria-label'?: string;
  onChange: (id: string) => void;
}

export function OptionSelect({ value, items, onChange, ...props }: OptionSelectProps) {
  return (
    <Select value={value} onChange={(next) => onChange(String(next))} {...props}>
      {items.map((item) => (
        <Select.Item key={item.id} id={item.id} textValue={item.label}>
          {item.label}
        </Select.Item>
      ))}
    </Select>
  );
}
