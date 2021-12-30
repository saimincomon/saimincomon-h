const path = require('path')
const webpack = require('webpack')
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

/**
 * 拉取配置
 * @param {String} name 名字
 * @param {String} entry 入口
 * @param {"production"|"development"} mode 模式
 */
function getConfig (name, entry, mode = 'production') {
  var isDevMode = false
  if (mode === 'development') {
    isDevMode = true
  }
  const config = {
    name: `${name}`,
    mode: isDevMode ? 'development' : 'production',
    devtool: isDevMode ? '#cheap-module-eval-source-map' : false,
    entry,
    output: {
      library: isDevMode ? `${name}.[name]` : `${name}.[name].[hash]`,
      libraryTarget: 'umd2',
      path: path.resolve(process.cwd(), `./dist/${name}/`),
      filename: isDevMode ? `${name}.[name].js` : `${name}.[name].[hash].js`
    },
    module: {
      rules: [{
        test: /\.vue$/,
        use: {
          loader: 'vue-loader',
          options: {
            extractCSS: true,
            loaders: {
              sass: 'vue-style-loader!css-loader!sass-loader?indentedSyntax=1',
              scss: 'vue-style-loader!css-loader!sass-loader',
              less: 'vue-style-loader!css-loader!less-loader'
            }
          }
        }
      },
      {
        test: /\.s(c|a)ss$/,
        use: [{
          loader: MiniCssExtractPlugin.loader,
          options: {
            hmr: mode === 'development'
          }
        },
        {
          loader: 'css-loader'
        },
        {
          loader: 'sass-loader',
          options: {
            // eslint-disable-next-line
                implementation: require('sass'),
          }
        }
        ]
      },
      {
        test: /\.css$/,
        use: [{
          loader: MiniCssExtractPlugin.loader,
          options: {
            hmr: isDevMode
          }
        },
        'css-loader'
        ]
      },
      {
        test: /\.html$/,
        use: 'vue-html-loader'
      },
      {
        test: /\.(png|jpe?g|gif|tif?f|bmp|webp|svg)(\?.*)?$/,
        use: {
          loader: 'url-loader',
          options: {
            esModule: false,
            limit: 10000,
            name: 'imgs/[name]--[folder].[ext]'
          }
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        use: {
          loader: 'url-loader',
          options: {
            esModule: false,
            limit: 10000,
            name: 'fonts/[name]--[folder].[ext]'
          }
        }
      }
      ]
    },
    plugins: [
      // new WriteFilePlugin(),
      new VueLoaderPlugin(),
      new MiniCssExtractPlugin({
        filename: isDevMode ? `${name}.[name].css` : `${name}.[name].[hash].css`,
        chunkFilename: isDevMode ? `${name}.[name].css` : `${name}.[name].[hash].css`
      })
    ],
    resolve: {
      modules: ['node_modules']
    },
    resolveLoader: {
      modules: [path.join(__dirname, '../node_modules')]
    }
  }
  /**
   * Adjust web for production settings
   */
  if (isDevMode) {
    // any dev only config
    // config.plugins.push(
    //   new webpack.HotModuleReplacementPlugin()
    // )
  } else {
    config.plugins.push(
      new webpack.LoaderOptionsPlugin({
        minimize: true
      })
    )
  }
  return config
}

module.exports = getConfig
