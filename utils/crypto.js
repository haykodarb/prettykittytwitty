require('dotenv').config();
const Cryptr = require('cryptr');
const cryptr = new Cryptr(process.env.CRYPTO_SECRET);


const encrypt = (text) => {
    let encryptedString = cryptr.encrypt(text);
    return encryptedString;
};

const decrypt = (text) => {
    let decryptedString = cryptr.decrypt(text);
    return decryptedString;
};


module.exports = {
    encrypt,
    decrypt
};
