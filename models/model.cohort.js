/**
 * Model for user and admin
 */
const sequelize = require('./../database');
const {DataTypes, Model} = require('sequelize');
const {utils} = require("../core");
const tableName = "v2ryd_cohort";
const queryInterface = sequelize.getQueryInterface();

const ModelProgram = require("./model.program");
const ModelPartnerProgram = require('./model.partner_program');
const ModelPromoProgram = require('./model.promo_program');
/**
 * Model extending sequelize model class
 */
class ModelCohort extends Model {
}

ModelCohort.init({
    id: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
    title: {type: DataTypes.STRING, allowNull: false},
    description: {type: DataTypes.STRING, allowNull: false},
    startDate: {type: DataTypes.DATE, allowNull: false},
    endDate: {type: DataTypes.DATE, allowNull: false},
    isStarted: {type: DataTypes.BOOLEAN, defaultValue: false},
    isVisible: {type: DataTypes.INTEGER, defaultValue: 0},
    status: {type: DataTypes.BOOLEAN, defaultValue: false},
}, {sequelize, tableName, paranoid: true});
/**
 * Run belonging and relationship before sync()
 */

// queryInterface.addColumn(tableName, 'isVisible', {
//     type: DataTypes.INTEGER, defaultValue: 0
// });

ModelCohort.hasMany(ModelProgram, {foreignKey: {name: "cohortId", allowNull: true}, as: "programs"})
ModelProgram.belongsTo(ModelCohort, {foreignKey: {name: "cohortId", allowNull: true}, as: "cohort"})

ModelCohort.hasMany(ModelPartnerProgram, {foreignKey: {name: "cohortId", allowNull: true}, as: "partner_programs"})
ModelPartnerProgram.belongsTo(ModelCohort, {foreignKey: {name: "cohortId", allowNull: true}, as: "partner_cohort"})

// ModelCohort.hasMany(ModelPromoProgram, {foreignKey: {name: "cohortId", allowNull: true}, as: "promo_programs"})
// ModelPromoProgram.belongsTo(ModelCohort, {foreignKey: {name: "cohortId", allowNull: true}, as: "promo_cohort"})

sequelize.sync();
module.exports = ModelCohort;
