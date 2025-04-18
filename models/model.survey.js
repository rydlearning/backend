/**
 * Model for user and admin
 */
const sequelize = require('./../database');
const {DataTypes, Model} = require('sequelize');
const {utils} = require("../core");
const tableName = "v2ryd_survey";
/**
 * Model extending sequelize model class
 */
class ModelSurvey extends Model {
}

ModelSurvey.init({
    id: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
    title: {type: DataTypes.STRING, allowNull: false},
    body: {type: DataTypes.TEXT, allowNull: false},
    pText: {type: DataTypes.STRING, allowNull: false, defaultValue: "YES"},
    nText: {type: DataTypes.STRING, allowNull: false, defaultValue: "NO"},
    status: {type: DataTypes.BOOLEAN, defaultValue: false},
}, {sequelize, tableName});
/**
 * Run belonging and relationship before sync()
 */

sequelize.sync();
module.exports = ModelSurvey;
