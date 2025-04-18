/**
 * Model for user and admin
 */
const sequelize = require('./../database');
const {DataTypes, Model} = require('sequelize');
const {utils} = require("../core");
const ModelProgram = require("./model.program");
const ModelPartnerProgram = require('./model.partner_program');
const ModelPromoProgram = require('./model.promo_program');
const tableName = "v2ryd_coupon";
//const queryInterface = sequelize.getQueryInterface();

/**
 * Model extending sequelize model class
 */
class ModelCoupon extends Model {
}

ModelCoupon.init({
    id: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
    code: {type: DataTypes.STRING, unique: true},
    value: {type: DataTypes.FLOAT, allowNull: false},
    isPercentage: {type: DataTypes.BOOLEAN, defaultValue: false},
    isActive: {type: DataTypes.BOOLEAN, defaultValue: true},
    byCountry: {type: DataTypes.JSON, defaultValue: "['All']"},
    accessKey: {type: DataTypes.STRING, allowNull: false},
    byLevel: {type: DataTypes.INTEGER, defaultValue: 0},
    mLevel: {type: DataTypes.JSON, defaultValue: [0]},
    usage: {type: DataTypes.INTEGER, defaultValue: 0},
}, {sequelize, tableName, paranoid: true});
/**
 * Run belonging and relationship before sync()
 */

// queryInterface.addColumn(tableName, 'mLevel',
//     {type: DataTypes.JSON, defaultValue: [0]}
//     );

ModelCoupon.hasMany(ModelProgram, {foreignKey: {name: "couponId", allowNull: true}, as: "programs"})
ModelProgram.belongsTo(ModelCoupon, {foreignKey: {name: "couponId", allowNull: true}, as: "coupon"})

ModelCoupon.hasMany(ModelPartnerProgram, {foreignKey: {name: "couponId", allowNull: true}, as: "partner_programs"})
ModelPartnerProgram.belongsTo(ModelCoupon, {foreignKey: {name: "couponId", allowNull: true}, as: "partner_coupon"})

ModelCoupon.hasMany(ModelPromoProgram, {foreignKey: {name: "couponId", allowNull: true}, as: "promo_programs"})
ModelPromoProgram.belongsTo(ModelCoupon, {foreignKey: {name: "couponId", allowNull: true}, as: "promo_coupon"})

sequelize.sync();
module.exports = ModelCoupon;
