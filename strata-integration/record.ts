// @ts-nocheck
import * as rrweb from "rrweb";
import { eventWithTime } from "rrweb/typings/types";

let curEvents: eventWithTime[] = [];

rrweb.record({
  emit(event, isCheckout) {
    if (isCheckout) {
      curEvents = [];
    }
    curEvents.push(event);
  },
  checkoutEveryNth: 50,
});

window.sendLogs = (message: string, stack: string) => {
  setTimeout(() => {
    window.fetch("http://localhost:9981/api/record", {
      body: JSON.stringify({
        logs: curEvents,
        errorInfo: {
          message,
          stack,
        },
      }),
      method: "POST",
    });
  }, 2000);
};

window.onunhandledrejection = (event) => {
  window.sendLogs(String(event.reason), "");
};
window.onerror = (message, file, line, column, errorObj) => {
  window.sendLogs(String(message), errorObj?.stack ?? "");
};
