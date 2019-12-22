module.exports = {
  devServer: {
    historyApiFallback: false,
    proxy: {
      '^/api': {
        target: 'http://localhost:5000',
      },
    },
  },
}
