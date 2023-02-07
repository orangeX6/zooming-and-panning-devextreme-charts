import React, { useEffect, useState } from 'react';
import Chart, {
  ArgumentAxis,
  AggregationInterval,
  Series,
  ZoomAndPan,
  ScrollBar,
  Title,
  Font,
  ValueAxis,
  Label,
} from 'devextreme-react/chart';
// import { zoomingData } from './data.js';
import { tripData } from './tripsData';

function getDateString(dateTime) {
  return dateTime ? dateTime.toLocaleString('en-US') : '';
}

function getDataFrame(args) {
  let params = '?';

  params += `startVisible=${args.startVisible}
    &endVisible=${args.endVisible}
    &startBound=${args.startBound}
    &endBound=${args.endBound}`;

  return fetch(
    `https://js.devexpress.com/Demos/WidgetsGallery/data/temperatureData${params}`
  ).then((response) => response.json());
}

function App() {
  const wholeRange = {
    startValue: new Date(2009, 0, 1),
    endValue: Date.now(),
    // seconds: 6000,
  };

  const [data, setData] = useState([]);

  const [limits, setLimits] = useState({
    lowerLimit: 0,
    upperLimit: 1000,
  });

  // const [vDate, setVDate] = useState(new Date(2009, 0, 1));

  const [visualRange, setVisualRange] = useState({
    startValue: new Date(2009, 0, 1),
    // length: { seconds: 30 },
    endValue: new Date(2009, 0, 1, 0, 5, 30),
  });

  const HALFDAY = 300;
  let packetsLock = 0;

  useEffect(() => {
    let trips;
    setLimits((prev) => {
      return {
        lowerLimit: prev.lowerLimit + 1000,
        upperLimit: prev.upperLimit + 1000,
      };
    });

    (async () => {
      trips = await tripData(...limits);
      setData((prev) => [...prev, ...trips]);
      console.log(new Date(trips.at(-1).pickup_datetime).toISOString());
      // setVDate(trips.at(-1).pickup_datetime);
    })();
  }, []);

  const handleChange = (e) => {
    // console.log(e);
    if (e.fullName === 'argumentAxis.visualRange') {
      const stateStart = visualRange.startValue;
      const currentStart = e.value.startValue;
      if (stateStart.valueOf() !== currentStart.valueOf()) {
        setVisualRange(e.value);
      }

      onVisualRangeChanged(e.component);
    }
  };

  const onVisualRangeChanged = (component) => {
    const items = component.getDataSource().items();
    console.log(items);
    if (
      !items.length ||
      items[0].pickup_datetime - visualRange.startValue >= HALFDAY ||
      visualRange.endValue - items[items.length - 1].pickup_datetime >= HALFDAY
    ) {
      console.log('SOMETHING');
      uploadDataByVisualRange(visualRange, component);
    }
  };

  const uploadDataByVisualRange = (visualRange, component) => {
    const dataSource = component.getDataSource();
    console.log(dataSource);
    const storage = dataSource.items();
    console.log(storage);
    const ajaxArgs = {
      startVisible: getDateString(visualRange.startValue),
      endVisible: getDateString(visualRange.endValue),
      startBound: getDateString(
        storage.length ? storage[0].pickup_datetime : null
      ),
      endBound: getDateString(
        storage.length ? storage[storage.length - 1].pickup_datetime : null
      ),
    };

    console.log(ajaxArgs);

    if (
      ajaxArgs.startVisible !== ajaxArgs.startBound &&
      ajaxArgs.endVisible !== ajaxArgs.endBound &&
      !packetsLock
    ) {
      packetsLock += 1;
      component.showLoadingIndicator();

      getDataFrame(ajaxArgs)
        .then((dataFrame) => {
          packetsLock -= 1;

          const componentStorage = dataSource.store();

          dataFrame
            .map((i) => ({
              date: new Date(i.Date),
              minTemp: i.MinTemp,
              maxTemp: i.MaxTemp,
            }))
            .forEach((item) => componentStorage.insert(item));
          dataSource.reload();

          onVisualRangeChanged(component);
        })
        .catch(() => {
          packetsLock -= 1;
          // dataSource.reload();
        });
    }
  };

  return (
    <Chart
      id="chart"
      title="Trips"
      palette="Harmony Light"
      dataSource={data}
      onOptionChanged={handleChange}
    >
      <Series
        argumentField="pickup_datetime"
        valueField="trip_distance"
        name="Trip "
      />
      {/* <Series argumentField="arg" valueField="y2" /> */}
      <ArgumentAxis
        // argumentType="datetime"
        visualRangeUpdateMode="keep"
        visualRange={visualRange}
        wholeRange={wholeRange}
      >
        <AggregationInterval seconds={50} />
      </ArgumentAxis>
      <ScrollBar visible={true} />
      <ZoomAndPan argumentAxis="both" />
      <ValueAxis name="trip_distance" allowDecimals={false}>
        <Title text={'Trip Distance, units'}>
          <Font color="#ff950c" />
        </Title>
        <Label>
          <Font color="#ff950c" />
        </Label>
      </ValueAxis>
    </Chart>
  );
}

export default App;
