import axiosInstance from '../../config/axiosInstance';

export const getEmployeebyCompany = async (nameEmpresa) => {
    console.log("Fetching employees for company:", nameEmpresa);
    const response = await axiosInstance.get(`http://localhost:3001/api/users/empleadosForempresa/${nameEmpresa}`);
    return response;
}