import axiosInstance from "../../config/axiosInstance"

export const getSecurityQuestion = async () => {
    const response = await axiosInstance.get('http://localhost:3001/api/users/getSecurity/');
    const question = response.data?.Pregunta;
    return question;
}

export const postSecurityQuestion = async (pregunta, Answer) => {
    const response = await axiosInstance.post('http://localhost:3001/api/users/security/', {
        Question: pregunta,
        password: Answer
    });

    return response;
}