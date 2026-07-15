export default {
  dialect: "sqlite",
  schema: "./server/schema.js",
  out: "./drizzle",
  dbCredentials: {
    url: "./server/cache.db",
  },
};
