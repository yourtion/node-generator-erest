import apiService from "../api";
const api = apiService.group("Base");

api
  .get("/index")
  .title("测试Index")
  .register((req, res) => {
    res.success("Hello, API Framework Index");
  });
