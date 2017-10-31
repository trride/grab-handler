import test from "ava";
require("dotenv").config();

const Grab = require("./");

const exampleToken = process.env.GRAB_TOKEN;
// console.log(process.env);
const { getMotorBikePrice } = new Grab(exampleToken);

// getMotorBikePrice(
//   { lat: -7.2266182, long: 106.8073293 },
//   { lat: -6.2266182, long: 106.8073293 }
// ).then(console.log);

test("Sanity check", t => {
  t.pass();
  t.is(!false, true);
});

test("Get Motor Bike Price", async t => {
  //   t.is(typeof exampleToken, "object");
  const data = await getMotorBikePrice(
    { lat: -7.2266182, long: 106.8073293 },
    { lat: -6.2266182, long: 106.8073293 }
  );
  t.is(typeof data, "object");
  t.is(typeof data.price, "object");
  t.is(typeof data.price.fixed, "boolean");
  t.is(typeof data.price.high, "number");
  t.is(typeof data.price.low, "number");
});
