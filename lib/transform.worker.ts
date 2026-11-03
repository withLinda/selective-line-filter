import { transform, type WorkerReply } from "./transform";
import type { Workspace } from "./workspace";

self.onmessage = (event: MessageEvent<Workspace>) => {
  let reply: WorkerReply;
  try {
    reply = { result: transform(event.data) };
  } catch (error) {
    reply = { error: error instanceof Error ? error.message : "Could not process this text." };
  }
  self.postMessage(reply);
};
