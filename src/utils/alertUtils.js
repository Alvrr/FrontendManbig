import Swal from 'sweetalert2';

// Konfigurasi default untuk SweetAlert2 selaras dengan tema dark-blue
const defaultConfig = {
  buttonsStyling: false,
  background: '#020617',
  color: '#ffffff',
  customClass: {
    popup: 'bg-slate-950 text-white border border-white/10 shadow-2xl',
    confirmButton: 'bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 text-white px-6 py-2 rounded-full shadow hover:opacity-95 transition font-semibold mr-2',
    cancelButton: 'bg-white/10 text-white px-6 py-2 rounded-full border border-white/20 hover:bg-white/20 transition font-medium',
    denyButton: 'bg-red-600 text-white px-6 py-2 rounded-full hover:bg-red-700 transition font-semibold mr-2'
  }
};

// Alert sukses
export const showSuccessAlert = (title, text = '') => {
  return Swal.fire({
    icon: 'success',
    title,
    text,
    confirmButtonText: 'OK',
    ...defaultConfig,
    customClass: {
      ...defaultConfig.customClass,
      confirmButton: 'bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 text-white px-6 py-2 rounded-full shadow hover:opacity-95 transition font-semibold'
    }
  });
};

// Alert error
export const showErrorAlert = (title, text = '') => {
  return Swal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonText: 'OK',
    ...defaultConfig,
    customClass: {
      ...defaultConfig.customClass,
      confirmButton: 'bg-red-600 text-white px-6 py-2 rounded-full hover:bg-red-700 transition font-semibold'
    }
  });
};

// Alert warning
export const showWarningAlert = (title, text = '') => {
  return Swal.fire({
    icon: 'warning',
    title,
    text,
    confirmButtonText: 'OK',
    ...defaultConfig,
    customClass: {
      ...defaultConfig.customClass,
      confirmButton: 'bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 text-white px-6 py-2 rounded-full shadow hover:opacity-95 transition font-semibold'
    }
  });
};

// Alert info
export const showInfoAlert = (title, text = '') => {
  return Swal.fire({
    icon: 'info',
    title,
    text,
    confirmButtonText: 'OK',
    ...defaultConfig,
    customClass: {
      ...defaultConfig.customClass,
      confirmButton: 'bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 text-white px-6 py-2 rounded-full shadow hover:opacity-95 transition font-semibold'
    }
  });
};

// Alert konfirmasi dengan Ya/Tidak
export const showConfirmAlert = (title, text = '', confirmButtonText = 'Ya', cancelButtonText = 'Tidak') => {
  return Swal.fire({
    title,
    text,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    ...defaultConfig,
    customClass: {
      ...defaultConfig.customClass,
      confirmButton: 'bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 text-white px-6 py-2 rounded-full shadow hover:opacity-95 transition font-semibold mr-2',
      cancelButton: 'bg-white/10 text-white px-6 py-2 rounded-full border border-white/20 hover:bg-white/20 transition font-medium'
    }
  });
};

// Alert konfirmasi hapus
export const showDeleteConfirmAlert = (title = 'Hapus Data', text = 'Apakah Anda yakin ingin menghapus data ini?') => {
  return Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Ya, Hapus',
    cancelButtonText: 'Batal',
    ...defaultConfig,
    customClass: {
      ...defaultConfig.customClass,
      confirmButton: 'bg-red-600 text-white px-6 py-2 rounded-full hover:bg-red-700 transition font-semibold mr-2',
      cancelButton: 'bg-white/10 text-white px-6 py-2 rounded-full border border-white/20 hover:bg-white/20 transition font-medium'
    }
  });
};

// Alert konfirmasi logout
export const showLogoutConfirmAlert = () => {
  return Swal.fire({
    title: 'Konfirmasi Logout',
    text: 'Apakah Anda yakin ingin keluar?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Ya, Logout',
    cancelButtonText: 'Batal',
    ...defaultConfig,
    customClass: {
      ...defaultConfig.customClass,
      confirmButton: 'bg-red-600 text-white px-6 py-2 rounded-full hover:bg-red-700 transition font-semibold mr-2',
      cancelButton: 'bg-white/10 text-white px-6 py-2 rounded-full border border-white/20 hover:bg-white/20 transition font-medium'
    }
  });
};

// Alert loading dengan timer
export const showLoadingAlert = (title = 'Loading...', timer = 1500) => {
  return Swal.fire({
    title,
    timer,
    timerProgressBar: true,
    didOpen: () => {
      Swal.showLoading();
    },
    willClose: () => {
      Swal.hideLoading();
    },
    showConfirmButton: false,
    ...defaultConfig
  });
};

// Alert sukses dengan timer
export const showTimedSuccessAlert = (title, text = '', timer = 1500) => {
  return Swal.fire({
    icon: 'success',
    title,
    text,
    timer,
    showConfirmButton: false,
    timerProgressBar: true,
    ...defaultConfig
  });
};

// Alert toast (pojok kanan atas)
export const showToast = (icon, title, position = 'top-end', timer = 3000) => {
  return Swal.fire({
    toast: true,
    position,
    icon,
    title,
    showConfirmButton: false,
    timer,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
  });
};

// Alert input
export const showInputAlert = (title, inputPlaceholder = '', inputValue = '') => {
  return Swal.fire({
    title,
    input: 'text',
    inputPlaceholder,
    inputValue,
    showCancelButton: true,
    confirmButtonText: 'OK',
    cancelButtonText: 'Batal',
    ...defaultConfig,
    inputValidator: (value) => {
      if (!value) {
        return 'Input tidak boleh kosong!';
      }
    }
  });
};
