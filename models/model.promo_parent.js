/**
 * Model for user and admin
 */
const sequelize = require('./../database');
const {DataTypes, Model} = require('sequelize');
const {utils} = require("../core");
const ModelPromoChild = require('./model.promo_child');
const tableName = "v2ryd_promo_parent";
const queryInterface = sequelize.getQueryInterface();

/**
 * Model extending sequelize model class
 */
class ModelPromoParent extends Model {
}

ModelPromoParent.init({
    id: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
    promoId: {type: DataTypes.INTEGER, allowNull: false},
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
    survey: {type: DataTypes.STRING, defaultValue: "Social Media"},
    privacyMode: {type: DataTypes.BOOLEAN, defaultValue: false},
    status: {type: DataTypes.BOOLEAN, defaultValue: true},
    active: {type: DataTypes.BOOLEAN, defaultValue: true},
    isTransfered: {type: DataTypes.BOOLEAN, defaultValue: false},
    isMigrated: {type: DataTypes.BOOLEAN, defaultValue: false},
    additionalFields: {type: DataTypes.JSON, defaultValue: []},
}, {sequelize, tableName, paranoid: true});
/**
 * Run belonging and relationship before sync()
 */

// queryInterface.addColumn(tableName, 'isMigrated', {
//     type: DataTypes.INTEGER, allowNull: false
// });

// queryInterface.addColumn(tableName, 'survey', {
//     type: DataTypes.STRING, defaultValue: "Social Media"
// });

ModelPromoParent.hasMany(ModelPromoChild, {foreignKey: {name: "parentId"}, as: "children", onDelete: 'CASCADE'})
ModelPromoChild.belongsTo(ModelPromoParent, {foreignKey: 'parentId', as: "parent"})

sequelize.sync();
module.exports = ModelPromoParent;

