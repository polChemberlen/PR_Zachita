import { sequelize } from "./db.js";
import { DataTypes } from "sequelize";

const Role = sequelize.define('Role',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        roleValue: {
            type: DataTypes.STRING,
            allowNull: false
        }
    },
    {
        timestamps: false,
    }
);

const User = sequelize.define('User',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        login: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        roleId: {
            type: DataTypes.INTEGER,
            references: {
                model: Role,
                key: 'id',
            },
            allowNull: false,
            defaultValue: 2
        }
    },
    {
        timestamps: false,
    }
);

const Book = sequelize.define('Book',
    {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        price: {
            type: DataTypes.FLOAT,
            allowNull: false
        }
    },
    {
        timestamps: false,
    }
);

const Genre = sequelize.define('Genre',
    {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        }
    },
    {
        timestamps: false,
    }
);

const Publishing_House = sequelize.define('Publishing_House',
    {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        }
    },
    {
        timestamps: false,
    }
);

const Author = sequelize.define('Author',
    {
        surname: {
            type: DataTypes.STRING,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        patronymic: {
            type: DataTypes.STRING,
        },        
    },
    {
        timestamps: false,
    }
);

Book.belongsTo(Genre);
Book.belongsTo(Publishing_House);
Book.belongsTo(Author);

Genre.hasMany(Book);
Publishing_House.hasMany(Book);
Author.hasMany(Book);

User.belongsTo(Role, {
    foreignKey: 'roleId',
    onDelete: 'CASCADE'
});
Role.hasMany(User, {
    foreignKey: 'roleId',
    onDelete: 'CASCADE'
});

export {
    Role,
    User,
    Book,
    Genre,
    Publishing_House,
    Author
};