module.exports = {
  target: 'node',
  entry: './src/index.js',
  output: {
    library: 'req-res-logger',
    libraryTarget: 'commonjs2',
    path: __dirname + '/dist',
    filename: '[name].js'
  }
};
