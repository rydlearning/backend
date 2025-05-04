/**
 * Slantapp code and properties {www.slantapp.io}
 */
const sha1 = require('sha1');
const Joi = require('joi');

const { useAsync, utils, errorHandle, } = require('./../core');
const {
    ModelParent,
    ModelTeacher,
    ModelProgram,
    ModelChild,
    ModelPackage,
    ModelAttendance,
    ModelSwap, ModelAuthorization, ModelPromoProgram, ModelPromoChild, ModelPromoParent,
    ModelReport
} = require("../models");
const EmailService = require("../services");
const { Op } = require("sequelize");
const sequelize = require("sequelize");
const ModelTimegroup = require('../models/model.timegroup');

exports.teacherLogin = useAsync(async (req, res, next) => {
    try {
        //create data if all data available
        const schema = Joi.object({
            email: Joi.string().email({ minDomainSegments: 2 }).required(),
            password: Joi.string().min(5).required(),
        })
        //validate data
        const data = await schema.validateAsync(req.body)
        //hash password
        data.password = sha1(data.password)
        //capture user data
        const teacherFound = await ModelTeacher.findOne({ where: data })
        if (teacherFound) await teacherFound.update({ token: sha1(new Date().toUTCString()) })
        if (teacherFound) await teacherFound.reload()
        res.json(utils.JParser(teacherFound ? "Login successful" : "Invalid email / password", !!teacherFound, teacherFound));
    } catch (e) {
        throw new errorHandle(e.message, 400);
    }

});

//parent register
exports.teacherRegister = useAsync(async (req, res, next) => {
    let message = ""
    try {
        //console.log(req.body)
        const schema = Joi.object({
            email: Joi.string().email({ minDomainSegments: 2 }).required(),
            password: Joi.string().min(5).required(),
            firstName: Joi.string().min(3).required(),
            lastName: Joi.string().min(1).required(),
            gender: Joi.string().min(1).required(),
            phone: Joi.string().min(1).required(),
            country: Joi.string().min(1).required(),
            timezone: Joi.string().min(1).required(),
            qualification: Joi.string().min(1).required(),
            experience: Joi.string().min(1),
            docUrl: Joi.string().min(1).required(),
        })
        const data = await schema.validateAsync(req.body)
        //add timezone from network
        data.timeOffset = await utils.getTimeOffsetByZone(data.timezone)
        //hash password
        data.password = sha1(data.password)
        data.token = sha1(new Date().toUTCString())

        const invitation = await ModelAuthorization.findOne({ where: { email: data.email, isUsed: false } })

        if (!invitation) {
            return res.json(utils.JParser("Unauthorized registration", false, {}));
        }

        const [createTeacher, status] = await ModelTeacher.findOrCreate({ where: { email: data.email }, defaults: data })
        await invitation.update({ isUsed: true, id: createTeacher.id })
        if (status) message = "Account created successfully"
        else message = "Account with this email already exists"
        //if newly created then send email
        if (status) {
            //sending email
            EmailService.sendTeacherWelcomeEmail(data)
        }
        res.json(utils.JParser(message, status, createTeacher));
    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});

//parent update
exports.teacherUpdate = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;
    let message = ""
    try {
        //console.log(req.body)
        const schema = Joi.object({
            firstName: Joi.string().min(3),
            lastName: Joi.string().min(3),
            phone: Joi.string().min(3),
            country: Joi.string().min(3),
            state: Joi.string().min(3),
            timezone: Joi.string().min(3),
            timeOffset: Joi.number(),
        })
        const data = await schema.validateAsync(req.body)
        const teacher = await ModelTeacher.findOne({
            where: {
                email: session.email,
                token: session.token,
            }
        })
        if (teacher) message = "Account created successfully"
        else message = "Account has been updated successfully"
        //if newly created then send email
        if (teacher) {
            //update model
            await teacher.update({ ...teacher.toJSON(), ...data })
            //sending email
            EmailService.sendNotificationUpdate(teacher.email, "Profile update")
        }
        res.json(utils.JParser(message, !!teacher, await teacher.reload()));
    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});

//parent remove child
exports.teacherPasswordReset = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;
    let message = "Password reset"
    try {
        //console.log(req.body)
        const schema = Joi.object({
            email: Joi.string().email({ minDomainSegments: 2 }).required(),
        })
        const data = await schema.validateAsync(req.body)
        const teacher = await ModelTeacher.findOne({ where: { email: data.email } })
        if (teacher) message = "Password reset successfully"
        else message = "Unable to reset password, Invalid email"
        //if parent found, reset password
        if (teacher) {
            //new password
            const pwd = utils.AsciiCodes(8)
            //sending email
            await teacher.update({ password: sha1(pwd), token: sha1(new Date().toUTCString()) })
            EmailService.sendPasswordReset(teacher.email, pwd)
        }
        res.json(utils.JParser(message, !!teacher, null));
    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});

//parent update password
exports.teacherPasswordUpdate = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;

    let message = ""
    try {
        //console.log(req.body)
        const schema = Joi.object({
            passwordOld: Joi.string().min(5).required(),
            password1: Joi.string().min(5).required(),
            password2: Joi.string().min(5).required(),
        })
        const data = await schema.validateAsync(req.body)
        //confirm password
        if (data.password1 === data.password2) {
            //hash password
            data.password1 = sha1(data.password1)
            data.passwordOld = sha1(data.passwordOld)
            const teacher = await ModelTeacher.findOne({
                where: {
                    email: session.email,
                    token: session.token,
                    password: data.passwordOld
                }
            })
            //if newly created then send email
            if (teacher) {
                //update password
                await teacher.update({ password: data?.password1 })
                //sending email
                EmailService.sendPasswordNotifications(teacher.email)
                res.json(utils.JParser("Password changed successfully", true, null));
            } else {
                res.json(utils.JParser("Invalid old password", false, null));
            }
        } else {
            res.json(utils.JParser("Password mis-matched", false, null));
        }
    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});

//teacher get activities
exports.teacherGetActivities = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;
    try {
        //Get all teacher activities
        const data = await ModelTeacher.findByPk(session.id, {
            include: {
                model: ModelProgram, as: "programs",
                where: { isPaid: true, isCompleted: false },
                include: [
                    { model: ModelChild, as: "child", include: { model: ModelParent, as: "parent" } },
                    { model: ModelPackage, as: "package" },
                    { model: ModelReport, as: "reports" },
                    { model: ModelAttendance, as: "attendance" }
                ]
            },
            order: [[{ model: ModelProgram, as: "programs" }, 'id', 'DESC']]
        })
        res.json(utils.JParser(data ? "Get all activities" : "No student(s) for you at the moment", !!data, data ? data : []));
    } catch (e) {
        throw new errorHandle(e.message, 202);
    }
});

exports.teacherGetPrommoActivities = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;
    try {
        //Get all teacher activities
        const data = await ModelTeacher.findByPk(session.id, {
            include: {
                model: ModelPromoProgram, as: "promo_programs",
                where: { isCompleted: false },
                include: [
                    { model: ModelPromoChild, as: "child", include: { model: ModelPromoParent, as: "parent" } },
                    { model: ModelTimegroup, as: "timeGroup" }
                ]
            },
            order: [[{ model: ModelPromoProgram, as: "promo_programs" }, 'id', 'DESC']]
        })
        res.json(utils.JParser(data ? "Get all activities" : "No student(s) for you at the moment", !!data, data ? data : []));
    } catch (e) {
        throw new errorHandle(e.message, 202);
    }
});

//get all teachers
exports.teacherGetAllTeachers = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;
    try {
        const data = await ModelTeacher.findAll({ where: { id: { [Op.not]: session.id } } })
        res.json(utils.JParser("Teachers loaded", !!data, data));
    } catch (e) {
        throw new errorHandle(e.message, 202);
    }
});

//create swap
exports.teacherSwapGet = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;
    try {
        const data = await ModelSwap.findAll({
            where: { fromTeacherId: session.id },
            include: [
                { model: ModelTeacher, as: "fromTeacher" },
                { model: ModelTeacher, as: "toTeacher" },
                { model: ModelProgram, as: "program", include: { model: ModelChild, as: "child" } },
            ]
        })
        res.json(utils.JParser("Swaps loaded", !!data, data));
    } catch (e) {
        throw new errorHandle(e.message, 202);
    }
});

//set swap
exports.teacherSwapSet = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;
    try {
        const schema = Joi.object({
            toTeacherId: Joi.number().required(),
            programId: Joi.number().required(),
            body: Joi.string().required(),
        })
        const data = await schema.validateAsync(req.body)
        data.fromTeacherId = session.id
        //insert swaps
        await ModelSwap.create(data)
        res.json(utils.JParser("Class swap create", !!data, data));
    } catch (e) {
        throw new errorHandle(e.message, 202);
    }
});

//update child library
exports.teacherProgramUpdateLibrary = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;
    const { id } = req.params
    try {
        const schema = Joi.object({
            assessmentUrl: Joi.string().allow(""),
            mediaUrl: Joi.string().allow(""),
        })
        const data = await schema.validateAsync(req.body)
        //find program
        const _program = await ModelProgram.findByPk(id)
        if (_program) {
            //update links
            await _program.update(data)
        }
        res.json(utils.JParser("Program links updated !", !!_program, data));
    } catch (e) {
        throw new errorHandle(e.message, 202);
    }
});


exports.teacherProgramCompleteAndUncomplete = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;
    const { ids } = req.body;
    const status = req.body.status
    if (!ids || ids.length === 0) {
        throw new Error('No program IDs provided');
    }
    try {
        //find program
        const _program = await ModelPromoProgram.findAll({ where: { id: ids } })
        if (!_program || _program.length === 0) {
            return res.json(utils.JParser("Programs not found, Try again later", false, []));
        }

        const [updatedRows] = await ModelPromoProgram.update({ isCompleted: status }, { where: { id: ids } });

        res.json(utils.JParser("Program completed !", !!_program, _program));
    } catch (e) {
        throw new errorHandle(e.message, 202);
    }
});

exports.teacherProgramCompleteAndUncompleteSingle = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;
    const { id } = req.params
    const status = req.body.status
    console.log(status, id)
    try {
        //find program
        const _program = await ModelPromoProgram.findByPk(id)
        if (_program) {
            //update links
            await _program.update({ isCompleted: status })
        }
        res.json(utils.JParser("Program completed !", !!_program, _program));
    } catch (e) {
        throw new errorHandle(e.message, 202);
    }
});


//mark attendance
exports.parentMarkAttendance = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;
    try {
        const schema = Joi.object({
            programId: Joi.number().required(),
            score: Joi.number().required(),
            status: Joi.bool().required(),
        })
        const data = await schema.validateAsync(req.body)
        //check and create attendance
        const findToday = await ModelAttendance.findOne({
            where: { createdAt: { [Op.gt]: sequelize.literal("NOW() - INTERVAL 24 HOUR") }, programId: data.programId }
        })
        if (!findToday) {
            const attend = await ModelAttendance.create(data)
            res.json(utils.JParser("Attendance Marked", !!attend, attend));
        } else {
            res.json(utils.JParser("Attendance marked already for today.", false, data));
        }
    } catch (e) {
        throw new errorHandle(e.message, 202);
    }
});

//template
exports.Template = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;
    try {

        res.json(utils.JParser("Packages loaded", !!data, data));
    } catch (e) {
        throw new errorHandle(e.message, 202);
    }
});


////////////////////////////////////////////////////////////////////////////////////////////
///////////REPORT
////////////////////////////////////////////////////////////////////////////////////////

exports.createReport = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;
    try {
        const schema = Joi.object({
            childId: Joi.number().required(),
            parentId: Joi.number().required(),
            programId: Joi.number().required(),
            progressNotes: Joi.string().required(),
            name: Joi.string().required(),
            areasForImprovement: Joi.string().required(),
            supportSuggestions: Joi.string().required(),
            additionalComments: Joi.string(),
            cohortCompleted: Joi.boolean().required(),
        })

        const data = await schema.validateAsync(req.body)
        // const data = req.body
        data.teacherId = session.id
        const program = await ModelProgram.findOne({
            where: { id: data.programId }
        })
        if (!program.reportCreated) {
            const report = await ModelReport.create(data)
            if (report) {
                await program.update({ reportCreated: true, reportId: report.id })
            }
            res.json(utils.JParser("Report created successfully", !!report, report));
        } else {
            res.json(utils.JParser("Report created already", false, []));
        }

    } catch (e) {
        throw new errorHandle(e.message, 202);
    }
});

exports.updateReport = useAsync(async (req, res, next) => {
    const id = req.params.id
    try {
        const schema = Joi.object({
            childId: Joi.number(),
            parentId: Joi.number(),
            programId: Joi.number(),
            progressNotes: Joi.string(),
            name: Joi.string(),
            areasForImprovement: Joi.string(),
            supportSuggestions: Joi.string(),
            additionalComments: Joi.string(),
            cohortCompleted: Joi.boolean(),
        })

        const data = await schema.validateAsync(req.body)
        const report = await ModelReport.findOne({
            where: { id }
        })

        if (report) message = "Report updated successfully"
        else message = "Report has been updated successfully"
        if (report) {
            //update model
            await report.update({ ...report.toJSON(), ...data })
        }
        res.json(utils.JParser(message, !!report, await report.reload()));
    } catch (e) {
        throw new errorHandle(e.message, 202);
    }
});


exports.getChildReport = useAsync(async (req, res, next) => {
    const id = req.params.id
    try {
        const data = await ModelReport.findAll({
            where: { childId: id },
            include: [
                { model: ModelProgram, as: "program", include: { model: ModelPackage, as: "package" } },
                { model: ModelChild, as: "child" },
                { model: ModelTeacher, as: "teacher" },
            ]
        })
        res.json(utils.JParser("Report fetched successfully", !!data, data));
    } catch (e) {
        throw new errorHandle(e.message, 202);
    }
});

exports.getSingleReport = useAsync(async (req, res, next) => {
    const id = req.params.id
    try {
        const data = await ModelReport.findOne({
            where: { id },
            include: [
                { model: ModelProgram, as: "program", include: { model: ModelPackage, as: "package" } },
                { model: ModelChild, as: "child", include: { model: ModelParent, as: "parent" } },
                { model: ModelTeacher, as: "teacher" },
            ]
        })
        res.json(utils.JParser("Report fetched successfully", !!data, data));
    } catch (e) {
        throw new errorHandle(e.message, 202);
    }
});

exports.getParentChildReport = useAsync(async (req, res, next) => {
    const id = req.params.id
    try {
        const data = await ModelReport.findAll({
            where: { parentId: id },
            include: [
                { model: ModelProgram, as: "program", include: { model: ModelPackage, as: "package" } },
                { model: ModelChild, as: "child", include: { model: ModelParent, as: "parent" } },
                { model: ModelTeacher, as: "teacher" },
            ]
        })
        res.json(utils.JParser("Report fetched successfully", !!data, data));
    } catch (e) {
        throw new errorHandle(e.message, 202);
    }
});

exports.getAllReport = useAsync(async (req, res, next) => {

    try {
        const data = await ModelReport.findAll({
            include: [
                { model: ModelProgram, as: "program", include: { model: ModelPackage, as: "package" } },
                { model: ModelChild, as: "child", include: { model: ModelParent, as: "parent" } },
                { model: ModelTeacher, as: "teacher" },
            ]
        })
        res.json(utils.JParser("Report fetched successfully", !!data, data));
    } catch (e) {
        throw new errorHandle(e.message, 202);
    }
});


exports.submitReportComment = useAsync(async (req, res, next) => {
    const id = req.params.id;
    try {
        const report = await ModelReport.findOne({
            where: { id }
        })
        if (report) {
            await report.update({ parentComments: req.body.comment })
            res.json(utils.JParser("Comment submited successfully", !!report, report));
        } else {
            res.json(utils.JParser("Report not found", false, []));
        }

    } catch (e) {
        throw new errorHandle(e.message, 202);
    }
});


exports.getTeacherCohortPrograms = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;
    try {
        const data = await ModelProgram.findAll({
            where: { teacherId: session.id, cohortId: req.params.id },
            include: [
                { model: ModelPackage, as: "package" },
                { model: ModelChild, as: "child", include: { model: ModelParent, as: "parent" } }
            ]
        })
        res.json(utils.JParser("programs fetched successfully", !!data, data));
    } catch (e) {
        throw new errorHandle(e.message, 202);
    }
});


exports.clickedReport = useAsync(async (req, res, next) => {
    const id = req.params.id;
    try {
        const report = await ModelReport.findOne({
            where: { id }
        })
        if (report) {
            await report.update({ clicked: true })
            res.json(utils.JParser("Clicked successfully", !!report, report));
        } else {
            res.json(utils.JParser("Report not found", false, []));
        }

    } catch (e) {
        throw new errorHandle(e.message, 202);
    }
});