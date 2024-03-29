import { axiosInstance } from "./axiosInstance";

// add a notificaton

export const AddNotification = async (data) => {
  try {
    const response = await axiosInstance.post("/api/notification/notify", data);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// get all notification

export const GetAllNotification = async () => {
  try {
    const response = await axiosInstance.get(
      "/api/notification/get-all-notification"
    );
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

//delete notification
export const DeleteNotification = async (id) => {
  try {
    const response = await axiosInstance.delete(
      `api/notification/delete-notification/${id}`
    );
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};
// read all notification

export const ReadAllNotification = async () => {
  try {
    const response = await axiosInstance.put(
      "/api/notification/read-all-notification"
    );
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};
