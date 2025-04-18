/**
 * Slantapp code and properties {www.slantapp.io}
 */
class CoreError extends Error {
    constructor(msg, code) {
        super(msg.replaceAll('"', ""));
        this.statusCode = code;
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = CoreError;
