const { create } = require("axios");
const ms = require("ms");

const ARBITRARY_STR = "TRIDE";

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
    this.getEstimate = this.getEstimate.bind(this);
    this.getCurrentRides = this.getCurrentRides.bind(this);

    this.requestRide = this.requestRide.bind(this);
    this.cancelRide = this.cancelRide.bind(this);
  }

  async getEstimate(start = {}, end = {}) {
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
    const { fixed, lowerBound, upperBound, signature } = unsanitized[0];
    // console.log(unsanitized[0]);
    return {
      service: 'grab',
      price: upperBound / 100,
      requestKey: {
        key: signature,
        expiresAt: Date.now() + ms("5 minutes")
      }
    };
  }

  async requestRide(requestKey = "", start = {}, end = {}) {
    const payload = {
      services: [
        {
          quoteSignature: requestKey,
          serviceId: SERVICES.GRABBIKE
        }
      ],
      itinerary: [
        {
          details: {
            address: start.name || ARBITRARY_STR,
            keywords: ARBITRARY_STR
          },
          coordinates: {
            latitude: +start.lat,
            longitude: +start.long
          }
        },
        {
          details: {
            address: end.name || ARBITRARY_STR,
            keywords: ARBITRARY_STR
          },
          coordinates: {
            latitude: +end.lat,
            longitude: +end.long
          }
        }
      ]
    };

    const { data } = await this.grabBase.post(
      "/api/passenger/v3/rides",
      payload,
      {
        headers: {
          "User-Agent": "Grab/4.38.3 (Android 5.1.1)",
          "Content-Type": "application/json; charset=UTF-8"
        }
      }
    );

    return {
      service: 'grab',
      requestId: data.code
    };
  }

  async rideStatus(rideId) {
    return await this.grabBase.get(`/api/passenger/v3/rides/${rideId}/status`);
  }

  async getCurrentRides() {
    const url = "/api/passenger/v3/current";
    const method = "get";
    const data = await this.fetch({ url, method });
    return data;
  }

  async cancelRide(requestId) {
    const url = `/api/passenger/v3/rides/${requestId}`;
    const method = "delete";
    return await this.fetch({ url, method });
  }
}

module.exports = Grab;
