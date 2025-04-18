/**
 * Model for user and admin
 */
const sequelize = require('./../database');
const {DataTypes, Model} = require('sequelize');
const {utils} = require("../core");
const tableName = "v2ryd_package";

const ModelProgram = require("./model.program");
const ModelPartnerProgram = require('./model.partner_program');
const ModelTimeGroup = require("./model.timegroup");
const ModelPromoProgram = require('./model.promo_program');
const queryInterface = sequelize.getQueryInterface();
/**
 * Model extending sequelize model class
 */
class ModelPackage extends Model {
}

ModelPackage.init({
    id: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
    title: {type: DataTypes.STRING, allowNull: false},
    name: {type: DataTypes.STRING, allowNull: false},
    description: {type: DataTypes.STRING, allowNull: false},
    level: {type: DataTypes.INTEGER, defaultValue: 1},
    timeGroupId: {type: DataTypes.INTEGER, allowNull: true},
    subClass: {type: DataTypes.JSON, defaultValue: []},
    imageUrl: {type: DataTypes.TEXT, allowNull: true},
    weekDuration: {type: DataTypes.INTEGER, allowNull: true, defaultValue: 8},
    amount: {type: DataTypes.INTEGER, allowNull: false},
    altAmount: {type: DataTypes.INTEGER, allowNull: false},
    minAge: {type: DataTypes.INTEGER, allowNull: false},
    maxAge: {type: DataTypes.INTEGER, allowNull: false},
    status: {type: DataTypes.BOOLEAN, defaultValue: true},
}, {sequelize, tableName, paranoid: true});
/**
 * Run belonging and relationship before sync()
 */

// queryInterface.addColumn(tableName, 'name',
//     {type: DataTypes.STRING, allowNull: false}
//     );

ModelProgram.belongsTo(ModelPackage, {foreignKey: {name: "packageId"}, as: "package"})
ModelPartnerProgram.belongsTo(ModelPackage, {foreignKey: {name: "packageId"}, as: "partner_package"})
// ModelPromoProgram.belongsTo(ModelPackage, {foreignKey: {name: "packageId"}, as: "promo_package"})

ModelPackage.belongsTo(ModelTimeGroup, {foreignKey: {name: "timeGroupId", allowNull: true}, as: "timeGroup"})

sequelize.sync();

module.exports = ModelPackage;
