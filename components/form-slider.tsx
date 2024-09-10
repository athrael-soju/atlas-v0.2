import { Slider } from '@/components/ui/slider';
import {
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage
} from '@/components/ui/form';

export function FormSlider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  description
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  description: string;
}) {
  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <FormControl>
        <Slider
          value={[value]}
          onValueChange={(val) => onChange(val[0])}
          min={min}
          max={max}
          step={step}
          aria-label={label}
        />
      </FormControl>
      <FormDescription>
        {description}. Current value: {value}
      </FormDescription>
      <FormMessage />
    </FormItem>
  );
}
