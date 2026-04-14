import { Alert, Pressable, StyleSheet, View } from "react-native";
import React, { useState } from "react";
import PeopleCard from "@/components/PeopleCard";
import { Octicons } from "@expo/vector-icons";
import Header from "@/components/Header";
import { useBridgeService } from "@/services/bridgeService";
import { useI18n } from "@/utils/i18n";

const People = () => {
  const { resetDemoState } = useBridgeService();
  const [isResetting, setIsResetting] = useState(false);
  const { t } = useI18n();

  const triggerDemoReset = () => {
    Alert.alert(
      t("bridge_reset_title"),
      t("bridge_reset_body"),
      [
        {
          text: t("bridge_cancel"),
          style: "cancel",
        },
        {
          text: t("bridge_reset"),
          style: "destructive",
          onPress: async () => {
            if (isResetting) {
              return;
            }

            setIsResetting(true);
            try {
              await resetDemoState();
            } finally {
              setIsResetting(false);
            }
          },
        },
      ]
    );
  };

  const button = () => (
    <Pressable onLongPress={triggerDemoReset} delayLongPress={650}>
      <Octicons
        name={isResetting ? "sync" : "filter"}
        size={24}
        color={isResetting ? "#34a853" : "black"}
      />
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Header headerTitle={t("bridge_header")} button={button} />
        <PeopleCard />
      </View>
    </View>
  );
};

export default People;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
    paddingHorizontal: 16,
  },
  content: {
    flex: 1,
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",
  },
});
