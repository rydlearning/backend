/**
 * Model for user and admin
 */
const sequelize = require('./../database');
const {DataTypes, Model} = require('sequelize');
const {utils} = require("../core");
const tableName = "v2ryd_attendance";
const ModelProgram = require ("./model.program")

/**
 * Model extending sequelize model class
 */
class ModelAttendance extends Model {
}

ModelAttendance.init({
    id: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
    programId: {type: DataTypes.INTEGER, allowNull: false},
    score: {type: DataTypes.INTEGER, allowNull: false},
    status: {type: DataTypes.BOOLEAN, defaultValue: true},
}, {sequelize, tableName, paranoid: true});
/**
 * Run belonging and relationship before sync()
 */
ModelProgram.hasMany(ModelAttendance, {foreignKey: {name: "programId", allowNull: true}, as: "attendance"})
sequelize.sync();
module.exports = ModelAttendance;

