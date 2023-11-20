import axios, { AxiosError } from "axios";
import { Router } from "express";
import qs, { ParsedUrlQueryInput } from "querystring";
import registry from "../registry.json";

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
      return res
        .status(404)
        .json({ error: true, message: "Resource Not Found!" }); // Getting and checking the resource

    const qsInput: ParsedUrlQueryInput = {};
    const queryString = qs.stringify(Object.assign(qsInput, req.query));

    try {
      const endpoints = new Map(Object.entries(resource.endpoints));

      const topic = endpoints.get(topicName) as TopicType;

      console.log(topic);
      if (!topic || topic === undefined)
        return res.status(404).json({ error: true, message: "Invalid URL!" }); // Checking if topic exists

      if (scope !== undefined && topic["scopes"] !== undefined) {
        if (!topic["scopes"].includes(scope))
          return res.status(404).json({ error: true, message: "Invalid URL!" }); // Checking if scope exists
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
            message: "Axios: " + error.message,
          }
        );
      else return res.sendStatus(500);
    }
  }
);

export default router;
