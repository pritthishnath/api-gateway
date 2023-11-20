import { Router } from "express";
import axios, { AxiosError } from "axios";
import registry from "../registry.json";

const router = Router();

router.all("/:route", async (req, res) => {
  const service = registry.services["auth"];
  const endpoints = new Map(
    Object.entries(registry.services["auth"].endpoints)
  );
  const route = req.params.route;

  try {
    if (route && endpoints.has(route)) {
      const resp = await axios({
        method: req.method,
        url: `${service.url}${endpoints.get(route)?.url}`,
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

      if (route === "logout") {
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
        console.log("TOKEN SENT");
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
    } else {
      return res
        .status(400)
        .json({ error: true, message: "Please enter a valid URL!" });
    }
  } catch (error: unknown) {
    if (error instanceof AxiosError)
      return res.status(error.response?.status || 500).json(
        error.response?.data || {
          error: true,
          message: "Axios: " + error.message,
        }
      );
    else return res.sendStatus(500);
  }
});

export default router;
