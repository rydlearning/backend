/**
 * Model for user and admin
 */
const sequelize = require('./../database');
const {DataTypes, Model} = require('sequelize');
const {utils} = require("../core");
const tableName = "v2ryd_parent";
const queryInterface = sequelize.getQueryInterface();
const ModelChild = require("./model.child");
const ModelTestimonial = require('./model.testimonial');

/**
 * Model extending sequelize model class
 */
class ModelParent extends Model {
}

ModelParent.init({
    id: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
    firstName: {type: DataTypes.STRING, allowNull: false},
    lastName: {type: DataTypes.STRING, allowNull: false},
    email: {type: DataTypes.STRING, allowNull: false, unique: true},
    password: {type: DataTypes.STRING, allowNull: false},
    phone: {type: DataTypes.STRING, allowNull: true},
    country: {type: DataTypes.STRING, allowNull: false},
    state: {type: DataTypes.STRING, allowNull: false},
    timezone: {type: DataTypes.STRING, allowNull: true},
    timeOffset: {type: DataTypes.INTEGER, allowNull: false},
    token: {type: DataTypes.STRING, unique: true},
    privacyMode: {type: DataTypes.BOOLEAN, defaultValue: false},
    isExternal: {type: DataTypes.INTEGER, defaultValue: 0},
    dnd: {type: DataTypes.INTEGER, defaultValue: 0},
    balance: {type: DataTypes.FLOAT, defaultValue: 0},
    status: {type: DataTypes.BOOLEAN, defaultValue: true},
}, {sequelize, tableName, paranoid: true});
/**
 * Run belonging and relationship before sync()
 */
ModelParent.hasMany(ModelChild, {foreignKey: {name: "parentId"}, as: "children", onDelete: 'CASCADE'})
ModelChild.belongsTo(ModelParent, {foreignKey: 'parentId', as: "parent"})

ModelParent.hasMany(ModelTestimonial, {foreignKey: {name: "parentId", allowNull: true}, as: "testimonial"})
ModelTestimonial.belongsTo(ModelParent, {foreignKey: {name: "parentId", allowNull: true}, as: "parent"})

// queryInterface.addColumn(tableName, 'dnd', {
//     type: DataTypes.INTEGER, defaultValue: 0
// });


sequelize.sync({});
module.exports = ModelParent;
