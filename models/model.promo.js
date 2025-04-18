/**
 * Model for user and admin
 */
const sequelize = require('./../database');
const { DataTypes, Model } = require('sequelize');
const { utils } = require("../core");
const ModelPromoProgram = require('./model.promo_program');
const ModelTimegroup = require('./model.timegroup');
const queryInterface = sequelize.getQueryInterface();
const tableName = "v2ryd_promo";

/**
 * Model extending sequelize model class
 */
class ModelPromo extends Model {
}

ModelPromo.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    firstName: { type: DataTypes.STRING, allowNull: false },
    lastName: { type: DataTypes.STRING, allowNull: false },
    address: { type: DataTypes.STRING, allowNull: false },
    country: { type: DataTypes.STRING, allowNull: false, defaultValue: "Canada" },
    phone: { type: DataTypes.STRING, allowNull: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    token: { type: DataTypes.STRING, unique: true },
    status: { type: DataTypes.BOOLEAN, defaultValue: true },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: false },
    registration: { type: DataTypes.BOOLEAN, defaultValue: false },
    discount: {type: DataTypes.FLOAT, allowNull: true, defaultValue: 0.00 },
    timeGroupId: {type: DataTypes.INTEGER, allowNull: true},
    additionalFields: {type: DataTypes.JSON, defaultValue: []},
    slot: {type: DataTypes.JSON, defaultValue: []},
}, { sequelize, tableName, paranoid: true });
/**
 * Run belonging and relationship before sync()
 */

// queryInterface.addColumn(tableName, 'registration', {
//     type: DataTypes.BOOLEAN, defaultValue: false
// });

ModelPromo.hasMany(ModelPromoProgram, { foreignKey: { name: "promoId" }, as: "programs", onDelete: 'CASCADE' })
ModelPromoProgram.belongsTo(ModelPromo, { foreignKey: 'promoId', as: "promo" })
ModelPromo.belongsTo(ModelTimegroup, {foreignKey: {name: "timeGroupId", allowNull: true}, as: "timeGroup"})

sequelize.sync();

module.exports = ModelPromo;
