/**
 * Model for user and admin
 */
const sequelize = require('./../database');
const { DataTypes, Model } = require('sequelize');
const { utils } = require("../core");
const tableName = "v2ryd_report";
const queryInterface = sequelize.getQueryInterface();
/**
 * Model extending sequelize model class
 */
class ModelReport extends Model {
}

ModelReport.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    childId: { type: DataTypes.INTEGER, allowNull: false },
    parentId: { type: DataTypes.INTEGER, allowNull: false },
    teacherId: {type: DataTypes.INTEGER, allowNull: true},
    programId: { type: DataTypes.INTEGER, allowNull: false },
    progressNotes: { type: DataTypes.STRING, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    areasForImprovement: { type: DataTypes.STRING, allowNull: false },
    supportSuggestions: { type: DataTypes.STRING, allowNull: false },
    additionalComments: { type: DataTypes.STRING },
    parentComments: { type: DataTypes.STRING },
    cohortCompleted: { type: DataTypes.BOOLEAN, defaultValue: false },
    clicked: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { sequelize, tableName });
/**
 * Run belonging and relationship before sync()
 */

// ModelProgram.belongsTo(ModelReport, {foreignKey: {name: "reportId"}, as: "report"})

// queryInterface.addColumn(tableName, 'clicked', {
//     type: DataTypes.BOOLEAN, defaultValue: false
// });

sequelize.sync();
module.exports = ModelReport;
