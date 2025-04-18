/**
 * Slantapp code and properties {www.slantapp.io}
 */
const sha1 = require('sha1');
const Joi = require('joi');

const EmailService = require("./../services")
const { useAsync, utils, errorHandle, } = require('./../core');
const { utc } = require("moment");
const countryData = require("./../models/model.countries")
const { Op } = require("sequelize");
const sequelize = require("sequelize");
const ModelPartnerParent = require('../models/model.partner_parent');
const ModelPartner = require('../models/model.partner');
const ModelParentInvite = require('../models/model.partner_invite');
const { UniqueCodeGenerator } = require('../core/core.utils');
const ModelPartnerChild = require('../models/model.partner_child');
const ModelPartnerProgram = require('../models/model.partner_program');
const ModelCohort = require('../models/model.cohort');
const { ModelParent, ModelPackage, ModelProgram, ModelTeacher } = require('../models');
//const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

////////////////////////////////////////////////////////////////////////////////
/**PARTNER */
////////////////////////////////////////////////////////////////////////////////

//partner login
exports.partnerLogin = useAsync(async (req, res, next) => {
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
        let partnerFound = await ModelPartner.findOne({ where: data })
        if (partnerFound) await partnerFound.update({ token: sha1(new Date().toUTCString()) })
        if (partnerFound) await partnerFound.reload()
        if (!partnerFound) {
            return res.status(400).json(utils.JParser('Invalid email or password', !!partnerFound, partnerFound));
        }
        if (!partnerFound.approved) {
            return res.status(400).json(utils.JParser("Sorry your account have not been approved yet, contact the RYD Admin for support", false, []));
        }

        if (!partnerFound.status) {
            return res.status(400).json(utils.JParser("Welcome " + partnerFound.organizationName + ", Your account have been disable, contact the RYD Admin for support", false, false));
        }
        //add partner currency and rate
        const rate = await utils.getCurrencyRate(partnerFound?.country)
        //console.log(rate)
        //console.log(rate)
        partnerFound = { ...partnerFound.get({ plain: true }), rate }
        res.json(utils.JParser("Login successful", !!partnerFound, partnerFound));
    } catch (e) {
        throw new errorHandle(e.message, 400);
    }

});

//partner register
exports.partnerRegister = useAsync(async (req, res, next) => {
    let message = ""
    try {
        //console.log(req.body)
        const schema = Joi.object({
            email: Joi.string().email({ minDomainSegments: 2 }).required(),
            password: Joi.string().min(5).required(),
            firstName: Joi.string().min(3).required(),
            lastName: Joi.string().min(3).required(),
            organizationName: Joi.string().min(3).required(),
            address: Joi.string().min(3).required(),
            country: Joi.string().min(3).optional(),
            phone: Joi.string().min(3).optional().allow("")
        })
        const data = await schema.validateAsync(req.body)
        //get time offset before create
        //timeOffset: Joi.number().required()
        const option = { where: { email: data.email } }
        const partner = await ModelPartner.findOne(option)
        if (partner) {
            res.json(utils.JParser("Organization with this email already exists", false, []));
            return
        }
        //hash password
        data.password = sha1(data.password)
        data.token = sha1(new Date().toUTCString())
        const [createPartner, status] = await ModelPartner.findOrCreate({ where: { organizationName: data.organizationName }, defaults: data })
        if (status) message = "Account created successfully"
        else message = "Organization with this name already exists"
        //if newly created then send email
        if (status) {
            //sending email
            EmailService.sendPartnerWelcomeEmail(data)
        }
        res.json(utils.JParser(message, status, createPartner));
    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});

//partner update
exports.partnerUpdate = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;
    let message = ""
    try {
        //console.log(req.body)
        const schema = Joi.object({
            firstName: Joi.string().min(3),
            organizationName: Joi.string().min(3),
            address: Joi.string().min(3),
            lastName: Joi.string().min(3),
            phone: Joi.string().min(3),
        })
        const data = await schema.validateAsync(req.body)
        const partner = await ModelPartner.findOne({
            where: {
                email: session.email,
                token: session.token,
            }
        })
        if (partner) message = "Account has been updated successfully"
        else message = "Account could not update"
        //if newly created then send email
        if (partner) {
            //update model
            await partner.update({ ...partner.toJSON(), ...data })
            //sending email
            EmailService.sendNotificationUpdate(partner.email, "Profile update")
        }
        res.json(utils.JParser(message, !!partner, await partner.reload()));
    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});

//partner reset password
exports.partnerPasswordReset = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;
    let message = "Password reset"
    try {
        //console.log(req.body)
        const schema = Joi.object({
            email: Joi.string().email({ minDomainSegments: 2 }).required(),
        })
        const data = await schema.validateAsync(req.body)
        const partner = await ModelPartner.findOne({ where: { email: data.email } })
        if (partner) message = "Password reset successfully"
        else message = "Unable to reset password, Invalid email"
        //if partner found, reset password
        if (partner) {
            //new password
            const pwd = utils.AsciiCodes(8)
            //sending email
            await partner.update({ password: sha1(pwd), token: sha1(new Date().toUTCString()) })
            EmailService.sendPasswordReset(partner.email, pwd)
        }
        res.json(utils.JParser(message, !!partner, null));
    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});

//partner update password
exports.partnerPasswordUpdate = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;

    let message = ""
    try {
        //console.log(req.body)
        const schema = Joi.object({
            email: Joi.required(),
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
            const partner = await ModelPartner.findOne({
                where: {
                    email: data.email,
                    password: data.passwordOld
                }
            })
            //if newly created then send email
            if (partner) {
                //update password
                await partner.update({ password: data?.password1 })
                //sending email
                EmailService.sendPasswordNotifications(partner.email)
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

exports.inviteParent = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;
    try {
        const schema = Joi.object({
            emails: Joi.string().required(),
            kidsNum: Joi.number().required(),
        });
        const data = await schema.validateAsync(req.body);
        const emailString = data.emails
        const partner = await ModelPartner.findOne({ where: { id: session.id } })

        const emailArray = emailString.split(',').map(email => email.trim()).filter(email => email.length > 0);

        if (partner) {
            const patnerId = 100 + partner.id
            for (const email of emailArray) {
                const option = {
                    where: {
                        email,
                        active: true
                    }
                }
                const existingEmail = await ModelPartnerParent.findOne(option);

                const existingInviting = await ModelParentInvite.findOne(option);
                if (existingEmail) {
                    res.json(utils.JParser(`Sorry you can't invite this parent ${existingEmail.email}`, false, []));
                    return
                } else if (existingInviting) {
                    res.json(utils.JParser("Sorry you can't invite this parents", false, []));
                    return
                } else {
                    await ModelParentInvite.create({
                        email,
                        kidsNum: data.kidsNum,
                        partnerId: session.id
                    });
                    const mailData = {
                        email: email,
                        partnerName: partner.organizationName,
                        patnerId: patnerId
                    }
                    EmailService.sendParentInviteEmail(mailData)
                }
            }
        }
        res.json(utils.JParser("Parent invited successfully", true, []));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});


// Get all parents
exports.GetAllPartnerParents = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;
    try {
        const parents = await ModelPartnerParent.findAll({
            where: { partnerId: session.id },
            include: [
                {
                    model: ModelPartnerChild,
                    as: "children",
                    required: false,
                    include: [
                        {
                            model: ModelPartnerProgram,
                            as: "programs",
                            required: false,
                            include: [
                                {
                                    model: ModelCohort,
                                    as: "partner_cohort",
                                    required: true
                                },
                            ],
                        }
                    ]
                }
            ]
        });
        res.json(utils.JParser("Parents retrieved successfully", !!parents, parents));
    } catch (e) {
        console.log(e.message)
        throw new errorHandle(e.message, 500);
    }
});

// Get partner cohort
exports.PartnerCohortGetAll = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;
    try {
        const cohort = await ModelCohort.findAll({
            where: { isVisible: { [Op.in]: [0, 2] } },
            include: {
                model: ModelPartnerProgram, as: "partner_programs", required: false,
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
            where: { partnerId: session.id },
            include: [
                {
                    model: ModelPartnerChild,
                    as: "children",
                    required: false
                }
            ]
        })

        const programs = await ModelPartnerProgram.findAll({
            where: { partnerId: session.id },
            include: [
                {
                    model: ModelPackage,
                    as: "partner_package",
                    required: true
                }
            ]
        })

        const activeStudent = programs.filter((program) => program.isPaid && !program.isCompleted).length;
        const inActiveStudent = programs.filter((program) => !program.isPaid).length;
        const totalStudent = parents.reduce((total, parent) => total + parent.children.length, 0);
        const debt = programs.filter((program) => program.partner_package && !program.isPaid)
            .reduce((total, program) => total + program.partner_package.amount, 0);

        const data = { cohort, totalStudent, activeStudent, inActiveStudent, debt }
        res.json(utils.JParser("fetched successfully", !!cohort, data));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// Get partner cohort by id
exports.PartnerCohortGetByID = useAsync(async (req, res, next) => {
    const { id } = req.params;
    try {
        const cohort = await ModelCohort.findOne({
            where: { isVisible: { [Op.in]: [0, 2] }, id: id },
            include: {
                model: ModelPartnerProgram, as: "partner_programs", required: false,
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
                    },
                    {
                        model: ModelPackage,
                        as: "partner_package",
                        required: true
                    },
                    { model: ModelTeacher, as: 'partner_teacher' },

                ]
            },
            order: [['id', 'desc']]
        })

        res.json(utils.JParser("fetched successfully", !!cohort, cohort));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// Get parent by ID
exports.partnerGetParentById = useAsync(async (req, res, next) => {
    try {
        const { id, cid } = req.params;
        const cohort = await ModelCohort.findOne({ where: { id: cid } })
        const parent = await ModelPartnerParent.findOne({
            where: { id: id },
            include: [
                {
                    model: ModelPartnerChild,
                    as: "children",
                    required: false,
                    include: [
                        {
                            model: ModelPartnerProgram,
                            as: "programs",
                            required: false,
                            include: [
                                {
                                    model: ModelCohort,
                                    as: "partner_cohort",
                                    required: true
                                },
                                {
                                    model: ModelPackage,
                                    as: "partner_package",
                                    required: true
                                },
                            ],
                        }
                    ]
                }
            ]
        });

        res.json(utils.JParser("Parent retrieved successfully", !!parent, { parent, cohort }));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// Get partner invoice
exports.PartnerInvoiceGetAll = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;
    try {
        const programs = await ModelPartnerProgram.findAll({
            where: { isPaid: false, partnerId: session.id },
            include: [
                {
                    model: ModelCohort,
                    as: "partner_cohort",
                    required: false
                },
                {
                    model: ModelPartnerChild,
                    as: "child",
                    required: false,
                },
                {
                    model: ModelPackage,
                    as: "partner_package",
                    required: false
                },
            ]
        })
        // Create an object to hold the grouped data
        const grouped = {};

        // Iterate over each unpaid program
        programs.forEach(program => {
            const cohortId = program.cohortId
            const amount = program.partner_package.amount
            const dueDate = program.partner_cohort.endDate
            const cohort = program.partner_cohort

            // Initialize the object for this cohortId if it doesn't exist
            if (!grouped[cohortId]) {
                grouped[cohortId] = {
                    programs: [],
                    count: 0,
                    totalAmount: 0,
                    dueDate: ""
                };
            }

            // Add the program to the cohortId group
            grouped[cohortId].programs.push(program);
            grouped[cohortId].count += 1;
            grouped[cohortId].totalAmount += amount;
            grouped[cohortId].dueDate = dueDate
            grouped[cohortId].cohort = cohort
        });

        // Convert the grouped object to an array of results
        const result = Object.keys(grouped).map(cohortId => ({
            cohortId,
            programs: grouped[cohortId].programs,
            count: grouped[cohortId].count,
            totalAmount: grouped[cohortId].totalAmount,
            cohort: grouped[cohortId].cohort,
            status: false,
            dueDate: grouped[cohortId].dueDate
        }));

        res.json(utils.JParser("Invoice fetched successfully", !!result, result));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});


// Disable partner
exports.partnerDisableParent = useAsync(async (req, res, next) => {
    try {
        const { id } = req.params;
        const parent = await ModelPartnerParent.findByPk(id);
        if (!parent) {
            res.status(400).json(utils.JParser("Parent not found", false, []));
        }

        parent.status = false;
        await parent.save();

        await ModelParentInvite.update({ active: false }, { where: { email: parent.email } });
        res.json(utils.JParser("Parent updated successfully", !!parent, parent));
    } catch (e) {
        console.log(e.message)
        throw new errorHandle(e.message, 500);
    }
});


// Enable partner
exports.partnerEnableParent = useAsync(async (req, res, next) => {
    try {
        const { id } = req.params;
        const parent = await ModelPartnerParent.findByPk(id);
        if (!parent) {
            res.status(400).json(utils.JParser("Parent not found", false, []));
        }

        parent.status = true;
        await parent.save();

        await ModelParentInvite.update({ active: true }, { where: { email: parent.email } });
        res.json(utils.JParser("Parent updated successfully", !!parent, parent));
    } catch (e) {
        console.log(e.message)
        throw new errorHandle(e.message, 500);
    }
});


//GET PARTNER INVITE
exports.getParentInvite = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;
    try {

        const invites = await ModelParentInvite.findAll({ where: { partnerId: session.id } });
        res.json(utils.JParser("Invite deleted successfully", !!invites, invites));

    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});


// update parent kids
exports.partnerUpdatekidAllowed = useAsync(async (req, res, next) => {
    try {
        const { id, num } = req.params;
        const invite = await ModelParentInvite.findByPk(id);
        if (!invite) {
            res.status(400).json(utils.JParser("Invite not found", false, []));
        }

        invite.kidsNum = parseInt(num);
        await invite.save();
        res.json(utils.JParser("Invite updated successfully", !!invite, invite));
    } catch (e) {
        console.log(e.message)
        throw new errorHandle(e.message, 500);
    }
});

////////////////////////////////////////////////////////////////////////////////
/**PARENT */
////////////////////////////////////////////////////////////////////////////////

//parent login
exports.partnerParentLogin = useAsync(async (req, res, next) => {
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
        const parent = await ModelPartnerParent.findOne({ where: data })
        if (parent) {
            const partner = await ModelPartner.findOne({ where: { id: parent.partnerId } })
            const invite = await ModelParentInvite.findOne({ where: { partnerId: partner.id, email: data.email, active: true } })
            const kidsNum = invite.kidsNum
            await parent.update({ token: sha1(new Date().toUTCString()) })
            await parent.reload()
            const partnerData = {
                firstName: partner.firstName,
                lastName: partner.lastName,
                organizationName: partner.organizationName,
                id: partner.id,
                kidsNum
            }

            if (!parent.status) {
                return res.status(400).json(utils.JParser("Welcome " + parent.firstName + " " + parent.lastName + ", Your account have been disable, contact your cooperation for support", false, false));
            }

            if (!partner.status) {
                return res.status(400).json(utils.JParser("Welcome " + parent.firstName + " " + parent.lastName + ", Your account have been disable, contact your cooperation for support", false, false));
            }

            parent.password = "**********************"

            res.json(utils.JParser("Login successful", !!parent, { parent, partnerData }));
        } else {
            res.json(utils.JParser("Invalid email / password", !!parent, []));
        }
    } catch (e) {
        throw new errorHandle(e.message, 400);
    }

});

//parent register
exports.partnerParentRegister = useAsync(async (req, res, next) => {
    let message = ""
    try {
        //console.log(req.body)
        const schema = Joi.object({
            email: Joi.string().email({ minDomainSegments: 2 }).required(),
            password: Joi.string().min(5).required(),
            firstName: Joi.string().min(3).required(),
            lastName: Joi.string().min(3).required(),
            phone: Joi.string().min(3).optional().allow(""),
            country: Joi.string().min(3).required(),
            state: Joi.string().min(3).required(),
            timezone: Joi.string().required(),
            partnerId: Joi.number().required()
        })
        const data = await schema.validateAsync(req.body)
        //get time offset before create
        //timeOffset: Joi.number().required()
        data.timeOffset = await utils.getTimeOffsetByZone(data.timezone)
        //hash password
        data.password = sha1(data.password)
        data.token = sha1(new Date().toUTCString())
        // console.log(data)
        // return
        const option = { where: { email: data.email } }
        const parent = await ModelPartnerParent.findOne(option)
        if (parent) {
            res.json(utils.JParser("Parent with this email already exists", false, []));
            return
        }
        const invite = await ModelParentInvite.findOne({ where: { partnerId: data.partnerId, email: data.email, active: true } })
        if (invite) {
            const [createParent, status] = await ModelPartnerParent.findOrCreate({ where: { email: data.email }, defaults: data })
            if (status) message = "Account created successfully"
            else message = "Account with this email already exists"
            //if newly created then send email
            if (status) {
                //sending email
                EmailService.sendParentWelcomeEmail(data)
            }
            res.json(utils.JParser(message, !!createParent, createParent));
        } else {
            res.json(utils.JParser("Sorry you have to be invited to be able to create account ", false, null));
        }
    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});

//parent update
exports.partnerParentUpdate = useAsync(async (req, res, next) => {
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
            privacyMode: Joi.bool(),
        })
        const data = await schema.validateAsync(req.body)
        const parent = await ModelPartnerParent.findOne({
            where: {
                email: session.email,
                token: session.token,
            }
        })
        if (parent) message = "Account has been updated successfully"
        else message = "Account could not update"
        //if newly created then send email
        if (parent) {
            //update model
            await parent.update({ ...parent.toJSON(), ...data })
            //sending email
            EmailService.sendNotificationUpdate(parent.email, "Profile update")
        }
        res.json(utils.JParser(message, !!parent, await parent.reload()));
    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});

//parent reset password
exports.partnerParentPasswordReset = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;
    let message = "Password reset"
    try {
        //console.log(req.body)
        const schema = Joi.object({
            email: Joi.string().email({ minDomainSegments: 2 }).required(),
        })
        const data = await schema.validateAsync(req.body)
        const parent = await ModelPartnerParent.findOne({ where: { email: data.email } })
        if (parent) message = "Password reset successfully"
        else message = "Unable to reset password, Invalid email"
        //if parent found, reset password
        if (parent) {
            //new password
            const pwd = utils.AsciiCodes(8)
            console.log(pwd)
            //sending email
            await parent.update({ password: sha1(pwd), token: sha1(new Date().toUTCString()) })
            EmailService.sendPasswordReset(parent.email, pwd)
        }
        res.json(utils.JParser(message, !!parent, null));
    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});

//parent update password
exports.partnerParentPasswordUpdate = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;

    let message = ""
    try {
        //console.log(req.body)
        const schema = Joi.object({
            email: Joi.required(),
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
            const parent = await ModelPartnerParent.findOne({
                where: {
                    email: data.email,
                    password: data.passwordOld
                }
            })
            //if newly created then send email
            if (parent) {
                //update password
                await parent.update({ password: data?.password1 })
                //sending email
                EmailService.sendPasswordNotifications(parent.email)
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


//parent add child
exports.partnerParentAddChild = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;
    let message = ""
    try {
        //console.log(req.body)
        const schema = Joi.object({
            firstName: Joi.string().min(1).required(),
            lastName: Joi.string().min(1).required(),
            age: Joi.number().required().min(7).max(16),
            gender: Joi.string().min(1).required(),
        })
        const data = await schema.validateAsync(req.body)
        //add parent id
        data.parentId = session.id

        const Childs = await ModelPartnerChild.findAll({ where: { parentId: session.id } })
        const invite = await ModelParentInvite.findOne({ where: { email: session.email, active: true } })

        // if (Childs.length < invite.kidsNum) {
        const [createChild, status] = await ModelPartnerChild.findOrCreate({ where: data, defaults: data })
        if (status) message = "New child added successfully"
        else message = "Child with similar details exist"
        //if newly created then send email
        if (status) {
            //sending email
            // EmailService.sendNotificationNewChild(session.email, data)
        }
        let tmpChild = await createChild.reload();
        //tmpChild.level = 1
        const objs = tmpChild.get({ plain: true })
        if (objs) {
            objs.level = 1
        }
        res.json(utils.JParser(message, status, objs));
        // } else {
        //     res.json(utils.JParser(`Sorry you don't have access to add more than ${invite.kidsNum} kids`, false, []));
        // }
    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});

//parent get child
exports.partnerParentGetDashboardData = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;
    let message = ""
    try {
        let allChild = await ModelPartnerChild.findAll({
            where: { parentId: session.id },
            include: [
                {
                    model: ModelPartnerProgram, as: "programs", include: [
                        {
                            model: ModelCohort,
                            as: "partner_cohort",
                            required: true
                        },
                        {
                            model: ModelPackage,
                            as: "partner_package",
                            required: true
                        },
                        {
                            model: ModelTeacher,
                            as: "partner_teacher",
                            required: false
                        }
                    ]
                },
            ],
        })
        //add levels and sort
        const children = allChild.map(o => {
            //sort for level and allowNewCohort
            const pLevel = o.programs.filter((p) => {
                if (p.isPaid && p.isCompleted) {
                    return p
                }
            })
            // sort for new cohort
            const allowNewCohort = o.programs.filter((p) => {
                if (p.isPaid && !p.isCompleted) {
                    return p
                }
            }).length === 0
            return { ...o.toJSON(), level: pLevel[0]?.level ? pLevel[0]?.level + 1 : 2, allowNewCohort }
        })

        const allPrograms = children.reduce((total, child) => {
            const completedAllPrograms = child.programs.filter((program) => program.isPaid);
            return total + completedAllPrograms.length;
        }, 0);


        const allOngoingClass = children.reduce((total, child) => {
            const ongoingClass = child.programs.filter((program) => program.isPaid && !program.isCompleted);
            return total + ongoingClass.length;
        }, 0);


        const completedPrograms = children.reduce((total, child) => {
            const completedPrograms = child.programs.filter((program) => program.isPaid && program.isCompleted);
            return total + completedPrograms.length;
        }, 0);

        const totalChild = allChild.length

        res.json(utils.JParser(message, !!allChild, { children, allPrograms, totalChild, allOngoingClass, completedPrograms }));
    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});

//parent add program
exports.partnerParentAddProgram = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;
    let message = ""
    try {
        const schema = Joi.object({
            childId: Joi.number(),
            packageId: Joi.number().optional(),
            time: Joi.number().required(),
            day: Joi.number().required(),
            level: Joi.number().required(),
            timeOffset: Joi.number().required(),
            cohortId: Joi.number().optional(),
        })

        const checkPartnerId = req.params.pid
        const data = await schema.validateAsync(req.body)
        data.childId = parseInt(req.params.id)
        if (checkPartnerId) {
            data.partnerId = checkPartnerId
        }
        //console.log(data.partnerId)
        //get child and get package
        const child = await ModelPartnerChild.findByPk(data.childId)
        const _package = await ModelPackage.findByPk(data.packageId)
        const program = await ModelPartnerProgram.findOne({ where: data })
        //sort 8 weeks for end classes
        let d = utc().utcOffset(Number(data.timeOffset), false)
        d.hour(data.time);
        d.day(data.day)
        d.minute(0)
        d.second(0)
        //add end class time
        data.nextClassDate = d.toDate()
        d.week(d.week() + 8)
        data.endClassDate = d.toDate()
        //insert new program
        if (child && _package && !program) {
            //console.log(data)
            const addNewProgram = await ModelPartnerProgram.create(data)
            const _junk = { child, _package, program: addNewProgram.toJSON() }
            //if added send email
            if (addNewProgram) {
                //sending a notification email
                EmailService.sendParentNewProgram(session.email, _junk)
            }
            res.json(utils.JParser(message, !!addNewProgram, addNewProgram));
        } else {
            res.json(utils.JParser("Unable to add a new program, similar program does exist", false, null));
        }
    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});


//Parent INVITE
exports.adminGetParentInvite = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;
    try {

        const parent = await ModelPartnerParent.findOne({ where: { id: session.id } })
        if (parent) {
            const invite = await ModelParentInvite.findOne({ where: { email: parent.email } });
            res.json(utils.JParser("Invite fetched successfully", !!invite, invite));
        } else {
            res.json(utils.JParser("Parent not found", false, []));
        }
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});
