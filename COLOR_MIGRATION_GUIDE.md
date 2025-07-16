# Color Migration Guide

## Mapping from hardcoded colors to semantic colors

### Green Colors → Success
- `bg-green-50` → `bg-success/10`
- `bg-green-100` → `bg-success/20`
- `bg-green-200` → `bg-success/30`
- `text-green-500` → `text-success`
- `text-green-600` → `text-success`
- `text-green-700` → `text-success-foreground`
- `text-green-800` → `text-success-foreground`
- `border-green-100` → `border-success/20`
- `border-green-200` → `border-success/30`
- `hover:bg-green-200` → `hover:bg-success/30`
- `hover:bg-green-600` → `hover:bg-success`
- `hover:bg-green-700` → `hover:bg-success/90`

### Yellow/Amber Colors → Warning
- `bg-yellow-50` → `bg-warning/10`
- `bg-yellow-100` → `bg-warning/20`
- `bg-yellow-200` → `bg-warning/30`
- `bg-amber-50` → `bg-warning/10`
- `bg-amber-100` → `bg-warning/20`
- `text-yellow-500` → `text-warning`
- `text-yellow-600` → `text-warning`
- `text-yellow-700` → `text-warning-foreground`
- `text-yellow-800` → `text-warning-foreground`
- `text-amber-800` → `text-warning-foreground`
- `border-yellow-200` → `border-warning/30`
- `border-amber-300` → `border-warning/40`
- `hover:bg-yellow-200` → `hover:bg-warning/30`

### Blue Colors → Info (if used for informational purposes)
- Use existing `text-blue-*` colors or convert to `text-info` if semantically appropriate

### Red Colors → Destructive (already in the system)
- These should already be using the destructive variant

## Component-specific changes

### Badge Component
✅ Already updated to use semantic colors

### Alert Component  
✅ Already updated to use semantic colors

### Other Components
- Need to update individually based on their semantic meaning
- Always consider the context - not all green should be "success"
- Some greens might be decorative and should remain as-is

## Testing
Visit `/color-system-demo` to see all the new semantic color variants in action.