import apiService from "../api";
import { helper, TYPES, config } from "../global";
const api = apiService.group("<%= name %>");

api
  .get("/index")
  .title("测试Index")
  .register(ctx => {
    ctx.response.ok("Hello, API Framework Index");
  });
