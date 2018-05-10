import apiService from "../api";
import { TYPES } from "../global";
import { build } from "../global/helper";
const api = apiService.api;

api
  .get("/index")
  .group("Base")
  .title("测试Index")
  .register((req, res) => {
    res.success("Hello, API Framework Index");
  });
