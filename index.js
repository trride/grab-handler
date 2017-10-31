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
      try {
        const response = await this.grabBase({
          method,
          url,
          params,
          data
        });
        return response.data;
      } catch ({ response }) {
        throw {
          status: response.status,
          statusText: "[grab-handler] " + response.statusText,
          data: response.data
        };
      }
    };
    this.getMotorBikePrice = this.getMotorBikePrice.bind(this);
    this.getCurrentRides = this.getCurrentRides.bind(this);
  }

  async getMotorBikePrice(start = {}, end = {}) {
    if (!start.long || !start.lat || !end.lat || !end.long) {
      throw new Error("no start or end lat/lon");
    }
    const url = "/api/passenger/v3/quotes";
    const method = "post";
    const services = [SERVICES.GRABBIKE];
    const itinerary = [
      {
        coordinates: {
          latitude: start.lat,
          longitude: start.long
        },
        details: {
          address: ARBITRARY_STR,
          keywords: ARBITRARY_STR
        }
      },
      {
        coordinates: {
          latitude: end.lat,
          longitude: end.long
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
      price: {
        fixed,
        high: upperBound / 100,
        low: lowerBound / 100
      }
    };
  }

  async getCurrentRides() {
    const url = "/api/passenger/v3/current";
    const method = "get";
    const data = await this.fetch({ url, method });
    return data;
  }
}

module.exports = Grab;
