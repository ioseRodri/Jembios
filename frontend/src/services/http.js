
import axios from 'axios';

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' },
});


export const postJson = (url, data) => http.post(url, data).then(r => r.data);
export const getJson  = (url)       => http.get(url).then(r => r.data);
export const patchJson= (url, data) => http.patch(url, data).then(r => r.data);

export const postForm = (url, formData) =>
  http.post(url, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(r => r.data);
