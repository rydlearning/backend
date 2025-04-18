/**
 * Slantapp code and properties {www.slantapp.io}
 */
const {errorHandle} = require('../core');
const ModelPartner = require('../models/model.partner');
const {ModelAdmin, ModelTeacher, ModelParent, ModelPartnerParent, ModelPromo, ModelPromoParent} = require("./../models")

//body safe state
exports.bodyParser = (req, res, next) => {
    Promise.resolve().then(() => {
        if (!Object.keys(req.body).length > 0) throw new errorHandle("the document body is empty", 202);
        else next();
    }).catch(next)
}

//body safe state for admin
exports.adminBodyGuard = (req, res, next) => {
    Promise.resolve().then(async () => {
        const token = req.headers['authorization']?.split(" ")[1];
        if (!token) throw new errorHandle("Provide an authorization token and try again", 401)
        //find the admin for live data
        const findAdmin = await ModelAdmin.findOne({where: {token: token}})
        //pass data
        req.app.locals.session = (findAdmin) ? findAdmin.get({plain: true}) : null
        //console.log(findAdmin.role)
        //check if the admin has role for full right
        if (findAdmin && findAdmin.role === 1) next()
        else if (findAdmin && findAdmin.role === 2 && req.method === "GET") next()
        else throw new errorHandle("Protected route, use valid token", 401)
    }).catch(next)
}

//body safe state for parents
exports.parentBodyGuard = (req, res, next) => {
    Promise.resolve().then(async () => {
        const token = req.headers['authorization']?.split(" ")[1];
        if (!token) throw new errorHandle("Provide an authorization token and try again", 401)
        //find the admin for live data
        const findParent = await ModelParent.findOne({where: {token: token}})
        //pass data
        req.app.locals.session = findParent
        if (findParent) next()
        else throw new errorHandle("Protected route, use valid token", 401)
    }).catch(next)
}

//body safe state for parents
exports.partnerBodyGuard = (req, res, next) => {
    Promise.resolve().then(async () => {
        const token = req.headers['authorization']?.split(" ")[1];
        if (!token) throw new errorHandle("Provide an authorization token and try again", 401)
        //find the admin for live data
        const findPartner = await ModelPartner.findOne({where: {token: token}})
        //pass data
        req.app.locals.session = findPartner
        if (findPartner) next()
        else throw new errorHandle("Protected route, use valid tokenp", 401)
    }).catch(next)
}

//body safe state for parents
exports.partnerParentBodyGuard = (req, res, next) => {
    Promise.resolve().then(async () => {
        const token = req.headers['authorization']?.split(" ")[1];
        if (!token) throw new errorHandle("Provide an authorization token and try again", 401)
        //find the admin for live data
        const findParent = await ModelPartnerParent.findOne({where: {token: token}})
        //pass data
        req.app.locals.session = findParent
        if (findParent) next()
        else throw new errorHandle("Protected route, use valid", 401)
    }).catch(next)
}

//body safe state for parents
exports.promoBodyGuard = (req, res, next) => {
    Promise.resolve().then(async () => {
        const token = req.headers['authorization']?.split(" ")[1];
        if (!token) throw new errorHandle("Provide an authorization token and try again", 401)
        //find the admin for live data
        const findPromo = await ModelPromo.findOne({where: {token: token}})
        //pass data
        req.app.locals.session = findPromo
        if (findPromo) next()
        else throw new errorHandle("Protected route, use valid tokenp", 401)
    }).catch(next)
}

//body safe state for parents
exports.promoParentBodyGuard = (req, res, next) => {
    Promise.resolve().then(async () => {
        const token = req.headers['authorization']?.split(" ")[1];
        if (!token) throw new errorHandle("Provide an authorization token and try again", 401)
        //find the admin for live data
        const findParent = await ModelPromoParent.findOne({where: {token: token}})
        //pass data
        req.app.locals.session = findParent
        if (findParent) next()
        else throw new errorHandle("Protected route, use valid", 401)
    }).catch(next)
}

//body safe state for teacher
exports.teacherBodyGuard = (req, res, next) => {
    Promise.resolve().then(async () => {
        const token = req.headers['authorization']?.split(" ")[1];
        if (!token) throw new errorHandle("Provide an authorization token and try again", 401)
        //find the admin for live data
        const findTeacher = await ModelTeacher.findOne({where: {token: token}})
        //pass data
        req.app.locals.session = findTeacher
        if (findTeacher) next()
        else throw new errorHandle("Protected route, use valid token", 401)
    }).catch(next)
}

exports.stripeBodyGuard = (req, res, next) => {
    Promise.resolve().then(async () => {
        //check if is from stripe
        next()
    }).catch(next)
}
