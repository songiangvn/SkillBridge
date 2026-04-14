import { StyleSheet, Text, View } from "react-native";
import React from "react";
interface HeaderProp {
  headerTitle: string;
  button: () => React.ReactNode;
}
const Header = ({ headerTitle, button }: HeaderProp) => {
  return (
    <View style={styles.headerSection}>
      <Text style={styles.logo}>{headerTitle}</Text>
      {button()}
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  headerSection: {
    justifyContent: "space-between",
    flexDirection: "row",
    paddingVertical: 8,
    marginBottom: 6,
  },
  logo: {
    color: "#111",
    fontSize: 24,
    fontWeight: "900",
  },
});
