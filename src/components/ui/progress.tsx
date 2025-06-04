
import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  indicatorColor?: string;
  showPercentage?: boolean;
  size?: "default" | "sm" | "lg";
  labelPosition?: "inside" | "above" | "none";
  animated?: boolean;
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
  animated = false,
  ...props 
}, ref) => {
  const heightClass = {
    sm: "h-2",
    default: "h-4",
    lg: "h-6"
  }[size];

  const percentageValue = Math.round(value || 0);

  return (
    <div className="w-full">
      {labelPosition === "above" && showPercentage && (
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>{props["aria-label"] || "Progress"}</span>
          <span>{percentageValue}%</span>
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
            "h-full w-full flex-1 transition-all duration-500 ease-out",
            animated && "animate-pulse",
            indicatorColor || "bg-primary"
          )}
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        >
          {labelPosition === "inside" && showPercentage && size !== "sm" && (
            <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white mix-blend-difference">
              {percentageValue}%
            </div>
          )}
        </ProgressPrimitive.Indicator>
      </ProgressPrimitive.Root>
      
      {labelPosition === "none" && showPercentage && (
        <div className="text-right text-xs text-muted-foreground mt-1">
          {percentageValue}%
        </div>
      )}
    </div>
  )
})

Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
