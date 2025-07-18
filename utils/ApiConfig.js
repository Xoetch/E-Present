// const BASE_URL = "http://192.168.227.145:8080" // Punya Ammar, jangan dihapus. komen dan duplikat untuk menyesuaikan dengan IP masing-masing
const BASE_URL = "http://192.168.1.5:8080"; // Punya Ammar, jangan dihapus. komen dan duplikat untuk menyesuaikan dengan IP masing-masing
// const BASE_URL = "http://192.168.3.69:8080" // Punya Ammar, jangan dihapus. komen dan duplikat untuk menyesuaikan dengan IP masing-masing
// const BASE_URL = "http://192.168.100.148:8080" // Punya Ammar, jangan dihapus. komen dan duplikat untuk menyesuaikan dengan IP masing-masing
// const BASE_URL = "http://192.168.181.85:8080" // Punya Ammar, jangan dihapus. komen dan duplikat untuk menyesuaikan dengan IP masing-masing

const API = {
  BASE_URL,
  LOGIN: `${BASE_URL}/user/login`,
  HISTORY: `${BASE_URL}/present/getHistory`,
  IZIN: `${BASE_URL}/reqPermit/addReqPermit`,
  ABSEN: `${BASE_URL}/present/addPresent`,
  PROFILE: `${BASE_URL}/user/updateProfilePic`,
  PIE_CHART: `${BASE_URL}/rekap/pieSebulan`,
  CHART_ABSENSI_BULANAN: `${BASE_URL}/rekap/lineAbsensiBulanan`,
  EXISTING_IZIN: `${BASE_URL}/reqPermit/getExistingReqPermit`,
};

export default API;
