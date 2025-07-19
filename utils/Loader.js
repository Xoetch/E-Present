// components/WithLoader.js
import React from "react";
import { View, ActivityIndicator } from "react-native";

export default function Loader({ loading, children, style }) {
  if (loading) {
    return (
      <View style={[{ padding: 12, alignItems: "center" }, style]}>
        <ActivityIndicator size="small" color="#2E7BE8" />
      </View>
    );
  }

  return children;
}
