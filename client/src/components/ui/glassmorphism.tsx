import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface GlassmorphismProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  blur?: "sm" | "md" | "lg";
  opacity?: "low" | "medium" | "high";
}

const Glassmorphism = forwardRef<HTMLDivElement, GlassmorphismProps>(
  ({ className, children, blur = "sm", opacity = "medium", ...props }, ref) => {
    const blurClasses = {
      sm: "backdrop-blur-sm",
      md: "backdrop-blur-md",
      lg: "backdrop-blur-lg",
    };

    const opacityClasses = {
      low: "bg-white/5 border-white/10",
      medium: "bg-white/10 border-white/20",
      high: "bg-white/20 border-white/30",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "border rounded-2xl",
          blurClasses[blur],
          opacityClasses[opacity],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Glassmorphism.displayName = "Glassmorphism";

export { Glassmorphism };
