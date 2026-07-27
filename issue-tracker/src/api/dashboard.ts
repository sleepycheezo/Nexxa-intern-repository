import { apiGet } from "./client";
import { Kpis } from "../types";

export const getKpis = () => apiGet<Kpis>("/api/dashboard/kpis");
