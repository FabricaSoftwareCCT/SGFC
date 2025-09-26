const jwt = require('jsonwebtoken');

const generateToken = (properties, key, minutes) => {
  console.log(properties, key, minutes)
  return jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) + minutes * 60, 
      data: properties,
    },
    key
  );
};

module.exports = {generateToken};