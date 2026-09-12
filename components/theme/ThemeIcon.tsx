import {
  Compass,
  Palette,
  Sparkles,
  Sun,
  Trophy,
  Zap,
} from "lucide-react";
import type { CSSProperties } from "react";
import type { ThemeId } from "@/lib/theme/types";

type ThemeIconProps = {
  themeId: ThemeId;
  className?: string;
  strokeWidth?: number;
  style?: CSSProperties;
};

export function ThemeIcon({ themeId, className, strokeWidth, style }: ThemeIconProps) {
  const iconProps = { className, strokeWidth, style };

  switch (themeId) {
    case "midnight":
      return <Sparkles {...iconProps} />;
    case "premier-league":
      return <Zap {...iconProps} />;
    case "champions":
      return <Trophy {...iconProps} />;
    case "ocean":
      return <Compass {...iconProps} />;
    case "daylight":
      return <Sun {...iconProps} />;
    default:
      return <Palette {...iconProps} />;
  }
}
