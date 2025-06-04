
import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  indicatorColor?: string;
  showPercentage?: boolean;
  size?: "default" | "sm" | "lg";
  labelPosition?: "inside" | "above" | "none";
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ 
  className, 
  value = 0, 
  indicatorColor, 
  showPercentage = false,
  size = "default",
  labelPosition = "none",
  ...props 
}, ref) => {
  const heightClass = {
    sm: "h-2",
    default: "h-4",
    lg: "h-6"
  }[size];

  return (
    <div className="w-full">
      {labelPosition === "above" && showPercentage && (
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>{props["aria-label"] || "Progress"}</span>
          <span>{Math.round(value || 0)}%</span>
        </div>
      )}
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-secondary",
          heightClass,
          className
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            "h-full w-full flex-1 transition-all",
            indicatorColor || "bg-primary"
          )}
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        >
          {labelPosition === "inside" && showPercentage && size !== "sm" && (
            <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
              {Math.round(value || 0)}%
            </div>
          )}
        </ProgressPrimitive.Indicator>
      </ProgressPrimitive.Root>
    </div>
  )
})

Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
