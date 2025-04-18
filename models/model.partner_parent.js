/**
 * Model for user and admin
 */
const sequelize = require('./../database');
const {DataTypes, Model} = require('sequelize');
const {utils} = require("../core");
const ModelPartnerChild = require('./model.partner_child');
const tableName = "v2ryd_partner_parent";
// const queryInterface = sequelize.getQueryInterface();

/**
 * Model extending sequelize model class
 */
class ModelPartnerParent extends Model {
}

ModelPartnerParent.init({
    id: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
    partnerId: {type: DataTypes.INTEGER, allowNull: false},
    firstName: {type: DataTypes.STRING, allowNull: false},
    lastName: {type: DataTypes.STRING, allowNull: false},
    email: {type: DataTypes.STRING, allowNull: false},
    password: {type: DataTypes.STRING, allowNull: false},
    phone: {type: DataTypes.STRING, allowNull: true},
    country: {type: DataTypes.STRING, allowNull: false},
    state: {type: DataTypes.STRING, allowNull: false},
    timezone: {type: DataTypes.STRING, allowNull: true},
    timeOffset: {type: DataTypes.INTEGER, allowNull: false},
    token: {type: DataTypes.STRING, unique: true},
    privacyMode: {type: DataTypes.BOOLEAN, defaultValue: false},
    status: {type: DataTypes.BOOLEAN, defaultValue: true},
    active: {type: DataTypes.BOOLEAN, defaultValue: true},
    isTransfered: {type: DataTypes.BOOLEAN, defaultValue: false},
}, {sequelize, tableName, paranoid: true});
/**
 * Run belonging and relationship before sync()
 */

// queryInterface.addColumn(tableName, 'partnerId', {
//     type: DataTypes.INTEGER, allowNull: false
// });

ModelPartnerParent.hasMany(ModelPartnerChild, {foreignKey: {name: "parentId"}, as: "children", onDelete: 'CASCADE'})
ModelPartnerChild.belongsTo(ModelPartnerParent, {foreignKey: 'parentId', as: "parent"})

sequelize.sync();
module.exports = ModelPartnerParent;

