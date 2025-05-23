import {useState} from "react";
import {MensajeRecibeDTO} from "./websocket";

export const useNotifications = () => {
  return useState<MensajeRecibeDTO[]>([]);
};
