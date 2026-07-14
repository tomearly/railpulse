// server/src/swagger-spec.ts

export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "RailPulse API Documentation",
    version: "1.0.0",
    description: "Live railway departure board API powered by Express, Prisma 7, and Supabase.",
  },
  servers: [
    {
      url: "http://127.0.0.1:5000",
      description: "Local Development Server",
    },
  ],
  paths: {
    "/api/departures": {
      get: {
        summary: "Retrieve live departures for a specific railway station",
        description: "Fetches a station's full name and a list of scheduled departures sorted by time. Defaults to Northampton (NMP).",
        parameters: [
          {
            in: "query",
            name: "code",
            schema: {
              type: "string",
              example: "EUS",
            },
            required: false,
            description: "The 3-letter British National Rail station code (case-insensitive).",
          },
        ],
        responses: {
          "200": {
            description: "Success. Returns the station name and an array of departures.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    stationName: {
                      type: "string",
                      example: "London Euston",
                    },
                    departures: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          time: { type: "string", example: "15:10" },
                          destination: { type: "string", example: "Manchester Piccadilly" },
                          operator: { type: "string", example: "Avanti West Coast" },
                          platform: { type: "string", example: "6" },
                          status: { type: "string", example: "On Time" },
                          delayMins: { type: "integer", example: null },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "404": {
            description: "Station code not found in the database.",
          },
          "500": {
            description: "Database connection error or internal server failure.",
          },
        },
      },
      post: {
        summary: "Add a new departure for a specific railway station",
        description: "Creates a new departure entry linked to the specified station code.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  stationCode: { type: "string", example: "NMP" },
                  time: { type: "string", example: "16:00" },
                  destination: { type: "string", example: "London Euston" },
                  operator: { type: "string", example: "London Northwestern Railway" },
                  platform: { type: "string", example: "1" },
                  status: { type: "string", example: "On Time" },
                  delayMins: { type: "integer", example: null },
                },
                required: ["stationCode", "time", "destination", "operator", "platform", "status"],}
              },
            },
        },
        responses: {
          "201": {
            description: "Departure created successfully.",
          },
          "400": {
            description: "Missing required fields in the request body.",
          },
          "404": {
            description: "Station code not found in the database.",
          },
          "500": {
            description: "Database connection error or internal server failure.",
          },
        },
      },
    },
    "/api/departures/{id}": {
      get: {
        summary: "Retrieve a specific departure by its ID",
        description: "Fetches the details of a single departure entry based on its unique identifier.",
        parameters: [
          {
            in: "path",
            name: "id",
            schema: {
              type: "string",
              example: "52250540-3b92-4c24-b458-0218051c11c9",
            },
            required: true,
            description: "The unique identifier of the departure.",
          },
        ],
        responses: {
          "200": {
            description: "Success. Returns the departure details.",
          },
          "404": {
            description: "Departure with the specified ID not found.",
          },
          "500": {
            description: "Database connection error or internal server failure.",
          },
        },
      },
    },
    "/api/arrivals": {
      get: {
        summary: "Retrieve live arrivals for a specific railway station",
        description: "Fetches a station's full name and a list of scheduled arrivals sorted by time. Defaults to Northampton (NMP).",
        parameters: [
          {
            in: "query",
            name: "code",
            schema: {
              type: "string",
              example: "EUS",
            },
            required: false,
            description: "The 3-letter British National Rail station code (case-insensitive).",
          },
        ],
        responses: {
          "200": {
            description: "Success. Returns the station name and an array of arrivals.",
          },
          "404": {
            description: "Station code not found in the database.",
          },
          "500": {
            description: "Database connection error or internal server failure.",
          },
        },
      },
    },
    "/api/arrivals/{id}": {
      get: {
        summary: "Retrieve a specific arrival by its ID",
        description: "Fetches the details of a single arrival entry based on its unique identifier.",
        parameters: [
          {
            in: "path",
            name: "id",
            schema: {
              type: "string",
              example: "122337f3-28fb-4700-b237-32cccdeed51c",
            },
            required: true,
            description: "The unique identifier of the arrival.",
          },
        ],
        responses: {
          "200": {
            description: "Success. Returns the arrival details.",
          },
          "404": {
            description: "Arrival with the specified ID not found.",
          },
          "500": {
            description: "Database connection error or internal server failure.",
          },
        },
      },
    },
  },
};
