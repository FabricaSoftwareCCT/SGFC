import axiosInstance from "../../config/axiosInstance"

export const getSecurityQuestion = async () => {
    const response = await axiosInstance.get('/api/users/getSecurity/');
    const question = response.data?.Pregunta;
    return question;
}

export const postSecurityQuestion = async (pregunta, Answer) => {
    const response = await axiosInstance.post('/api/users/security/', {
        Question: pregunta,
        password: Answer
    });

    return response;
}

export const updateSecurityQuestion = async (pregunta, Answer) => {
    const response = await axiosInstance.put('/api/users/updateSecurity/', {
        Question: pregunta,
        password: Answer
    });

    return response.data;
}