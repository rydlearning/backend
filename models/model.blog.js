const sequelize = require('./../database');
const { DataTypes, Model } = require('sequelize');
const { utils } = require("../core");
const tableName = "v2ryd_blogs";
const queryInterface = sequelize.getQueryInterface();


class ModelBlog extends Model { }

ModelBlog.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    like: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    slug: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
    },
    excerpt: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    featuredImage: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    link: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    category: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    readTime: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    likes: {
        type: DataTypes.INTEGER, defaultValue: 0
    },
    views: {
        type: DataTypes.INTEGER, defaultValue: 0
    },
    status: {
        type: DataTypes.ENUM('draft', 'published', 'archived'),
        defaultValue: 'draft'
    },
    isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, { sequelize, tableName, paranoid: true });


// queryInterface.addColumn(tableName, 'likes', {
//     type: DataTypes.INTEGER, defaultValue: 0
// });

// queryInterface.addColumn(tableName, 'views', {
//     type: DataTypes.INTEGER, defaultValue: 0
// });

sequelize.sync();

module.exports = ModelBlog;
