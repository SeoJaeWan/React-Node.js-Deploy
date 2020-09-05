import express from "express";

const PORT = 5000;
const app = express();

app.post("/api/callTest", () => {
  console.log("CALL TEST SUC");
});

app.listen(PORT, () => {
  console.log(PORT, "SERVER START");
});
