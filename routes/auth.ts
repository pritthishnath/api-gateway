import Elysia, { Context } from "elysia";
import axios, { AxiosError } from "axios";
import registry from "../registry.json";
import { jsonError } from "../utils";

const authHandler = async (context: Context) => {
  const { params, query, request, cookie, set } = context;
  const { topic: topicName, uniqueId } = params;
  const body = context.body as Record<string, any>;
  const authResource = registry.services["auth"];
  const endpoints = new Map(Object.entries(authResource.endpoints));

  const queryString = new URLSearchParams(
    query as Record<string, string>
  ).toString();
  const topic = endpoints.get(topicName) as { url: string };

  try {
    if (!topic) {
      return jsonError(context, 404, "Invalid URL!");
    }

    const targetUrl = `${authResource.url}${topic.url}${
      uniqueId ? "/" + uniqueId : ""
    }?${queryString}`;

    const resp = await axios({
      method: request.method,
      url: targetUrl,
      headers: {
        "Content-Type": "application/json",
        "authorization-token": cookie.at?.value || "",
      },
      data: {
        ...body,
        refreshToken: cookie.rt?.value || "",
      },
    });

    const respData = resp.data;

    if (topicName === "logout") {
      cookie.rt.remove();
      cookie.at.remove();
      set.status = resp.status;
      return { error: false };
    }

    if (!respData.error && respData.accessToken && respData.refreshToken) {
      cookie.rt.set({
        value: respData.refreshToken,
        httpOnly: true,
        secure: true,
        maxAge: 10 * 24 * 3600 * 1000, // 10 days
      });

      cookie.at.set({
        value: respData.accessToken,
        httpOnly: true,
        secure: true,
        maxAge: 10 * 60 * 1000, // 10 minutes
      });

      set.status = resp.status;
      return { error: false };
    }

    set.status = resp.status;
    return respData;
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

const authController = new Elysia({ prefix: "/auth" })
  .all("/:topic/:uniqueId?", authHandler)
  .all("/:topic", authHandler);

export default authController;
