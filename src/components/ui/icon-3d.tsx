import React from "react";

import icon3dHome from "@/assets/icons/3d-home.png";
import icon3dChat from "@/assets/icons/3d-chat.png";
import icon3dDollar from "@/assets/icons/3d-dollar.png";
import icon3dBell from "@/assets/icons/3d-bell.png";
import icon3dHeart from "@/assets/icons/3d-heart.png";
import icon3dShield from "@/assets/icons/3d-shield.png";
import icon3dUpload from "@/assets/icons/3d-upload.png";

const iconMap = {
  home: icon3dHome,
  chat: icon3dChat,
  dollar: icon3dDollar,
  bell: icon3dBell,
  heart: icon3dHeart,
  shield: icon3dShield,
  upload: icon3dUpload,
} as const;

export type Icon3DName = keyof typeof iconMap;

const sizeMap = {
  xs: "w-5 h-5",
  sm: "w-7 h-7",
  md: "w-9 h-9",
  lg: "w-12 h-12",
  xl: "w-16 h-16",
};

interface Icon3DProps {
  name: Icon3DName;
  size?: keyof typeof sizeMap;
  className?: string;
}

export const Icon3D = ({ name, size = "md", className = "" }: Icon3DProps) => {
  const src = iconMap[name];
  return (
    <img
      src={src}
      alt=""
      className={`${sizeMap[size]} object-contain flex-shrink-0 ${className}`}
      draggable={false}
    />
  );
};
