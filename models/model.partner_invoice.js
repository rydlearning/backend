/**
 * Model for user and admin
 */
const sequelize = require('./../database');
const {DataTypes, Model} = require('sequelize');
const {utils} = require("../core");
const tableName = "v2ryd_partner_invoice";

/**
 * Model extending sequelize model class
 */
class ModelPartnerInvoice extends Model {
}

ModelPartnerInvoice.init({
    id: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
    partnerId: {type: DataTypes.INTEGER, allowNull: false},
    cohortId: {type: DataTypes.INTEGER, allowNull: false},
    date: {type: DataTypes.DATE, allowNull: false},
    amount: {type: DataTypes.INTEGER, allowNull: false},
    status: {type: DataTypes.BOOLEAN, defaultValue: true},
}, {sequelize, tableName, paranoid: true});
/**
 * Run belonging and relationship before sync()
 */
sequelize.sync();

module.exports = ModelPartnerInvoice;
