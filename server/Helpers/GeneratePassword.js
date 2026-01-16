const passwordCharacters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{};:,.<>?/';

async function generateTempPassword() {
    let tempPassword = '';

    for(let i = 0; i < 8 ; i++) {
        const randomIndex = Math.floor(Math.random() * passwordCharacters.length);
        tempPassword += passwordCharacters[randomIndex];    
    }

    return verificacionTempPassword(tempPassword);
};

async function verificacionTempPassword(password) {
    let hasLetter = /(?=.*[A-Z])/.test(password) && /(?=.*[a-z])/.test(password);
    let hasNumber = /(?=.*[0-9])/.test(password);
    let hasSpecialChar = /(?=.*[!@#$%^&*()\-_=+\[\]{};:,.<>?\\|])/.test(password);
    let hasValidLength = password.length >= 8;

    if(hasLetter && hasNumber && hasSpecialChar && hasValidLength) {
        return password;
    }

    return await generateTempPassword();
}

module.exports = { generateTempPassword };