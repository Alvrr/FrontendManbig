import { Navigate } from "react-router-dom";
import { decodeJWT } from '../utils/jwtDecode';

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const token = localStorage.getItem("token");
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Decode JWT untuk mendapatkan informasi user
  const decoded = decodeJWT(token);
  const userRole = decoded?.role;

  // Jika ada requiredRoles dan user tidak memiliki role yang diperlukan
  if (requiredRoles.length > 0 && !requiredRoles.includes(userRole)) {
    // Redirect ke dashboard sesuai role
    const redirectPath = userRole === 'driver' ? '/dashboard' : 
                        userRole === 'kasir' ? '/dashboard' : 
                        '/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default ProtectedRoute;
