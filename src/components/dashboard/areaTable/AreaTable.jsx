import "./AreaTable.scss";

const TABLE_HEADS = [
  "Sensors Used",
  "Sensor ID",
  "Installation Date",
  "Status",
];

const TABLE_DATA = [
  {
    id: 100,
    name: "Temperature Sensor",
    sensor_id: 11232,
    installation_date: "Jun 29, 2022",
    status: "active",
  },
  {
    id: 101,
    name: "Humidity Sensor",
    sensor_id: 11233,
    installation_date: "Jun 30, 2022",
    status: "inactive",
  },
  {
    id: 102,
    name: "pH Sensor",
    sensor_id: 11234,
    installation_date: "Jul 01, 2022",
    status: "active",
  },
  {
    id: 103,
    name: "Water Level Sensor",
    sensor_id: 11235,
    installation_date: "Jul 02, 2022",
    status: "active",
  },
  {
    id: 104,
    name: "NPK Sensor",
    sensor_id: 11236,
    installation_date: "Jul 03, 2022",
    status: "inactive",
  },
];

const AreaTable = () => {
  return (
    <section className="content-area-table">
      <div className="data-table-info">
        <h4 className="data-table-title">Sensors Used</h4>
      </div>
      <div className="data-table-diagram">
        <table>
          <thead>
            <tr>
              {TABLE_HEADS.map((th, index) => (
                <th key={index}>{th}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TABLE_DATA.map((dataItem) => (
              <tr key={dataItem.id}>
                <td>{dataItem.name}</td>
                <td>{dataItem.sensor_id}</td>
                <td>{dataItem.installation_date}</td>
                <td>
                  <div className="dt-status">
                    <span className={`dt-status-dot dot-${dataItem.status}`}></span>
                    <span className="dt-status-text">{dataItem.status}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default AreaTable;
