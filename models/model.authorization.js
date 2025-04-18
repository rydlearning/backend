/**
 * Model for user and admin
 */
const sequelize = require('./../database');
const {DataTypes, Model} = require('sequelize');
const {utils} = require("../core");
const tableName = "v2ryd_authorization";
const ModelTeacher = require("./model.teacher")
/**
 * Model extending sequelize model class
 */
class ModelAuthorization extends Model {
}

ModelAuthorization.init({
    id: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
    teacherId: {type: DataTypes.INTEGER, allowNull: true},
    email: {type: DataTypes.STRING, unique: true},
    isUsed: {type: DataTypes.BOOLEAN, defaultValue: 0},
}, {sequelize, tableName});
/**
 * Run belonging and relationship before sync()
 */
sequelize.sync();
module.exports = ModelAuthorization;
