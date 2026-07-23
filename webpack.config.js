import HtmlWebpackPlugin from "html-webpack-plugin";
import CopyWebpackPlugin from "copy-webpack-plugin";
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

    plugins: [
        new HtmlWebpackPlugin({
            templateContent: ({htmlWebpackPlugin}) => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="manifest" href="/manifest.json"><link rel="icon" href="/icons/icon.svg" type="image/svg+xml"><meta name="theme-color" content="#2b7a0b"></head><body><div id="root"></div></body></html>`
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: 'manifest.json', to: '' },
                { from: 'icons', to: 'icons' },
                { from: 'sw.js', to: '' }
            ]
        })
    ],

    resolve: {
        extensions: ['.js', '.jsx', '.scss', '.css'],
    },
}
