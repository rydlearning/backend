/**
 * Model for user and admin
 */
const sequelize = require('./../database');
const {DataTypes, Model} = require('sequelize');
const {utils} = require("../core");
const tableName = "v2ryd_partner_program";

/**
 * Model extending sequelize model class
 */
class ModelPartnerProgram extends Model {
}

ModelPartnerProgram.init({
    id: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
    childId: {type: DataTypes.INTEGER, allowNull: false},
    partnerId: {type: DataTypes.INTEGER, allowNull: true},
    teacherId: {type: DataTypes.INTEGER, allowNull: true},
    packageId: {type: DataTypes.INTEGER, allowNull: false},
    cohortId: {type: DataTypes.INTEGER, allowNull: true},
    couponId: {type: DataTypes.INTEGER, allowNull: true},
    mediaUrl: {type: DataTypes.TEXT, allowNull: true},
    assessmentUrl: {type: DataTypes.TEXT, allowNull: true},
    level: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 1},
    time: {type: DataTypes.INTEGER, allowNull: false},
    day: {type: DataTypes.INTEGER, allowNull: false},
    timeOffset: {type: DataTypes.INTEGER, allowNull: false},
    trxId: {type: DataTypes.STRING, allowNull: true},
    nextClassDate: {type: DataTypes.DATE, allowNull: true},
    endClassDate: {type: DataTypes.DATE, allowNull: true},
    isCompleted: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
    isPaid: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
    status: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true},
}, {sequelize, tableName, paranoid: true});
/**
 * Run belonging and relationship before sync()
 */

sequelize.sync();
module.exports = ModelPartnerProgram;
