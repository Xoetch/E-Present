import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Modal from "react-native-modal";

export default function resultModal({ visible, onClose, isSuccess }) {
  const title = isSuccess ? "Berhasil" : "Gagal";

  /* pengkondisian warna gagal atau sukses */
  const titleStyle = {
    ...styles.title,
    color: isSuccess ? "#46A06F" : "#E9483F",
  };

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onSwipeComplete={onClose}
      swipeDirection="down"
      style={styles.modal}
    >
      <View style={styles.container}>
        <View style={styles.topBar} />
        <Text style={titleStyle}>{title}</Text>
        
        <TouchableOpacity
          onPress={onClose}
          style={{ marginTop: 12, alignSelf: "center" }}
        >
          <Text style={{ color: "#2E7BE8" }}>Tutup</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  container: {
    backgroundColor: "#fff",
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  topBar: {
    height: 5,
    width: 60,
    backgroundColor: "#ccc",
    borderRadius: 999,
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
});
