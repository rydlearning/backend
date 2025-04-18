/**
 * Slantapp code and properties {www.slantapp.io}
 */
let express = require('express');
let router = express.Router();
let { errorHandle, useAsync } = require('../core');
//load middleware for admin
let { bodyParser, promoBodyGuard, promoParentBodyGuard } = require('../middleware/middleware.protects');
const { parentGetCohort } = require('../controllers/controller.parent');
const { promoLogin, promoPasswordReset, promoPasswordUpdate, GetAllPromoParents, PromoCohortGetAll, PromoCohortGetByID, promoDisableParent, promoEnableParent, promoGetParentById, promoParentLogin, promoParentRegister, promoParentPasswordReset, promoParentUpdate, promoParentPasswordUpdate, promoParentGetDashboardData, promoParentAddProgram, promoParentAddChild, getAllPromoTimeTable, getAllPromoTimeTableWithId, promoParentAddChildWithId, promoParentAddProgramWithId, getPromoAdditionalFields, getPromoStatus, migratePromoToParent, checkEmail } = require('../controllers/controller.promo');
//load controller for admin

/* PARTNER */
/* Auth. */
router.post('/auth/login', useAsync(bodyParser), useAsync(promoLogin));
router.post('/auth/password-reset', useAsync(bodyParser), useAsync(promoPasswordReset));
router.post('/auth/password-update', useAsync(bodyParser), useAsync(promoPasswordUpdate));

/* no auth. */
router.get('/cohort/all', useAsync(promoBodyGuard), useAsync(PromoCohortGetAll));
router.get('/parent/all', useAsync(promoBodyGuard), useAsync(GetAllPromoParents));
router.get('/parent/:id/:cid', useAsync(promoBodyGuard), useAsync(promoGetParentById));
router.get('/cohort/:id', useAsync(promoBodyGuard), useAsync(PromoCohortGetByID));
router.put('/disable/parent/:id', useAsync(promoBodyGuard), useAsync(promoDisableParent))
router.put('/enable/parent/:id', useAsync(promoBodyGuard), useAsync(promoEnableParent))

/* PARENT*/
/* no auth. */
router.post('/parent/auth/login', useAsync(bodyParser), useAsync(promoParentLogin));
router.post('/parent/auth/register', useAsync(bodyParser), useAsync(promoParentRegister));
router.post('/parent/auth/password-reset', useAsync(bodyParser), useAsync(promoParentPasswordReset));
//auth with auth
router.post('/parent/auth/profile-update', useAsync(bodyParser), useAsync(promoParentBodyGuard), useAsync(promoParentUpdate));
router.post('/parent/auth/password-update', useAsync(bodyParser), useAsync(promoParentPasswordUpdate));
//cohort
router.get('/parent/get/cohort/all',  useAsync(parentGetCohort));
//program
router.post('/parent/program/add/:id/:pid', useAsync(bodyParser), useAsync(promoParentBodyGuard), useAsync(promoParentAddProgram));
router.post('/parent/program/add/:id/:pid/:ppid', useAsync(bodyParser), useAsync(promoParentAddProgramWithId));
//child
router.post('/parent/child/add', useAsync(bodyParser), useAsync(promoParentBodyGuard), useAsync(promoParentAddChild));
router.post('/parent/child/add/:id', useAsync(bodyParser), useAsync(promoParentAddChildWithId));
router.get('/parent/get/dashboard/data', useAsync(promoParentBodyGuard), useAsync(promoParentGetDashboardData));
//Timetable
router.get('/parent/get/promo/timegroup/:continent/:timezone', useAsync(promoParentBodyGuard), useAsync(getAllPromoTimeTable));
router.get('/parent/get/timegroup/:id/:continent/:timezone', getAllPromoTimeTableWithId);
//fields
router.get('/parent/get/fields/:id', getPromoAdditionalFields);
router.get('/parent/get/status/:id', getPromoStatus);
router.get('/parent/get/email/:email', checkEmail);
//MIGRATION
router.post('/parent/migrate/:id', useAsync(migratePromoToParent));


module.exports = router;
