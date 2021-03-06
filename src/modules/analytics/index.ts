import Analytics from "./Analytics";
import resolvers from "./resolvers";
import typeDefs from "./typeDefs";

export default {
  resolvers,
  typeDefs,
  dataSources: {
    analytics: Analytics,
  },
};
