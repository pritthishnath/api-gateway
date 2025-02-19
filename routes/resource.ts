import { Context, Elysia } from "elysia";
import axios, { AxiosError } from "axios";
import registry from "../registry.json";
import { jsonError } from "../utils";

const resourceHandler = async (context: Context) => {
  const { params, query, request, cookie, set } = context;
  const { resource: resourceName, topic: topicName, uniqueId, scope } = params;
  const body = context.body as Record<string, any>;
  const resources = new Map(Object.entries(registry.services.resources));
  const resource = resources.get(resourceName);

  if (!resource) {
    return jsonError(context, 404, "Resource not found");
  }

  const queryString = new URLSearchParams(
    query as Record<string, string>
  ).toString();
  const endpoints = new Map(Object.entries(resource.endpoints));
  const topic = endpoints.get(topicName) as {
    url: string;
    scopes?: string[];
  };

  try {
    if (!topic) {
      return jsonError(context, 404, "Invalid URL!");
    }

    if (scope && topic.scopes && !topic.scopes.includes(scope)) {
      return jsonError(context, 404, "Invalid URL!");
    }

    const targetUrl = `${resource.url}${topic.url}${
      uniqueId ? "/" + uniqueId : ""
    }${scope ? "/" + scope : ""}?${queryString}`;

    const resp = await axios({
      method: request.method,
      url: targetUrl,
      headers: {
        "Content-Type": "application/json",
        "authorization-token": cookie.at?.value || "",
      },
      data: body,
    });

    set.status = resp.status;
    return resp.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      set.status = error.response?.status || 500;
      return (
        error.response?.data || {
          error: true,
          msg: "Axios: " + error.message,
          errorData: error,
        }
      );
    }
    return jsonError(context, 500);
  }
};

const resourceController = new Elysia({ prefix: "/rs" })
  .all("/:resource/:topic/:uniqueId?/:scope?", resourceHandler) //
  .all("/:resource/:topic/:uniqueId?", resourceHandler) //
  .all("/:resource/:topic", resourceHandler); //

export default resourceController;
