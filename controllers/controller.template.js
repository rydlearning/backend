/**
 * Slantapp code and properties {www.slantapp.io}
 */
const sha1 = require('sha1');
const Joi = require('joi');

const {useAsync, utils, errorHandle,} = require('./../core');

exports.adminStats = useAsync(async (req, res, next) => {
    try {
        res.json(utils.JParser("ok-response", !![], []));
    } catch (e) {
        throw new errorHandle(e.message, 202);
    }
});
