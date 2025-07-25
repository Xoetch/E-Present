const BASE_URL = "http://192.168.8.196:8080"

const API = {
  BASE_URL,
  LOGIN: `${BASE_URL}/user/login`,
  HISTORY: `${BASE_URL}/present/getHistory`,
  IZIN: `${BASE_URL}/reqPermit/addReqPermit`,
  IZIN_SEMENTARA: `${BASE_URL}/reqPermit/addReqPermitSementara`,
  ABSEN: `${BASE_URL}/present/addPresent`,
  PROFILE: `${BASE_URL}/user/updateProfilePic`,
  PIE_CHART: `${BASE_URL}/rekap/pieSebulan`,
  CHART_ABSENSI_BULANAN: `${BASE_URL}/rekap/lineAbsensiBulanan`,
  EXISTING_IZIN: `${BASE_URL}/reqPermit/getExistingReqPermit`,
  GET_HOLIDAY: `${BASE_URL}/holiday/getHolidays`,
};

export default API;
