module.exports = function override(config, env) {
  config.resolve = {
    ...config.resolve,
    fallback: {
      ...config.resolve.fallback,
      "localStorage": false,
    }
  };

  return config;
};