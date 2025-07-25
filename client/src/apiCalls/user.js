import { axiosInstance } from "./axiosInstance";

// register user
export const RegisterUser = async (payload) => {
  try {
    const response = await axiosInstance.post("/api/auth/register", payload);
    console.log(response);
    return response.data;
  } catch (error) {
    console.log(error);
    return error.response.data;
  }
};

export const LoginUser = async (payload) => {
  try {
    const response = await axiosInstance.post("/api/auth/login", payload);
    console.log(response);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

export const GetCurrentUser = async () => {
  try {
    const response = await axiosInstance.get("/api/user/get-current-user");
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

export const GetAllUsers = async () => {
  try {
    const response = await axiosInstance.get("/api/user/get-all-users");
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

export const UpdateUserStatus = async (id, status) => {
  try {
    const response = await axiosInstance.put(
      `/api/user/update-user-status/${id}`,
      { status }
    );
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};
