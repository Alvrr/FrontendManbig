import axiosInstance from './axiosInstance';

// Get all employees (admin only)
export const getAllKaryawan = async () => {
  try {
    const response = await axiosInstance.get('/users/karyawan');
    return response.data?.data || response.data || [];
  } catch (error) {
    if (error?.response?.status === 403) {
      // Role tidak diizinkan (mis. kasir) -> kembalikan [] agar UI tetap jalan
      return [];
    }
    console.error('Error fetching karyawan:', error);
    throw error;
  }
};

// Get active employees only
export const getActiveKaryawan = async () => {
  try {
    const response = await axiosInstance.get('/users/karyawan/active');
    return response.data?.data || [];
  } catch (error) {
    if (error?.response?.status === 403) {
      return [];
    }
    console.error('Error fetching active karyawan:', error);
    throw error;
  }
};

// Get employee by ID
export const getKaryawanById = async (id) => {
  try {
    const response = await axiosInstance.get(`/users/karyawan/${id}`);
    return response.data?.data;
  } catch (error) {
    if (error?.response?.status === 403) {
      return null;
    }
    console.error('Error fetching karyawan by ID:', error);
    throw error;
  }
};

// Create new employee (admin only)
export const createKaryawan = async (data) => {
  try {
    const response = await axiosInstance.post('/users/karyawan', data);
    return response.data;
  } catch (error) {
    console.error('Error creating karyawan:', error);
    throw error;
  }
};

// Update employee (admin only)
export const updateKaryawan = async (id, data) => {
  try {
    console.log('Update URL will be:', `/users/karyawan/${id}`); // Debug log
    console.log('Update data:', data); // Debug log
    const response = await axiosInstance.put(`/users/karyawan/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating karyawan:', error);
    console.error('Failed URL:', `/users/karyawan/${id}`); // Debug log
    throw error;
  }
};

// Toggle employee status (admin only)
export const toggleKaryawanStatus = async (id, status) => {
  try {
    const response = await axiosInstance.patch(`/users/karyawan/${id}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('Error toggling karyawan status:', error);
    throw error;
  }
};

// Delete employee (admin only)
export const deleteKaryawan = async (id) => {
  try {
    console.log('Delete URL will be:', `/users/karyawan/${id}`); // Debug log
    const response = await axiosInstance.delete(`/users/karyawan/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting karyawan:', error);
    console.error('Failed URL:', `/users/karyawan/${id}`); // Debug log
    throw error;
  }
};