// utils/activityUtils.js
import { format } from "date-fns";
import { id } from "date-fns/locale";

export const getActivityIcon = (type) => {
  const icons = {
    'transaction': '💰',
    'payment': '💳',
    'product': '📦',
    'customer': '👤',
    'employee': '👥',
    'driver': '🚗',
    'login': '🔐',
    'system': '⚙️'
  };
  return icons[type] || '📝';
};

export const getActivityColor = (type) => {
  const colors = {
    'transaction': 'bg-green-100 text-green-800',
    'payment': 'bg-blue-100 text-blue-800',
    'product': 'bg-purple-100 text-purple-800',
    'customer': 'bg-orange-100 text-orange-800',
    'employee': 'bg-indigo-100 text-indigo-800',
    'driver': 'bg-cyan-100 text-cyan-800',
    'login': 'bg-gray-100 text-gray-800',
    'system': 'bg-yellow-100 text-yellow-800'
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
};

export const formatActivityTime = (timestamp) => {
  const now = new Date();
  const activityTime = new Date(timestamp);
  const diffInMinutes = Math.floor((now - activityTime) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Baru saja';
  if (diffInMinutes < 60) return `${diffInMinutes} menit yang lalu`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} jam yang lalu`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} hari yang lalu`;
  
  return format(activityTime, "dd MMM yyyy, HH:mm", { locale: id });
};

// Fungsi untuk mengkonversi data pembayaran menjadi aktivitas
export const parsePaymentActivities = (payments, users = {}) => {
  if (!Array.isArray(payments)) return [];
  
  return payments.map(payment => ({
    id: `payment-${payment.id}`,
    type: payment.status === 'Selesai' ? 'transaction' : 'payment',
    title: payment.status === 'Selesai' ? 'Transaksi Diselesaikan' : 'Transaksi Dibuat',
    description: `${payment.status === 'Selesai' ? 'Menyelesaikan' : 'Membuat'} transaksi ${payment.id} untuk ${payment.nama_pelanggan || 'pelanggan'}`,
    user: payment.nama_kasir || users[payment.id_kasir]?.nama || 'System',
    timestamp: payment.tanggal || payment.updated_at || new Date().toISOString(),
    details: {
      amount: payment.total_bayar,
      customer: payment.nama_pelanggan,
      status: payment.status
    }
  }));
};

// Fungsi untuk mengkonversi data produk menjadi aktivitas (simulasi)
export const parseProductActivities = (products) => {
  if (!Array.isArray(products)) return [];
  
  // Karena kita tidak punya timestamp yang tepat, kita buat simulasi berdasarkan data yang ada
  // Ini hanya contoh implementasi, idealnya backend yang menyediakan log aktivitas
  return products.slice(0, 5).map((product, index) => ({
    id: `product-${product.id}-${index}`,
    type: 'product',
    title: 'Produk Diperbarui',
    description: `Memperbarui data produk ${product.nama_produk}`,
    user: 'Admin', // Default karena tidak ada info user pada data produk
    timestamp: new Date(Date.now() - (index * 60 * 60 * 1000)).toISOString(), // Simulasi timestamp
    details: {
      productName: product.nama_produk,
      stock: product.stok,
      price: product.harga
    }
  }));
};

// Fungsi untuk mengkonversi data pelanggan menjadi aktivitas (simulasi)
export const parseCustomerActivities = (customers) => {
  if (!Array.isArray(customers)) return [];
  
  return customers.slice(0, 3).map((customer, index) => ({
    id: `customer-${customer.id}-${index}`,
    type: 'customer',
    title: 'Data Pelanggan Diperbarui',
    description: `Memperbarui data pelanggan ${customer.nama}`,
    user: 'Admin',
    timestamp: new Date(Date.now() - (index * 90 * 60 * 1000)).toISOString(), // Simulasi timestamp
    details: {
      customerName: customer.nama,
      phone: customer.no_hp,
      address: customer.alamat
    }
  }));
};

// Fungsi untuk mengkonversi data karyawan menjadi aktivitas
export const parseEmployeeActivities = (employees) => {
  if (!Array.isArray(employees)) return [];
  
  return employees.slice(0, 5).map((employee, index) => ({
    id: `employee-${employee.id}-${index}`,
    type: 'employee',
    title: `Karyawan ${employee.nama} bergabung`,
    description: `${employee.nama} bergabung sebagai ${employee.role === 'admin' ? 'Administrator' : employee.role === 'kasir' ? 'Kasir' : 'Driver'}`,
    user: 'Admin',
    timestamp: employee.created_at || new Date(Date.now() - (index * 120 * 60 * 1000)).toISOString(),
    details: {
      employeeName: employee.nama,
      role: employee.role,
      status: employee.status,
      username: employee.username
    }
  }));
};

// Fungsi utama untuk menggabungkan semua aktivitas
export const combineActivities = (payments = [], products = [], customers = [], employees = [], users = {}) => {
  const activities = [
    ...parsePaymentActivities(payments, users),
    ...parseProductActivities(products),
    ...parseCustomerActivities(customers),
    ...parseEmployeeActivities(employees)
  ];
  
  // Urutkan berdasarkan timestamp (terbaru dulu)
  return activities
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 50); // Ambil 50 aktivitas terbaru
};

// Fungsi untuk mendapatkan aktivitas hari ini
export const getTodayActivities = (activities) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return activities.filter(activity => {
    const activityDate = new Date(activity.timestamp);
    activityDate.setHours(0, 0, 0, 0);
    return activityDate.getTime() === today.getTime();
  });
};

// Fungsi untuk menghitung statistik aktivitas
export const getActivityStats = (activities) => {
  const stats = {
    total: activities.length,
    today: getTodayActivities(activities).length,
    byType: {}
  };
  
  activities.forEach(activity => {
    stats.byType[activity.type] = (stats.byType[activity.type] || 0) + 1;
  });
  
  return stats;
};
