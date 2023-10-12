module.exports = {
  entry: './src/index.js',
  mode: 'production',
  output: {
    path: __dirname + '/dist',
    filename: 'index.js',
    library: 'avsc',
    libraryTarget: 'umd',
    globalObject: 'this',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'string-replace-loader',
        options: {
          // Patch
          multiple: [
            {
              search: '(this\\.buf\\.)utf8Write(.*?)\\);',
              replace: "$1write$2, 'utf8');",
              flags: '',
            },
            {
              search: '(this\\.buf\\.)utf8Slice(.*?\\));',
              replace: "$1slice$2.toString('utf8');",
              flags: '',
            },
          ],
        },
      },
    ],
  },
  externals: [
    {
      stream: 'stream-browserify',
      buffer: 'buffer',
    },
  ],
  resolve: {
    fallback: {
      assert: require.resolve('assert-browserify'),
      fs: false,
      path: false,
      zlib: require.resolve('browserify-zlib'),
      process: require.resolve('process'),
      events: require.resolve('events'),
    },
  },
}
