const { create } = require("axios");

const ARBITRARY_STR = "ARBITRARY";

const SERVICES = {
  GRABBIKE: 71
};

class Grab {
  constructor(grabToken) {
    if (!grabToken) {
      throw new Error("No Grab Token supplied");
    }
    this.grabBase = create({
      baseURL: "https://p.grabtaxi.com",
      responseType: "json",
      timeout: 10000,
      headers: {
        "x-mts-ssid": grabToken
      }
    });
    this.fetch = async ({ method, url, params, data }) => {
      const response = await this.grabBase({
        method,
        url,
        params,
        data
      });
      return response.data;
    };
    this.getMotorBikePrice = this.getMotorBikePrice.bind(this);
  }

  async getMotorBikePrice(start = {}, end = {}) {
    if (!start.lon || !start.lat || !end.lat || !end.lon) {
      throw new Error("no start or end lat/lon");
    }
    const url = "/api/passenger/v3/quotes";
    const method = "post";
    const services = [SERVICES.GRABBIKE];
    const itinerary = [
      {
        coordinates: {
          latitude: start.lat,
          longitude: start.lon
        },
        details: {
          address: ARBITRARY_STR,
          keywords: ARBITRARY_STR
        }
      },
      {
        coordinates: {
          latitude: end.lat,
          longitude: end.lon
        },
        details: {
          address: ARBITRARY_STR,
          keywords: ARBITRARY_STR
        }
      }
    ];
    const data = {
      services,
      itinerary
    };
    const unsanitized = await this.fetch({ url, method, data });
    // Should only return 1 member of array from the defined Services
    const { fixed, lowerBound, upperBound } = unsanitized[0];
    return {
      fixed,
      high: upperBound,
      low: lowerBound
    };
  }
}
