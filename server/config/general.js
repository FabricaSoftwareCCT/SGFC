require('dotenv').config();

module.exports = {
    googleClientId: process.env.VITE_GOOGLE_CLIENT_ID,
    port: process.env.PORT || 3001,
};