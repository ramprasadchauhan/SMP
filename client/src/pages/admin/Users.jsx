import { Table, message } from "antd";
import { useEffect, useState } from "react";

import { useDispatch } from "react-redux";
import { setLoader } from "../../redux/loadersSlice";
import { UpdateProductStatus } from "../../apiCalls/products";
import moment from "moment";
import { GetAllUsers, UpdateUserStatus } from "../../apiCalls/user";

const Users = () => {
  const dispatch = useDispatch();
  const [users, setUsers] = useState([]);

  const columns = [
    { title: "Name", dataIndex: "name" },
    { title: "Email", dataIndex: "email" },
    {
      title: "Role",
      dataIndex: "role",
      render: (text, record) => {
        return record.role.toUpperCase();
      },
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      render: (text, record) => {
        return moment(record.createdAt).format("DD-MM-YYYY hh:mm");
      },
    },

    {
      title: "Status",
      dataIndex: "status",
      render: (text, record) => {
        return record.status.toUpperCase();
      },
    },

    {
      title: "Action",
      dataIndex: "action",
      render: (text, record) => {
        const { status, _id } = record;
        return (
          <div className="flex gap-3">
            {status === "active" && (
              <span
                onClick={() => onStatusUpdate(_id, "blocked")}
                className="underline cursor-pointer"
              >
                Block
              </span>
            )}
            {status === "blocked" && (
              <span
                onClick={() => onStatusUpdate(_id, "active")}
                className="underline cursor-pointer"
              >
                Unblock
              </span>
            )}
          </div>
        );
      },
    },
  ];
  const onStatusUpdate = async (id, status) => {
    try {
      dispatch(setLoader(true));
      const response = await UpdateUserStatus(id, status);
      console.log(response);
      dispatch(setLoader(false));
      if (response.success) {
        getData();
        message.success(response.message);
      } else {
        return new Error(response.message);
      }
    } catch (error) {
      dispatch(setLoader(false));
      message.error(error.message);
    }
  };
  const getData = async () => {
    try {
      dispatch(setLoader(true));
      let response = await GetAllUsers(null);
      console.log(response);
      dispatch(setLoader(false));
      if (response.success) {
        setUsers(response.data);
      }
      console.log(users);
    } catch (error) {
      dispatch(setLoader(false));
      return message.error(error.message);
    }
  };

  useEffect(() => {
    getData();
  }, []);
  // useEffect(() => {
  //   onStatusUpdate();
  // }, []);
  console.log(users);
  return (
    <div>
      <Table
        columns={columns}
        dataSource={users}
        rowKey={(record) => record._id}
      />
    </div>
  );
};

export default Users;
