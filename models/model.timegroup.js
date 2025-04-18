/**
 * Model for user and admin
 */
const sequelize = require('./../database');
const {DataTypes, Model} = require('sequelize');
const {utils} = require("../core");
const ModelPromoProgram = require('./model.promo_program');
const tableName = "v2ryd_timegroup";
/**
 * Model extending sequelize model class
 */
class ModelTimegroup extends Model {
}

ModelTimegroup.init({
    id: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
    title: {type: DataTypes.STRING, allowNull: false},
    times: {type: DataTypes.JSON, allowNull: false}
}, {sequelize, tableName, paranoid: false});
/**
 * Run belonging and relationship before sync()
 */

ModelTimegroup.hasMany(ModelPromoProgram, {foreignKey: {name: "timeGroupId", allowNull: true}, as: "programs"})
ModelPromoProgram.belongsTo(ModelTimegroup, {foreignKey: {name: "timeGroupId", allowNull: true}, as: "timeGroup"})

sequelize.sync();
module.exports = ModelTimegroup;
