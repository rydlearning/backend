/**
 * Model for user and admin
 */
const sequelize = require('../database');
const {DataTypes, Model, QueryTypes} = require('sequelize');
const {utils} = require("../core");
const ModelPromoProgram = require('./model.promo_program');
const tableName = "v2ryd_promo_child";


/**
 * Model extending sequelize model class
 */
class ModelPromoChild extends Model {
}

ModelPromoChild.init({
    id: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
    parentId: {type: DataTypes.INTEGER},
    firstName: {type: DataTypes.STRING, allowNull: false},
    lastName: {type: DataTypes.STRING, allowNull: false},
    age: {type: DataTypes.INTEGER, allowNull: false},
    gender: {type: DataTypes.STRING, allowNull: false, defaultValue: "Male"},
    privacyMode: {type: DataTypes.BOOLEAN, defaultValue: false},
    status: {type: DataTypes.BOOLEAN, defaultValue: true},
}, {
    sequelize, tableName, scopes: {
        withLevel: {
            attributes: {
                include: [[
                    // Note the wrapping parentheses in the call below!
                    sequelize.literal(`(
                    SELECT COUNT(pp.level)
                    FROM v2ryd_promo_program AS pp, v2ryd_child AS cd
                    WHERE
                        pp.childId = cd.id
                        AND
                        pp.isPaid = 1 AND pp.isCompleted order by pp.level DESC LIMIT 2
                )`),
                    'level',
                ],
                    [
                        sequelize.literal(`(
              SELECT IF(count(*)>0, 'true', 'false') from v2ryd_promo_program INNER JOIN ${tableName} ON v2ryd_promo_program.childId = ${tableName}.id 
    WHERE v2ryd_promo_program.isPaid = 1 AND v2ryd_promo_program.isCompleted = 1
    ORDER BY v2ryd_promo_program.createdAt DESC 
    LIMIT 1  
              )`),
                        'allowNewCohort'
                    ]
                ]
            }
        }
    }, paranoid: true
});
/**
 * Run belonging and relationship before sync()
 */
ModelPromoChild.hasMany(ModelPromoProgram, {foreignKey: {name: "childId", allowNull: true}, as: "programs", onDelete: "CASCADE"})
ModelPromoProgram.belongsTo(ModelPromoChild, {foreignKey: {name: 'childId', allowNull: true}, as: "child", onDelete: "SET NULL"})

sequelize.sync();
module.exports = ModelPromoChild;
