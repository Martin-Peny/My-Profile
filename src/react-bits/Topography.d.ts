import type { ComponentType, CSSProperties } from "react";
import type { TopographyProps } from "../Topography";

declare const Topography: ComponentType<TopographyProps & {
  dpr?: number;
  className?: string;
  style?: CSSProperties;
  onRender?: () => void;
}>;
export default Topography;
