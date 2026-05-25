import axiosInstance from '../axios';

const NOTIFICATION_BASE_PATH = "/api/notifications";

export const getUserNotifications = async () => {
  const response = await axiosInstance.get(NOTIFICATION_BASE_PATH);
  return response.data;
};

export const markNotificationAsRead = async (id) => {
  const response = await axiosInstance.patch(`${NOTIFICATION_BASE_PATH}/${id}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await axiosInstance.patch(`${NOTIFICATION_BASE_PATH}/read-all`);
  return response.data;
};
