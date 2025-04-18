/**
 * Model for user and admin
 */
const sequelize = require('./../database');
const {DataTypes, Model} = require('sequelize');
const {utils} = require("../core");
const tableName = "v2ryd_migration";
/**
 * Model extending sequelize model class
 */
class ModelMigration extends Model {
}

ModelMigration.init({
    id: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
    promoId: {type: DataTypes.INTEGER},
    status: {type: DataTypes.BOOLEAN, defaultValue: false},
}, {sequelize, tableName});
/**
 * Run belonging and relationship before sync()
 */

sequelize.sync();
module.exports = ModelMigration;
