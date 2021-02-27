import { APIContext } from "core/types";
import { graphql } from "graphql";

export default function GraphQL(schema) {
  return async (context: APIContext, params: any) => {
    const { query, operationName, variables } = {
      ...params.input,
      ...params,
    } as any;
    const response = await graphql({
      schema,
      contextValue: context,
      source: query,
      operationName,
      variableValues: variables,
    });
    if ("errors" in response) {
      return { code: 400, response };
    }
    return response;
  };
}