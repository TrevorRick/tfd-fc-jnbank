const assert = require('assert');
const aesutil = require('../utils/aesutil');

let encryption = aesutil.encrypt('测试01!@#');
let decryption = aesutil.decrypt(encryption);

describe('decryption', function () {
    it('should encrypt passed without error.', function () {
        assert.equal(encryption, 'rwH+jEn/+hVsLyam1ynAOg==');
    });
    it('should decrypt passed without error.', function () {
        assert.equal(decryption, '测试01!@#');
    });
});

