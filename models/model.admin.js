/**
 * Model for user and admin
 */
const sequelize = require('./../database');
const {DataTypes, Model} = require('sequelize');
const {utils} = require("../core");
const tableName = "v2ryd_admin";

/**
 * Model extending sequelize model class
 */
class ModelAdmin extends Model {
}

ModelAdmin.init({
    id: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
    fullName: {type: DataTypes.STRING, allowNull: false},
    email: {type: DataTypes.STRING, allowNull: false, unique: true},
    password: {type: DataTypes.STRING, allowNull: false},
    displayName: {type: DataTypes.STRING, allowNull: false},
    role: {type: DataTypes.INTEGER, defaultValue: 1, allowNull: false},
    token: {type: DataTypes.STRING, unique: true},
}, {sequelize, tableName, paranoid: true});
/**
 * Run belonging and relationship before sync()
 */
sequelize.sync();

module.exports = ModelAdmin;
