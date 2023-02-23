const path = require('path');

const isDev = process.env.NODE_ENV === 'development'

module.exports = {
    entry: './src/app.js',
    output: {
        filename: 'app.js',
        path: path.resolve(__dirname, 'dist'),
    },
    optimization: {
        minimize: !isDev
    }
};