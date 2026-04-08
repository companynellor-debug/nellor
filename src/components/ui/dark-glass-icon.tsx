import React from "react";

type ColorVariant = "purple" | "amber" | "blue" | "emerald" | "red";

interface DarkGlassIconProps {
  icon: React.ElementType;
  size?: "xs" | "sm" | "md" | "lg";
  color?: ColorVariant;
  className?: string;
}

const sizeMap = {
  xs: { container: "w-7 h-7", icon: "h-3.5 w-3.5" },
  sm: { container: "w-9 h-9", icon: "h-4 w-4" },
  md: { container: "w-10 h-10", icon: "h-5 w-5" },
  lg: { container: "w-12 h-12", icon: "h-5 w-5" },
};

const colorMap: Record<ColorVariant, { bg: string; accent: string; iconColor: string; glow: string }> = {
  purple: {
    bg: "bg-slate-900/90",
    accent: "border-purple-500/30",
    iconColor: "text-purple-400",
    glow: "from-purple-600/20",
  },
  amber: {
    bg: "bg-slate-900/90",
    accent: "border-amber-500/30",
    iconColor: "text-amber-400",
    glow: "from-amber-600/20",
  },
  blue: {
    bg: "bg-slate-900/90",
    accent: "border-blue-500/30",
    iconColor: "text-blue-400",
    glow: "from-blue-600/20",
  },
  emerald: {
    bg: "bg-slate-900/90",
    accent: "border-emerald-500/30",
    iconColor: "text-emerald-400",
    glow: "from-emerald-600/20",
  },
  red: {
    bg: "bg-slate-900/90",
    accent: "border-red-500/30",
    iconColor: "text-red-400",
    glow: "from-red-600/20",
  },
};

export const DarkGlassIcon = ({ icon: Icon, size = "md", color = "purple", className = "" }: DarkGlassIconProps) => {
  const s = sizeMap[size];
  const c = colorMap[color];
  return (
    <div className={`relative ${s.container} flex-shrink-0 ${className}`}>
      <div className={`absolute inset-0 rounded-full ${c.bg} border ${c.accent} shadow-[inset_0_1px_2px_rgba(255,255,255,0.1),0_4px_12px_rgba(0,0,0,0.3)]`} />
      <div className="absolute top-0 left-[10%] right-[10%] h-[45%] rounded-t-full bg-gradient-to-b from-white/15 to-transparent" />
      <div className={`absolute bottom-0 left-0 right-0 h-1/2 rounded-b-full bg-gradient-to-tr ${c.glow} to-transparent`} />
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        <Icon className={`${s.icon} ${c.iconColor} drop-shadow-[0_0_6px_rgba(168,85,247,0.5)]`} strokeWidth={1.8} />
      </div>
    </div>
  );
};
