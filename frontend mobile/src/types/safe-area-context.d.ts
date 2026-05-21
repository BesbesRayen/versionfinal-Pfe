declare module "react-native-safe-area-context" {
  import type { ComponentType, ReactNode } from "react";
  import type { StyleProp, ViewStyle } from "react-native";

  export interface SafeAreaViewProps {
    children?: ReactNode;
    style?: StyleProp<ViewStyle>;
    edges?: Array<"top" | "right" | "bottom" | "left">;
  }

  export const SafeAreaView: ComponentType<SafeAreaViewProps>;
}
