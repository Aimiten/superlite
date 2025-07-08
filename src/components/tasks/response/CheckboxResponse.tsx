import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface CheckboxResponseProps {
  taskId: string;
  value?: { checked?: boolean };
  label?: string;
  onSave: (value: { checked: boolean }) => void;
  disabled?: boolean;
}

/**
 * Component for simple checkbox responses
 */
const CheckboxResponse: React.FC<CheckboxResponseProps> = ({
  taskId,
  value = {},
  label = "Merkitse tehdyksi",
  onSave,
  disabled = false,
}) => {
  const handleChange = (checked: boolean | "indeterminate") => {
    if (typeof checked === "boolean") {
      onSave({ checked });
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={`checkbox-${taskId}`}
        checked={value?.checked || false}
        onCheckedChange={handleChange}
        disabled={disabled}
      />
      <Label
        htmlFor={`checkbox-${taskId}`}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
      </Label>
    </div>
  );
};

export default CheckboxResponse;