export const tripData = async (lowerLim = 0, upperLim = 1000) => {
  const response = await fetch(
    'https://demo.questdb.io/exec?query=Select+pickup_datetime%2Ctrip_distance+from+trips+where+pickup_datetime+%3E%3D+%272009-01-01T00%3A00%3A03.000Z%27+AND+pickup_datetime+%3C%3D+%272009-01-01T00%3A10%3A00.000Z%27%3B'
  );

  const data = await response.json();

  // console.log(upperLim, lowerLim);
  const cols = data.columns.map((obj) => obj.name);

  const dataset = data.dataset.map((trip) => {
    let object = {};
    trip.forEach((col, index) => {
      if (index === 0) {
        col = new Date(col).toLocaleString('en-US');
      }

      object[cols[index]] = col;
    });
    return object;
  });

  return dataset;
};
