/**
 * Model for user and admin
 */
const sequelize = require('./../database');
const {DataTypes, Model} = require('sequelize');
const {utils} = require("../core");
const tableName = "v2ryd_program";
const queryInterface = sequelize.getQueryInterface();

/**
 * Model extending sequelize model class
 */
class ModelProgram extends Model {
}

ModelProgram.init({
    id: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
    childId: {type: DataTypes.INTEGER, allowNull: false},
    teacherId: {type: DataTypes.INTEGER, allowNull: true},
    packageId: {type: DataTypes.INTEGER, allowNull: false},
    cohortId: {type: DataTypes.INTEGER, allowNull: true},
    couponId: {type: DataTypes.INTEGER, allowNull: true},
    mediaUrl: {type: DataTypes.TEXT, allowNull: true},
    assessmentUrl: {type: DataTypes.TEXT, allowNull: true},
    level: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 1},
    curriculum: {type: DataTypes.INTEGER, allowNull: true, defaultValue: 0},
    time: {type: DataTypes.INTEGER, allowNull: false},
    day: {type: DataTypes.INTEGER, allowNull: false},
    timeOffset: {type: DataTypes.INTEGER, allowNull: false},
    trxId: {type: DataTypes.STRING, allowNull: true},
    nextClassDate: {type: DataTypes.DATE, allowNull: true},
    endClassDate: {type: DataTypes.DATE, allowNull: true},
    isCompleted: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
    isPaid: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
    status: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true},
}, {sequelize, tableName, paranoid: true});
/**
 * Run belonging and relationship before sync()
 */

// queryInterface.addColumn(tableName, 'curriculum', {
//     type: DataTypes.INTEGER, allowNull: true, defaultValue: 0
// });

// queryInterface.removeColumn('v2ryd_program', 'curriculum');

sequelize.sync({});
module.exports = ModelProgram;
