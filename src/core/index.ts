import { IncomingMessage, ServerResponse } from "http";
import cookie from "cookie";
import { APIContext, Routes, HTTPMethod, InitializedContext } from "./types";
import { superuser } from "config";
import requestParams from "./requestParams";
import routeRequest from "./routeRequest";
import { DataSource } from "./DataSource";
import responseFactory from "./responseFactory";
import { HTTPNotFound } from "./errors";
import NormalizedURL from "./NormalizedURL";
import Users from "modules/authorization/Users";
import { insertInto } from "./sql";
import Pages from "modules/pages/Pages";
import cors from "./cors";
import createRoutes from "utils/routes";
import { ContentPage } from "modules/pages/types";
import { perform } from "./sql/mutation";

const initSuperUser = (ctx: APIContext) =>
  ctx.db
    ?.query(
      ...insertInto(
        ctx["users"].collection,
        {
          name: "superuser",
          email: superuser.email,
          pwhash: "",
        },
        {
          onConflict: {
            constraint: "email",
            update: { set: { name: "superuser" } },
          },
          returning: "*",
        }
      )
    )
    .then(({ rows }) => rows[0]);

export const initDataSources = async (
  ctx: APIContext,
  dataSources: Record<string, typeof DataSource>
) => {
  if (!dataSources) return;
  const mutations = [];
  for (let source in dataSources) {
    const Source = dataSources[source] as any;
    ctx[source] = new Source(ctx);
    const sourceMutations: Record<string, { up: string }> =
      ctx[source].mutations || ctx[source].defaultMutations;
    if (sourceMutations)
      Object.entries(sourceMutations).forEach(([name, { up }]) => {
        up && mutations.push({ name, model: source, query: up });
      });
  }
  if (mutations.length) await perform(ctx.db, mutations);
};

const createSessionContext = (req: IncomingMessage) => {
  const context: Record<string, any> = {};
  context.headers = req.headers;
  context.ip = req.socket.remoteAddress;
  // TODO: check accept header
  // Look for existing page
  context.url = new NormalizedURL(req.url);
  context.cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};
  return context;
};

const initializeAccess = async (context: InitializedContext) => {
  if (!context.token) return;
  context.user = await (context.users as Users).byToken(context.token);
};

export default async function core(
  modules: {
    routes?: Routes;
    dataSources?: Record<string, typeof DataSource>;
  },
  ctx: APIContext
) {
  let notFoundPage: ContentPage = null;
  const routes = createRoutes(modules.routes);
  try {
    await initDataSources(ctx, modules.dataSources);
    ctx.superuser = await initSuperUser(ctx);
    notFoundPage = await ctx["pages"]?.retrieve("/*");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  return async (
    req: IncomingMessage,
    res: ServerResponse,
    next?: () => void
  ) => {
    const sendResponse = responseFactory(req, res);
    const notFound = () => {
      if (next) return next();
      if (notFoundPage)
        return sendResponse({ type: "amp", ...notFoundPage, code: 404 });
      throw new HTTPNotFound();
    };
    try {
      cors(req, res);
      const context: InitializedContext = Object.assign(
        createSessionContext(req),
        ctx
      );
      const params = await requestParams(req);
      context.token = context.cookies["amp-access"] ?? params.rid;
      // Clean context for each request
      const method = req.method?.toUpperCase();
      const expectsPage = !req.headers.accept?.endsWith("/json");
      await initializeAccess(context).catch(console.error);
      if (expectsPage) {
        const page = await (context.pages as Pages)?.retrieve(
          context.url.normalizedPath
        );
        if (page) {
          return sendResponse({
            type: "amp",
            ...page,
          });
        }
      }
      const { resolver, params: routeParams } = routeRequest(
        context.url,
        method as HTTPMethod,
        routes
      );
      if (!resolver) return notFound();
      const response = await resolver({ ...routeParams, ...params }, context);
      if (typeof response !== "object")
        throw new Error(
          `Wrong response returned from ${context.url.normalizedPath}`
        );
      return sendResponse(response);
    } catch (error) {
      const code = "code" in error ? error.code : 500;
      const message = code >= 500 ? "Internal Server Error" : error.message;
      if (code >= 500) console.error(error);
      return sendResponse({
        errors: [{ name: error["field"] ?? error.name, message }],
        code,
      });
    }
  };
}
