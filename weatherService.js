async function getWeatherByRegion(region) {
  const geoRes = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      region
    )}&count=1&language=en&format=json`
  );

  if (!geoRes.ok) {
    throw new Error("Geokodlash muvaffaqiyatsiz yakunlandi.");
  }

  const geoData = await geoRes.json();
  const place = geoData?.results?.[0];

  if (!place) {
    throw new Error("Bu hudud topilmadi. Boshqa nom bilan urinib ko'ring.");
  }

  const weatherRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m`
  );

  if (!weatherRes.ok) {
    throw new Error("Ob-havo xizmati vaqtincha ishlamayapti.");
  }

  const weatherData = await weatherRes.json();
  const current = weatherData?.current;

  if (!current) {
    throw new Error("Joriy ob-havo ma'lumoti topilmadi.");
  }

  return {
    region: place.name,
    temperature: Math.round(current.temperature_2m),
    humidity: Math.round(current.relative_humidity_2m),
  };
}

module.exports = {
  getWeatherByRegion,
};
