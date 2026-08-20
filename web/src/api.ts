import axios from "axios";

import { API_URL } from "./globals";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  paramsSerializer: { indexes: null },
});

export default api;
