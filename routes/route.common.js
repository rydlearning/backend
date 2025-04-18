/**
 * Slantapp code and properties {www.slantapp.io}
 */
let express = require('express');
const {useAsync, utils} = require("../core");
const {bodyParser, stripeBodyGuard} = require("../middleware/middleware.protects");

const {
    commonSendOTP,
    commonGetPackages,
    commonGetDayTimes,
    commonProcessInvoice,
    commonCheckCoupon,
    commonGetPaymentIntent,
    commonPaymentStatus,
    migrationDBs,
    stripePaymentCheck,
    commonPaymentStatusPaystack,
    getAffiliates,
    GetAllTestimonial,
    commonGetPartnerPaymentIntent, commonPartnerProcessInvoice, GetProgramCertificate, CheckMigrations
} = require("../controllers/controller.common");
const { getAllPublishedBlogs, updateBlogViews, updateBlogLikes, getSingleBlog } = require('../controllers/controller.admin');
// const { promoParentCreateProgramsForChildrenWithoutProgram, updatePromoProgramsTimeGroupIndex } = require('../controllers/controller.promo');

let router = express.Router();

//payment hook
router.post('/payment/hook/stripe', useAsync(bodyParser), useAsync(stripeBodyGuard), useAsync(commonPaymentStatus));
router.post('/payment/hook/paystack', useAsync(bodyParser), useAsync(stripeBodyGuard), useAsync(commonPaymentStatusPaystack));

//verify email
router.post('/verify/email', useAsync(bodyParser), useAsync(commonSendOTP));
router.get('/package/all', useAsync(commonGetPackages));
router.get('/program/daytime', useAsync(commonGetDayTimes));
//payment related routes
router.get('/stripe-check/:id', useAsync(stripePaymentCheck));
router.post('/payment/get/stripe-intent', useAsync(commonGetPaymentIntent));
router.get('/payment/check/coupon/:code', useAsync(commonCheckCoupon));

//EJS VIEWS FOR PAYMENT
router.get('/payment-init/:id/:coupon?', commonProcessInvoice, function (req, res, next) {
    res.render('payment', {data: req.app.locals.invoice});
});

//EJS VIEWS FOR PARTNER PAYMENT
router.get('/partner-payment-init/:id/:coupon?', commonPartnerProcessInvoice, function (req, res, next) {
    res.render('partner-payment', {data: req.app.locals.invoice});
});

//AFFILIATES
router.get('/affiliates/:code/:accessKey', getAffiliates);

//Testimonial
router.get('/testimonial/all', GetAllTestimonial);

//CERTIFICATE PROGRAMS
router.get('/certificate/:id', GetProgramCertificate);

//MIGRATIONS DBs
router.get('/migration-db', migrationDBs);

// BLOG Route
router.get('/blogs/all', getAllPublishedBlogs);
router.get('/blog/:id', getSingleBlog);
router.put('/blog/views/:id', updateBlogViews);
router.put('/blog/like/:id', updateBlogLikes);

//PROMO MIGRATION CHECK
router.get('/migration/check/:id', CheckMigrations);
// router.get('/withoutprogram', updatePromoProgramsTimeGroupIndex);
module.exports = router;

router.all('/payment-status', commonPaymentStatus, function (req, res, next) {
    res.render('success', {...req.app.locals.output});
});
//for paystack status
router.all('/payment-status-paystack', commonPaymentStatusPaystack, function (req, res, next) {
    res.render('success', {...req.app.locals.output});
});

//Partners common
router.post('/partners/get-currency-rate', commonPaymentStatusPaystack, async (req, res, next)=> {
    const {country} = req.body
    if(country){
        const rate = await utils.getCurrencyRate(country)
        return res.status(200).json(utils.JParser('success', !!rate, rate));
    }
    res.status(200).json(utils.JParser('success', false, null));
});
//create invoice for partners
router.post('/partners/payment/create', useAsync(commonGetPartnerPaymentIntent));
