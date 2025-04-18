/**
 * Model for user and admin
 */
const sequelize = require('./../database');
const {DataTypes, Model} = require('sequelize');
const {utils} = require("../core");
const tableName = "v2ryd_teacher";
const ModelProgram = require ("./model.program")
const ModelAuthorization = require("./model.authorization");
const ModelPartnerProgram = require('./model.partner_program');
const ModelPromoProgram = require('./model.promo_program');

/**
 * Model extending sequelize model class
 */
class ModelTeacher extends Model {
}

ModelTeacher.init({
    id: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
    firstName: {type: DataTypes.STRING, allowNull: false},
    lastName: {type: DataTypes.STRING, allowNull: false},
    email: {type: DataTypes.STRING, allowNull: false, unique:true},
    password: {type: DataTypes.STRING, allowNull: false},
    gender: {type: DataTypes.STRING, allowNull: false},
    phone: {type: DataTypes.STRING, allowNull: false},
    country: {type: DataTypes.STRING, allowNull: false},
    timezone: {type: DataTypes.STRING, allowNull: false},
    timeOffset: {type: DataTypes.STRING, allowNull: false},
    classLink: {type: DataTypes.STRING, allowNull: true},
    qualification: {type: DataTypes.STRING, allowNull: false},
    experience: {type: DataTypes.STRING, allowNull: true},
    docUrl: {type: DataTypes.TEXT, allowNull: false},
    status: {type: DataTypes.BOOLEAN, defaultValue: true},
    token: {type: DataTypes.STRING, unique: true},
}, {sequelize, tableName, paranoid: true});
/**
 * Run belonging and relationship before sync()
 */
ModelTeacher.hasMany(ModelProgram, {foreignKey: {name: "teacherId", allowNull: true}, as: "programs"})
ModelProgram.belongsTo(ModelTeacher, {foreignKey: 'teacherId', as: "teacher"})
ModelTeacher.hasMany(ModelAuthorization, {foreignKey: {name: "teacherId", allowNull: true}, as: "teacher"})

ModelTeacher.hasMany(ModelPartnerProgram, {foreignKey: {name: "teacherId", allowNull: true}, as: "parner_programs"})
ModelPartnerProgram.belongsTo(ModelTeacher, {foreignKey: 'teacherId', as: "partner_teacher"})

ModelTeacher.hasMany(ModelPromoProgram, {foreignKey: {name: "teacherId", allowNull: true}, as: "promo_programs"})
ModelPromoProgram.belongsTo(ModelTeacher, {foreignKey: 'teacherId', as: "promo_teacher"})

sequelize.sync();
module.exports = ModelTeacher;
