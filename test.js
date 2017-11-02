import test from "ava";
require("dotenv").config();

const Grab = require("./");

const exampleToken = process.env.GRAB_TOKEN;
const { getMotorBikePrice, getCurrentRides } = new Grab(exampleToken);

const TYPE = {
  OBJECT: "object",
  FUNCTION: "function",
  STRING: "string",
  NUMBER: "number",
  BOOLEAN: "boolean",
  UNDEFINED: "undefined"
};

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
  t.is(typeof data, TYPE.OBJECT);
  t.is(typeof data.price, TYPE.OBJECT);
  t.is(typeof data.price.fixed, TYPE.BOOLEAN);
  t.is(typeof data.price.high, TYPE.NUMBER);
  t.is(typeof data.price.low, TYPE.NUMBER);
});

test("Get Current Profile", async t => {
  t.is(typeof getCurrentRides, TYPE.FUNCTION);
  const data = await getCurrentRides();
  t.is(typeof data, TYPE.OBJECT);
  t.is(typeof data.rides, TYPE.OBJECT);
  t.is(typeof data.deliveries, TYPE.OBJECT);
});
