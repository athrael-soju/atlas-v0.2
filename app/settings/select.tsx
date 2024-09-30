import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface SelectSettingProps {
  value: string;
  options: { value: string; label: string }[];
  description?: string;
  onValueChange: (val: string) => void;
}

export const SelectSetting = ({
  value,
  options,
  description,
  onValueChange
}: SelectSettingProps) => {
  return (
    <div className="space-y-4">
      <div
        className="flex items-center justify-between"
        style={{ width: '100%' }}
      >
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select value" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {description && <p>{description}</p>}
    </div>
  );
};
