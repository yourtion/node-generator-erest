import apiService from "../api";
const api = apiService.api;

api
  .get("/index")
  .group("Base")
  .title("测试Index")
  .register((req, res) => {
    res.success("Hello, API Framework Index");
  });
