/**
 * Model for user and admin
 */
const sequelize = require('./../database');
const {DataTypes, Model} = require('sequelize');
const {utils} = require("../core");
const tableName = "v2ryd_timetable";
/**
 * Model extending sequelize model class
 */
class ModelTimetable extends Model {
}

ModelTimetable.init({
    id: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
    dayText: {type: DataTypes.STRING, allowNull: false},
    dayAbbr: {type: DataTypes.STRING, allowNull: false},
    day: {type: DataTypes.INTEGER, allowNull: false},
    timex: {type: DataTypes.INTEGER, allowNull: false},
    timeText: {type: DataTypes.STRING, allowNull: false},
}, {sequelize, tableName, paranoid: false, timestamps: false});

// ModelTimetable.init({
//     id: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
//     weekTitle: {type: DataTypes.STRING, allowNull: false},
//     weekAbbr: {type: DataTypes.STRING, allowNull: false},
//     day: {type: DataTypes.INTEGER, allowNull: false},
//     hour: {type: DataTypes.INTEGER, allowNull: false},
//     hourText: {type: DataTypes.STRING, allowNull: false},
// }, {sequelize, tableName, paranoid: false, timestamps: false});
/**
 * Run belonging and relationship before sync()
 */
sequelize.sync();
module.exports = ModelTimetable;
