import axiosInstance from '../axios';

const REPORT_BASE_PATH = "/api/reports";

export const getAdminReports = async (filters = {}) => {
  const queryParams = new URLSearchParams();
  if (filters.from) queryParams.append('from', filters.from);
  if (filters.to) queryParams.append('to', filters.to);

  const response = await axiosInstance.get(`${REPORT_BASE_PATH}/admin?${queryParams.toString()}`);
  return response.data;
};
