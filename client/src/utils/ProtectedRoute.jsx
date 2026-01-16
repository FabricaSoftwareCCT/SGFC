import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const getUserFromStorage = () => {
    const user =
        JSON.parse(localStorage.getItem('user')) ||
        JSON.parse(sessionStorage.getItem('user'));
    return user;
};

export const ProtectedRoute = ({ requireAdmin = false }) => {
    const user = getUserFromStorage();


    if (requireAdmin && user.accountType !== 'Administrador') {
        return <Navigate to="/no-autorizado" />;
    }

    return <Outlet />;
};
