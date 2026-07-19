// server/src/swagger-spec.ts

export const swaggerSpec = {
  "openapi": "3.0.0",
  "info": {
    "title": "Train Departure API",
    "description": "API for retrieving real-time train departures and service details.",
    "version": "1.0.0"
  },
  "paths": {
    "/api/v1/stations/{crs}": {
      "get": {
        "summary": "Get details for a specific station by CRS code",
        "parameters": [
          {
            "in": "path",
            "name": "crs",
            "required": true,
            "description": "The 3-letter station CRS code (e.g., EUS)",
            "schema": { "type": "string" }
          }
        ],
        "responses": {
          "200": {
            "description": "Station details",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "id": { "type": "string" },
                    "name": { "type": "string" },
                    "crs": { "type": "string" }
                  }
                }
              }
            }
          },
          "404": { "description": "Station not found" }
        }
      }
    },
    "/api/v1/departures/{crs}": {
      "get": {
        "summary": "Get departure board for a station",
        "parameters": [
          {
            "in": "path",
            "name": "crs",
            "required": true,
            "description": "The 3-letter station CRS code (e.g., EUS)",
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "A list of upcoming services",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/Service"
                  }
                }
              }
            }
          },
          "500": {
            "description": "Server error"
          }
        }
      }
    },
    "/api/v1/service/{rid}": {
      "get": {
        "summary": "Get details for a specific train service",
        "parameters": [
          {
            "in": "path",
            "name": "rid",
            "required": true,
            "description": "The unique Service ID (e.g., RID-12345)",
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Full service details",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Service"
                }
              }
            }
          },
          "404": {
            "description": "Service not found"
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "Service": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "trainUid": { "type": "string" },
          "departureInfo": { "type": "string", "format": "date-time" },
          "operator": {
            "type": "object",
            "properties": {
              "name": { "type": "string" },
              "code": { "type": "string" }
            }
          },
          "status": {
            "type": "object",
            "properties": {
              "status": { "type": "string" },
              "delayMinutes": { "type": "integer" },
              "reason": { "type": "string", "nullable": true }
            }
          },
          "stops": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "stopOrder": { "type": "integer" },
                "scheduledTime": { "type": "string", "format": "date-time" },
                "estimatedTime": { "type": "string", "format": "date-time", "nullable": true },
                "station": {
                  "type": "object",
                  "properties": {
                    "name": { "type": "string" },
                    "crs": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
