import { Router } from "express";
import axios, { AxiosError } from "axios";
import registry from "../registry.json";
import { jsonError } from "../utils";
import qs, { ParsedUrlQueryInput } from "querystring";

const router = Router();

type TopicType = {
  url: string;
};

router.all(["/:topic/:uniqueId", "/:topic"], async (req, res) => {
  const { topic: topicName, uniqueId } = req.params;

  const authResource = registry.services["auth"];
  const endpoints = new Map(Object.entries(authResource.endpoints));

  const qsInput: ParsedUrlQueryInput = {};
  const queryString = qs.stringify(Object.assign(qsInput, req.query));

  const topic = endpoints.get(topicName) as TopicType;

  try {
    if (!topic || topic === undefined)
      return jsonError(res, 404, "Invalid URL!"); // Checking if topic exists

    const targetUrl = `${authResource.url}${topic.url}${
      uniqueId !== undefined ? "/" + uniqueId : ""
    }?${queryString}`; // Target URL

    const resp = await axios({
      method: req.method,
      url: targetUrl,
      headers: {
        "Content-Type": "application/json",
        "authorization-token": `${req.cookies["at"]}`,
      },
      data: {
        ...req.body,
        refreshToken: req.cookies["rt"],
      },
    });

    const respData = resp.data;

    if (topicName === "logout") {
      return res
        .status(resp.status)
        .clearCookie("rt")
        .clearCookie("at")
        .json({ error: false });
    } else if (
      !respData.error &&
      respData.accessToken &&
      respData.refreshToken
    ) {
      return res
        .cookie("rt", respData.refreshToken, {
          httpOnly: true,
          secure: true,
          maxAge: 10 * 24 * 3600 * 1000, // 10 days in ms
        })
        .cookie("at", respData.accessToken, {
          httpOnly: true,
          secure: true,
          maxAge: 10 * 60 * 1000, // 10 min in ms
        })
        .status(resp.status)
        .json({ error: false });
    } else {
      return res.status(resp.status).json(respData);
    }
  } catch (error: unknown) {
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
});

export default router;
