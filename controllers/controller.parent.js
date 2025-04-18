/**
 * Slantapp code and properties {www.slantapp.io}
 */
const sha1 = require('sha1');
const Joi = require('joi');

const EmailService = require("./../services")
const {useAsync, utils, errorHandle,} = require('./../core');
const {
    ModelParent,
    ModelChild,
    ModelProgram,
    ModelPackage,
    ModelTeacher,
    ModelAttendance,
    ModelSurvey,
    ModelSurveyResp, ModelCoupon, ModelCohort
} = require("../models");
const {utc} = require("moment");
const countryData = require("./../models/model.countries")
const {Op} = require("sequelize");
const sequelize = require("sequelize");
//const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

//parent login
exports.parentLogin = useAsync(async (req, res, next) => {
    try {
        //create data if all data available
        const schema = Joi.object({
            email: Joi.string().email({minDomainSegments: 2}).required(),
            password: Joi.string().min(5).required(),
        })
        //validate data
        const data = await schema.validateAsync(req.body)
        //hash password
        data.password = sha1(data.password)
        //capture user data
        const parentFound = await ModelParent.findOne({where: data})
        if (parentFound) await parentFound.update({token: sha1(new Date().toUTCString())})
        if (parentFound) await parentFound.reload()
        res.json(utils.JParser(parentFound ? "Login successful" : "Invalid email / password", !!parentFound, parentFound));
    } catch (e) {
        throw new errorHandle(e.message, 400);
    }

});

//parent register
exports.parentRegister = useAsync(async (req, res, next) => {
    let message = ""
    try {
        //console.log(req.body)
        const schema = Joi.object({
            email: Joi.string().email({minDomainSegments: 2}).required(),
            password: Joi.string().min(5).required(),
            firstName: Joi.string().min(3).required(),
            lastName: Joi.string().min(3).required(),
            phone: Joi.string().min(3).optional().allow(""),
            country: Joi.string().min(3).required(),
            state: Joi.string().min(3).required(),
            timezone: Joi.string().required()
        })
        const data = await schema.validateAsync(req.body)
        //get time offset before create
        //timeOffset: Joi.number().required()
        data.timeOffset = await utils.getTimeOffsetByZone(data.timezone)
        //hash password
        data.password = sha1(data.password)
        data.token = sha1(new Date().toUTCString())
        const [createParent, status] = await ModelParent.findOrCreate({where: {email: data.email}, defaults: data})
        if (status) message = "Account created successfully"
        else message = "Account with this email already exists"
        //if newly created then send email
        if (status) {
            //sending email
            EmailService.sendParentWelcomeEmail(data)
        }
        res.json(utils.JParser(message, status, createParent));
    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});

//parent update
exports.parentUpdate = useAsync(async (req, res, next) => {
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
        const parent = await ModelParent.findOne({
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
            await parent.update({...parent.toJSON(), ...data})
            //sending email
            EmailService.sendNotificationUpdate(parent.email, "Profile update")
        }
        res.json(utils.JParser(message, !!parent, await parent.reload()));
    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});

//parent reset password
exports.parentPasswordReset = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;
    let message = "Password reset"
    try {
        //console.log(req.body)
        const schema = Joi.object({
            email: Joi.string().email({minDomainSegments: 2}).required(),
        })
        const data = await schema.validateAsync(req.body)
        const parent = await ModelParent.findOne({where: {email: data.email}})
        if (parent) message = "Password reset successfully"
        else message = "Unable to reset password, Invalid email"
        //if parent found, reset password
        if (parent) {
            //new password
            const pwd = utils.AsciiCodes(8)
            //sending email
            await parent.update({password: sha1(pwd), token: sha1(new Date().toUTCString())})
            EmailService.sendPasswordReset(parent.email, pwd)
        }
        res.json(utils.JParser(message, !!parent, null));
    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});

//parent update password
exports.parentPasswordUpdate = useAsync(async (req, res, next) => {
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
            const parent = await ModelParent.findOne({
                where: {
                    email: session.email,
                    token: session.token,
                    password: data.passwordOld
                }
            })
            //if newly created then send email
            if (parent) {
                //update password
                await parent.update({password: data?.password1})
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
exports.parentAddChild = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;
    let message = ""
    try {
        //console.log(req.body)
        const schema = Joi.object({
            firstName: Joi.string().min(1).required(),
            lastName: Joi.string().min(1).required(),
            age: Joi.number().required().min(7).max(30),
            gender: Joi.string().min(1).required(),
        })
        const data = await schema.validateAsync(req.body)
        //add parent id
        data.parentId = session.id
        data.curriculum = 1
        const [createChild, status] = await ModelChild.findOrCreate({where: data, defaults: data})
        if (status) message = "New child added successfully"
        else message = "Child with similar details exist"
        //if newly created then send email
        if (status) {
            //sending email
            EmailService.sendNotificationNewChild(session.email, data)
        }
        let tmpChild = await createChild.reload();
        //tmpChild.level = 1
        const objs = tmpChild.get({plain: true})
        if (objs) {
            objs.level = 1
        }
        res.json(utils.JParser(message, status, objs));
    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});

//parent child update
exports.parentChildUpdate = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;
    const {id} = req.params
    let message = ""
    try {
        //console.log(req.body)
        const schema = Joi.object({
            firstName: Joi.string().min(3),
            lastName: Joi.string().min(3),
            age: Joi.number().min(7),
            privacyMode: Joi.bool(),
        })
        const data = await schema.validateAsync(req.body)
        let child = await ModelChild.findOne({
            where: {
                parentId: session.id, id,
            }
        })
        if (child) message = "Child account has been updated successfully"
        else message = "Child account could not update"
        //if newly created then send email
        if (child) {
            //update model
            await child.update({...child.toJSON(), ...data})
            //sending email
            //EmailService.sendNotificationUpdate(parent.email, "Profile update")
            res.json(utils.JParser(message, !!child, await child.reload()));
            return
        }
        res.json(utils.JParser(message, !!child, null));
    } catch (e) {
        console.log(e.message)
        throw new errorHandle(e.message, 400);
    }
});

//parent get child
exports.parentGetAllChild = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;
    let message = ""
    try {
        let allChild = await ModelChild.findAll({
            where: {parentId: session.id},
            include: [
                {model: ModelProgram, as: "programs"},
            ],
        })
        //add levels and sort
        const objs = allChild.map(o => {
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
            return {...o.toJSON(), level: pLevel[0]?.level ? pLevel[0]?.level + 1 : 2, allowNewCohort}
        })
        res.json(utils.JParser(message, !!allChild, objs));
    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});

//parent remove child
exports.parentRemoveChild = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;
    let message = "Child successfully removed"
    try {
        //add parent id and params id
        const data = {}
        data.parentId = session.id
        data.id = req.params.id
        const child = await ModelChild.findOne({
            where: data,
            include: [
                {model: ModelProgram, as: "programs", where: {isPaid: false}, required: true},
            ]})
        if (child) message = "Child removed successfully"
        else message = "Unable to remove child"
        //if deleted then send email
        if (child) {
            //delete and sending email
            await child.destroy()
            EmailService.sendNotificationRemoveChild(session.email, child.toJSON())
        }
        res.json(utils.JParser(message, !!child, null));
    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});

//parent add program
exports.parentAddProgram = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;
    let message = ""
    try {
        const schema = Joi.object({
            childId: Joi.number(),
            packageId: Joi.number().required(),
            time: Joi.number().required(),
            day: Joi.number().required(),
            level: Joi.number().required(),
            timeOffset: Joi.number().required(),
            cohortId: Joi.number().optional(),
        })
        const data = await schema.validateAsync(req.body)
        data.childId = req.params.id
        //data.cohortId = 5;
        //console.log("COHORT", data.cohortId)
        //get child and get package
        const child = await ModelChild.findByPk(data.childId)
        const _package = await ModelPackage.findByPk(data.packageId)
        const program = await ModelProgram.findOne({where: data})
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
            const addNewProgram = await ModelProgram.create(data)
            const _junk = {child, _package, program: addNewProgram.toJSON()}
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

//get parents cart
exports.parentGetCart = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;
    try {
        //get child
        const data = await ModelChild.findAll({
            where: {parentId: session.id},
            include: {
                model: ModelProgram,
                as: "programs",
                where: {isPaid: false},
                include: {model: ModelPackage, as: "package"},
                required: true
            }
        })
        res.json(utils.JParser("Program cart loaded", data.length > 0, data));
    } catch (e) {
        throw new errorHandle(e.message, 202);
    }
});

//get parents cart
exports.parentGetPrograms = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;
    try {
        //get child
        const data = await ModelChild.findAll({
            where: {parentId: session.id},
            include: {
                model: ModelProgram,
                as: "programs",
                where: {isPaid: true},
                include: [
                    {model: ModelPackage, as: "package"}, {
                        model: ModelTeacher,
                        as: "teacher"
                    },
                    {model: ModelAttendance, as: "attendance"},
                    {model: ModelCoupon, as: "coupon"},
                    {model: ModelCohort, as: "cohort"}
                ],
                required: true
            },
            order: [[{model: ModelProgram, as: "programs"}, 'id', 'DESC']]
        })
        //add levels and sort
        const objs = data.map(o => {
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
            return {...o.toJSON(), level: pLevel[0]?.level ? pLevel[0]?.level + 1 : 2, allowNewCohort}
        })
        res.json(utils.JParser("Program programs loaded", data.length > 0, objs));
    } catch (e) {
        throw new errorHandle(e.message, 202);
    }
});

//parent remove from cart
exports.parentRemoveCart = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;
    try {
        //get child
        const data = await ModelProgram.findByPk(req.params.id)
        if (data) {
            await data.destroy()
        }
        res.json(utils.JParser("Program removed successfully", !!data, data));
    } catch (e) {
        throw new errorHandle(e.message, 202);
    }
});

//get currencies
exports.parentGetCurrencies = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;
    try {
        //get parent country and return data
        const data = await utils.getCurrencyRate(session.country)
        res.json(utils.JParser("Currency fetched", !!data, data));
    } catch (e) {
        throw new errorHandle(e.message, 202);
    }
});

//get survey
exports.parentGetSurvey = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;
    try {
        const data = await ModelSurvey.findAll({
            include: [{
                model: ModelSurveyResp,
                as: "responses",
                required: false
            }],
            where: {
                status: true,
                '$responses.parentId$': {[Op.is]: null}
            }
        })
        res.json(utils.JParser("Surveys loaded", !!data, data));
    } catch (e) {
        throw new errorHandle(e.message, 202);
    }
});

//answer survey
exports.parentAnswerSurvey = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;
    const {id} = req.params;
    const {response} = req.body;
    try {
        const data = await ModelSurveyResp.create({
            surveyId: id,
            parentId: session.id,
            response
        })
        res.json(utils.JParser("Survey response received", !!data, data));
    } catch (e) {
        throw new errorHandle(e.message, 202);
    }
});

//get cohort
exports.parentGetCohort = useAsync(async (req, res, next) => {
    try {
        const allActiveTokens = await ModelCohort.findAll({where: {status: true}})
        res.json(utils.JParser("Cohort loaded", !!allActiveTokens, allActiveTokens));
    } catch (e) {
        throw new errorHandle(e.message, 202);
    }
});

//template
exports.parentTemplate = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;
    try {

        res.json(utils.JParser("Packages loaded", !![], []));
    } catch (e) {
        throw new errorHandle(e.message, 202);
    }
});

exports.dndtoggler = useAsync(async (req, res, next) => {
    try {
        const { id } = req.params;
        const parent = await ModelParent.findByPk(id);
        if (!parent) {
            res.status(400).json(utils.JParser("Parent not found", false, []));
        }

        let status;

        if(parent.dnd === 1){
            status = 0;
        }else if(parent.dnd === 0){
            status = 1
        }
console.log(status)
        parent.dnd = status
        await parent.save();

        res.json(utils.JParser("Parent updated successfully", !!parent, parent));
    } catch (e) {
        console.log(e.message)
        throw new errorHandle(e.message, 500);
    }
});

//**************TESTIMONIAL */
exports.testimonial = useAsync(async (req, res, next) => {
    const session = req.app.locals.session;
    try {
        const schema = Joi.object({
            testimonial: Joi.string().min(3),
        })
        const data = await schema.validateAsync(req.body)
        data.parentId = session.id
        const testimonial = await ModelTestimonial.create(data)
        res.json(utils.JParser("Testimonial created successfully", !!testimonial, testimonial));
    } catch (e) {
        throw new errorHandle(e.message, 202);
    }
});

exports.GetChildPrograms = useAsync(async (req, res, next) => {
    try {
        const { id } = req.params
        const options = {
            where: { id },
            include: [
                {
                    model: ModelProgram,
                    as: "programs",
                    required: false,
                    include: [
                        {
                            model: ModelPackage,
                            as: "package",
                            required: true
                        },
                    ]
                },
            ]
        }

        const childDetails = await ModelChild.findOne(options)

        res.json(utils.JParser("Programs retrieved successfully", !!childDetails, childDetails));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});
