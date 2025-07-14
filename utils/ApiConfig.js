const BASE_URL = "http://10.1.51.153:8080" // Punya Ammar, jangan dihapus. komen dan duplikat untuk menyesuaikan dengan IP masing-masing
// const BASE_URL = "http://192.168.3.69:8080" // Punya Verdy, jangan dihapus. komen dan duplikat untuk menyesuaikan dengan IP masing-masing

const API = {
  BASE_URL,
  LOGIN: `${BASE_URL}/user/login`,
  HISTORY: `${BASE_URL}/present/getHistory`,
  IZIN: `${BASE_URL}/reqPermit/addReqPermit`,
  ABSEN: `${BASE_URL}/present/addPresent`,
  PROFILE: `${BASE_URL}/user/updateProfilePic`,
  PIE_CHART: `${BASE_URL}/rekap/pieSebulan`,
  CHART_ABSENSI_BULANAN: `${BASE_URL}/rekap/lineAbsensiBulanan`,
};

export default API;