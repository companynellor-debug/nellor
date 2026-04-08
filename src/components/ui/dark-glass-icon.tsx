import React from "react";

interface DarkGlassIconProps {
  icon: React.ElementType;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  xs: { container: "w-7 h-7", icon: "h-3.5 w-3.5" },
  sm: { container: "w-9 h-9", icon: "h-4 w-4" },
  md: { container: "w-10 h-10", icon: "h-5 w-5" },
  lg: { container: "w-12 h-12", icon: "h-5 w-5" },
};

export const DarkGlassIcon = ({ icon: Icon, size = "md", className = "" }: DarkGlassIconProps) => {
  const s = sizeMap[size];
  return (
    <div className={`relative ${s.container} flex-shrink-0 ${className}`}>
      <div className="absolute inset-0 rounded-full bg-slate-900/90 border border-purple-500/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.1),0_4px_12px_rgba(0,0,0,0.3)]" />
      <div className="absolute top-0 left-[10%] right-[10%] h-[45%] rounded-t-full bg-gradient-to-b from-white/15 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-1/2 rounded-b-full bg-gradient-to-tr from-purple-600/20 to-transparent" />
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        <Icon className={`${s.icon} text-purple-400 drop-shadow-[0_0_6px_rgba(168,85,247,0.5)]`} strokeWidth={1.8} />
      </div>
    </div>
  );
};
