import axios, { AxiosError } from "axios";
import { Router } from "express";
import qs, { ParsedUrlQueryInput } from "querystring";
import registry from "../registry.json";
import { jsonError } from "../utils";

const router = Router();

type TopicType = {
  url: string;
  scopes?: string[];
};

router.all(
  [
    "/:resource/:topic/:uniqueId/:scope",
    "/:resource/:topic/:uniqueId",
    "/:resource/:topic",
  ],
  async (req, res) => {
    const {
      resource: resourceName,
      topic: topicName,
      uniqueId,
      scope,
    } = req.params;

    const resources = new Map(Object.entries(registry.services.resources));
    const resource = resources.get(resourceName);
    if (!resource || resource === undefined)
      return jsonError(res, 404, "Resource not found"); // Getting and checking the resource

    const qsInput: ParsedUrlQueryInput = {};
    const queryString = qs.stringify(Object.assign(qsInput, req.query));

    const endpoints = new Map(Object.entries(resource.endpoints));

    const topic = endpoints.get(topicName) as TopicType;

    try {
      if (!topic || topic === undefined)
        return jsonError(res, 404, "Invalid URL!"); // Checking if topic exists

      if (scope !== undefined && topic["scopes"] !== undefined) {
        if (!topic["scopes"].includes(scope))
          return jsonError(res, 404, "Invalid URL!"); // Checking if scope exists
      }

      const targetUrl = `${resource.url}${topic.url}${
        uniqueId !== undefined ? "/" + uniqueId : ""
      }${scope !== undefined ? "/" + scope : ""}?${queryString}`; // Target URL

      const resp = await axios({
        method: req.method,
        url: targetUrl,
        headers: {
          "Content-Type": "application/json",
          "authorization-token": `${req.cookies.at}`,
        },
        data: req.body,
      });

      res.status(resp.status).json(resp.data);
    } catch (error) {
      if (error instanceof AxiosError)
        return res.status(error.response?.status || 500).json(
          error.response?.data || {
            error: true,
            msg: "Axios: " + error.message,
            errorData: error,
          }
        );
      else return jsonError(res, 500);
    }
  }
);

export default router;
