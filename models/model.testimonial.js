/**
 * Model for user and admin
 */
const sequelize = require('./../database');
const {DataTypes, Model} = require('sequelize');
const {utils} = require("../core");
const ModelParent = require('./model.parent');
const tableName = "v2ryd_testimonial";
/**
 * Model extending sequelize model class
 */
class ModelTestimonial extends Model {
}

ModelTestimonial.init({
    id: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
    parentId: {type: DataTypes.INTEGER},
    name: {type: DataTypes.STRING},
    country: {type: DataTypes.STRING},
    testimonial: {type: DataTypes.TEXT, allowNull: false},
    status: {type: DataTypes.BOOLEAN, defaultValue: false},
}, {sequelize, tableName});
/**
 * Run belonging and relationship before sync()
 */

sequelize.sync();
module.exports = ModelTestimonial;
