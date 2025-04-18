/**
 * Model for user and admin
 */
const sequelize = require('./../database');
const { DataTypes, Model } = require('sequelize');
const { utils } = require("../core");
const ModelParentInvite = require('./model.partner_invite');
const ModelPartnerProgram = require('./model.partner_program');
const tableName = "v2ryd_partner";
const queryInterface = sequelize.getQueryInterface();

/**
 * Model extending sequelize model class
 */
class ModelPartner extends Model {
}

ModelPartner.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    organizationName: { type: DataTypes.STRING, allowNull: false },
    firstName: { type: DataTypes.STRING, allowNull: false },
    lastName: { type: DataTypes.STRING, allowNull: false },
    address: { type: DataTypes.STRING, allowNull: false },
    country: { type: DataTypes.STRING, allowNull: false, defaultValue: "Canada" },
    phone: { type: DataTypes.STRING, allowNull: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    token: { type: DataTypes.STRING, unique: true },
    status: { type: DataTypes.BOOLEAN, defaultValue: true },
    approved: { type: DataTypes.BOOLEAN, defaultValue: false },
    discount: {type: DataTypes.FLOAT, allowNull: true, defaultValue: 0.00 },
}, { sequelize, tableName, paranoid: true });
/**
 * Run belonging and relationship before sync()
 */

// queryInterface.addColumn(tableName, 'country', {
//     type: DataTypes.STRING, allowNull: false, defaultValue: "Canada"
// });

// queryInterface.removeColumn('v2ryd_partner', 'discount');

ModelPartner.hasMany(ModelParentInvite, { foreignKey: { name: "partnerId" }, as: "invite", onDelete: 'CASCADE' })
ModelParentInvite.belongsTo(ModelPartner, { foreignKey: 'partnerId', as: "partner" })

ModelPartner.hasMany(ModelPartnerProgram, { foreignKey: { name: "partnerId", allowNull: true }, as: "programs", onDelete: 'CASCADE' })
ModelPartnerProgram.belongsTo(ModelPartner, { foreignKey: 'partnerId', as: "partner" })

sequelize.sync();

module.exports = ModelPartner;
