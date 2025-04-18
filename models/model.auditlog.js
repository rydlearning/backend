/**
 * Model for user and admin
 */
const sequelize = require('./../database');
const {DataTypes, Model} = require('sequelize');
const {utils} = require("../core");
const tableName = "v2ryd_auditlogs";

const ModelAdmin = require("./model.admin")
const {ModelProgram} = require("./index");
/**
 * Model extending sequelize model class
 */
class ModelAuditlog extends Model {
}

ModelAuditlog.init({
    id: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
    adminId: {type: DataTypes.INTEGER, allowNull: false},
    body: {type: DataTypes.TEXT, allowNull: false},
}, {sequelize, tableName, paranoid: true});
/**
 * Run belonging and relationship before sync()
 */
ModelAuditlog.belongsTo(ModelAdmin, {foreignKey: {name: "adminId", allowNull: true}, as: "admin"})
sequelize.sync();
module.exports = ModelAuditlog;
