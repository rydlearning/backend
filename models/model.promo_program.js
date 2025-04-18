/**
 * Model for user and admin
 */
const sequelize = require('../database');
const {DataTypes, Model} = require('sequelize');
const {utils} = require("../core");
const tableName = "v2ryd_promo_program";
const queryInterface = sequelize.getQueryInterface();

/**
 * Model extending sequelize model class
 */
class ModelPromoProgram extends Model {
}

ModelPromoProgram.init({
    id: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
    childId: {type: DataTypes.INTEGER, allowNull: false},
    promoId: {type: DataTypes.INTEGER, allowNull: false},
    teacherId: {type: DataTypes.INTEGER, allowNull: true},
    packageId: {type: DataTypes.INTEGER, allowNull: false},
    cohortId: {type: DataTypes.INTEGER, allowNull: true},
    couponId: {type: DataTypes.INTEGER, allowNull: true},
    mediaUrl: {type: DataTypes.TEXT, allowNull: true},
    assessmentUrl: {type: DataTypes.TEXT, allowNull: true},
    level: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 1},
    time: {type: DataTypes.INTEGER, allowNull: true},
    day: {type: DataTypes.STRING, allowNull: true},
    timeOffset: {type: DataTypes.INTEGER, allowNull: false},
    trxId: {type: DataTypes.STRING, allowNull: true},
    nextClassDate: {type: DataTypes.DATE, allowNull: true},
    endClassDate: {type: DataTypes.DATE, allowNull: true},
    isCompleted: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
    isPaid: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
    status: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true},
    timeGroupId: {type: DataTypes.INTEGER, allowNull: true},
    timeGroupIndex: {type: DataTypes.INTEGER, allowNull: true},
}, {sequelize, tableName, paranoid: true});
/**
 * Run belonging and relationship before sync()
 */

// queryInterface.addColumn(tableName, 'day', {type: DataTypes.STRING, allowNull: true});

// queryInterface.addColumn(tableName, 'timeGroupIndex', {
//     type: DataTypes.INTEGER, allowNull: true
// });

// queryInterface.removeColumn('v2ryd_promo_program', 'day');

sequelize.sync();
module.exports = ModelPromoProgram;
