import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface SliderSettingProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onValueChange: (val: number) => void;
  description?: string;
}

export const SliderSetting = ({
  label,
  value,
  min,
  max,
  step,
  onValueChange,
  description
}: SliderSettingProps) => {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Slider
        value={[value]}  // Use `value` instead of `defaultValue`
        min={min}
        max={max}
        step={step}
        onValueChange={(val) => onValueChange(val[0])}  // Update the value correctly
      />
      <p>
        {value} {description}
      </p>
    </div>
  );
};
