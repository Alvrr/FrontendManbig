import { Navigate } from "react-router-dom";
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { token, user } = useAuth();
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user?.role;

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
