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
  }
};
