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
const { UniqueCodeGenerator, generateRandomPassword, countTimeGroupIndexes, convertLessonTimes } = require('../core/core.utils');
const ModelPartnerChild = require('../models/model.partner_child');
const ModelPartnerProgram = require('../models/model.partner_program');
const ModelCohort = require('../models/model.cohort');
const { ModelPackage, ModelProgram, ModelTeacher, ModelPromo, ModelPromoParent, ModelPromoChild, ModelPromoProgram, ModelTimeGroup, ModelChild, ModelParent } = require('../models');

////////////////////////////////////////////////////////////////////////////////
/**PROMO */
////////////////////////////////////////////////////////////////////////////////

//PROMO login
exports.promoLogin = useAsync(async (req, res, next) => {
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
        let promoFound = await ModelPromo.findOne({ where: { email: data.email } })
        if (promoFound) await promoFound.update({ token: sha1(new Date().toUTCString()) })
        if (promoFound) await promoFound.reload()
        if (!promoFound) {
            return res.status(400).json(utils.JParser('Invalid email or password', !!promoFound, promoFound));
        }

        if (!promoFound.status) {
            return res.status(400).json(utils.JParser("Welcome " + promoFound.organizationName + ", Your account have been disable, contact the RYD Admin for support", false, false));
        }
        //add partner currency and rate
        const rate = await utils.getCurrencyRate(promoFound?.country)
        //console.log(rate)
        promoFound = { ...promoFound.get({ plain: true }), rate }
        res.json(utils.JParser("Login successful", !!promoFound, promoFound));
    } catch (e) {
        throw new errorHandle(e.message, 400);
    }

});

//create promo
exports.createPromo = useAsync(async (req, res, next) => {
    let message = ""
    try {

        const schema = Joi.object({
            email: Joi.string().email({ minDomainSegments: 2 }).required(),
            firstName: Joi.string().min(3).required(),
            lastName: Joi.string().min(3).required(),
            title: Joi.string().min(3).required(),
            address: Joi.string().min(3).required(),
            country: Joi.string().min(3).required(),
            phone: Joi.string().min(3).optional().allow(""),
            timeGroupId: Joi.number().required(),
            additionalFields: Joi.array().optional(),
            slot: Joi.array().required()
        })
        const data = await schema.validateAsync(req.body)
        const password = generateRandomPassword()
        //hash password
        data.password = sha1(password)
        data.token = sha1(new Date().toUTCString())
        const [createPromo, status] = await ModelPromo.findOrCreate({ where: { title: data.title }, defaults: data })
        if (status) message = "Account created successfully"
        else message = "Promo with this name already exists"
        //if newly created then send email
        if (status) {
            //sending email
            const body = {
                email: data.email,
                firstName: data.firstName,
                password: password
            }
            console.log(password)
            EmailService.sendPromoProgramWelcomeEmail(body)
        }
        res.json(utils.JParser(message, status, createPromo));
    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});

//promo reset password
exports.promoPasswordReset = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;
    let message = "Password reset"
    try {
        //console.log(req.body)
        const schema = Joi.object({
            email: Joi.string().email({ minDomainSegments: 2 }).required(),
        })
        const data = await schema.validateAsync(req.body)
        const promo = await ModelPromo.findOne({ where: { email: data.email } })
        if (promo) message = "Password reset successfully"
        else message = "Unable to reset password, Invalid email"
        //if promo found, reset password
        if (promo) {
            //new password
            const pwd = utils.AsciiCodes(8)
            //sending email
            await promo.update({ password: sha1(pwd), token: sha1(new Date().toUTCString()) })
            EmailService.sendPasswordReset(promo.email, pwd)
        }
        res.json(utils.JParser(message, !!promo, null));
    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});

//promo update password
exports.promoPasswordUpdate = useAsync(async (req, res, next) => {
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
            const promo = await ModelPromo.findOne({
                where: {
                    email: data.email,
                    password: data.passwordOld
                }
            })
            //if newly created then send email
            if (promo) {
                //update password
                await promo.update({ password: data?.password1 })
                //sending email
                EmailService.sendPasswordNotifications(promo.email)
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

// Get all parents
exports.GetAllPromoParents = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;
    try {
        const parents = await ModelPromoParent.findAll({
            where: { promoId: session.id },
            include: [
                {
                    model: ModelPromoChild,
                    as: "children",
                    required: false,
                    include: [
                        {
                            model: ModelPromoProgram,
                            as: "programs",
                            required: false,
                            include: [
                                {
                                    model: ModelCohort,
                                    as: "promo_cohort",
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
exports.PromoCohortGetAll = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;
    try {

        const parents = await ModelPromoParent.findAll({
            where: { promoId: session.id },
            include: [
                {
                    model: ModelPromoChild,
                    as: "children",
                    required: false
                }
            ]
        })

        const programs = await ModelPromoProgram.findAll({
            where: { promoId: session.id },
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

        const activeStudent = programs.filter((program) => program.isPaid && !program.isCompleted).length;
        const inActiveStudent = programs.filter((program) => !program.isPaid).length;
        const totalStudent = parents.reduce((total, parent) => total + parent.children.length, 0);
        const data = { programs, totalStudent, activeStudent, inActiveStudent }
        res.json(utils.JParser("fetched successfully", !!programs, data));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// Get PROMO cohort by id
exports.PromoCohortGetByID = useAsync(async (req, res, next) => {
    const { id } = req.params;
    try {
        const cohort = await ModelCohort.findOne({
            where: { isVisible: { [Op.in]: [0, 3] }, id: id },
            include: {
                model: ModelPromoProgram, as: "promo_programs", required: false,
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
                    },
                    {
                        model: ModelPackage,
                        as: "promo_package",
                        required: true
                    },
                    { model: ModelTeacher, as: 'promo_teacher' },

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
exports.promoGetParentById = useAsync(async (req, res, next) => {
    try {
        const { id, cid } = req.params;
        const cohort = await ModelCohort.findOne({ where: { id: cid } })
        const parent = await ModelPromoParent.findOne({
            where: { id: id },
            include: [
                {
                    model: ModelPromoChild,
                    as: "children",
                    required: false,
                    include: [
                        {
                            model: ModelPromoProgram,
                            as: "programs",
                            required: false,
                            include: [
                                {
                                    model: ModelCohort,
                                    as: "promo_cohort",
                                    required: true
                                },
                                {
                                    model: ModelPackage,
                                    as: "promo_package",
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


// Disable promo
exports.promoDisableParent = useAsync(async (req, res, next) => {
    try {
        const { id } = req.params;
        const parent = await ModelPromoParent.findByPk(id);
        if (!parent) {
            res.status(400).json(utils.JParser("Parent not found", false, []));
        }

        parent.status = false;
        await parent.save();

        res.json(utils.JParser("Parent updated successfully", !!parent, parent));
    } catch (e) {
        console.log(e.message)
        throw new errorHandle(e.message, 500);
    }
});


// Enable partner
exports.promoEnableParent = useAsync(async (req, res, next) => {
    try {
        const { id } = req.params;
        const parent = await ModelPromoParent.findByPk(id);
        if (!parent) {
            res.status(400).json(utils.JParser("Parent not found", false, []));
        }

        parent.status = true;
        await parent.save();

        res.json(utils.JParser("Parent updated successfully", !!parent, parent));
    } catch (e) {
        console.log(e.message)
        throw new errorHandle(e.message, 500);
    }
});

////////////////////////////////////////////////////////////////////////////////
/**PARENT */
////////////////////////////////////////////////////////////////////////////////

//parent login
exports.promoParentLogin = useAsync(async (req, res, next) => {
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
        const parent = await ModelPromoParent.findOne({ where: data })
        if (parent) {
            const promo = await ModelPromo.findOne({ where: { id: parent.promoId } })
            await parent.update({ token: sha1(new Date().toUTCString()) })
            await parent.reload()
            const promoData = {
                firstName: promo.firstName,
                lastName: promo.lastName,
                title: promo.title,
                id: promo.id,
            }

            if (!parent.status) {
                return res.status(400).json(utils.JParser("Welcome " + parent.firstName + " " + parent.lastName + ", Your account have been disable, contact your cooperation for support", false, false));
            }

            if (!promo.status) {
                return res.status(400).json(utils.JParser("Welcome " + parent.firstName + " " + parent.lastName + ", Your account have been disable, contact your cooperation for support", false, false));
            }

            parent.password = "**********************"

            res.json(utils.JParser("Login successful", !!parent, { parent, promoData }));
        } else {
            res.json(utils.JParser("Invalid email / password", !!parent, []));
        }
    } catch (e) {
        throw new errorHandle(e.message, 400);
    }

});

//parent register
exports.promoParentRegister = useAsync(async (req, res, next) => {
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
            survey: Joi.string().min(3).required(),
            timezone: Joi.string().required(),
            promoId: Joi.number().required(),
            additionalFields: Joi.object().optional(),
        })
        const data = await schema.validateAsync(req.body)

        //get time offset before create
        //timeOffset: Joi.number().required()
        data.timeOffset = await utils.getTimeOffsetByZone(data.timezone)
        //hash password
        data.password = sha1(data.password)
        data.token = sha1(new Date().toUTCString())

        const [createParent, status] = await ModelPromoParent.findOrCreate({ where: { email: data.email }, defaults: data })
        if (status) message = "Account created successfully"
        else message = "Account with this email already exists"
        //if newly created then send email
        if (status) {
            //sending email
            EmailService.sendParentPromoWelcomeEmail(data)
        }
        res.json(utils.JParser(message, !!createParent, createParent));
    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});

//parent update
exports.promoParentUpdate = useAsync(async (req, res, next) => {
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
            survey: Joi.string().min(3),
            timeOffset: Joi.number(),
            privacyMode: Joi.bool(),
        })
        const data = await schema.validateAsync(req.body)
        const parent = await ModelPromoParent.findOne({
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
exports.promoParentPasswordReset = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;
    let message = "Password reset"
    try {
        //console.log(req.body)
        const schema = Joi.object({
            email: Joi.string().email({ minDomainSegments: 2 }).required(),
        })
        const data = await schema.validateAsync(req.body)
        const parent = await ModelPromoParent.findOne({ where: { email: data.email } })
        if (parent) message = "Password reset successfully"
        else message = "Unable to reset password, Invalid email"
        //if parent found, reset password
        if (parent) {
            //new password
            const pwd = utils.AsciiCodes(8)
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
exports.promoParentPasswordUpdate = useAsync(async (req, res, next) => {
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
            const parent = await ModelPromoParent.findOne({
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
exports.promoParentAddChild = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;
    let message = ""
    try {
        //console.log(req.body)
        const schema = Joi.object({
            firstName: Joi.string().min(1).required(),
            lastName: Joi.string().min(1).required(),
            age: Joi.number().required().min(5).max(16),
            gender: Joi.string().min(1).required(),
        })
        const data = await schema.validateAsync(req.body)
        //add parent id
        data.parentId = session.id

        const [createChild, status] = await ModelPromoChild.findOrCreate({ where: data, defaults: data })
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
    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});

//parent add child with id
exports.promoParentAddChildWithId = useAsync(async (req, res, next) => {
    const { id } = req.params
    let message = ""
    try {
        //console.log(req.body)
        const schema = Joi.object({
            firstName: Joi.string().min(1).required(),
            lastName: Joi.string().min(1).required(),
            age: Joi.number().required().min(5).max(16),
            gender: Joi.string().min(1).required(),
        })
        const data = await schema.validateAsync(req.body)
        //add parent id
        data.parentId = id

        const [createChild, status] = await ModelPromoChild.findOrCreate({ where: data, defaults: data })
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
    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});

// exports.promoParentCreateProgramsForChildrenWithoutProgram = useAsync(async (req, res, next) => {
//     // const session = req.app.locals.session;
//     let message = ""
//     try {
//         // Step 1: Get all children of the current parent
//         const children = await ModelPromoChild.findAll();

//         // Step 2: Loop through each child and check if they have a program
//         for (const child of children) {
//             const existingProgram = await ModelPromoProgram.findOne({
//                 where: { childId: child.id }
//             });

//             // Step 3: If no program exists for this child, create one
//             if (!existingProgram) {
//                 const newProgramData = {
//                     childId: child.id,
//                     promoId: 3, // Assuming promoId is passed as a param
//                     timeGroupId: 7, // Provide default or required value here
//                     timeGroupIndex: 0, // Provide default or required value here
//                     level: 1, // Default level (or can be derived from the child)
//                     timeOffset: 1, // Provide default or required value here
//                     packageId: 0, // Default or required value here
//                 };

//                 const newProgram = await ModelPromoProgram.create(newProgramData);

//                 // Step 4: If program creation is successful, send an email notification
//                 // if (newProgram) {
//                 //     // Send notification email about new program
//                 //     EmailService.sendPromoParentNewProgram(session.email, child);
//                 // }
//                 console.log("created new "+ newProgram.id)
//             }
//         }

//         message = "Programs created for all children without a program.";

//         // Step 5: Return a response indicating success
//         res.json(utils.JParser(message, true, null));

//     } catch (e) {
//         throw new errorHandle(e.message, 400);
//     }
// });

// exports.updatePromoProgramsTimeGroupIndex = useAsync(async (req, res, next) => {
//     const session = req.app.locals.session;
//     const numbers = [
//         478, 479, 480, 481, 482, 483, 484, 485,
//         486, 487, 488, 489, 490, 491, 492, 493, 494, 495, 496, 497, 498,
//         499, 500, 501, 502, 503, 504, 505, 506, 507, 508, 509, 510, 511,
//         512, 513, 514, 515, 516, 517, 518, 519, 520, 521, 522, 523, 524,
//         525, 526, 527, 528, 529, 530, 531, 532, 533, 534
//     ];

//     let message = "";
//     try {
//         // Step 1: Update the timeGroupIndex for all promo programs matching the provided numbers
//         const [updatedCount] = await ModelPromoProgram.update(
//             { timeGroupIndex: 10 },  // The field to update
//             { where: { id: numbers } } // Filter the programs by the provided ids
//         );

//         // Step 2: Check if any rows were updated
//         if (updatedCount > 0) {
//             message = `${updatedCount} promo programs updated successfully.`;
//         } else {
//             message = "No promo programs found to update.";
//         }

//         // Step 3: Return a response indicating success or failure
//         res.json(utils.JParser(message, updatedCount > 0, null));
//     } catch (e) {
//         // Error handling
//         throw new errorHandle(e.message, 400);
//     }
// });


//parent get dashboard data
exports.promoParentGetDashboardData = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;
    let message = ""
    try {
        let allChild = await ModelPromoChild.findAll({
            where: { parentId: session.id },
            include: [
                {
                    model: ModelPromoProgram, as: "programs",
                    include: [
                        {
                            model: ModelTeacher,
                            as: "promo_teacher",
                            required: false
                        },
                    ]
                },
            ],
        })
        const parent = await ModelPromoParent.findOne({
            where: { id: session.id },
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

        res.json(utils.JParser(message, !!allChild, { children, allPrograms, totalChild, allOngoingClass, completedPrograms, isMigrated:parent.isMigrated }));
    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});

//parent add program
exports.promoParentAddProgram = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;
    let message = ""
    try {
        const schema = Joi.object({
            childId: Joi.number(),
            // packageId: Joi.number().required(),
            timeGroupId: Joi.number().required(),
            timeGroupIndex: Joi.number().required(),
            level: Joi.number().required(),
            timeOffset: Joi.number().required(),
            // cohortId: Joi.number().optional(),
        })
        const data = await schema.validateAsync(req.body)
        data.childId = parseInt(req.params.id)
        data.promoId = req.params.pid
        data.packageId = 0
        const child = await ModelPromoChild.findByPk(data.childId)
        const program = await ModelPromoProgram.findOne({ where: data })

        if (child && !program) {
            const addNewProgram = await ModelPromoProgram.create(data)
            //if added send email
            if (addNewProgram) {
                //sending a notification email
                EmailService.sendPromoParentNewProgram(session.email, child)
            }
            res.json(utils.JParser(message, !!addNewProgram, addNewProgram));
        } else {
            res.json(utils.JParser("Unable to add a new program, similar program does exist", false, null));
        }
    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});


//parent add program with id
exports.promoParentAddProgramWithId = useAsync(async (req, res, next) => {
    const ppid = req.params.ppid
    const option = { where: { id: ppid } };
    const parent = await ModelPromoParent.findOne(option)
    let message = ""
    try {
        const schema = Joi.object({
            childId: Joi.number(),
            // packageId: Joi.number().required(),
            timeGroupId: Joi.number().required(),
            timeGroupIndex: Joi.number().required(),
            level: Joi.number().required(),
            timeOffset: Joi.number().required(),
            // cohortId: Joi.number().optional(),
        })
        const data = await schema.validateAsync(req.body)
        data.childId = parseInt(req.params.id)
        data.promoId = req.params.pid
        data.packageId = 0
        const child = await ModelPromoChild.findByPk(data.childId)
        const program = await ModelPromoProgram.findOne({ where: data })
        if (child && !program) {
            const addNewProgram = await ModelPromoProgram.create(data)
            //if added send email
            if (addNewProgram && parent) {
                //sending a notification email
                EmailService.sendPromoParentNewProgram(parent.email, child)
            }
            res.json(utils.JParser(message, !!addNewProgram, addNewProgram));
        } else {
            res.json(utils.JParser("Unable to add a new program, similar program does exist", false, null));
        }
    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});

// Get all timetables
exports.getAllPromoTimeTable = useAsync(async (req, res, next) => {
    try {
        const { continent, timezone } = req.params
        const parentTimeZone = continent + "/" + timezone
        const session = req.app.locals.session;
        const option = { where: { id: session.promoId } }
        const promo = await ModelPromo.findOne(option)
        const lessonTimezone = 'Africa/Lagos';
        if (promo) {
            const slot = promo.slot
            const timeGroupId = promo.timeGroupId
            const programs = await ModelPromoProgram.findAll({ where: { timeGroupId, promoId: promo.id } })

            const slotChilds = countTimeGroupIndexes(programs);
            console.log(slotChilds)
            const timeTable = await ModelTimeGroup.findOne({ where: { id: timeGroupId } })
            const convertedTimes = Array.isArray(timeTable.times)
                ? convertLessonTimes(timeTable.times, lessonTimezone, parentTimeZone)
                : convertLessonTimes(JSON.parse(timeTable.times), lessonTimezone, parentTimeZone);

            timeTable.times = convertedTimes
            res.json(utils.JParser("Programs timetable retrieved successfully", !!timeTable, { timeTable, slot, slotChilds }));
        } else {
            res.json(utils.JParser("Unable to fetch time group", false, []));
        }
    } catch (e) {
        console.log(e)
        throw new errorHandle(e.message, 500);
    }
});

// Get all timetables
exports.getAllPromoTimeTableWithId = useAsync(async (req, res, next) => {
    try {
        const { id, continent, timezone } = req.params
        const parentTimeZone = continent + "/" + timezone
        const option = { where: { id } }
        const promo = await ModelPromo.findOne(option)
        const lessonTimezone = 'Africa/Lagos';
        if (promo) {
            const slot = promo.slot
            const timeGroupId = promo.timeGroupId
            const programs = await ModelPromoProgram.findAll({ where: { timeGroupId, promoId: promo.id } })
            const slotChilds = countTimeGroupIndexes(programs);
            const timeTable = await ModelTimeGroup.findOne({ where: { id: timeGroupId } })
            const convertedTimes = Array.isArray(timeTable.times)
                ? convertLessonTimes(timeTable.times, lessonTimezone, parentTimeZone)
                : convertLessonTimes(JSON.parse(timeTable.times), lessonTimezone, parentTimeZone);

            timeTable.times = convertedTimes
            res.json(utils.JParser("Programs timetable retrievedd successfully", !!timeTable, { timeTable, slot, slotChilds }));
        } else {
            res.json(utils.JParser("Unable to fetch time group", false, []));
        }
    } catch (e) {
        console.log(e)
        throw new errorHandle(e.message, 500);
    }
});

// Get all timetables
exports.getPromoAdditionalFields = useAsync(async (req, res, next) => {
    try {
        const { id } = req.params
        const option = { where: { id } }
        const promo = await ModelPromo.findOne(option)
        if (promo) {
            const fields = promo.additionalFields
            res.json(utils.JParser("Fields retrieved successfully", !!fields, fields));
        } else {
            res.json(utils.JParser("Invalid link", false, []));
        }
    } catch (e) {
        console.log(e)
        throw new errorHandle(e.message, 500);
    }
});


exports.getPromoStatus = useAsync(async (req, res, next) => {
    try {
        const { id } = req.params
        const option = { where: { id } }
        const promo = await ModelPromo.findOne(option)
        if (promo) {
            res.json(utils.JParser("Promo retrieved successfully", promo.isActive, []));
        }
    } catch (e) {
        console.log(e)
        throw new errorHandle(e.message, 500);
    }
});

exports.checkEmail = useAsync(async (req, res, next) => {
    try {
        const { email } = req.params
        const option = { where: { email } }
        const parent = await ModelPromoParent.findOne(option)
        if (parent) {
            res.json(utils.JParser("Promo retrieved successfully", !!parent, parent));
        }else{
            res.json(utils.JParser("Promo not found", !!parent, []));
        }
    } catch (e) {
        console.log(e)
        throw new errorHandle(e.message, 500);
    }
});

//Parent and Child migration
exports.migratePromoToParent= useAsync(async (req, res, next) => {
    let message = "";
    try {
        // Find promo parent with their children
        const promoParent = await ModelPromoParent.findOne({
            where: { id: req.params.id },
            include: [
                {
                    model: ModelPromoChild,
                    as: "children",
                    required: true,
                }
            ]
        });

        if (!promoParent) {
            throw new errorHandle("Promo parent not found", 404);
        }

        const parentData = {
            email: promoParent.email,
            password: promoParent.password,
            firstName: promoParent.firstName,
            lastName: promoParent.lastName,
            phone: promoParent.phone || "",
            country: promoParent.country,
            state: promoParent.state,
            timezone: promoParent.timezone,
            timeOffset: promoParent.timeOffset,
            token: sha1(new Date().toUTCString())
        };

        console.log(promoParent.children);
        const [newParent, parentCreated] = await ModelParent.findOrCreate({
            where: { email: parentData.email }, 
            defaults: parentData 
        });

        if (!parentCreated) {
            throw new errorHandle("Parent with this email already exists in the normal system", 400);
        }

        // Migrate all children
        if(newParent){
            await promoParent.update({isMigrated:true})
        const migratedChildren = [];
        for (const promoChild of promoParent.children) {
            const childData = {
                parentId: newParent.id, // Link child to the new parent
                firstName: promoChild.firstName,
                lastName: promoChild.lastName,
                age: promoChild.age,
                gender: promoChild.gender,
            };


            const [newChild, childCreated] = await ModelChild.findOrCreate({
                where: {
                    parentId: newParent.id,
                    firstName: childData.firstName,
                    lastName: childData.lastName,
                    age: childData.age,
                    gender: childData.gender,
                },
                defaults: childData,
            });

            if (childCreated) {
                migratedChildren.push(newChild);
            }
        }


        EmailService.sendParentWelcomeEmail(parentData);

        const responseData = {
            parent: newParent,
            children: migratedChildren,
        };
        console.log(responseData)
        message = "Promo parent and children successfully migrated to normal system";
        res.json(utils.JParser(message, true, responseData));
    }else(
        console.log("parent not found")
    )
    // res.json(utils.JParser("message", true, promoParent));
    } catch (e) {
        console.log("new error "+e)
        next(new errorHandle(e.message, e.status || 400));
    }
});
