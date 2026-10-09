export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("beforeResponse", (event) => {
    removeResponseHeader(event, "x-powered-by");
  });
});
