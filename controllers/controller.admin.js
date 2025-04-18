/**
 * Slantapp code and properties {www.slantapp.io}
 */
const sha1 = require('sha1');
const Joi = require('joi');
const {Op} = require('sequelize');

const {useAsync, utils, errorHandle,} = require('./../core');
const {ModelTimeGroup, ModelTimeTable, ModelMigration, ModelBlog, AuditLog} = require("../models");
const {
    ModelAdmin,
    ModelSurvey,
    ModelSurveyResp,
    ModelAuthorization,
    ModelCohort,
    ModelPartner,
    ModelPartnerParent,
    ModelPartnerProgram,
    ModelPartnerChild,
    ModelPromo,
    ModelPromoProgram,
    ModelPromoChild,
    ModelPromoParent
} = require("../models");
const {ModelParent} = require('../models');
const {ModelChild} = require('../models');
const {ModelTeacher} = require('../models');
const {ModelCoupon} = require('../models');
const {ModelPackage} = require('../models');
const {ModelProgram} = require('../models');
const {ModelSwap} = require('../models');

const EmailService = require("./../services")
const {sendTeacherInviteEmail, sendParentEmail} = require("../services");
const ModelTestimonial = require('../models/model.testimonial');
const slugify = require('slugify');
const ModelTimegroup = require('../models/model.timegroup');
const {
    convertLessonTimes,
    convertSingleLessonTimes,
    renderDate,
    convertTimegroupToParentTimezone,
    formatData,
    formatTimeGroup,
    mergeDayAndTime
} = require('../core/core.utils');

// Create a new admin
exports.adminCreate = useAsync(async (req, res, next) => {
    try {
        const schema = Joi.object({
            fullName: Joi.string().required(),
            email: Joi.string().email().required(),
            password: Joi.string().required(),
            displayName: Joi.string().required(),
            role: Joi.number().integer().default(1).required()
        });
        const data = await schema.validateAsync(req.body);
        data.password = sha1(data.password);
        const adminObj = await ModelAdmin.create({...data, token: sha1(new Date().toUTCString())});
        //send email
        res.json(utils.JParser("Admin created successfully", true, adminObj));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});


//login in as admin
exports.adminLogin = useAsync(async (req, res, next) => {
    try {
        //capture user data
        const data = req.body;
        data.password = sha1(data?.password)
        const adminObj = await ModelAdmin.findOne({where: {email: data.email, password: data.password}})
        //add token here
        if (adminObj) {
            //update token
            await adminObj.update({token: sha1(new Date().toUTCString())})
        }
        res.json(utils.JParser("Login status", !!adminObj, !!adminObj ? await adminObj.reload() : []));
    } catch (e) {
        console.log(e)
        throw new errorHandle("Invalid login details", 202);
    }
});


//reset admin password
exports.adminResetPassword = useAsync(async (req, res, next) => {
    try {
        //capture user data
        const data = req.body;
        const adminObj = await ModelAdmin.findOne({where: data})
        //if admin found then reset password and clear token
        if (adminObj) {
            const tmpPass = utils.AsciiCodes(8);
            await adminObj.update({password: tmpPass, token: sha1(new Date().toUTCString())})
            //send email to the admin
            EmailService.sendPasswordReset(adminObj.email, tmpPass)
        }
        res.json(utils.JParser("Password reset status", !!adminObj, adminObj));
    } catch (e) {
        throw new errorHandle(e.message, 202);
    }
});

//Get all admin
exports.adminGetAll = useAsync(async (req, res, next) => {
    try {
        const admins = await ModelAdmin.findAll();
        res.json(utils.JParser("Admins retrieved successfully", !!admins, admins));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// Get admin by ID
exports.adminGetById = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;
        const admin = await ModelAdmin.findByPk(id);
        res.json(utils.JParser("Admin retrieved successfully", !!admin, admin));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// Update admin
exports.adminUpdate = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;
        const schema = Joi.object({
            fullName: Joi.string().required(),
            email: Joi.string().email().required(),
            displayName: Joi.string().required(),
            role: Joi.number().integer().default(1).required()
        });
        const data = await schema.validateAsync(req.body);
        const admin = await ModelAdmin.findByPk(id);
        await admin.update(data);
        res.json(utils.JParser("Admin updated successfully", !!admin, admin));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// Delete admin
exports.adminDelete = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;
        const admin = await ModelAdmin.findByPk(id);
        await admin.destroy();
        res.json(utils.JParser("Admin deleted successfully", !!admin, admin));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

/*
***************************************
* PARENT ADMINISTRATION              *
***************************************
*/


// Create parent
exports.adminCreateParent = useAsync(async (req, res, next) => {
    try {
        const schema = Joi.object({
            firstName: Joi.string().required(),
            lastName: Joi.string().required(),
            email: Joi.string().email().required(),
            password: Joi.string().required(),
            phone: Joi.string().required(),
            country: Joi.string().required(),
            state: Joi.string().required(),
            timezone: Joi.string().allow(null),
            timeOffset: Joi.number().integer().required()
        });

        const data = await schema.validateAsync(req.body);
        data.password = sha1(data.password);
        const parent = await ModelParent.create({...data, token: sha1(new Date().toUTCString())});
        res.json(utils.JParser("Parent created successfully", !!parent, parent));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// Update parent
exports.adminUpdateParent = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;
        const schema = Joi.object({
            firstName: Joi.string().required(),
            lastName: Joi.string().required(),
            email: Joi.string().email().required(),
            password: Joi.string().empty(),
            phone: Joi.string().required(),
            country: Joi.string().required(),
            state: Joi.string().required(),
            timezone: Joi.string().allow(null),
            timeOffset: Joi.number().integer().required()
        });
        const data = await schema.validateAsync(req.body);
        const [updatedRows] = await ModelParent.update(data, {where: {id}});
        const updatedParent = await ModelParent.findByPk(id);
        res.json(utils.JParser("Parent updated successfully", !!updatedParent, updatedParent));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// Delete parent
exports.adminDeleteParent = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;
        const deletedRows = await ModelParent.destroy({where: {id}});
        res.json(utils.JParser("Parent deleted successfully", !!deletedRows, deletedRows));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

//credit parents
exports.adminCreditParent = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;
        const {token, amount} = req.body;
        const findParent = await ModelParent.findByPk(id);
        //check for token
        if (token === "super+push-cmd" && findParent && amount >= 0) {
            await findParent.update({balance: amount})
        }
        res.json(utils.JParser("Parent credited / Debited successfully", !!findParent, "Credited / Debited"));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// Get all parents
exports.adminGetAllParents = useAsync(async (req, res, next) => {
    try {
        const parents = await ModelParent.findAll({
            include: {
                model: ModelChild,
                as: "children",
                include: {model: ModelProgram, as: "programs"}
            }
        });
        res.json(utils.JParser("Parents retrieved successfully", !!parents, parents));
    } catch (e) {
        console.log(e.message)
        throw new errorHandle(e.message, 500);
    }
});

// Send all parents email
exports.adminSendAllParentsEmail = useAsync(async (req, res, next) => {
    try {
        let q = {};
        // const parents = await ModelParent.findAll();
        const schema = Joi.object({
            t: Joi.number().required(),
            s: Joi.string().required(),
            b: Joi.string().required(),
            attachmentLink: Joi.string().optional()
        });
        const data = await schema.validateAsync(req.body);
        //query build
        if (data.t === 1) {
            q.isPaid = true
            q.isCompleted = false
        }
        if (data.t === 2) {
            q.isPaid = false
            q.isCompleted = false
        }
        if (data.t === 3) {
            q = {}
        }
        if (data.t === 4) {
            q.isPaid = true
            q.isCompleted = true
        }
        //find all parents
        const parents = await ModelParent.findAll({
            include: {
                model: ModelChild,
                as: "children",
                include: {model: ModelProgram, as: "programs", where: q, required: (data.t !== 3)},
                required: true
            }
        });
        //console.log(parents.length)
        let d = 0
        parents.map((parent) => {
            if (data.t !== 3) {
                const body = `<strong>Hello, ${parent.firstName}</strong> <br/>${data.b}`
                sendParentEmail(parent.email, body, data.s, data.attachmentLink)
            }
            if (data.t === 3) {
                //parent with no any cohort
                if (parent?.children?.filter((x) => x.programs.length === 0).length > 0) {
                    const body = `<strong>Hello, ${parent.firstName}</strong> <br/>${data.b}`
                    sendParentEmail(parent.email, body, data.s, data.attachmentLink)
                }
            }
        })
        res.json(utils.JParser("Parents mailed successfully", true, []));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// Send parent email
exports.adminSendParentEmail = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params
        const parent = await ModelParent.findOne({where: {id}});
        if (!parent) return res.json(utils.JParser("Parents not found", false, []));
        const schema = Joi.object({
            body: Joi.string().required(),
            subject: Joi.string().required(),
            attachmentLink: Joi.string().optional()
        });
        const data = await schema.validateAsync(req.body);
        const body = `<strong>Hello, ${parent.firstName}</strong> <br/>${data.body}`
        sendParentEmail(parent.email, body, data.subject, data.attachmentLink)
        res.json(utils.JParser("Parent mailed successfully", true, []));
    } catch (e) {
        console.log(e.message)
        throw new errorHandle(e.message, 500);
    }
});

// Send parent email
exports.adminSendResetPassword = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params
        const parent = await ModelParent.findOne({where: {id}});
        const schema = Joi.object({
            newPassword: Joi.string().required()
        });
        const data = await schema.validateAsync(req.body);
        if (parent && schema) {
            await parent.update({password: sha1(data.newPassword)})
            const body = `<strong>Hello, ${parent.firstName}</strong> <br/>Your password has been reset by the admin and your new password is: <code>${data.newPassword}</code>`
            sendParentEmail(parent.email, body, "New Password Reset")
        }
        res.json(utils.JParser("Parent reset password altered", true, []));
    } catch (e) {
        console.log(e.message)
        throw new errorHandle(e.message, 500);
    }
});

// Get parent by ID
exports.adminGetParentById = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;
        const parent = await ModelParent.findByPk(id);
        res.json(utils.JParser("Parent retrieved successfully", !!parent, parent));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

/*
***************************************
* CHILD ADMINISTRATION                *
***************************************
*/


// Create child
exports.adminCreateChild = useAsync(async (req, res, next) => {
    try {
        const schema = Joi.object({
            parentId: Joi.number().integer().required(),
            firstName: Joi.string().required(),
            lastName: Joi.string().required(),
            age: Joi.number().integer().required(),
            gender: Joi.string().valid('Male', 'Female').required()
        });
        const {error, value: data} = schema.validate(req.body);
        if (error) {
            return res.status(400).json({error: error.details[0].message});
        }
        const child = await ModelChild.create(data);
        res.json(utils.JParser("Child created successfully", !!child, child));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// Update child
exports.adminUpdateChild = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;
        const schema = Joi.object({
            firstName: Joi.string().required(),
            lastName: Joi.string().required(),
            age: Joi.number().integer().required(),
            gender: Joi.string().valid('Male', 'Female').required()
        });
        const {error, value: data} = schema.validate(req.body);
        const [updatedRows] = await ModelChild.update(data, {where: {id}});
        const updatedChild = await ModelChild.findByPk(id);
        res.json(utils.JParser("Child updated successfully", !!updatedChild, updatedChild));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// Delete child
exports.adminDeleteChild = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;
        const deletedRows = await ModelChild.destroy({where: {id}});
        res.json(utils.JParser("Child deleted successfully", !!deletedRows, deletedRows));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// Get all children
exports.adminGetAllChild = useAsync(async (req, res, next) => {
    try {
        const children = await ModelChild.scope("withLevel").findAll({
            include: [
                {model: ModelParent, as: "parent"},
                {
                    model: ModelProgram,
                    as: "programs",
                    order: [['id', 'desc']],
                    where: {isPaid: true},
                    include: {model: ModelCohort, as: "cohort", required: false, order: [['id', 'desc']]},
                    required: false
                }
            ]
        });
        res.json(utils.JParser("Children retrieved successfully", !!children, children));
    } catch (e) {
        console.log(e)
        throw new errorHandle(e.message, 500);
    }
});

// Get child by ID
exports.adminGetChildById = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;
        const child = await ModelChild.scope("withLevel").findByPk(id);
        res.json(utils.JParser("Child retrieved successfully", !!child, child));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

/*
***************************************
* TEACHER ADMINISTRATION                *
***************************************
*/


// Create teacher
exports.adminCreateTeacher = useAsync(async (req, res, next) => {
    try {
        const schema = Joi.object({
            firstName: Joi.string().required(),
            lastName: Joi.string().required(),
            email: Joi.string().email().required(),
            password: Joi.string().required(),
            gender: Joi.string().required(),
            phoneNumber: Joi.string().required(),
            country: Joi.string().required(),
            timeZone: Joi.string().required(),
            timeOffset: Joi.string().required(),
            qualification: Joi.string().required(),
            docUrl: Joi.string().required()
        });
        const {error, value: data} = schema.validate(req.body);
        const teacher = await ModelTeacher.create(data);
        res.json(utils.JParser("Teacher created successfully", !!teacher, teacher));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// Invite Teacher
exports.adminInviteTeacher = useAsync(async (req, res, next) => {
    try {
        const schema = Joi.object({
            email: Joi.string().email().required()
        });

        const data = await schema.validateAsync(req.body);
        const [invite, created] = await ModelAuthorization.findOrCreate({where: {email: data.email}, defaults: data});
        if (!created) {
            return res.json(utils.JParser("Parent already invited", !!invite, invite));
        }
        sendTeacherInviteEmail(invite)
        res.json(utils.JParser("Teacher invited successfully", !!invite, invite));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// Get Teacher Invitation
exports.adminGetTeacherInvites = useAsync(async (req, res, next) => {
    try {
        const invites = await ModelAuthorization.findAll();
        res.json(utils.JParser("Teachers invitations", !!invites, invites));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// Remove Teacher Invite
exports.adminRemoveInviteTeacher = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params

        const invite = await ModelAuthorization.findOne({where: {id, isUsed: false}});

        if (!invite) {
            return res.json(utils.JParser("Invite not found or already used", false, {}));
        }
        await invite.destroy();
        return res.json(utils.JParser("Invite revoked successfully", !!invite, invite));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// Update teacher
exports.adminUpdateTeacher = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;
        const schema = Joi.object({
            firstName: Joi.string().required(),
            lastName: Joi.string().required(),
            email: Joi.string().email().required(),
            gender: Joi.string().required(),
            phoneNumber: Joi.string().required(),
            // country: Joi.string().required(),
            // timeZone: Joi.string().required(),
            // timeOffset: Joi.string().required(),
            qualification: Joi.string(),
            classLink: Joi.string().required(),
            docUrl: Joi.string().required()
        });
        const {error, value: data} = schema.validate(req.body);
        const [updatedRows] = await ModelTeacher.update(data, {where: {id}});
        const updatedTeacher = await ModelTeacher.findByPk(id);
        res.json(utils.JParser("Teacher updated successfully", !!updatedTeacher, updatedTeacher));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// Delete teacher
exports.adminDeleteTeacher = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;
        const deletedRows = await ModelTeacher.destroy({where: {id}});
        res.json(utils.JParser("Teacher deleted successfully", !!deletedRows, deletedRows));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// Get all teachers
exports.adminGetAllTeachers = useAsync(async (req, res, next) => {
    try {
        const teachers = await ModelTeacher.findAll();
        res.json(utils.JParser("Teachers retrieved successfully", !!teachers, teachers));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// Get teacher by ID
exports.adminGetTeacherById = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;
        const teacher = await ModelTeacher.findByPk(id);
        res.json(utils.JParser("Teacher retrieved successfully", !!teacher, teacher));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});


/*
***************************************
* COUPON ADMINISTRATION              *
***************************************
*/

// Create coupon
exports.adminCreateCoupon = useAsync(async (req, res, next) => {
    try {
        const schema = Joi.object({
            code: Joi.string().required(),
            value: Joi.number().integer().required(),
            isPercentage: Joi.boolean().default(false),
            isActive: Joi.boolean().default(true)
        });
        const {error, value: data} = schema.validate(req.body);
        const hash = sha1(new Date().toUTCString)
        data.accessKey = req.body.code + hash.substring(0, 5);
        const coupon = await ModelCoupon.create(data);
        res.json(utils.JParser("Coupon created successfully", !!coupon, coupon));
    } catch (e) {
        console.log(e)
        throw new errorHandle(e.message, 500);
    }
});

// Update coupon
exports.adminUpdateCoupon = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;
        const schema = Joi.object({
            code: Joi.string(),
            value: Joi.number().integer(),
            isPercentage: Joi.boolean(),
            isActive: Joi.boolean()
        }).min(1); // At least one field to update

        const {error, value: data} = schema.validate(req.body);
        const [updatedRows] = await ModelCoupon.update(data, {where: {id}});
        const updatedCoupon = await ModelCoupon.findByPk(id);
        res.json(utils.JParser("Coupon updated successfully", !!updatedCoupon, updatedCoupon));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// Revoke coupon
exports.adminCouponRevoke = useAsync(async (req, res, next) => {

    try {
        const {id} = req.params;
        const coupon = await ModelCoupon.findOne({where: {id}});
        if (coupon) {
            const hash = sha1(new Date().toUTCString)
            const data = {
                accessKey: coupon.code + hash.substring(0, 5)
            }
            const [updatedRows] = await ModelCoupon.update(data, {where: {id}});
            const updatedCoupon = await ModelCoupon.findByPk(id);
            res.json(utils.JParser("Coupon revoke successfully", !!updatedCoupon, updatedCoupon));
        }
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// Delete coupon
exports.adminDeleteCoupon = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;
        const deletedRows = await ModelCoupon.destroy({where: {id}});
        res.json(utils.JParser("Coupon deleted successfully", !!deletedRows, deletedRows));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// Get all coupons
exports.adminGetAllCoupons = useAsync(async (req, res, next) => {
    try {
        const coupons = await ModelCoupon.findAll({
            include: {
                model: ModelProgram,
                as: "programs",
                where: {isPaid: true},
                required: false
            }, order: [['id', 'DESC']],
        });
        res.json(utils.JParser("Coupons retrieved successfully", !!coupons, coupons));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// Get coupon by ID
exports.adminGetCouponById = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;
        const coupon = await ModelCoupon.findByPk(id);
        res.json(utils.JParser("Coupon retrieved successfully", !!coupon, coupon));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

/*
***************************************
* PACKAGE ADMINISTRATION              *
***************************************
*/

// Create package
exports.adminCreatePackage = useAsync(async (req, res, next) => {
    try {
        const schema = Joi.object({
            title: Joi.string().required(),
            description: Joi.string().required(),
            timegroupId: Joi.number().optional(),
            imageUrl: Joi.string().allow(null).optional(),
            week: Joi.number().integer().min(1).default(8),
            amount: Joi.number().integer().required(),
            altAmount: Joi.number().integer().required(),
            minAge: Joi.number().integer().required(),
            maxAge: Joi.number().integer().required(),
            status: Joi.boolean().default(true)
        });
        const {error, value: data} = schema.validate(bodies);
        const _package = await ModelPackage.create(data);
        res.json(utils.JParser("Package created successfully", !!_package, _package));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// Update package
exports.adminUpdatePackage = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;
        const schema = Joi.object({
            title: Joi.string(),
            description: Joi.string(),
            timeGroupId: Joi.number().optional(),
            subClass: Joi.any().optional(),
            imageUrl: Joi.string().allow(null),
            week: Joi.number().integer().min(1),
            amount: Joi.number().integer(),
            minAge: Joi.number().integer(),
            maxAge: Joi.number().integer(),
            status: Joi.boolean()
        }).min(1);

        const dd = req.body
        if(dd.timeGroupId===0){
            dd.timeGroupId = null
        }
        const {error, value: data} = schema.validate(dd);
        const [updatedRows] = await ModelPackage.update(data, {where: {id}});
        const updatedPackage = await ModelPackage.findByPk(id);
        res.json(utils.JParser("Package updated successfully", !!updatedPackage, updatedPackage));
    } catch (e) {
        console.error(e.message, 500);
        throw new errorHandle(e.message, 500);
    }
});

// Delete package
exports.adminDeletePackage = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;
        const deletedRows = await ModelPackage.destroy({where: {id}});
        res.json(utils.JParser("Package deleted successfully", !!deletedRows, deletedRows));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

//TimeGroup
exports.adminGetAllTimeGroup = useAsync(async (req, res, next) => {
    try {
        const _timegroup = await ModelTimeGroup.findAll();
        res.json(utils.JParser("TimeGroup retrieved successfully", !!_timegroup, _timegroup));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

exports.adminCreateTimeGroup = useAsync(async (req, res, next) => {
    try {
        //await runDbTimeTable()
        const bodyData = req.body
        if (bodyData.title || bodyData.times) {
            const newTimeGroup = await ModelTimeGroup.create(bodyData)
            res.json(utils.JParser("Time group created okay", !!newTimeGroup, newTimeGroup));
            return
        }
        res.json(utils.JParser("Time group created failed", !![], []));
    } catch (e) {
        console.log(e)
        throw new errorHandle(e.message, 500);
    }
});

exports.adminUpdateTimeGroup = useAsync(async (req, res, next) => {
    try {
        //await runDbTimeTable()
        const {id} = req.params
        const {times} = req.body
        //console.log(id)
        if (id && times) {
            const updTimeGroup = await ModelTimeGroup.findByPk(id)
            if (updTimeGroup) await updTimeGroup.update({times})
            res.json(utils.JParser("Time group updated successfully", !!updTimeGroup, updTimeGroup));
            return
        }
        res.json(utils.JParser("Time group update failed", !![], []));
    } catch (e) {
        console.log(e)
        throw new errorHandle(e.message, 500);
    }
});

// Get all timetables
exports.adminGetAllTimeTable = useAsync(async (req, res, next) => {
    try {
        //await runDbTimeTable()
        const allDays = await ModelTimeTable.findAll()
        res.json(utils.JParser("Programs timetable retrieved successfully", !!allDays, allDays));
    } catch (e) {
        console.log(e)
        throw new errorHandle(e.message, 500);
    }
});

async function runDbTimeTable() {
    const wday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    const wdayAbbr = ["Sun", "Mon", "Tue", "Wed", "Thur", "Fri", "Sat"]

    let allTime = []

    for (let i = 0; i < wday.length; i++) {
        let prepare = []
        for (let x = 0; x <= 23; x++) {
            //push single
            let tmpTime = {
                dayText: wday[i],
                dayAbbr: wdayAbbr[i],
                day: i,
                timex: x,
                timeText: (x >= 12 ? `${(x % 12) === 0 ? 12 : x % 12}PM` : `${(x % 12) === 0 ? 12 : x % 12}AM`.toString())
            }
            prepare.push(tmpTime)
        }
        allTime = [...allTime, ...prepare]
    }
    const ins = await ModelTimeTable.bulkCreate(allTime)
    return allTime
}

// Get all packages
exports.adminGetAllPackages = useAsync(async (req, res, next) => {
    try {
        const _packages = await ModelPackage.findAll();
        //console.log(_packages)
        res.json(utils.JParser("Packages retrieved successfully", !!_packages, _packages));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// Get package by ID
exports.adminGetPackageById = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;
        const _package = await ModelPackage.findByPk(id);
        res.json(utils.JParser("Package retrieved successfully", !!_package, _package));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});


/*
***************************************
* PROGRAM ADMINISTRATION              *
***************************************
*/


// Create program
exports.adminCreateProgram = useAsync(async (req, res, next) => {
    try {
        const schema = Joi.object({
            childId: Joi.number().integer().required(),
            teacherId: Joi.number().integer().allow(null).optional(),
            packageId: Joi.number().integer().required(),
            attendanceId: Joi.number().integer().required(),
            mediaUrl: Joi.string().allow(null).optional(),
            assessmentUrl: Joi.string().allow(null).optional(),
            level: Joi.number().integer().required().default(1),
            time: Joi.number().integer().required(),
            day: Joi.number().integer().required(),
            timeOffset: Joi.number().integer().required(),
            nextClassDate: Joi.date().required(),
            endClassDate: Joi.date().required(),
            isCompleted: Joi.boolean().required().default(false),
            isPaid: Joi.boolean().required().default(false)
        });

        const {error, value: data} = schema.validate(req.body);
        const program = await ModelProgram.create(data);
        res.json(utils.JParser("Program created successfully", !!program, program));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// Update program
exports.adminUpdateProgram = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;
        const schema = Joi.object({
            childId: Joi.number().integer().optional(),
            teacherId: Joi.number().integer().allow(null).optional(),
            packageId: Joi.number().integer().optional(),
            cohortId: Joi.number().integer().optional(),
            attendanceId: Joi.number().integer().optional(),
            mediaUrl: Joi.string().allow(null).optional(),
            assessmentUrl: Joi.string().allow(null).optional(),
            level: Joi.number().integer().optional(),
            time: Joi.number().integer().optional(),
            day: Joi.number().integer().optional(),
            timeOffset: Joi.number().integer().optional(),
            nextClassDate: Joi.date().optional(),
            endClassDate: Joi.date().optional(),
            isCompleted: Joi.boolean().optional(),
            isPaid: Joi.boolean().optional()
        }).min(1);

        const {error, value: data} = schema.validate(req.body);
        const updatedProgram = await ModelProgram.findByPk(id);
        if (updatedProgram) {
            await updatedProgram.update(data);
        }
        res.json(utils.JParser("Program updated successfully", !!updatedProgram, updatedProgram));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// Update batch program
exports.adminBatchUpdateProgram = useAsync(async (req, res, next) => {
    try {
        const schema = Joi.object({
            ids: Joi.array().required(),
            teacherId: Joi.number().optional(),
            cohortId: Joi.number().optional()
        }).min(2);
        //extract ids
        const data = await schema.validateAsync(req.body);
        const IDs = data.ids
        //remove IDs
        delete data.ids
        const updatedProgram = await ModelProgram.update(data, {where: {id: IDs}});
        res.json(utils.JParser("Program updated successfully", !!updatedProgram, updatedProgram));
    } catch (e) {
        console.log(e.message)
        throw new errorHandle(e.message, 500);
    }
});

// Delete program
exports.adminDeleteProgram = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;
        const deletedRows = await ModelProgram.destroy({where: {id}});
        res.json(utils.JParser("Program deleted successfully", !!deletedRows, deletedRows));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// Get all programs
exports.adminGetAllPrograms = useAsync(async (req, res, next) => {
    try {
        const programs = await ModelProgram.findAll({
            include: [
                {model: ModelChild, as: 'child', include: {model: ModelParent, as: "parent"}, required: true},
                {model: ModelTeacher, as: 'teacher'},
                {model: ModelPackage, as: 'package'},
                {model: ModelCoupon, as: 'coupon'},
                {model: ModelCohort, as: 'cohort'}
            ],
            order: [["day", "asc"], ["time", "asc"]]
        });
        res.json(utils.JParser("Programs retrieved successfully", !!programs, programs));
    } catch (e) {
        console.log(e)
        throw new errorHandle(e.message, 500);
    }
});

// Get all inactive programs
exports.adminGetAllOldPrograms = useAsync(async (req, res, next) => {
    try {
        const programs = await ModelProgram.findAll({
            include: [
                {model: ModelChild, as: 'child', include: {model: ModelParent, as: "parent"}, required: true},
                {model: ModelTeacher, as: 'teacher'},
                {model: ModelPackage, as: 'package'}
            ],
            order: [["day", "asc"], ["time", "asc"]],
            where: {isCompleted: true, isPaid: true}
        });
        res.json(utils.JParser("Programs inactive retrieved successfully", !!programs, programs));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// Get program by ID
exports.adminGetProgramById = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;
        const program = await ModelProgram.findByPk(id);
        res.json(utils.JParser("Program retrieved successfully", !!program, program));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// Assign teacher to program
exports.adminAssignTeacherToProgram = useAsync(async (req, res, next) => {
    try {
        const schema = Joi.object({
            teacherId: Joi.number().integer().required(),
            programIds: Joi.any().required()
        }).min(1);

        const {error, value: data} = schema.validate(req.body);
        const [updatedRows] = await ModelProgram.update({teacherId: data.teacherId}, {where: {id: data.programIds}});
        const updatedProgram = await ModelProgram.findAll({where: {id: data.programIds}});
        res.json(utils.JParser("Program updated successfully", !!updatedProgram, updatedProgram));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

/*
***************************************
* SWAP ADMINISTRATION              *
***************************************
*/


// Delete swap
exports.adminDeleteSwap = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;
        const deletedRows = await ModelSwap.destroy({where: {id}});
        res.json(utils.JParser("Swap deleted successfully", !!deletedRows, deletedRows));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// Accept swap
exports.adminAcceptSwap = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;
        const [updatedRows] = await ModelSwap.update({status: true}, {where: {id}});
        const updatedSwap = await ModelSwap.findByPk(id);
        if (updatedSwap) {
            //swap teacher
            const pp = await ModelProgram.findByPk(updatedSwap.programId)
            if (pp) {
                await pp.update({teacherId: updatedSwap.toTeacherId})
            }
        }
        res.json(utils.JParser("Swap accepted", !!updatedSwap, updatedSwap));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// Reject swap
exports.adminRejectSwap = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;
        const [updatedRows] = await ModelSwap.update({status: false}, {where: {id}});
        const updatedSwap = await ModelSwap.findByPk(id);
        res.json(utils.JParser("Swap rejected", !!updatedSwap, updatedSwap));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// Update swap
exports.adminUpdateSwap = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;
        const schema = Joi.object({
            fromTeacherId: Joi.number().integer().required(),
            toTeacherId: Joi.number().integer().required(),
            programId: Joi.number().integer().required(),
            body: Joi.string().required(),
            status: Joi.boolean().required()
        });
        const {error, value: data} = schema.validate(req.body);
        if (error) {
            return res.status(400).json({error: error.details[0].message});
        }
        const [updatedRows] = await ModelSwap.update(data, {where: {id}});
        const updatedSwap = await ModelSwap.findByPk(id);
        res.json(utils.JParser("Swap updated successfully", !!updatedSwap, updatedSwap));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// Get all swaps
exports.adminGetAllSwaps = useAsync(async (req, res, next) => {
    try {
        const swaps = await ModelSwap.findAll({
            include: [
                {model: ModelTeacher, as: 'fromTeacher'},
                {model: ModelTeacher, as: 'toTeacher'},
                {
                    model: ModelProgram,
                    as: 'program',
                    include: [
                        {model: ModelChild, as: 'child'}
                    ]
                }
            ]
        });

        res.json(utils.JParser("Swaps retrieved successfully", !!swaps, swaps));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});


/*
***************************************
* SURVEY ADMINISTRATION              *
***************************************
*/


// Create program
exports.adminCreateSurvey = useAsync(async (req, res, next) => {
    try {
        const schema = Joi.object({
            title: Joi.string().required(),
            body: Joi.string().required(),
            pText: Joi.string().allow(null).optional(),
            nText: Joi.string().allow(null).optional(),
            status: Joi.boolean().allow(null).optional(),
        });

        const {error, value: data} = schema.validate(req.body);
        const survey = await ModelSurvey.create(data);
        res.json(utils.JParser("Survey created successfully", !!survey, survey));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});


// Get all swaps
exports.adminGetAllSurvey = useAsync(async (req, res, next) => {
    try {
        const surveys = await ModelSurvey.findAll(
            {
                include: [
                    {
                        model: ModelSurveyResp,
                        as: "positiveResponses",
                        required: false,
                        include: [
                            {
                                model: ModelParent,
                                as: "parent",
                                required: true
                            }
                        ]
                    },
                    {
                        model: ModelSurveyResp,
                        as: "negativeResponses",
                        required: false,
                        include: [
                            {
                                model: ModelParent,
                                as: "parent",
                                required: true
                            }
                        ]
                    }]
            }
        );
        res.json(utils.JParser("Survey retrieved successfully", !!surveys, surveys));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// Update survey
exports.adminUpdateSurvey = useAsync(async (req, res, next) => {
    try {
        const schema = Joi.object({
            title: Joi.string().required(),
            body: Joi.string().required(),
            pText: Joi.string().allow(null).optional(),
            nText: Joi.string().allow(null).optional(),
            status: Joi.boolean().allow(null).optional(),
        });

        const {error, value: data} = schema.validate(req.body);
        const {id} = req.params;

        const survey = await ModelSurvey.findByPk(id);
        if (!survey) {
            return res.status(404).json(utils.JParser("Survey not found", false));
        }

        await survey.update(data);

        res.json(utils.JParser("Survey updated successfully", true, survey));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// Toggle survey
exports.adminToggleSurvey = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;

        const survey = await ModelSurvey.findByPk(id);
        if (!survey) {
            return res.status(404).json(utils.JParser("Survey not found", false));
        }

        await survey.update({status: !survey.status});

        res.json(utils.JParser("Survey toggled successfully", true, survey));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// Delete survey
exports.adminDeleteSurvey = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;

        const survey = await ModelSurvey.findByPk(id);
        if (!survey) {
            return res.status(404).json(utils.JParser("Survey not found", false));
        }

        await survey.destroy();

        res.json(utils.JParser("Survey deleted successfully", true));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// Cohort route and creations
exports.adminCohortCreate = useAsync(async (req, res, next) => {
    try {
        const schema = Joi.object({
            title: Joi.string().required(),
            description: Joi.string().required(),
            startDate: Joi.date().required(),
            endDate: Joi.date().required(),
        });
        const data = await schema.validateAsync(req.body);
        //well validated
        const newInserted = await ModelCohort.create(data)
        res.json(utils.JParser("New cohort added", !!newInserted, newInserted));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

exports.adminCohortComplete = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;
        const data = {
            isCompleted: true
        }
        const body = {
            status: false,
            isStarted: false
        }
        const options = {where: {cohortId: id, isPaid: true}}
        const option = {where: {id}}
        const cohort = await ModelCohort.findOne(option);

        if (!cohort) {
            return res.status(404).json(utils.JParser("Cohort not found", false));
        }
        await cohort.update(body);
        await ModelProgram.update(data, options);
        res.json(utils.JParser("Cohort completed successfully", true, []));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});


exports.adminCohortUnComplete = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;
        const data = {
            isCompleted: false
        }
        const body = {
            isStarted: true
        }
        const options = {where: {cohortId: id, isPaid: true}}
        const option = {where: {id}}
        const cohort = await ModelCohort.findOne(option);

        if (!cohort) {
            return res.status(404).json(utils.JParser("Cohort not found", false));
        }
        await cohort.update(body);
        await ModelProgram.update(data, options);
        res.json(utils.JParser("Cohort completed successfully", true, []));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

//cohort get all
exports.adminCohortGetAll = useAsync(async (req, res, next) => {
    try {
        const getAll = await ModelCohort.findAll({
            include: {model: ModelProgram, as: "programs"},
            order: [['id', 'desc']]
        })
        res.json(utils.JParser("fetched successfully", !!getAll, getAll));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

//cohort update settings
exports.adminCohortUpdate = useAsync(async (req, res, next) => {
    try {
        const schema = Joi.object({
            title: Joi.string().optional(),
            description: Joi.string().optional(),
            startDate: Joi.string().optional(),
            endDate: Joi.string().optional(),
            isStarted: Joi.boolean().optional(),
            status: Joi.boolean().optional()
        });
        const data = await schema.validateAsync(req.body);
        const getOne = await ModelCohort.findByPk(req?.params?.id)
        if (getOne) {
            //update it
            if (data.status === false) {
                const option = {where: {cohortId: req.params.id, isPaid: false}}
                await ModelProgram.destroy(option)
                await ModelPromoProgram.destroy(option)
                await ModelPartnerProgram.destroy(option)
            }
            await getOne.update(data)
        }
        res.json(utils.JParser("action is successfully", !!getOne, getOne));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

//cohort delete cohort
exports.adminCohortRemove = useAsync(async (req, res, next) => {
    try {
        const getOne = await ModelCohort.findByPk(req?.params.id, {
            include: {model: ModelProgram, as: "programs"},
            order: [['id', 'desc']]
        })
        if (getOne && getOne?.programs?.length < 1) {
            //update it
            await getOne.destroy()
        }
        res.json(utils.JParser("action is successfully", !!getOne, getOne));
    } catch (e) {
        console.log(e.message)
        throw new errorHandle(e.message, 500);
    }
});

//**************TESTIMONIAL */
exports.adminGetAllTestimonial = useAsync(async (req, res, next) => {
    try {
        const testimonial = await ModelTestimonial.findAll({
            include: [
                {
                    model: ModelParent,
                    as: "parent",
                    required: false
                },
            ]
        })
        res.json(utils.JParser("Testimonial retrieved successfully", !!testimonial, testimonial));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

exports.testimonialEnabled = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;
        const data = {
            status: true
        }
        const options = {
            where: {id}
        }
        const testimonial = await ModelTestimonial.findOne(options);
        await testimonial.update(data);
        res.json(utils.JParser("Testimonial updated successfully", false, []));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

exports.testimonialDisabled = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;
        const data = {
            status: true
        }
        const options = {
            where: {id}
        }
        const testimonial = await ModelTestimonial.findOne(options);
        await testimonial.update(data);
        res.json(utils.JParser("Testimonial updated successfully", false, []));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

//PARTNER
exports.allPartners = useAsync(async (req, res, next) => {
    try {
        const partners = await ModelPartner.findAll({
            include: [
                {
                    model: ModelPartnerProgram,
                    as: "programs",
                    required: false,
                    include: [
                        {
                            model: ModelPackage,
                            as: "partner_package",
                            required: false
                        }
                    ]
                }
            ]
        });
        res.json(utils.JParser("All partners fetched successfully", !!partners, partners));
    } catch (e) {
        console.log(e)
        throw new errorHandle(e.message, 500);
    }
});

exports.addDiscountAndApprovePartners = useAsync(async (req, res, next) => {
    try {
        const schema = Joi.object({
            discount: Joi.number().required(),
            id: Joi.required()
        });

        const {error, value: data} = schema.validate(req.body);

        const partner = await ModelPartner.findByPk(data.id);
        if (!partner) {
            return res.status(404).json(utils.JParser("Partner not found", false));
        }

        const approveData = {
            discount: data.discount,
            approved: true
        }

        await partner.update(approveData);
        EmailService.sendPartnerApprovedEmail(partner)

        res.json(utils.JParser("Partner updated successfully", true, partner));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

exports.updatePartnerDiscount = useAsync(async (req, res, next) => {
    try {
        const schema = Joi.object({
            discount: Joi.number().required(),
            id: Joi.required()
        });

        const {error, value: data} = schema.validate(req.body);

        const partner = await ModelPartner.findByPk(data.id);
        if (!partner) {
            return res.status(404).json(utils.JParser("Partner not found", false));
        }

        const approveData = {
            discount: data.discount,
        }

        await partner.update(approveData);

        res.json(utils.JParser("Partner updated successfully", true, partner));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// Get partner dashboard details
exports.PartnerDashboard = useAsync(async (req, res, next) => {
    const id = req.params.id
    try {
        const partner = await ModelPartner.findOne({where: {id}})
        if (partner) {
            const cohort = await ModelCohort.findAll({
                where: {isVisible: {[Op.in]: [0, 2]}},
                include: {
                    model: ModelPartnerProgram, as: "partner_programs",
                    include: [
                        {
                            model: ModelPartnerChild,
                            as: "child",
                            required: false,
                            include: [
                                {
                                    model: ModelPartnerParent,
                                    as: "parent",
                                    required: false
                                }
                            ]
                        }
                    ]
                },
                order: [['id', 'desc']]
            })

            const parents = await ModelPartnerParent.findAll({
                where: {partnerId: id},
                include: [
                    {
                        model: ModelPartnerChild,
                        as: "children",
                        required: false
                    }
                ]
            })
            const programs = await ModelPartnerProgram.findAll({
                where: {partnerId: id},
                include: [
                    {
                        model: ModelPackage,
                        as: "partner_package",
                        required: true
                    }
                ]
            })


            const totalStudent = parents.reduce((total, parent) => total + parent.children.length, 0);
            const debt = programs.filter((program) => program.partner_package && !program.isPaid)
                .reduce((total, program) => total + program.partner_package.amount, 0);

            //add partner currency and rate
            const rate = await utils.getCurrencyRate(partner?.country)
            //console.log(rate)
            const data = {cohort, debt, totalStudent, parents, programs, partner, rate}
            res.json(utils.JParser("fetched successfully", !!cohort, data));
        } else {
            res.json(utils.JParser("Partner not found", false, []));
        }
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});


// Get partner parents
exports.PartnerParents = useAsync(async (req, res, next) => {
    const id = req.params.id
    try {
        const partner = await ModelPartner.findOne({where: {id}})
        if (partner) {

            const parents = await ModelPartnerParent.findAll({
                where: {partnerId: id},
                include: [
                    {
                        model: ModelPartnerChild,
                        as: "children",
                        required: false,
                        include: {model: ModelPartnerProgram, as: "programs"}
                    }
                ]
            })

            res.json(utils.JParser("Parents fetched successfully", !!parents, parents));
        } else {
            res.json(utils.JParser("Partner not found", false, []));
        }
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// Send all parner parents email
exports.adminSendAllPartnerParentsEmail = useAsync(async (req, res, next) => {
    const id = req.params.id
    try {
        let q = {};
        // const parents = await ModelParent.findAll();
        const schema = Joi.object({
            t: Joi.number().required(),
            s: Joi.string().required(),
            b: Joi.string().required(),
            attachmentLink: Joi.string().optional()
        });
        const data = await schema.validateAsync(req.body);
        //query build
        if (data.t === 1) {
            q.isPaid = true
            q.isCompleted = false
        }
        if (data.t === 2) {
            q.isPaid = false
            q.isCompleted = false
        }
        if (data.t === 3) {
            q = {}
        }
        if (data.t === 4) {
            q.isPaid = true
            q.isCompleted = true
        }
        //find all parents
        const parents = await ModelPartnerParent.findAll({
            where: {partnerId: id},
            include: {
                model: ModelPartnerChild,
                as: "children",
                include: {model: ModelPartnerProgram, as: "programs", where: q, required: (data.t !== 3)},
                required: true
            }
        });
        //console.log(parents.length)
        let d = 0
        parents.map((parent) => {
            if (data.t !== 3) {
                const body = `<strong>Hello, ${parent.firstName}</strong> <br/>${data.b}`
                sendParentEmail(parent.email, body, data.s, data.attachmentLink)
            }
            if (data.t === 3) {
                //parent with no any cohort
                if (parent?.children?.filter((x) => x.programs.length === 0).length > 0) {
                    const body = `<strong>Hello, ${parent.firstName}</strong> <br/>${data.b}`
                    sendParentEmail(parent.email, body, data.s, data.attachmentLink)
                }
            }
        })
        res.json(utils.JParser("Parents mailed successfully", true, []));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// Send partner parent email
exports.adminSendPartnerParentEmail = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params
        const parent = await ModelPartnerParent.findOne({where: {id}});
        if (!parent) return res.json(utils.JParser("Parents not found", false, []));
        const schema = Joi.object({
            body: Joi.string().required(),
            subject: Joi.string().required(),
            attachmentLink: Joi.string().optional()
        });
        const data = await schema.validateAsync(req.body);
        const body = `<strong>Hello, ${parent.firstName}</strong> <br/>${data.body}`
        sendParentEmail(parent.email, body, data.subject, data.attachmentLink)
        res.json(utils.JParser("Parent mailed successfully", true, []));
    } catch (e) {
        console.log(e.message)
        throw new errorHandle(e.message, 500);
    }
});

// Reset partner parent password
exports.adminParnerSendResetPassword = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params
        const parent = await ModelPartnerParent.findOne({where: {id}});
        const schema = Joi.object({
            newPassword: Joi.string().required()
        });
        const data = await schema.validateAsync(req.body);
        if (parent && schema) {
            await parent.update({password: sha1(data.newPassword)})
            const body = `<strong>Hello, ${parent.firstName}</strong> <br/>Your password has been reset by the admin and your new password is: <code>${data.newPassword}</code>`
            sendParentEmail(parent.email, body, "New Password Reset")
        }
        res.json(utils.JParser("Parent reset password altered", true, []));
    } catch (e) {
        console.log(e.message)
        throw new errorHandle(e.message, 500);
    }
});

// Get all partner children
exports.adminGetAllPartnerChild = useAsync(async (req, res, next) => {
    const {id} = req.params
    try {

        const parents = await ModelPartnerParent.findAll({
            where: {partnerId: id},
            include: {
                model: ModelPartnerChild,
                as: "children",
                required: true,
                include: [
                    {
                        model: ModelPartnerProgram,
                        as: "programs",
                        order: [['id', 'desc']],
                        where: {isPaid: true},
                        include: {model: ModelCohort, as: "partner_cohort", required: false, order: [['id', 'desc']]},
                        required: false
                    },
                    {
                        model: ModelPartnerParent,
                        as: "parent",
                        required: true
                    }
                ]
            }

        });
        console.log(parents)

        const children = parents.reduce((allChildren, parent) => {
            return allChildren.concat(parent.children);
        }, []);


        res.json(utils.JParser("Children retrieved successfully", !!children, children));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

//Delete child
exports.adminDeletePartnerChild = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;
        const deletedRows = await ModelPartnerChild.destroy({where: {id}});
        res.json(utils.JParser("Child deleted successfully", !!deletedRows, deletedRows));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});


// Update child
exports.adminUpdatePartnerChild = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;
        const schema = Joi.object({
            firstName: Joi.string().required(),
            lastName: Joi.string().required(),
            age: Joi.number().integer().required(),
            gender: Joi.string().valid('Male', 'Female').required()
        });
        const {error, value: data} = schema.validate(req.body);
        const [updatedRows] = await ModelPartnerChild.update(data, {where: {id}});
        const updatedChild = await ModelPartnerChild.findByPk(id);
        res.json(utils.JParser("Child updated successfully", !!updatedChild, updatedChild));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});


// Get all partner programs
exports.adminGetAllPartnerPrograms = useAsync(async (req, res, next) => {
    try {
        const programs = await ModelPartnerProgram.findAll({
            include: [
                {
                    model: ModelPartnerChild,
                    as: 'child',
                    include: {model: ModelPartnerParent, as: "parent"},
                    required: true
                },
                {model: ModelTeacher, as: 'partner_teacher'},
                {model: ModelPackage, as: 'partner_package'},
                {model: ModelCoupon, as: 'partner_coupon'},
                {model: ModelCohort, as: 'partner_cohort'},
                {model: ModelPartner, as: 'partner', required: true}
            ],
            order: [["day", "asc"], ["time", "asc"]]
        });
        res.json(utils.JParser("Programs retrieved successfully", !!programs, programs));
    } catch (e) {
        console.log(e)
        throw new errorHandle(e.message, 500);
    }
});

exports.adminGetPartnerPrograms = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params
        const programs = await ModelPartnerProgram.findAll({
            where: {partnerId: id},
            include: [
                {
                    model: ModelPartnerChild,
                    as: 'child',
                    include: {model: ModelPartnerParent, as: "parent"},
                    required: true
                },
                {model: ModelTeacher, as: 'partner_teacher'},
                {model: ModelPackage, as: 'partner_package'},
                {model: ModelCoupon, as: 'partner_coupon'},
                {model: ModelCohort, as: 'partner_cohort'}
            ],
            order: [["day", "asc"], ["time", "asc"]]
        });
        res.json(utils.JParser("Programs retrieved successfully", !!programs, programs));
    } catch (e) {
        console.log(e)
        throw new errorHandle(e.message, 500);
    }
});

// Assign teacher to program
exports.adminAssignTeacherToPartnerProgram = useAsync(async (req, res, next) => {
    try {
        const schema = Joi.object({
            teacherId: Joi.number().integer().required(),
            programIds: Joi.any().required()
        }).min(1);

        const {error, value: data} = schema.validate(req.body);
        const [updatedRows] = await ModelPartnerProgram.update({teacherId: data.teacherId}, {where: {id: data.programIds}});
        const updatedProgram = await ModelPartnerProgram.findAll({where: {id: data.programIds}});
        res.json(utils.JParser("Program updated successfully", !!updatedProgram, updatedProgram));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// Update partner program
exports.adminUpdatePartnerProgram = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;
        const schema = Joi.object({
            childId: Joi.number().integer().optional(),
            teacherId: Joi.number().integer().allow(null).optional(),
            packageId: Joi.number().integer().optional(),
            cohortId: Joi.number().integer().optional(),
            attendanceId: Joi.number().integer().optional(),
            mediaUrl: Joi.string().allow(null).optional(),
            assessmentUrl: Joi.string().allow(null).optional(),
            level: Joi.number().integer().optional(),
            time: Joi.number().integer().optional(),
            day: Joi.number().integer().optional(),
            timeOffset: Joi.number().integer().optional(),
            nextClassDate: Joi.date().optional(),
            endClassDate: Joi.date().optional(),
            isCompleted: Joi.boolean().optional(),
            isPaid: Joi.boolean().optional()
        }).min(1);

        const {error, value: data} = schema.validate(req.body);
        const updatedProgram = await ModelPartnerProgram.findByPk(id);
        if (updatedProgram) {
            await updatedProgram.update(data);
        }
        res.json(utils.JParser("Program updated successfully", !!updatedProgram, updatedProgram));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});


// Update batch program
exports.adminBatchUpdatePartnerProgram = useAsync(async (req, res, next) => {
    try {
        const schema = Joi.object({
            ids: Joi.array().required(),
            teacherId: Joi.number().optional(),
            cohortId: Joi.number().optional()
        }).min(2);
        //extract ids
        const data = await schema.validateAsync(req.body);
        const IDs = data.ids
        //remove IDs
        delete data.ids
        const updatedProgram = await ModelPartnerProgram.update(data, {where: {id: IDs}});
        res.json(utils.JParser("Program updated successfully", !!updatedProgram, updatedProgram));
    } catch (e) {
        console.log(e.message)
        throw new errorHandle(e.message, 500);
    }
});


// Disable partner
exports.adminDisablePartner = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;
        const partner = await ModelPartner.findByPk(id);
        if (!partner) {
            res.status(400).json(utils.JParser("Partner not found", false, []));
        }

        partner.status = false;
        await partner.save();

        await ModelPartnerParent.update({status: false}, {where: {partnerId: id}});
        res.json(utils.JParser("Partner updated successfully", !!partner, partner));
    } catch (e) {
        console.log(e.message)
        throw new errorHandle(e.message, 500);
    }
});


// Enable partner
exports.adminEnblePartner = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;
        const partner = await ModelPartner.findByPk(id);
        if (!partner) {
            res.status(400).json(utils.JParser("Partner not found", false, []));
        }

        partner.status = true;
        await partner.save();

        await ModelPartnerParent.update({status: true}, {where: {partnerId: id}});
        res.json(utils.JParser("Partner updated successfully", !!partner, partner));
    } catch (e) {
        console.log(e.message)
        throw new errorHandle(e.message, 500);
    }
});


//////////////////////////////////////////////////////////////////////////////////////
//PROMO
////////////////////////////////////////////////////////////////////////////////////////////////////
//PARTNER
exports.allPromos = useAsync(async (req, res, next) => {
    try {
        const promos = await ModelPromo.findAll({
            include: [
                {
                    model: ModelPromoProgram,
                    as: "programs",
                    required: false,
                }
            ]
        });
        res.json(utils.JParser("All promos fetched successfully", !!promos, promos));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});


//promo update
exports.promoUpdate = useAsync(async (req, res, next) => {
    const {id} = req.params;
    let message = ""
    try {

        const data = req.body
        const promo = await ModelPromo.findOne({
            where: {
                id: id
            }
        })
        if (promo) message = "Account has been updated successfully"
        else message = "Account could not update"
        //if newly created then send email
        const body = {
            ...promo.toJSON(),
            ...data,
            slot: data.slot.length > 0 ? data.slot : promo.slot,
            additionalFields: data.additionalFields.length > 0 ? data.additionalFields : promo.additionalFields
        }
        if (promo) {
            //update model
            await promo.update(body)
            //sending email
            EmailService.sendNotificationUpdate(promo.email, "Profile update")
        }
        res.json(utils.JParser(message, !!promo, await promo.reload()));
    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});


// Disable promo
exports.adminDisablePromo = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;
        const promo = await ModelPromo.findByPk(id);
        if (!promo) {
            res.status(400).json(utils.JParser("Promo not found", false, []));
        }

        promo.status = false;
        await promo.save();

        res.json(utils.JParser("Promo updated successfully", !!promo, promo));
    } catch (e) {
        console.log(e.message)
        throw new errorHandle(e.message, 500);
    }
});

exports.adminDisablePromoRegistration = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;
        const promo = await ModelPromo.findByPk(id);
        if (!promo) {
            res.status(400).json(utils.JParser("Promo not found", false, []));
        }

        promo.isActive = true;
        await promo.save();

        res.json(utils.JParser("Promo updated successfully", !!promo, promo));
    } catch (e) {
        console.log(e.message)
        throw new errorHandle(e.message, 500);
    }
});

exports.adminEnablePromoRegistration = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;
        const promo = await ModelPromo.findByPk(id);
        if (!promo) {
            res.status(400).json(utils.JParser("Promo not found", false, []));
        }

        promo.isActive = false;
        await promo.save();

        res.json(utils.JParser("Promo updated successfully", !!promo, promo));
    } catch (e) {
        console.log(e.message)
        throw new errorHandle(e.message, 500);
    }
});

// Enable promo
exports.adminEnablePromo = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;
        const promo = await ModelPromo.findByPk(id);
        if (!promo) {
            res.status(400).json(utils.JParser("Promo not found", false, []));
        }

        promo.status = true;
        await promo.save();

        res.json(utils.JParser("Promo updated successfully", !!promo, promo));
    } catch (e) {
        console.log(e.message)
        throw new errorHandle(e.message, 500);
    }
});


// Get promo dashboard details
exports.PromoDashboard = useAsync(async (req, res, next) => {
    const id = req.params.id
    try {
        const promo = await ModelPromo.findOne({where: {id}})
        if (promo) {

            const parents = await ModelPromoParent.findAll({
                where: {promoId: id},
                include: [
                    {
                        model: ModelPromoChild,
                        as: "children",
                        required: false
                    }
                ]
            })
            const programs = await ModelPromoProgram.findAll({
                where: {promoId: id},
                include: [
                    {
                        model: ModelPromoChild,
                        as: "child",
                        required: false,
                        include: [
                            {
                                model: ModelPromoParent,
                                as: "parent",
                                required: false
                            }
                        ]
                    }
                ]
            })

            const totalStudent = parents.reduce((allChildrenArr, parent) => {
                return allChildrenArr.concat(parent.children);
            }, []).length;

            const data = {totalStudent, parents, programs, promo}
            res.json(utils.JParser("fetched successfully", !!programs, data));
        } else {
            res.json(utils.JParser("Promo not found", false, []));
        }
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});


// Get PROMO parents
exports.PromoParents = useAsync(async (req, res, next) => {
    const id = req.params.id
    try {
        const promo = await ModelPromo.findOne({where: {id}})
        if (promo) {

            const parents = await ModelPromoParent.findAll({
                where: {promoId: id},
                include: [
                    {
                        model: ModelPromoChild,
                        as: "children",
                        required: false,
                        include: {model: ModelPromoProgram, as: "programs"}
                    }
                ]
            })

            res.json(utils.JParser("Parents fetched successfully", !!parents, parents));
        } else {
            res.json(utils.JParser("Promo not found", false, []));
        }
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});


// Send all PROMO parents reminders email
exports.adminSendAllPromoParentsReminderEmail = useAsync(async (req, res, next) => {
    try {
        const {ids} = req.body;
        if (!ids || ids.length === 0) {
            throw new Error('No program IDs provided');
        }

        const programs = await ModelPromoProgram.findAll({
            where: {id: ids},
            include: [
                {
                    model: ModelTeacher,
                    as: "promo_teacher",
                    required: false
                },
                {
                    model: ModelPromoChild,
                    as: "child",
                    include: {
                        model: ModelPromoParent,
                        as: "parent",
                        required: true
                    },
                    required: true
                },
                {model: ModelTimegroup, as: 'timeGroup'}
            ]
        });

        if (!programs || programs.length === 0) {
            return res.json(utils.JParser("Programs not found, Trya again later", false, []));
        }

        // Check if any program is missing a teacher
        const programsWithoutTeacher = programs.filter(program => !program.promo_teacher);
        if (programsWithoutTeacher.length > 0) {
            return res.json(utils.JParser("Some programs are missing teachers, Assign teacher to program and try again", false, programsWithoutTeacher.map(p => p.id)));
        }


        for (const program of programs) {
            const day = program.day;
            const teacher = program.promo_teacher;
            const child = program.child;
            const parent = child.parent;
            const time = formatTimeGroup(program.timeGroup.times, program.timeGroupIndex, program?.child?.parent?.timezone)

            const body = {
                name: parent.firstName,
                email: parent.email,
                child: child.firstName,
                time: mergeDayAndTime(day, time),
                teacher: `${teacher.firstName} ${teacher.lastName}`,
                link: teacher.classLink,
            };

            await EmailService.sendParentPromoReminderEmail(body);
        }

        res.json(utils.JParser("Parents mailed successfully", true, []));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

exports.adminSendAllPromoParentsCertificateEmail = useAsync(async (req, res, next) => {
    try {
        const {id} = req.body;
        if (!id) {
            throw new Error('No program IDs provided');
        }

        const programs = await ModelPromoProgram.findAll({
            where: {id: id, isCompleted: true},
            include: [
                {
                    model: ModelPromoChild,
                    as: "child",
                    include: {
                        model: ModelPromoParent,
                        as: "parent",
                        required: true
                    },
                    required: true
                }
            ]
        });

        if (!programs || programs.length === 0) {
            return res.json(utils.JParser("No Programs completed found,", false, []));
        }

        const unCompleteProgram = programs.filter(program => !program.isCompleted);
        if (unCompleteProgram.length > 0) {
            return res.json(utils.JParser("Some programs are missing not completed yet, complete and try again", false, unCompleteProgram.map(p => p.id)));
        }

        for (const program of programs) {
            const child = program.child;
            const parent = child.parent;

            const body = {
                name: parent.firstName,
                email: parent.email,
                child: child.firstName,
                id: program.id
            };

            await EmailService.sendParentPromoCertificateEmail(body);
        }

        res.json(utils.JParser("Parents mailed successfully", true, []));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});


exports.adminSendSinglePromoParentsCertificateEmail = useAsync(async (req, res, next) => {
    try {
        const {id} = req.body;
        if (!id) {
            throw new Error('No program IDs provided');
        }

        const program = await ModelPromoProgram.findOne({
            where: {id: id, isCompleted: true},
            include: [
                {
                    model: ModelPromoChild,
                    as: "child",
                    include: {
                        model: ModelPromoParent,
                        as: "parent",
                        required: true
                    },
                    required: true
                }
            ]
        });

        if (!program) {
            return res.json(utils.JParser("No program completed found,", false, []));
        }

        const child = program.child;
        const parent = child.parent;

        const body = {
            name: parent.firstName,
            email: parent.email,
            child: child.firstName,
            id: program.id
        };

        await EmailService.sendParentPromoCertificateEmail(body);

        res.json(utils.JParser("Parents mailed successfully", true, []));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});


exports.adminSendSinglePromoParentsReminderEmail = useAsync(async (req, res, next) => {
    try {
        const {id} = req.body;
        if (!id) {
            throw new Error('No program IDs provided');
        }

        const program = await ModelPromoProgram.findOne({
            where: {id: id},
            include: [
                {
                    model: ModelTeacher,
                    as: "promo_teacher",
                    required: false
                },
                {
                    model: ModelPromoChild,
                    as: "child",
                    include: {
                        model: ModelPromoParent,
                        as: "parent",
                        required: true
                    },
                    required: true
                },
                {model: ModelTimegroup, as: 'timeGroup'}
            ]
        });

        if (!program) {
            return res.json(utils.JParser("Programs not found, Trya again later", false, []));
        }

        if (!program.promo_teacher) {
            return res.json(utils.JParser("Assign teacher to program and try again", false, []));
        }

        const day = program.day;
        const teacher = program.promo_teacher;
        const child = program.child;
        const parent = child.parent;
        const time = formatTimeGroup(program.timeGroup.times, program.timeGroupIndex, program?.child?.parent?.timezone)

        const body = {
            name: parent.firstName,
            email: parent.email,
            child: child.firstName,
            time: mergeDayAndTime(day, time),
            teacher: `${teacher.firstName} ${teacher.lastName}`,
            link: teacher.classLink,
        };

        await EmailService.sendParentPromoReminderEmail(body);

        res.json(utils.JParser("Parents mailed successfully", true, []));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// Send all PROMO parents email
exports.adminSendAllPromoParentsEmail = useAsync(async (req, res, next) => {
    const id = req.params.id
    try {
        let q = {};
        // const parents = await ModelParent.findAll();
        const schema = Joi.object({
            t: Joi.number().required(),
            s: Joi.string().required(),
            b: Joi.string().required(),
            attachmentLink: Joi.string().optional()
        });
        const data = await schema.validateAsync(req.body);
        //query build
        if (data.t === 1) {
            q.isPaid = true
            q.isCompleted = false
        }
        if (data.t === 2) {
            q.isPaid = false
            q.isCompleted = false
        }
        if (data.t === 3) {
            q = {}
        }
        if (data.t === 4) {
            q.isPaid = true
            q.isCompleted = true
        }
        //find all parents
        const parents = await ModelPromoParent.findAll({
            where: {promoId: id},
            include: {
                model: ModelPromoChild,
                as: "children",
                include: {model: ModelPromoProgram, as: "programs", where: q, required: (data.t !== 3)},
                required: true
            }
        });
        //console.log(parents.length)
        let d = 0
        parents.map((parent) => {
            if (data.t !== 3) {
                const body = `<strong>Hello, ${parent.firstName}</strong> <br/>${data.b}`
                sendParentEmail(parent.email, body, data.s, data.attachmentLink)
            }
            if (data.t === 3) {
                //parent with no any cohort
                if (parent?.children?.filter((x) => x.programs.length === 0).length > 0) {
                    const body = `<strong>Hello, ${parent.firstName}</strong> <br/>${data.b}`
                    sendParentEmail(parent.email, body, data.s, data.attachmentLink)
                }
            }
        })
        res.json(utils.JParser("Parents mailed successfully", true, []));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// Send promo parent email
exports.adminSendPromoParentEmail = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params
        const parent = await ModelPromoParent.findOne({where: {id}});
        if (!parent) return res.json(utils.JParser("Parents not found", false, []));
        const schema = Joi.object({
            body: Joi.string().required(),
            subject: Joi.string().required(),
            attachmentLink: Joi.string().optional()
        });
        const data = await schema.validateAsync(req.body);
        const body = `<strong>Hello, ${parent.firstName}</strong> <br/>${data.body}`
        sendParentEmail(parent.email, body, data.subject, data.attachmentLink)
        res.json(utils.JParser("Parent mailed successfully", true, []));
    } catch (e) {
        console.log(e.message)
        throw new errorHandle(e.message, 500);
    }
});

// Reset promo parent password
exports.adminPromoSendResetPassword = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params
        const parent = await ModelPromoParent.findOne({where: {id}});
        const schema = Joi.object({
            newPassword: Joi.string().required()
        });
        const data = await schema.validateAsync(req.body);
        if (parent && schema) {
            await parent.update({password: sha1(data.newPassword)})
            const body = `<strong>Hello, ${parent.firstName}</strong> <br/>Your password has been reset by the admin and your new password is: <code>${data.newPassword}</code>`
            sendParentEmail(parent.email, body, "New Password Reset")
        }
        res.json(utils.JParser("Parent reset password altered", true, []));
    } catch (e) {
        console.log(e.message)
        throw new errorHandle(e.message, 500);
    }
});


// Get all partner children
exports.adminGetAllPromoChild = useAsync(async (req, res, next) => {
    const {id} = req.params
    try {

        const parents = await ModelPromoParent.findAll({
            where: {promoId: id},
            include: {
                model: ModelPromoChild,
                as: "children",
                required: true,
                include: [
                    {
                        model: ModelPromoProgram,
                        as: "programs",
                        order: [['id', 'desc']],
                        required: false
                    },
                    {
                        model: ModelPromoParent,
                        as: "parent",
                        required: true
                    }
                ]
            }

        });

        const children = parents.reduce((allChildren, parent) => {
            return allChildren.concat(parent.children);
        }, []);


        res.json(utils.JParser("Children retrieved successfully", !!children, children));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

//Delete child
exports.adminDeletePromoChild = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;
        const deletedRows = await ModelPromoChild.destroy({where: {id}});
        res.json(utils.JParser("Child deleted successfully", !!deletedRows, deletedRows));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});


// Update child
exports.adminUpdatePromoChild = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;
        const schema = Joi.object({
            firstName: Joi.string().required(),
            lastName: Joi.string().required(),
            age: Joi.number().integer().required(),
            gender: Joi.string().valid('Male', 'Female').required()
        });
        const {error, value: data} = schema.validate(req.body);
        const [updatedRows] = await ModelPromoChild.update(data, {where: {id}});
        const updatedChild = await ModelPromoChild.findByPk(id);
        res.json(utils.JParser("Child updated successfully", !!updatedChild, updatedChild));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});


// Get all partner programs
exports.adminGetAllPromoPrograms = useAsync(async (req, res, next) => {
    try {
        const programs = await ModelPromoProgram.findAll({
            include: [
                {model: ModelPromoChild, as: 'child', include: {model: ModelPromoParent, as: "parent"}, required: true},
                {model: ModelTeacher, as: 'promo_teacher'},
                {model: ModelPackage, as: 'promo_package'},
                {model: ModelCoupon, as: 'promo_coupon'},
                {model: ModelCohort, as: 'promo_cohort'},
                {model: ModelPromo, as: 'promo'},
                {model: ModelTimegroup, as: 'timeGroup'}
            ],
            order: [["day", "asc"], ["time", "asc"]]
        });
        res.json(utils.JParser("Programs retrieved successfully", !!programs, programs));
    } catch (e) {
        console.log(e)
        throw new errorHandle(e.message, 500);
    }
});

exports.adminGetPromoPrograms = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params
        const programs = await ModelPromoProgram.findAll({
            where: {promoId: id},
            include: [
                {model: ModelPromoChild, as: 'child', include: {model: ModelPromoParent, as: "parent"}, required: true},
                {model: ModelTeacher, as: 'promo_teacher'},
                {model: ModelCoupon, as: 'promo_coupon'},
                {model: ModelTimegroup, as: 'timeGroup'}
            ],
            order: [["day", "asc"], ["time", "asc"]]
        });
        res.json(utils.JParser("Programs retrieved successfully", !!programs, programs));
    } catch (e) {
        console.log(e)
        throw new errorHandle(e.message, 500);
    }
});

// Assign teacher to program
exports.adminAssignTeacherToPromoProgram = useAsync(async (req, res, next) => {
    try {
        const schema = Joi.object({
            teacherId: Joi.number().integer().required(),
            programIds: Joi.any().required(),
        }).min(1);
        console.log(req.body)
        const {error, value: data} = schema.validate(req.body);
        const [updatedRows] = await ModelPromoProgram.update({teacherId: data.teacherId}, {where: {id: data.programIds}});
        const updatedProgram = await ModelPromoProgram.findAll({where: {id: data.programIds}});
        res.json(utils.JParser("Program updated successfully", !!updatedProgram, updatedProgram));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

exports.adminPromoProgramTimeGroup = useAsync(async (req, res, next) => {
    try {
        const schema = Joi.object({
            programIds: Joi.any().required(),
            day: Joi.required()
        }).min(1);
        const {error, value: data} = schema.validate(req.body);
        const [updatedRows] = await ModelPromoProgram.update({day: data.day}, {where: {id: data.programIds}});
        const updatedProgram = await ModelPromoProgram.findAll({where: {id: data.programIds}});
        res.json(utils.JParser("Program updated successfully", !!updatedProgram, updatedProgram));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// Update promo program
exports.adminUpdatePromoProgram = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;
        const schema = Joi.object({
            timeGroupIndex: Joi.number().integer().optional(),
            day: Joi.string().optional(),
        }).min(1);

        const {error, value: data} = schema.validate(req.body);
        const updatedProgram = await ModelPromoProgram.findByPk(id);
        if (updatedProgram) {
            await updatedProgram.update(data);
        }
        res.json(utils.JParser("Program updated successfully", !!updatedProgram, updatedProgram));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});


// Update batch program
exports.adminBatchUpdatePromoProgram = useAsync(async (req, res, next) => {
    try {
        const schema = Joi.object({
            ids: Joi.array().required(),
            teacherId: Joi.number().optional(),
            day: Joi.optional()
        }).min(2);
        //extract ids
        const data = await schema.validateAsync(req.body);
        const IDs = data.ids
        //remove IDs
        delete data.ids
        const updatedProgram = await ModelPromoProgram.update(data, {where: {id: IDs}});
        res.json(utils.JParser("Program updated successfully", !!updatedProgram, updatedProgram));
    } catch (e) {
        console.log(e.message)
        throw new errorHandle(e.message, 500);
    }
});

// Update promo program
exports.adminUpdatePromoTimeSlot = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;
        const schema = Joi.object({
            numberOfKids: Joi.number().required(),
            index: Joi.number().required(),
        }).min(1);

        const {error, value: data} = schema.validate(req.body);
        const promo = await ModelPromo.findByPk(id);
        if (promo) {
            const parsedSlots = Array.isArray(promo.slot)
                ? promo.slot
                : JSON.parse(promo.slot);
            const slotConfig = parsedSlots.find(config => config.index === data.index);
            if (slotConfig) {
                slotConfig.numberOfKid = data.numberOfKids;
            }
            const editdata = {
                slot: parsedSlots
            }

            await promo.update(editdata);
            res.json(utils.JParser("Program updated successfully", !!promo, promo));
        }
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

exports.getPromoTimeTableWithId = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params
        const option = {where: {id}}
        const promo = await ModelPromo.findOne(option)
        if (promo) {
            const timeGroupId = promo.timeGroupId
            const timeTable = await ModelTimeGroup.findOne({where: {id: timeGroupId}})
            const convertedTimes = formatData(timeTable.times)
            res.json(utils.JParser("Timetable retrieved successfully", !!promo, convertedTimes));
        } else {
            res.json(utils.JParser("Unable to fetch time group", false, []));
        }
    } catch (e) {
        console.log(e)
        throw new errorHandle(e.message, 500);
    }
});


// MIGRATION
exports.migration = useAsync(async (req, res, next) => {
    let message = ""
    try {
        //console.log(req.body)
        const schema = Joi.object({
            promoId: Joi.number().required(),
        })
        const data = await schema.validateAsync(req.body)
        //add parent id
        data.status = true

        const option = {where: {promoId: data.promoId}}
        const migration = await ModelMigration.findOne(option)

        if (migration) {
            message = "Migration Enabled successfully"
            migration.update({status: true})
        } else {
            await ModelMigration.create(data)
            message = "Migration Enabled successfully"
        }

        res.json(utils.JParser(message, true, []))
    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});

//UPDATE MIGRATION
exports.updateMigration = useAsync(async (req, res, next) => {
    try {
        const {id, status} = req.body
        const option = {where: {promoId: id}}
        const migration = await ModelMigration.findOne(option)
        if (migration) {
            console.log(migration)
            const disabled = migration.update({status: status})
            console.log(disabled)
            res.json(utils.JParser("Migration disabled successfully", !!disabled, disabled));
        }
    } catch (e) {
        console.log(e)
        throw new errorHandle(e.message, 500);
    }
});

//BLOG

// Create a new blog
exports.createBlog = useAsync(async (req, res, next) => {
    try {
        const {title, content, category, readTime, featuredImage} = req.body;

        const blogData = {
            title,
            slug: slugify(title, {lower: true}),
            content,
            // excerpt,
            category,
            featuredImage,
            readTime,
            status: 'draft'
        };

        const blog = await ModelBlog.create(blogData);
        res.json(utils.JParser("Blog created successfully", true, blog));
    } catch (e) {
        console.error(e);
        throw new errorHandle(e.message, 500);
    }
});

// Get all blogs with pagination
exports.getAllBlogs = useAsync(async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const options = {
            where: {isDeleted: false},
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        };

        const blogs = await ModelBlog.findAndCountAll(options);

        const totalPages = Math.ceil(blogs.count / limit);
        const response = {
            blogs: blogs.rows,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: blogs.count,
                hasMore: page < totalPages
            }
        };

        res.json(utils.JParser("Blogs retrieved successfully", true, response));
    } catch (e) {
        console.error(e);
        throw new errorHandle(e.message, 500);
    }
});

exports.getAllPublishedBlogs = useAsync(async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const options = {
            where: {isDeleted: false, status: "published"},
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        };

        const option = {
            where: {isDeleted: false, status: "archived"},
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        };

        const blogs = await ModelBlog.findAndCountAll(options);
        const featured = await ModelBlog.findAll(option);


        const totalPages = Math.ceil(blogs.count / limit);
        const response = {
            blogs: blogs.rows,
            featured,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: blogs.count,
                hasMore: page < totalPages
            }
        };

        res.json(utils.JParser("Blogs retrieved successfully", true, response));
    } catch (e) {
        console.error(e);
        throw new errorHandle(e.message, 500);
    }
});

// Get single blog by slug
exports.getBlogBySlug = useAsync(async (req, res, next) => {
    try {
        const {slug} = req.params;
        const options = {
            where: {slug, isDeleted: false, status: 'published'}
        };

        const blog = await ModelBlog.findOne(options);
        if (blog) {
            res.json(utils.JParser("Blog retrieved successfully", true, blog));
        } else {
            res.json(utils.JParser("Blog not found", false, null));
        }
    } catch (e) {
        console.error(e);
        throw new errorHandle(e.message, 500);
    }
});

// Update blog
exports.updateBlog = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;
        const {title, content, excerpt, categoryId, readTime, status} = req.body;

        const blog = await ModelBlog.findOne({where: {id, isDeleted: false}});
        if (!blog) {
            return res.json(utils.JParser("Blog not found", false, null));
        }

        const updateData = {
            title,
            content,
            categoryId,
            readTime,
            excerpt,
            status,
            updatedAt: new Date()
        };

        if (title !== blog.title) {
            updateData.slug = slugify(title, {lower: true});
        }

        if (req.file) {
            updateData.featuredImage = req.file.path;
        }

        await blog.update(updateData);
        res.json(utils.JParser("Blog updated successfully", true, blog));
    } catch (e) {
        console.error(e);
        throw new errorHandle(e.message, 500);
    }
});

exports.updateBlogStatus = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;
        const {status} = req.body;

        const blog = await ModelBlog.findOne({where: {id, isDeleted: false}});
        if (!blog) {
            return res.json(utils.JParser("Blog not found", false, null));
        }

        const updateData = {
            featuredImage: req.body.featuredImage ? req.body.featuredImage : blog.featuredImage,
            status,
            updatedAt: new Date()
        };

        await blog.update(updateData);
        res.json(utils.JParser("Blog updated successfully", true, blog));
    } catch (e) {
        console.error(e);
        throw new errorHandle(e.message, 500);
    }
});

exports.updateBlogViews = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;

        const blog = await ModelBlog.findOne({where: {id, isDeleted: false}});
        if (!blog) {
            return res.json(utils.JParser("Blog not found", false, null));
        }

        const updateData = {
            views: blog.views + 1,
            updatedAt: new Date()
        };

        await blog.update(updateData);
        res.json(utils.JParser("Blog updated successfully", true, []));
    } catch (e) {
        console.error(e);
        throw new errorHandle(e.message, 500);
    }
});

exports.updateBlogLikes = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;

        const blog = await ModelBlog.findOne({where: {id, isDeleted: false}});
        if (!blog) {
            return res.json(utils.JParser("Blog not found", false, null));
        }

        const updateData = {
            likes: blog.likes + 1,
            updatedAt: new Date()
        };

        await blog.update(updateData);
        res.json(utils.JParser("Blog updated successfully", true, []));
    } catch (e) {
        console.error(e);
        throw new errorHandle(e.message, 500);
    }
});

exports.getSingleBlog = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;

        const blog = await ModelBlog.findOne({where: {id, isDeleted: false}});
        if (!blog) {
            return res.json(utils.JParser("Blog not found", false, null));
        }
        res.json(utils.JParser("Blog fetched successfully", true, blog));
    } catch (e) {
        console.error(e);
        throw new errorHandle(e.message, 500);
    }
});

// Soft delete blog
exports.deleteBlog = useAsync(async (req, res, next) => {
    try {
        const {id} = req.params;
        const blog = await ModelBlog.findOne({where: {id, isDeleted: false}});

        if (!blog) {
            return res.json(utils.JParser("Blog not found", false, null));
        }

        await blog.update({isDeleted: true});
        res.json(utils.JParser("Blog deleted successfully", true, null));
    } catch (e) {
        console.error(e);
        throw new errorHandle(e.message, 500);
    }
});

// Audit logs - route
exports.getAuditLog = useAsync(async (req, res, next) => {
    try {
        const logs = await AuditLog.find().sort({timestamp: -1});
        res.json(utils.JParser("Okay", true, logs));
    } catch (e) {
        console.error(e);
        throw new errorHandle(e.message, 500);
    }
});
