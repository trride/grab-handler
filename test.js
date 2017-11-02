import test from "ava";
require("dotenv").config();

const Grab = require("./");

const exampleToken = process.env.GRAB_TOKEN;
const {
  getMotorBikePrice,
  getCurrentRides,
  getEstimate,
  requestRide,
  cancelRide
} = new Grab(exampleToken);

const TYPE = {
  OBJECT: "object",
  FUNCTION: "function",
  STRING: "string",
  NUMBER: "number",
  BOOLEAN: "boolean",
  UNDEFINED: "undefined"
};

const TEST_START = { lat: -6.2266195, long: 106.8073293 };
const TEST_END = { lat: -6.2266182, long: 106.8073293 };

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

test("Book and Cancel", async t => {
  const { price: { high }, requestKey: { key } } = await getEstimate(
    TEST_START,
    TEST_END
  );
  t.is(typeof key, TYPE.STRING);
  t.is(typeof high, TYPE.NUMBER);

  const { requestId } = await requestRide(key, TEST_START, TEST_END);
  t.is(typeof requestId, TYPE.STRING);

  const data = await cancelRide(requestId);
  t.is(data, "");
});
