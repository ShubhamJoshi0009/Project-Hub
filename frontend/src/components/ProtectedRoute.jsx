import { Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../AuthContextInstance';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;
