/**
 * Model for user and admin
 */
const sequelize = require('./../database');
const {DataTypes, Model} = require('sequelize');
const {utils} = require("../core");
const tableName = "v2ryd_swap";
const ModelTeacher = require ("./model.teacher")
const ModelProgram = require ("./model.program")

/**
 * Model extending sequelize model class
 */
class ModelSwap extends Model {
}

ModelSwap.init({
    id: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
    fromTeacherId: {type: DataTypes.INTEGER, allowNull: false},
    toTeacherId: {type: DataTypes.INTEGER, allowNull: false},
    programId: {type: DataTypes.INTEGER, allowNull: false},
    body: {type: DataTypes.STRING, allowNull: false},
    status: {type: DataTypes.BOOLEAN, defaultValue: false},
}, {sequelize, tableName, paranoid: true});
/**
 * Run belonging and relationship before sync()
 */

ModelSwap.belongsTo(ModelTeacher, {foreignKey: {name: "fromTeacherId"}, as: "fromTeacher"})
ModelSwap.belongsTo(ModelTeacher, {foreignKey: {name: "toTeacherId"}, as: "toTeacher"})
ModelSwap.belongsTo(ModelProgram, {foreignKey: {name: "programId"}, as: "program"})
sequelize.sync();
module.exports = ModelSwap;
