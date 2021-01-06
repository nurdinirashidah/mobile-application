import React, { FunctionComponent, ReactElement } from "react";
import { color, size as sizeScale } from "../../../common/styles";
import { BaseButton } from "./BaseButton";
import { AppText } from "../AppText";
import { ActivityIndicator, View } from "react-native";
import { lineHeight } from "../../../common/styles/typography";

export interface SecondaryButton {
  onPress?: () => void;
  text: string;
  fullWidth?: boolean;
  isLoading?: boolean;
  icon?: ReactElement;
  disabled?: boolean;
  size?: "medium" | "small";
  accessibilityLabel?: string;
}

export const SecondaryButton: FunctionComponent<SecondaryButton> = ({
  onPress,
  text,
  fullWidth = false,
  isLoading = false,
  icon,
  disabled,
  size = "medium",
  accessibilityLabel,
}) => (
  <BaseButton
    onPress={onPress}
    backgroundColor="transparent"
    borderColor={disabled ? color("grey", 40) : color("blue", 50)}
    fullWidth={fullWidth}
    disabled={disabled || isLoading}
    size={size}
    accessibilityLabel={accessibilityLabel}
  >
    {isLoading ? (
      <ActivityIndicator size="small" color={color("grey", 40)} />
    ) : (
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {icon && <View style={{ marginRight: sizeScale(1) }}>{icon}</View>}
        <AppText
          style={{
            color: disabled ? color("grey", 40) : color("blue", 50),
            fontFamily: "brand-bold",
            textAlign: "center",
            lineHeight: lineHeight(0, false),
          }}
        >
          {text}
        </AppText>
      </View>
    )}
  </BaseButton>
);
