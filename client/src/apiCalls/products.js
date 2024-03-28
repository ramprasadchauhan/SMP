import { axiosInstance } from "./axiosInstance";

// add new product
export const AddProduct = async (payload) => {
  try {
    const response = await axiosInstance.post(
      "/api/product/add-product",
      payload
    );
    console.log(response);
    return response.data;
  } catch (error) {
    return error.message;
  }
};

export const GetProducts = async (filters) => {
  try {
    const response = await axiosInstance.post(
      "/api/product/get-products",
      filters
    );
    console.log(response);
    return response.data;
  } catch (error) {
    return error.message;
  }
};

export const EditProduct = async (id, payload) => {
  try {
    const response = await axiosInstance.put(
      `/api/product/edit-product/${id}`,
      payload
    );
    return response.data;
  } catch (error) {
    return error.message;
  }
};

export const DeleteProduct = async (id) => {
  try {
    const response = await axiosInstance.delete(
      `/api/product/delete-product/${id}`
    );
    return response.data;
  } catch (error) {
    return error.message;
  }
};

// upload product image
export const uploadProductImage = async (payload) => {
  try {
    const response = await axiosInstance.post(
      `/api/product/upload-product-image`,
      payload
    );
    return response.data;
  } catch (error) {
    return error.message;
  }
};

// update product status

export const UpdateProductStatus = async (id, status) => {
  try {
    const response = await axiosInstance.put(
      `/api/product/update-product-status/${id}`,
      { status }
    );
    return response.data;
  } catch (error) {
    return error.message;
  }
};

export const GetProductById = async (id) => {
  try {
    const response = await axiosInstance.get(
      `/api/product/get-product-by-id/${id}`
    );
    return response.data;
  } catch (error) {
    return error.message;
  }
};
