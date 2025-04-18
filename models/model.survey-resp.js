/**
 * Model for user and admin
 */
const sequelize = require('./../database');
const {DataTypes, Model} = require('sequelize');
const {utils} = require("../core");
const tableName = "v2ryd_survey_resp";
/**
 * Model extending sequelize model class
 */
const ModelParent = require("./model.parent")
const ModelSurvey = require("./model.survey")

class ModelSurveyResp extends Model {
}

ModelSurveyResp.init({
    id: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
    surveyId: {type: DataTypes.INTEGER, allowNull: false},
    parentId: {type: DataTypes.INTEGER, allowNull: false},
    response: {type: DataTypes.BOOLEAN, allowNull: false},
}, {sequelize, tableName});
/**
 * Run belonging and relationship before sync()
 */
ModelSurveyResp.belongsTo(ModelSurvey, {foreignKey: {name: "surveyId"}, as: "survey"})
ModelSurvey.hasMany(ModelSurveyResp, {foreignKey: {name: "surveyId"}, as: "responses"})
ModelSurvey.hasMany(ModelSurveyResp, {foreignKey: {name: "surveyId"}, as: "positiveResponses", scope: {response: true}})
ModelSurvey.hasMany(ModelSurveyResp, {foreignKey: {name: "surveyId"}, as: "negativeResponses", scope: {response: false}})
ModelParent.hasOne(ModelSurveyResp, {foreignKey: {name: "parentId"}, as: "response"})
ModelSurveyResp.belongsTo(ModelParent, {foreignKey: {name: "parentId"}, as: "parent"})

sequelize.sync();
module.exports = ModelSurveyResp;
