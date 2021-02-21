import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import Dotenv from 'dotenv-webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import OptimizeCSSAssetsPlugin from 'optimize-css-assets-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import autoprefixer from 'autoprefixer';
import path from 'path';
import fs from 'fs';

const ASSETS_DIR = 'assets/';
const SRC_DIR = 'src';

const css = (regex, mode, modules) => ({
  test: regex,
  use: [
    MiniCssExtractPlugin.loader,
    {
      loader: 'css-loader',
      options: {
        importLoaders: 3,
        sourceMap: mode === 'development',
        modules: modules
          ? {
              ...(mode === 'development' && {
                localIdentName: '[path][name]__[local]',
              }),
            }
          : false,
      },
    },
    {
      loader: 'postcss-loader',
      options: {
        postcssOptions: {
          plugins: [
            autoprefixer({
              remove: false,
            }),
          ],
        },
        sourceMap: mode === 'development',
      },
    },
    'resolve-url-loader',
    {
      loader: 'sass-loader',
      options: {
        sourceMap: true,
        sassOptions: {
          indentWidth: 2,
        },
      },
    },
  ],
});

export default (env, argv) => ({
  context: path.resolve(__dirname, SRC_DIR),
  devServer: {
    compress: true,
    contentBase: './public',
    host: 'dev.jitsi-experments-front.com',
    writeToDisk: true,
    https: true,
    key: fs.readFileSync('public/certs/cert.key'),
    cert: fs.readFileSync('public/certs/cert.crt'),
    ca: fs.readFileSync('public/certs/ca.key'),
  },
  entry: {
    index: 'index',
  },
  devtool: argv.mode === 'development' ? 'source-map' : false,
  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: /\.jsx?$/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        exclude: /node_modules/,
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
        },
      },
      css(/(?<!\.module)\.(sa|sc|c)ss$/, argv.mode),
      css(/\.module\.(sa|sc|c)ss$/, argv.mode, {
        localIdentName:
          argv.mode === 'production'
            ? '[hash:base64]'
            : '[name]__[local]--[hash:base64:5]',
      }),
      {
        test: /\.(woff(2)?|(o|t)tf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name:
                argv.mode === 'production'
                  ? '[hash].[ext]'
                  : '[path][name].[ext]',
              outputPath(url, resourcePath, context) {
                return `.${this.publicPath(url, resourcePath, context)}`;
              },
              publicPath: (url) => {
                if (argv.mode !== 'production') {
                  return `/${ASSETS_DIR}fonts/${url
                    .split('/')
                    .slice(2)
                    .join('/')}`;
                }
                return `/${ASSETS_DIR}fonts/${url}`;
              },
            },
          },
        ],
      },
      {
        test: /\.(cur|png|jpe?g|gif|webp)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name:
                argv.mode === 'production'
                  ? '[hash].[ext]'
                  : '[name].[hash].[ext]',
              outputPath(url, resourcePath, context) {
                return `.${this.publicPath(url, resourcePath, context)}`;
              },
              publicPath: (url) => `/${ASSETS_DIR}images/${url}`,
            },
          },
        ],
      },
    ],
  },
  optimization: {
    minimize: argv.mode === 'production',
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          output: {
            comments: false,
          },
        },
        extractComments: false,
      }),
      new OptimizeCSSAssetsPlugin({
        cssProcessorPluginOptions: {
          preset: ['default', { discardComments: { removeAll: true } }],
        },
      }),
    ],
    runtimeChunk: 'single',
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        reactVendor: {
          test: /[\\/]node_modules[\\/](react|react-dom|redux)[\\/]/,
          name: 'reactVendor',
        },
        utilityVendor: {
          test: /[\\/]node_modules[\\/](lodash|moment|moment-timezone)[\\/]/,
          name: 'utilityVendor',
        },
        vendor: {
          test: /[\\/]node_modules[\\/](!lodash)(!moment)(!moment-timezone)[\\/]/,
          name: 'vendor',
        },
      },
    },
  },
  output: {
    filename:
      argv.mode === 'production'
        ? `${ASSETS_DIR}js/[contenthash].bundle.js`
        : `${ASSETS_DIR}js/[name].bundle.js`,
    chunkFilename:
      argv.mode === 'production'
        ? `${ASSETS_DIR}js/[id].[contenthash].chunk.js`
        : `${ASSETS_DIR}js/[id].chunk.js`,
    path: path.resolve(__dirname, 'public'),
    publicPath: '/',
  },
  plugins: [
    new CleanWebpackPlugin({
      cleanOnceBeforeBuildPatterns: [
        'assets/js/**/*',
        'assets/css/**/*',
        'index.html',
      ],
      cleanStaleWebpackAssets: false,
    }),
    new Dotenv(),
    new MiniCssExtractPlugin({
      filename:
        argv.mode === 'production'
          ? `${ASSETS_DIR}css/[contenthash].css`
          : `${ASSETS_DIR}css/[name].css`,
    }),
    new HtmlWebpackPlugin({
      chunks: ['index'],
      template: 'index.ejs',
      inject: false,
    }),
  ],
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.scss'],
    modules: ['node_modules', SRC_DIR],
  },
  stats: {
    excludeModules: 'node_modules',
  },
});
