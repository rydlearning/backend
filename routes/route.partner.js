/**
 * Slantapp code and properties {www.slantapp.io}
 */
let express = require('express');
let router = express.Router();
let { errorHandle, useAsync } = require('../core');
//load middleware for admin
let { bodyParser, partnerBodyGuard, partnerParentBodyGuard } = require('../middleware/middleware.protects');
const { partnerLogin, partnerRegister, partnerPasswordReset,
    partnerUpdate, partnerPasswordUpdate, partnerParentLogin,
    partnerParentRegister, partnerParentPasswordReset, partnerParentUpdate,
    partnerParentPasswordUpdate, inviteParent, PartnerCohortGetAll, partnerParentAddProgram, partnerParentAddChild, GetAllPartnerParents, PartnerInvoiceGetAll, partnerGetParentById, partnerParentGetDashboardData, adminGetParentInvite, PartnerCohortGetByID, partnerDisableParent, partnerEnableParent, getParentInvite, partnerUpdatekidAllowed } = require('../controllers/controller.partner');
const { parentGetCohort } = require('../controllers/controller.parent');
//load controller for admin

/* PARTNER */
/* Auth. */
router.post('/auth/login', useAsync(bodyParser), useAsync(partnerLogin));
router.post('/auth/register', useAsync(bodyParser), useAsync(partnerRegister));
router.post('/auth/password-reset', useAsync(bodyParser), useAsync(partnerPasswordReset));
router.post('/auth/password-update', useAsync(bodyParser), useAsync(partnerPasswordUpdate));

/* no auth. */
router.post('/profile-update', useAsync(bodyParser), useAsync(partnerBodyGuard), useAsync(partnerUpdate));
router.post('/parent/invite', useAsync(partnerBodyGuard), useAsync(inviteParent));
router.get('/cohort/all', useAsync(partnerBodyGuard), useAsync(PartnerCohortGetAll));
router.get('/parent/all', useAsync(partnerBodyGuard), useAsync(GetAllPartnerParents));
router.get('/invoice/all', useAsync(partnerBodyGuard), useAsync(PartnerInvoiceGetAll));
router.get('/parent/:id/:cid', useAsync(partnerBodyGuard), useAsync(partnerGetParentById));
router.get('/cohort/:id', useAsync(partnerBodyGuard), useAsync(PartnerCohortGetByID));
router.put('/disable/parent/:id', useAsync(partnerBodyGuard), useAsync(partnerDisableParent))
router.put('/enable/parent/:id', useAsync(partnerBodyGuard), useAsync(partnerEnableParent))
router.get('/invites/all', useAsync(partnerBodyGuard), useAsync(getParentInvite));
router.put('/invites/update/:id/:num', useAsync(partnerBodyGuard), useAsync(partnerUpdatekidAllowed));

/* PARENT*/
/* no auth. */
router.post('/parent/auth/login', useAsync(bodyParser), useAsync(partnerParentLogin));
router.post('/parent/auth/register', useAsync(bodyParser), useAsync(partnerParentRegister));
router.post('/parent/auth/password-reset', useAsync(bodyParser), useAsync(partnerParentPasswordReset));
//auth with auth
router.post('/parent/auth/profile-update', useAsync(bodyParser), useAsync(partnerParentBodyGuard), useAsync(partnerParentUpdate));
router.post('/parent/auth/password-update', useAsync(bodyParser), useAsync(partnerParentPasswordUpdate));
//cohort
router.get('/parent/get/cohort/all', useAsync(partnerParentBodyGuard), useAsync(parentGetCohort));
//program
router.post('/parent/program/add/:id/:pid?', useAsync(bodyParser), useAsync(partnerParentBodyGuard), useAsync(partnerParentAddProgram));
//child
router.post('/parent/child/add', useAsync(bodyParser), useAsync(partnerParentBodyGuard), useAsync(partnerParentAddChild));
router.get('/parent/get/dashboard/data', useAsync(partnerParentBodyGuard), useAsync(partnerParentGetDashboardData));
//invite
router.get('/parent/invite', useAsync(partnerParentBodyGuard), useAsync(adminGetParentInvite));

module.exports = router;
