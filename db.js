import { Sequelize } from "sequelize";

export const sequelize = new Sequelize('PR_Zaschita', 'postgres', '123', {
    host: 'localhost',
    dialect: 'postgres'
});
