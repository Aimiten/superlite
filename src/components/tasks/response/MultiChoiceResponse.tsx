import React, { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MultiChoiceResponseProps {
  taskId: string;
  options: string[];
  value?: { options?: string[] };
  onSave: (value: { options: string[] }) => void;
  allowMultiple?: boolean;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  autoSave?: boolean;
}

/**
 * Component for single or multiple choice responses
 */
const MultiChoiceResponse: React.FC<MultiChoiceResponseProps> = ({
  taskId,
  options,
  value = {},
  onSave,
  allowMultiple = false,
  label,
  required = false,
  disabled = false,
  className,
  autoSave = true,
}) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>(
    value?.options || []
  );
  const [isDirty, setIsDirty] = useState(false);

  // Update local state when external value changes
  useEffect(() => {
    if (value?.options) {
      setSelectedOptions(value.options);
    }
  }, [value?.options]);

  // Helper for checking if an option is selected
  const isSelected = (option: string) => selectedOptions.includes(option);

  // Handle checkbox change for multiple selection
  const handleCheckboxChange = (option: string) => {
    let newSelectedOptions: string[];

    if (isSelected(option)) {
      // Remove option if already selected
      newSelectedOptions = selectedOptions.filter((item) => item !== option);
    } else {
      // Add option if not selected
      newSelectedOptions = [...selectedOptions, option];
    }

    setSelectedOptions(newSelectedOptions);
    setIsDirty(true);

    // Auto-save if enabled
    if (autoSave) {
      onSave({ options: newSelectedOptions });
      setIsDirty(false);
    }
  };

  // Handle radio change for single selection
  const handleRadioChange = (value: string) => {
    setSelectedOptions([value]);
    setIsDirty(true);

    // Auto-save if enabled
    if (autoSave) {
      onSave({ options: [value] });
      setIsDirty(false);
    }
  };

  // Manual save
  const handleSave = () => {
    if (!isDirty) return;

    onSave({ options: selectedOptions });
    setIsDirty(false);
  };

  // Render multiple choice with checkboxes
  if (allowMultiple) {
    return (
      <div className={cn("space-y-3", className)}>
        {label && <p className="text-sm font-medium">{label}</p>}
        <div className="space-y-2.5">
          {options.map((option, index) => (
            <div key={`${taskId}-option-${index}`} className="flex items-center space-x-2">
              <Checkbox
                id={`option-${taskId}-${index}`}
                checked={isSelected(option)}
                onCheckedChange={() => handleCheckboxChange(option)}
                disabled={disabled}
              />
              <Label
                htmlFor={`option-${taskId}-${index}`}
                className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {option}
              </Label>
            </div>
          ))}
        </div>

        {!autoSave && (
          <Button size="sm" onClick={handleSave} disabled={!isDirty || disabled}>
            Tallenna valinnat
          </Button>
        )}

        {required && selectedOptions.length === 0 && (
          <p className="text-xs text-red-500">Valitse vähintään yksi vaihtoehto</p>
        )}
      </div>
    );
  }

  // Render single choice with radio buttons
  return (
    <div className={cn("space-y-3", className)}>
      {label && <p className="text-sm font-medium">{label}</p>}
      <RadioGroup
        value={selectedOptions[0] || ""}
        onValueChange={handleRadioChange}
        disabled={disabled}
      >
        <div className="space-y-2.5">
          {options.map((option, index) => (
            <div key={`${taskId}-option-${index}`} className="flex items-center space-x-2">
              <RadioGroupItem
                value={option}
                id={`option-${taskId}-${index}`}
                disabled={disabled}
              />
              <Label
                htmlFor={`option-${taskId}-${index}`}
                className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {option}
              </Label>
            </div>
          ))}
        </div>
      </RadioGroup>

      {!autoSave && (
        <Button size="sm" onClick={handleSave} disabled={!isDirty || disabled}>
          Tallenna valinta
        </Button>
      )}

      {required && selectedOptions.length === 0 && (
        <p className="text-xs text-red-500">Valitse yksi vaihtoehto</p>
      )}
    </div>
  );
};

export default MultiChoiceResponse;