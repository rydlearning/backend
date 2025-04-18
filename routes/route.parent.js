/**
 * Slantapp code and properties {www.slantapp.io}
 */
let express = require('express');
let router = express.Router();
let {errorHandle, useAsync} = require('../core');
//load middleware for admin
let {bodyParser, parentBodyGuard} = require('../middleware/middleware.protects');
//load controller for admin
let {
    parentLogin,
    parentRegister,
    parentPasswordUpdate,
    parentUpdate,
    parentAddChild,
    parentGetAllChild,
    parentRemoveChild,
    parentPasswordReset,
    parentAddProgram,
    parentGetCart,
    parentRemoveCart,
    parentGetCurrencies,
    parentGetPrograms,
    parentGetSurvey,
    parentAnswerSurvey,
    parentChildUpdate, parentGetCohort, testimonial, GetChildPrograms
} = require('../controllers/controller.parent');

/* no auth. */
router.post('/auth/login', useAsync(bodyParser), useAsync(parentLogin));
router.post('/auth/register', useAsync(bodyParser), useAsync(parentRegister));
router.post('/auth/password-reset', useAsync(bodyParser), useAsync(parentPasswordReset));
//auth with auth
router.post('/auth/profile-update', useAsync(bodyParser), useAsync(parentBodyGuard), useAsync(parentUpdate));
router.post('/auth/password-update', useAsync(bodyParser), useAsync(parentBodyGuard), useAsync(parentPasswordUpdate));
//child routes with-auth
router.post('/child/add', useAsync(bodyParser), useAsync(parentBodyGuard), useAsync(parentAddChild));
router.get('/child/get', useAsync(parentBodyGuard), useAsync(parentGetAllChild));
router.get('/child/remove/:id', useAsync(parentBodyGuard), useAsync(parentRemoveChild));
router.get('/child/update/:id', useAsync(parentBodyGuard), useAsync(parentChildUpdate));
//programs with auth
router.post('/program/add/:id', useAsync(bodyParser), useAsync(parentBodyGuard), useAsync(parentAddProgram));
router.get('/program/get/all', useAsync(parentBodyGuard), useAsync(parentGetPrograms));
router.get('/program/get/cart', useAsync(parentBodyGuard), useAsync(parentGetCart));
router.get('/program/del/cart/:id', useAsync(parentBodyGuard), useAsync(parentRemoveCart));
router.get('/program/child/:id', useAsync(parentBodyGuard), useAsync(GetChildPrograms));

//cohort
router.get('/program/get/cohort', useAsync(parentBodyGuard), useAsync(parentGetCohort));
//misc
router.get('/get/currency', useAsync(parentBodyGuard), useAsync(parentGetCurrencies));

//surveys
router.get('/survey/get', useAsync(parentBodyGuard), useAsync(parentGetSurvey));
router.post('/survey/answer/:id', useAsync(parentBodyGuard), useAsync(parentAnswerSurvey));

module.exports = router;
