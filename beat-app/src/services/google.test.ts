import assert from "node:assert/strict";

import {
  buildWellnessMapEmbedUrl,
  buildWellnessMapsSearchQuery,
  buildWellnessMapsUrl,
  buildWellnessTextQuery,
  getWellnessPrimaryTypes,
  normalizeWellnessPlace,
} from "./google.ts";

run("buildWellnessTextQuery picks the right Google Places query per category", () => {
  assert.equal(buildWellnessTextQuery("healthy_restaurant"), "healthy restaurant");
  assert.equal(buildWellnessTextQuery("gym"), "gym");
});

run("buildWellnessMapsSearchQuery includes category label and location", () => {
  assert.equal(
    buildWellnessMapsSearchQuery({
      lat: 40.758,
      lng: -73.9855,
      category: "healthy_restaurant",
    }),
    "Healthy restaurants near 40.7580,-73.9855"
  );
});

run("getWellnessPrimaryTypes maps each category to Nearby Search primary types", () => {
  assert.deepEqual(getWellnessPrimaryTypes("gym"), ["gym", "fitness_center", "sports_club", "yoga_studio"]);
  assert.deepEqual(getWellnessPrimaryTypes("healthy_restaurant"), [
    "vegan_restaurant",
    "vegetarian_restaurant",
    "juice_shop",
    "mediterranean_restaurant",
    "restaurant",
  ]);
});

run("buildWellnessMapEmbedUrl uses search mode until a place is selected", () => {
  const searchUrl = buildWellnessMapEmbedUrl({
    apiKey: "maps-key",
    lat: 40.758,
    lng: -73.9855,
    category: "gym",
  });

  assert.match(searchUrl, /embed\/v1\/search/);
  assert.match(searchUrl, /Gym%20locations%20near%2040\.7580%2C-73\.9855/);

  const placeUrl = buildWellnessMapEmbedUrl({
    apiKey: "maps-key",
    lat: 40.758,
    lng: -73.9855,
    category: "healthy_restaurant",
    selectedPlace: {
      name: "Sweetgreen",
      address: "32 W 40th St, New York, NY",
    },
  });

  assert.match(placeUrl, /embed\/v1\/place/);
  assert.match(placeUrl, /Sweetgreen/);
});

run("buildWellnessMapsUrl creates a plain Google Maps search link", () => {
  const mapsUrl = buildWellnessMapsUrl({
    lat: 40.758,
    lng: -73.9855,
    category: "gym",
  });

  assert.match(mapsUrl, /maps\/search\/\?api=1/);
  assert.match(mapsUrl, /Gym%20locations%20near%2040\.7580%2C-73\.9855/);
});

run("normalizeWellnessPlace flattens Google place data into Beat's card model", () => {
  const normalized = normalizeWellnessPlace(
    {
      id: "gym-1",
      displayName: { text: "Equinox Bryant Park" },
      formattedAddress: "114 W 41st St, New York, NY",
      location: {
        lat: () => 40.7527,
        lng: () => -73.9842,
      },
      rating: 4.7,
      userRatingCount: 612,
      regularOpeningHours: {
        openNow: true,
      },
      googleMapsURI: "https://maps.google.com/?cid=123",
      primaryType: "gym",
    },
    {
      lat: 40.758,
      lng: -73.9855,
      category: "gym",
    }
  );

  assert.equal(normalized.id, "gym-1");
  assert.equal(normalized.name, "Equinox Bryant Park");
  assert.equal(normalized.category, "gym");
  assert.equal(normalized.openNow, true);
  assert.equal(normalized.rating, 4.7);
  assert.equal(normalized.reviewCount, 612);
  assert.match(normalized.mapsUrl ?? "", /cid=123/);
  assert.ok(normalized.distanceMi > 0);
});

console.log("All Google Maps service checks passed.");

function run(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}
