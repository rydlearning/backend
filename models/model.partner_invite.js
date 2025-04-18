/**
 * Model for user and admin
 */
const sequelize = require('./../database');
const {DataTypes, Model} = require('sequelize');
const {utils} = require("../core");
const ModelPartnerParent = require('./model.partner_parent');
const tableName = "v2ryd_parent_invite";

/**
 * Model extending sequelize model class
 */
class ModelParentInvite extends Model {
}

ModelParentInvite.init({
    id: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
    partnerId: {type: DataTypes.INTEGER, allowNull: false},
    email: {type: DataTypes.STRING, allowNull: false},
    kidsNum: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    active: {type: DataTypes.BOOLEAN, defaultValue: true},
}, {sequelize, tableName, paranoid: true});
/**
 * Run belonging and relationship before sync()
 */

//ModelParentInvite.hasOne(ModelPartnerParent, {foreignKey: {name: "email"}, as: "parent", onDelete: 'CASCADE'})
//ModelPartnerParent.belongsTo(ModelParentInvite, {foreignKey: 'email', as: "invite"})

sequelize.sync();

module.exports = ModelParentInvite;
