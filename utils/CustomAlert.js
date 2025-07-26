import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Modal from "react-native-modal";

const { width } = Dimensions.get("window");

// Alert types with their corresponding styles
const ALERT_TYPES = {
  success: {
    iconName: "checkmark-circle",
    iconColor: "#34C759",
    backgroundColor: "#E8F5E8",
  },
  error: {
    iconName: "close-circle",
    iconColor: "#FF3B30",
    backgroundColor: "#FFEBEE",
  },
  warning: {
    iconName: "warning",
    iconColor: "#FF9500",
    backgroundColor: "#FFF3E0",
  },
  info: {
    iconName: "information-circle",
    iconColor: "#007AFF",
    backgroundColor: "#E3F2FD",
  },
};

// Global alert state
let globalAlertState = {
  isVisible: false,
  type: "info",
  title: "",
  message: "",
  buttons: [],
  onDismiss: null,
};

let alertUpdateCallback = null;

// Custom Alert class
class CustomAlert {
  static show(options) {
    const {
      type = "info",
      title = "",
      message = "",
      buttons = [{ text: "OK", onPress: null }],
      onDismiss = null,
    } = options;

    globalAlertState = {
      isVisible: true,
      type,
      title,
      message,
      buttons,
      onDismiss,
    };

    if (alertUpdateCallback) {
      alertUpdateCallback(globalAlertState);
    }
  }

  static hide() {
    globalAlertState = {
      ...globalAlertState,
      isVisible: false,
    };

    if (alertUpdateCallback) {
      alertUpdateCallback(globalAlertState);
    }
  }

  // Convenience methods for different alert types
  static success(title, message, buttons) {
    this.show({ type: "success", title, message, buttons });
  }

  static error(title, message, buttons) {
    this.show({ type: "error", title, message, buttons });
  }

  static warning(title, message, buttons) {
    this.show({ type: "warning", title, message, buttons });
  }

  static info(title, message, buttons) {
    this.show({ type: "info", title, message, buttons });
  }

  // Simple alert method similar to Alert.alert()
  static alert(title, message, buttons = [{ text: "OK" }]) {
    this.show({ type: "info", title, message, buttons });
  }
}

// Alert Provider Component
const AlertProvider = ({ children }) => {
  const [alertState, setAlertState] = useState(globalAlertState);

  useEffect(() => {
    alertUpdateCallback = setAlertState;
    return () => {
      alertUpdateCallback = null;
    };
  }, []);

  const handleButtonPress = (button) => {
    if (button.onPress) {
      button.onPress();
    }
    CustomAlert.hide();
  };

  const handleModalHide = () => {
    if (alertState.onDismiss) {
      alertState.onDismiss();
    }
  };

  const alertConfig = ALERT_TYPES[alertState.type] || ALERT_TYPES.info;

  return (
    <>
      {children}
      <Modal
        isVisible={alertState.isVisible}
        animationIn="fadeIn"
        animationOut="fadeOut"
        backdropOpacity={0.5}
        backdropTransitionInTiming={300}
        backdropTransitionOutTiming={300}
        onBackdropPress={() => CustomAlert.hide()}
        onModalHide={handleModalHide}
        style={styles.modalContainer}>
        <View style={styles.alertContainer}>
          {/* Icon Section */}
          <View style={[styles.iconContainer, { backgroundColor: alertConfig.backgroundColor }]}>
            <Ionicons name={alertConfig.iconName} size={48} color={alertConfig.iconColor} />
          </View>

          {/* Content Section */}
          <View style={styles.contentContainer}>
            {alertState.title ? <Text style={styles.titleText}>{alertState.title}</Text> : null}

            {alertState.message ? <Text style={styles.messageText}>{alertState.message}</Text> : null}
          </View>

          {/* Buttons Section */}
          <View style={styles.buttonsContainer}>
            {alertState.buttons.map((button, index) => {
              const isDestructive = button.style === "destructive";
              const isCancel = button.style === "cancel";
              const isPrimary = !isDestructive && !isCancel;

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    isDestructive && styles.destructiveButton,
                    isCancel && styles.cancelButton,
                    isPrimary && styles.primaryButton,
                    alertState.buttons.length === 1 && styles.singleButton,
                  ]}
                  onPress={() => handleButtonPress(button)}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.buttonText,
                      isDestructive && styles.destructiveButtonText,
                      isCancel && styles.cancelButtonText,
                      isPrimary && styles.primaryButtonText,
                    ]}>
                    {button.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    justifyContent: "center",
    alignItems: "center",
    margin: 0,
  },
  alertContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: width * 0.85,
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  contentContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  titleText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1C1C1E",
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 24,
  },
  messageText: {
    fontSize: 16,
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: 22,
  },
  buttonsContainer: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  singleButton: {
    flex: 1,
  },
  primaryButton: {
    backgroundColor: "#007AFF",
  },
  cancelButton: {
    backgroundColor: "#F2F2F7",
  },
  destructiveButton: {
    backgroundColor: "#FF3B30",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  primaryButtonText: {
    color: "#fff",
  },
  cancelButtonText: {
    color: "#8E8E93",
  },
  destructiveButtonText: {
    color: "#fff",
  },
});

export { AlertProvider, CustomAlert };
export default CustomAlert;
