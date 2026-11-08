import express from "express";
import cors from "cors";
import { runAgentController } from "../features/agent/agent.controller.js";

const app = express();

app.use(cors());
app.use(express.json());

app.post("/run-agent", runAgentController);

export default app;

