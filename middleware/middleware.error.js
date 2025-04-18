/**
 * Slantapp code and properties {www.slantapp.io}
 */
const middlewareError = (err, req, res, next) => {
    if(req.path.includes("payment-init")){
        res.render("empty")
        return
    }
    const error = {...err};
    error.message = err.message;
    /**
     * Define other error handling struct here
     */
    res.status(error.statusCode || 500).json({
        status: false,
        message: error.message,
        data: null
    })
}
module.exports = middlewareError;
