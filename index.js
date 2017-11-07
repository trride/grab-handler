require('dotenv').config()
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

    this.baseURL = process.env.NODE_ENV == 'development' ? process.env.DEV_BASE_URL + '/grab' : 'https://p.grabtaxi.com'

    this.grabBase = create({
      baseURL: this.baseURL,
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
    this.rideStatus = this.rideStatus.bind(this)
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
    return this.grabBase
      .get(`/api/passenger/v3/rides/${rideId}/status`)
      .then(response => {
        const { data } = response

        const driver = {
          name: "Dummy Driver",
          rating: 4.8,
          pictureUrl: "http://google.com",
          phoneNumber: "081234567890",
          vehicle: {
            plate: "B 1234 AA",
            name: "Honda Vario"
          }
        }

        const payload = {
          service: 'grab',
          requestId: rideId,
          driver
        }

        let status = data.status ? data.status.toLowerCase() : data.reason && data.reason.toLowerCase()

        if (status == 'allocated' && data.activeStepIndex > 0)
          status = 'on_the_way'

        const result = {
          'allocating': {
            status: 'processing',
            ...payload
          },
          'unallocated': {
            status: 'not_found',
            ...payload
          },
          'allocated': {
            status: 'accepted',
            ...payload
          },
          'cancelled': {
            status: 'canceled',
            ...payload
          },
          'on_the_way': {
            status: 'on_the_way',
            ...payload
          },
          'completed': {
            status: 'completed',
            ...payload
          }
        }
  
        return result[status]
      })
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
