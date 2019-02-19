import apiService from "../api";
const api = apiService.group("Utils");

api
  .get("/index")
  .title("测试Index")
  .register(ctx => {
    ctx.response.ok("Hello, API Framework Index");
  });
