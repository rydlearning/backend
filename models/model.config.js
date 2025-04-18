/**
 * Model for user and admin
 */
const sequelize = require('./../database');
const {DataTypes, Model} = require('sequelize');
const {utils} = require("../core");
const tableName = "v2ryd_config";

/**
 * Model extending sequelize model class
 */
class ModelConfig extends Model {
}

ModelConfig.init({
    id: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
    maintenance: {type: DataTypes.BOOLEAN, defaultValue: 0},
    allowRegistration: {type: DataTypes.BOOLEAN, defaultValue: 1},
    allowParentAddChild: {type: DataTypes.BOOLEAN, defaultValue: 1},
}, {sequelize, tableName});
/**
 * Run belonging and relationship before sync()
 */
sequelize.sync();
module.exports = ModelConfig;
