import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-lg border-2 border-border/50 bg-card/60 backdrop-blur-md px-4 py-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/70 shadow-sm transition-all duration-200 ease-out hover:border-border focus:border-primary/60 focus:bg-card/80 focus:shadow-lg focus:shadow-primary/20 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
