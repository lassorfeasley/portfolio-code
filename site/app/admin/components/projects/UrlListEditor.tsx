import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type UrlListEditorProps = {
  label: string;
  values: string[];
  placeholder?: string;
  addLabel?: string;
  onChange: (values: string[]) => void;
};

export function UrlListEditor({
  label,
  values,
  placeholder,
  addLabel = 'Add URL',
  onChange,
}: UrlListEditorProps) {
  const updateValue = (index: number, value: string) => {
    const next = [...values];
    next[index] = value;
    onChange(next);
  };

  const removeValue = (index: number) => {
    const next = values.filter((_, idx) => idx !== index);
    onChange(next);
  };

  const addValue = () => {
    onChange([...values, '']);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="space-y-2">
        {values.length === 0 ? <p className="text-sm text-muted-foreground">No entries yet.</p> : null}
        {values.map((value, index) => (
          <div key={`${label}-${index}`} className="flex gap-2">
            <Input
              type="url"
              value={value}
              onChange={(event) => updateValue(index, event.target.value)}
              placeholder={placeholder}
            />
            <Button
              type="button"
              variant="ghost"
              className="shrink-0"
              onClick={() => removeValue(index)}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={addValue}>
        {addLabel}
      </Button>
    </div>
  );
}


