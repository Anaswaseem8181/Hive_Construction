import axiosInstance from "../axios";

const PROPERTY_BASE_PATH = "/api/properties";

const buildPropertyFormData = (propertyData = {}) => {
  if (propertyData instanceof FormData) {
    return propertyData;
  }

  const formData = new FormData();
  const isFileLike = (value) =>
    (typeof File !== "undefined" && value instanceof File) ||
    (typeof Blob !== "undefined" && value instanceof Blob);

  Object.entries(propertyData).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    if (key === "image") {
      if (isFileLike(value)) {
        formData.append("image", value);
      }
      return;
    }

    formData.append(key, value);
  });

  return formData;
};

const formatApiError = (error, fallbackMessage) => {
  throw {
    message:
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      fallbackMessage,
  };
};

export const getAllProperties = async () => {
  try {
    const response = await axiosInstance.get(PROPERTY_BASE_PATH);
    return response.data;
  } catch (error) {
    formatApiError(error, "Failed to fetch properties");
  }
};

export const getPropertyById = async (id) => {
  try {
    const response = await axiosInstance.get(`${PROPERTY_BASE_PATH}/${id}`);
    return response.data;
  } catch (error) {
    formatApiError(error, "Failed to fetch property");
  }
};

export const createProperty = async (propertyData) => {
  try {
    const formData = buildPropertyFormData(propertyData);
    const response = await axiosInstance.post(
      `${PROPERTY_BASE_PATH}/create-property`,
      formData
    );

    return response.data;
  } catch (error) {
    formatApiError(error, "Failed to create property");
  }
};

export const updateProperty = async (id, propertyData) => {
  try {
    const formData = buildPropertyFormData(propertyData);
    const response = await axiosInstance.put(
      `${PROPERTY_BASE_PATH}/${id}`,
      formData
    );

    return response.data;
  } catch (error) {
    formatApiError(error, "Failed to update property");
  }
};

export const deleteProperty = async (id) => {
  try {
    const response = await axiosInstance.delete(`${PROPERTY_BASE_PATH}/${id}`);
    return response.data;
  } catch (error) {
    formatApiError(error, "Failed to delete property");
  }
};
