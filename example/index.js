require("dotenv");

const exampleToken = process.env.GRAB_TOKEN;
const { getMotorBikePrice } = new Grab(exampleToken);

getMotorBikePrice(
  { lat: -7.2266182, lon: 106.8073293 },
  { lat: -6.2266182, lon: 106.8073293 }
).then(console.log);
