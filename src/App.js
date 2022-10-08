/* eslint-disable jsx-a11y/anchor-is-valid */
import { Table, Space } from "antd";
import "antd/dist/antd.min.css";
import { useEffect, useState } from "react";

const video = document.getElementById("video");
const columns = [
  {
    title: "error message",
    dataIndex: ["errorInfo", "message"],
  },
  {
    title: "stack",
    dataIndex: ["errorInfo", "stack"],
  },
  {
    title: "Action",
    key: "action",
    render: (_, record) => (
      <Space size="middle">
        <a
          onClick={(e) => {
            // eslint-disable-next-line no-undef
            const replayer = new rrwebPlayer({
              target: video, // customizable root element
              props: {
                events: record.logs,
              },
            });
            video.style.display = "flex";
            replayer.play();
            e.preventDefault();
          }}
        >
          User Actions Replay
        </a>
      </Space>
    ),
  },
];

function App() {
  const [datas, setDatas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    setIsLoading(true);
    (async function fetchData() {
      try {
        const response = await fetch("http://localhost:9981/api/records", {
          method: "GET",
        });
        const data = (await response.json()).map((d) => JSON.parse(d));
        setDatas(data);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return (
    <div className="App">
      <Table columns={columns} dataSource={datas} loading={isLoading} />
    </div>
  );
}

export default App;
