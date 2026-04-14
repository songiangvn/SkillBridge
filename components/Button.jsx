import { Pressable, StyleSheet, Text } from "react-native";
import React from "react";

const Button = ({
  children,
  onPress,
  backgroundColor = "#1a1a1a",
  borderRadius = 30,
  paddingVertical = 6,
  paddingHorizontal = 8,
  textColor = "#ffffff",
  fontSize = 16,
  fontWeight = "bold",
  disabled = false,
  style = {},
  textStyle = {},
}) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: disabled ? "#888" : backgroundColor,
          borderRadius,
          paddingVertical,
          paddingHorizontal,
          opacity: pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: textColor, fontSize, fontWeight },
          textStyle,
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    textAlign: "center",
  },
});

export default Button;
