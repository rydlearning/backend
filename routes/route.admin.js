/**
 * Slantapp code and properties {www.slantapp.io}
 */
let express = require('express');
let router = express.Router();
let {errorHandle, useAsync} = require('../core');
//load middleware for admin
let {bodyParser, adminBodyGuard} = require('../middleware/middleware.protects');
//load controller for admin
let {
    adminLogin,
    adminResetPassword,
    adminCreate,
    adminGetAll,
    adminGetById,
    adminDelete,
    adminUpdate,
    adminCreateParent,
    adminUpdateParent,
    adminDeleteParent,
    adminGetAllParents,
    adminGetParentById,
    adminCreateChild,
    adminGetChildById,
    adminGetAllChild,
    adminUpdateChild,
    adminDeleteChild,
    adminCreateTeacher,
    adminUpdateTeacher,
    adminGetTeacherById,
    adminGetAllTeachers,
    adminDeleteTeacher,
    adminCreateCoupon,
    adminUpdateCoupon,
    adminGetAllCoupons,
    adminDeleteCoupon,
    adminGetCouponById,
    adminCreateProgram,
    adminUpdateProgram,
    adminDeleteProgram,
    adminGetAllPrograms,
    adminGetProgramById,
    adminCreatePackage,
    adminDeletePackage,
    adminGetAllPackages,
    adminGetPackageById,
    adminUpdatePackage,
    adminAcceptSwap,
    adminUpdateSwap,
    adminRejectSwap,
    adminGetAllSwaps,
    adminDeleteSwap,
    adminGetAllTimeTable,
    adminGetAllSurvey,
    adminCreateSurvey,
    adminDeleteSurvey,
    adminUpdateSurvey,
    adminToggleSurvey,
    adminInviteTeacher,
    adminRemoveInviteTeacher,
    adminSendAllParentsEmail,
    adminSendParentEmail,
    adminAssignTeacherToProgram,
    adminGetTeacherInvites,
    adminGetAllOldPrograms,
    adminCohortCreate,
    adminCohortGetAll,
    adminCohortUpdate,
    adminCohortRemove,
    adminBatchUpdateProgram,
    adminSendResetPassword,
    adminGetAllTestimonial,
    testimonialEnabled,
    testimonialDisabled,
    adminCouponRevoke,
    allPartners,
    addDiscountAndApprovePartners,
    updatePartnerDiscount,
    PartnerDashboard,
    PartnerParents,
    adminSendAllPartnerParentsEmail,
    adminSendPartnerParentEmail,
    adminParnerSendResetPassword,
    adminGetAllPartnerChild,
    adminDeletePartnerChild,
    adminUpdatePartnerChild,
    adminGetAllPartnerPrograms,
    adminAssignTeacherToPartnerProgram,
    adminUpdatePartnerProgram,
    adminBatchUpdatePartnerProgram,
    adminEnblePartner,
    adminDisablePartner,
    adminGetPartnerPrograms,
    adminGetAllTimeGroup,
    adminCreateTimeGroup,
    adminCohortComplete,
    adminCohortUnComplete,
    allPromos,
    promoUpdate,
    adminDisablePromo,
    adminEnablePromo,
    PromoDashboard,
    PromoParents,
    adminSendAllPromoParentsEmail,
    adminSendPromoParentEmail,
    adminPromoSendResetPassword,
    adminGetAllPromoChild,
    adminDeletePromoChild,
    adminUpdatePromoChild,
    adminBatchUpdatePromoProgram,
    adminUpdatePromoProgram,
    adminAssignTeacherToPromoProgram,
    adminGetPromoPrograms,
    adminGetAllPromoPrograms,
    adminUpdateTimeGroup,
    adminUpdatePromoTimeSlot,
    adminSendAllPromoParentsReminderEmail,
    getPromoTimeTableWithId,
    adminSendSinglePromoParentsReminderEmail,
    adminSendAllPromoParentsCertificateEmail,
    adminSendSinglePromoParentsCertificateEmail,
    adminDisablePromoRegistration,
    adminEnablePromoRegistration,
    updateMigration,
    migration,
    createBlog,
    getAllBlogs,
    getBlogBySlug,
    updateBlog,
    deleteBlog,
    updateBlogStatus,
    getAuditLog, adminCreditParent
} = require('../controllers/controller.admin');
const {createPromo, getAllPromoTimeTableWithId} = require('../controllers/controller.promo');
const {
    teacherProgramCompleteAndUncomplete,
    teacherProgramCompleteAndUncompleteSingle
} = require('../controllers/controller.teacher');
const {AuditLog} = require("../models");
const { dndtoggler } = require('../controllers/controller.parent');

router.post('/auth/create', useAsync(bodyParser), useAsync(adminCreate));
router.post('/auth/login', useAsync(bodyParser), useAsync(adminLogin));
router.post('/auth/reset', useAsync(bodyParser), useAsync(adminResetPassword));
router.get('/all', useAsync(adminBodyGuard), useAsync(adminGetAll));
router.get('/:id', useAsync(adminBodyGuard), useAsync(adminGetById));
router.put('/:id', useAsync(adminBodyGuard), useAsync(bodyParser), useAsync(adminUpdate));
router.delete('/:id', useAsync(adminBodyGuard), useAsync(adminDelete));

//before any other route do logs
router.all('/*', (adminBodyGuard), async (req, res, next) => {
    try {
        if (req.method !== "GET") {
            const u = req.app.locals.session
            if (u) {
                const rs = {
                    title: "["+req.method + "] "+req.originalUrl,
                    agent: u?.displayName + " (" + u?.email + ")",
                    reasons: u.fullName + ` ${req.method} data to [${req.originalUrl}] with [${JSON.stringify(req.params)}] params`
                }
                const newLog = new AuditLog(rs);
                await newLog.save();
            }
            // console.log(req.originalUrl);
            // console.log(req.params);
        }
    } catch (e) {
        console.log(e)
    }
    next()
})

//admin parent route
router.post('/parent/create', useAsync(adminBodyGuard), useAsync(bodyParser), useAsync(adminCreateParent));
router.post('/parent/send/all', useAsync(adminBodyGuard), useAsync(bodyParser), useAsync(adminSendAllParentsEmail));
router.post('/parent/send/:id', useAsync(adminBodyGuard), useAsync(bodyParser), useAsync(adminSendParentEmail));
router.post('/parent/reset-password/:id', useAsync(adminBodyGuard), useAsync(bodyParser), useAsync(adminSendResetPassword));
router.get('/parent/all', useAsync(adminBodyGuard), useAsync(adminGetAllParents));
router.get('/parent/:id', useAsync(adminBodyGuard), useAsync(adminGetParentById));
router.put('/parent/edit/:id', useAsync(adminBodyGuard), useAsync(bodyParser), useAsync(adminUpdateParent));
router.delete('/parent/:id', useAsync(adminBodyGuard), useAsync(adminDeleteParent));
router.post('/parent/credit/:id', useAsync(adminBodyGuard), useAsync(adminCreditParent));

//admin child route
router.post('/child/create', useAsync(bodyParser), useAsync(adminCreateChild));
router.get('/child/all', useAsync(adminGetAllChild));
router.get('/child/:id', useAsync(adminGetChildById));
router.put('/child/edit/:id', useAsync(bodyParser), useAsync(adminBodyGuard), useAsync(adminUpdateChild));
router.delete('/child/:id', useAsync(adminDeleteChild));

//admin Teacher route
router.post('/teacher/create', useAsync(bodyParser), useAsync(adminBodyGuard), useAsync(adminCreateTeacher));
router.post('/teacher/invite', useAsync(bodyParser), useAsync(adminBodyGuard), useAsync(adminInviteTeacher));
router.get('/teacher/invites', useAsync(bodyParser), useAsync(adminBodyGuard), useAsync(adminGetTeacherInvites));
router.get('/teacher/invite/remove/:id', useAsync(adminBodyGuard), useAsync(adminRemoveInviteTeacher));
router.get('/teacher/all', useAsync(adminBodyGuard), useAsync(adminGetAllTeachers));
router.get('/teacher/:id', (adminBodyGuard), useAsync(adminGetTeacherById));
router.put('/teacher/edit/:id', useAsync(bodyParser), useAsync(adminBodyGuard), useAsync(adminUpdateTeacher));
router.delete('/teacher/:id', useAsync(adminBodyGuard), useAsync(adminDeleteTeacher));


//admin Package routes
router.post('/package/create', useAsync(bodyParser), useAsync(adminBodyGuard), useAsync(adminCreatePackage));
router.get('/package/all', (adminBodyGuard), useAsync(adminGetAllPackages));
router.get('/package/:id', (adminBodyGuard), useAsync(adminGetPackageById));
router.put('/package/edit/:id', useAsync(bodyParser), useAsync(adminBodyGuard), useAsync(adminUpdatePackage));
router.delete('/package/:id', useAsync(adminBodyGuard), useAsync(adminDeletePackage));

//timeGroup route
router.get('/timetable/all', useAsync(adminBodyGuard), useAsync(adminGetAllTimeTable))
router.get('/timegroup/all', (adminBodyGuard), useAsync(adminGetAllTimeGroup));
router.post('/timegroup/create', (adminBodyGuard), useAsync(adminCreateTimeGroup));
router.post('/timegroup/update/:id', (adminBodyGuard), useAsync(adminUpdateTimeGroup));

//admin Program routes
router.post('/program/create', useAsync(bodyParser), useAsync(adminBodyGuard), useAsync(adminCreateProgram));
router.post('/program/assign/teacher', useAsync(bodyParser), (adminBodyGuard), useAsync(adminAssignTeacherToProgram));
router.get('/program/all', (adminBodyGuard), useAsync(adminGetAllPrograms));
router.get('/program/old/all', useAsync(adminBodyGuard), useAsync(adminGetAllOldPrograms));
router.get('/program/:id', useAsync(adminBodyGuard), useAsync(adminGetProgramById));
router.put('/program/edit/:id', useAsync(bodyParser), useAsync(adminBodyGuard), useAsync(adminUpdateProgram));
router.post('/program/batch-update', useAsync(bodyParser), useAsync(adminBodyGuard), useAsync(adminBatchUpdateProgram));
router.delete('/program/:id', useAsync(adminBodyGuard), useAsync(adminDeleteProgram));

// Coupon routes
router.post('/coupon/create', useAsync(bodyParser), useAsync(adminBodyGuard), useAsync(adminCreateCoupon));
router.get('/coupon/all', (adminBodyGuard), useAsync(adminGetAllCoupons));
router.get('/coupon/:id', (adminBodyGuard), useAsync(adminGetCouponById));
router.put('/coupon/edit/:id', useAsync(bodyParser), useAsync(adminBodyGuard), useAsync(adminUpdateCoupon));
router.put('/coupon/revoke/:id', useAsync(adminBodyGuard), useAsync(adminCouponRevoke));
router.delete('/coupon/:id', useAsync(adminBodyGuard), useAsync(adminDeleteCoupon));

//admin Swap routes
router.delete('/swap/:id', useAsync(adminBodyGuard), useAsync(adminDeleteSwap));
router.put('/swap/accept/:id', useAsync(adminBodyGuard), useAsync(adminAcceptSwap));
router.put('/swap/reject/:id', useAsync(adminBodyGuard), useAsync(bodyParser), useAsync(adminRejectSwap));
router.put('/swap/edit/:id', useAsync(bodyParser), useAsync(adminBodyGuard), useAsync(adminUpdateSwap));
router.get('/swap/all', useAsync(adminBodyGuard), useAsync(adminGetAllSwaps));
//router.get('/swap/:id', useAsync(adminBodyGuard), useAsync(adminGetSwapById));

//Survey Route
router.post('/survey/create', useAsync(bodyParser), useAsync(adminBodyGuard), useAsync(adminCreateSurvey))
router.get('/survey/all', useAsync(adminBodyGuard), useAsync(adminGetAllSurvey))
router.put('/survey/edit/:id', useAsync(adminBodyGuard), useAsync(adminUpdateSurvey))
router.get('/survey/toggle/:id', useAsync(adminBodyGuard), useAsync(adminToggleSurvey))
router.delete('/survey/:id', useAsync(adminBodyGuard), useAsync(adminDeleteSurvey))

//cohort
router.post('/cohort/create', useAsync(bodyParser), useAsync(adminBodyGuard), useAsync(adminCohortCreate))
router.get('/cohort/all', useAsync(adminBodyGuard), useAsync(adminCohortGetAll))
router.post('/cohort/update/:id', useAsync(adminBodyGuard), useAsync(adminCohortUpdate))
router.get('/cohort/remove/:id', useAsync(adminBodyGuard), useAsync(adminCohortRemove))
router.put('/cohort/complete/:id', useAsync(adminBodyGuard), useAsync(adminCohortComplete))
router.put('/cohort/uncomplete/:id', useAsync(adminBodyGuard), useAsync(adminCohortUnComplete))

//**************TESTIMONIAL */
router.get('/testimonial/all', adminGetAllTestimonial)
router.put('/testimonial/enable/:id', useAsync(adminBodyGuard), useAsync(testimonialEnabled))
router.put('/testimonial/disable/:id', useAsync(adminBodyGuard), useAsync(testimonialDisabled))

//Partners
router.get('/partner/all', useAsync(adminBodyGuard), useAsync(allPartners))
router.get('/partner/dashboard/:id', useAsync(adminBodyGuard), useAsync(PartnerDashboard))
router.get('/partner/parents/:id', useAsync(adminBodyGuard), useAsync(PartnerParents))
router.put('/partner/approve', useAsync(adminBodyGuard), useAsync(addDiscountAndApprovePartners))
router.put('/partner/discount/update', useAsync(adminBodyGuard), useAsync(updatePartnerDiscount))
router.put('/partner/disable/:id', useAsync(adminBodyGuard), useAsync(adminDisablePartner))
router.put('/partner/enable/:id', useAsync(adminBodyGuard), useAsync(adminEnblePartner))
//PARTNER PARENT
router.post('/partner/parent/send/all/:id', useAsync(adminBodyGuard), useAsync(bodyParser), useAsync(adminSendAllPartnerParentsEmail));
router.post('/partner/parent/send/:id', useAsync(adminBodyGuard), useAsync(bodyParser), useAsync(adminSendPartnerParentEmail));
router.post('/partner/parent/reset-password/:id', useAsync(adminBodyGuard), useAsync(bodyParser), useAsync(adminParnerSendResetPassword));
//PARTNER CHILD
router.get('/partner/child/all/:id', useAsync(adminGetAllPartnerChild));
router.put('/partner/child/edit/:id', useAsync(bodyParser), useAsync(adminBodyGuard), useAsync(adminUpdatePartnerChild));
router.delete('/partner/child/:id', useAsync(adminDeletePartnerChild));

//PARTNER PROGRAM
router.get('/partner/program/all/:id', (adminBodyGuard), useAsync(adminGetPartnerPrograms));
router.get('/partner/program/all', (adminBodyGuard), useAsync(adminGetAllPartnerPrograms));
router.post('/partner/program/assign/teacher', useAsync(bodyParser), (adminBodyGuard), useAsync(adminAssignTeacherToPartnerProgram));
router.put('/partner/program/edit/:id', useAsync(bodyParser), useAsync(adminBodyGuard), useAsync(adminUpdatePartnerProgram));
router.post('/partner/program/batch-update', useAsync(bodyParser), useAsync(adminBodyGuard), useAsync(adminBatchUpdatePartnerProgram));

/////////////////////////////////////
//////PROMO
////////////////////////////////////
router.get('/promo/all', useAsync(adminBodyGuard), useAsync(allPromos))
router.get('/promo/dashboard/:id', useAsync(adminBodyGuard), useAsync(PromoDashboard))
router.get('/promo/parents/:id', useAsync(adminBodyGuard), useAsync(PromoParents))
router.post('/promo/create', useAsync(bodyParser), useAsync(adminBodyGuard), useAsync(createPromo))
router.put('/promo/edit/:id', useAsync(adminBodyGuard), useAsync(promoUpdate))
router.put('/promo/disable/:id', useAsync(adminBodyGuard), useAsync(adminDisablePromo))
router.put('/promo/registration/disable/:id', useAsync(adminBodyGuard), useAsync(adminDisablePromoRegistration))
router.put('/promo/registration/enable/:id', useAsync(adminBodyGuard), useAsync(adminEnablePromoRegistration))
router.put('/promo/enable/:id', useAsync(adminBodyGuard), useAsync(adminEnablePromo))

//PROMO PARENT
router.post('/promo/parent/send/all/:id', useAsync(adminBodyGuard), useAsync(bodyParser), useAsync(adminSendAllPromoParentsEmail));
router.post('/promo/parent/send/reminder', useAsync(bodyParser), useAsync(adminSendAllPromoParentsReminderEmail));
router.post('/promo/parent/send/single/reminder', useAsync(bodyParser), useAsync(adminSendSinglePromoParentsReminderEmail));
router.post('/promo/parent/send/:id', useAsync(adminBodyGuard), useAsync(bodyParser), useAsync(adminSendPromoParentEmail));
router.post('/promo/parent/certificate', useAsync(adminBodyGuard), useAsync(bodyParser), useAsync(adminSendAllPromoParentsCertificateEmail));
router.post('/promo/parent/single/certificate', useAsync(adminBodyGuard), useAsync(bodyParser), useAsync(adminSendSinglePromoParentsCertificateEmail));
router.post('/promo/parent/reset-password/:id', useAsync(adminBodyGuard), useAsync(bodyParser), useAsync(adminPromoSendResetPassword));

//PROMO CHILD
router.get('/promo/child/all/:id', useAsync(adminGetAllPromoChild));
router.put('/promo/child/edit/:id', useAsync(bodyParser), useAsync(adminBodyGuard), useAsync(adminUpdatePromoChild));
router.delete('/promo/child/:id', useAsync(adminDeletePromoChild));

//PROMO PROGRAM
router.get('/promo/program/all/:id', (adminBodyGuard), useAsync(adminGetPromoPrograms));
router.get('/promo/program/all', (adminBodyGuard), useAsync(adminGetAllPromoPrograms));
router.post('/promo/program/assign/teacher', useAsync(bodyParser), (adminBodyGuard), useAsync(adminAssignTeacherToPromoProgram));
router.put('/promo/program/edit/:id', useAsync(bodyParser), useAsync(adminBodyGuard), useAsync(adminUpdatePromoProgram));
router.post('/promo/program/batch-update', useAsync(bodyParser), useAsync(adminBodyGuard), useAsync(adminBatchUpdatePromoProgram));
router.put('/promo/program/complete/:id', (adminBodyGuard), useAsync(teacherProgramCompleteAndUncompleteSingle));
router.post('/promo/program/complete', (adminBodyGuard), useAsync(teacherProgramCompleteAndUncomplete));

//MANAGE Time
router.get('/promo/timeslot/all/:id', (adminBodyGuard), useAsync(getAllPromoTimeTableWithId));
router.get('/promo/timegroup/:id', (adminBodyGuard), useAsync(getPromoTimeTableWithId));
router.put('/promo/timeslot/edit/:id', (adminBodyGuard), useAsync(adminUpdatePromoTimeSlot));

///MIGRATION
router.post('/promo/migration', useAsync(bodyParser), useAsync(adminBodyGuard), useAsync(migration));
router.put('/promo/migration/disable', useAsync(bodyParser), useAsync(adminBodyGuard), useAsync(updateMigration));

//BLOG
router.post('/blogs', useAsync(bodyParser), useAsync(adminBodyGuard), createBlog);
router.get('/blogs/all', (adminBodyGuard), getAllBlogs);
router.get('/blog/:slug', (adminBodyGuard), getBlogBySlug);
router.put('/blog/:id', useAsync(bodyParser), useAsync(adminBodyGuard), updateBlog);
router.put('/blog/status/:id', useAsync(bodyParser), useAsync(adminBodyGuard), updateBlogStatus);
router.delete('/blog/:id', (adminBodyGuard), deleteBlog);

///Audit Log
router.get('/audit/all', (adminBodyGuard), getAuditLog);

//dnd
router.get('/parent/dnd/:id', useAsync(adminBodyGuard), useAsync(dndtoggler));


module.exports = router;
