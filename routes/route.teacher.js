/**
 * Slantapp code and properties {www.slantapp.io}
 */
let express = require('express');
let router = express.Router();
let {errorHandle, useAsync} = require('../core');
//load middleware for admin
let {bodyParser, teacherBodyGuard,} = require('../middleware/middleware.protects');
//load controller for admin
let {
    teacherLogin,
    teacherRegister,
    teacherPasswordUpdate,
    teacherUpdate,
    teacherPasswordReset,
    teacherGetActivities,
    teacherGetAllTeachers,
    teacherSwapGet,
    teacherSwapSet,
    teacherProgramUpdateLibrary,
    parentMarkAttendance,
    teacherGetPrommoActivities,
    teacherProgramCompleteAndUncompleteSingle,
    teacherProgramCompleteAndUncomplete
} = require('../controllers/controller.teacher');

/* no auth. */
router.post('/auth/login', useAsync(bodyParser), useAsync(teacherLogin));
router.post('/auth/register', useAsync(bodyParser), useAsync(teacherRegister));
router.post('/auth/password-reset', useAsync(bodyParser), useAsync(teacherPasswordReset));
//auth with auth
router.post('/auth/profile-update', useAsync(bodyParser), useAsync(teacherBodyGuard), useAsync(teacherUpdate));
router.post('/auth/password-update', useAsync(bodyParser), useAsync(teacherBodyGuard), useAsync(teacherPasswordUpdate));
//auth with token
router.get('/get/activities', useAsync(teacherBodyGuard), useAsync(teacherGetActivities));
router.get('/get/promo/activities', useAsync(teacherBodyGuard), useAsync(teacherGetPrommoActivities));
router.get('/get/all-teachers', useAsync(teacherBodyGuard), useAsync(teacherGetAllTeachers));
router.get('/swap/get', useAsync(teacherBodyGuard), useAsync(teacherSwapGet));
router.post('/swap/set', useAsync(teacherBodyGuard), useAsync(teacherSwapSet));
router.post('/update/program/:id', useAsync(teacherBodyGuard), useAsync(teacherProgramUpdateLibrary));
router.put('/single/program/status/:id', useAsync(teacherBodyGuard), useAsync(teacherProgramCompleteAndUncompleteSingle));
router.post('/program/status', useAsync(teacherBodyGuard), useAsync(teacherProgramCompleteAndUncomplete));
router.post('/mark/attendance', useAsync(teacherBodyGuard), useAsync(parentMarkAttendance));

module.exports = router;
