const BASE_URL = "http://192.168.227.145:8080" // Punya Ammar, jangan dihapus. komen dan duplikat untuk menyesuaikan dengan IP masing-masing

const API = {
  BASE_URL,
  LOGIN: `${BASE_URL}/user/login`,
  HISTORY: `${BASE_URL}/present/getHistory`,
  IZIN: `${BASE_URL}/reqPermit/addReqPermit`,
  ABSEN: `${BASE_URL}/present/addPresent`,
};

export default API;