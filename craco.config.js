const { createProxyMiddleware } = require('http-proxy-middleware');

const backendTarget = process.env.REACT_APP_API_PROXY || 'http://localhost:4000';

module.exports = {
  devServer: (devServerConfig) => {
    devServerConfig.setupMiddlewares = (middlewares, devServer) => {
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined');
      }

      devServer.app.use(
        '/api',
        createProxyMiddleware({
          target: backendTarget,
          changeOrigin: true,
          ws: true,
          logLevel: 'warn'
        })
      );

      return middlewares;
    };

    return devServerConfig;
  },
  webpack: {
    configure: (webpackConfig) => {
      // Find MiniCssExtractPlugin and configure it to ignore CSS file order conflicts
      const miniCssExtractPlugin = webpackConfig.plugins.find(
        (plugin) => plugin.constructor.name === 'MiniCssExtractPlugin'
      );
      if (miniCssExtractPlugin) {
        miniCssExtractPlugin.options.ignoreOrder = true;
      }

      // Remove ESLintWebpackPlugin so CI=true on Vercel/Render doesn't
      // treat ESLint warnings as fatal build errors
      webpackConfig.plugins = webpackConfig.plugins.filter(
        (plugin) => plugin.constructor.name !== 'ESLintWebpackPlugin'
      );

      return webpackConfig;
    }
  }
};
