import { Alert, Pressable, StyleSheet, View } from "react-native";
import React, { useState } from "react";
import PeopleCard from "@/components/PeopleCard";
import { Octicons } from "@expo/vector-icons";
import Header from "@/components/Header";
import { useBridgeService } from "@/services/bridgeService";

const People = () => {
  const { resetDemoState } = useBridgeService();
  const [isResetting, setIsResetting] = useState(false);

  const triggerDemoReset = () => {
    Alert.alert(
      "Reset Demo State",
      "Restore starting demo setup with queued matches, active chats, and a fresh Bridge deck?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Reset",
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
        <Header headerTitle={"SkillBridge"} button={button} />
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
