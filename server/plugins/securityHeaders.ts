// Do not advertise the server stack.
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("beforeResponse", (event) => {
    removeResponseHeader(event, "x-powered-by");
  });
});
