/* eslint-disable jsx-a11y/anchor-is-valid */
import { Table, Space, Button } from "antd";
import "antd/dist/antd.min.css";
import { useEffect, useState } from "react";

const video = document.getElementById("video");

function App() {
  const [datas, setDatas] = useState([]);
  const [refreshNum, refresh] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const columns = [
    {
      title: "error message",
      dataIndex: ["content", "errorInfo", "message"],
    },
    {
      title: "stack",
      dataIndex: ["content", "errorInfo", "stack"],
      render: (value) => (
        <span style={{ whiteSpace: "pre-line" }}>{value}</span>
      ),
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
                  events: record.content.logs,
                },
              });
              video.style.display = "flex";
              replayer.play();
              e.preventDefault();
            }}
          >
            Replay
          </a>
          <a
            onClick={(e) => {
              // eslint-disable-next-line no-undef
              if (!window.confirm("Are you sure to Delete it?")) {
                return;
              }
              fetch("http://localhost:9981/api/delete?name=" + record.key, {
                method: "GET",
              }).then((f) => {
                const newDatas = [...datas];
                newDatas.splice(
                  datas.findIndex((e) => e.key === record.key),
                  1
                );
                setDatas(newDatas);
              });
            }}
          >
            Delete
          </a>
        </Space>
      ),
    },
  ];

  useEffect(() => {
    setIsLoading(true);
    (async function fetchData() {
      try {
        const response = await fetch("http://localhost:9981/api/records", {
          method: "GET",
        });
        const data = (await response.json())
          .map((d) => {
            try {
              return { key: d.key, content: JSON.parse(d.content) };
            } catch (e) {
              return false;
            }
          })
          .filter(Boolean);
        setDatas(data);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [refreshNum]);

  return (
    <div className="App">
      <div>
        <Button
          onClick={() => {
            if (!window.confirm("Are you sure to Delete all?")) {
              return;
            }
            fetch("http://localhost:9981/api/delete", {
              method: "GET",
            }).then((f) => {
              setDatas([]);
            });
          }}
          style={{
            margin: "20px",
            marginBottom: 0,
          }}
          type="primary"
        >
          Remove All
        </Button>
        <Button
          onClick={() => {
            refresh((prev) => prev + 1);
          }}
          style={{
            margin: "20px",
            marginBottom: 0,
          }}
          type="primary"
        >
          Refresh
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={datas}
        loading={isLoading}
        style={{
          margin: "20px",
        }}
      />
    </div>
  );
}

export default App;
