
import HtmlWebpackPlugin from "html-webpack-plugin";
export default {
    entry: './src/index.js',

    module: {
        rules: [
            {
                test: /\.s[ac]ss$/i,
                use: [
                    'style-loader',
                    'css-loader',
                    'sass-loader'
                ],
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            }
        ],
    },

    plugins: [new HtmlWebpackPlugin()],

    resolve: {
        extensions: ['.js', '.jsx', '.scss', '.css'],
    },
}
