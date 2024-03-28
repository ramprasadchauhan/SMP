import { Table, message } from "antd";
import { useEffect, useState } from "react";

import { useDispatch } from "react-redux";
import { setLoader } from "../../redux/loadersSlice";
import { GetProducts, UpdateProductStatus } from "../../apiCalls/products";
import moment from "moment";

const Products = () => {
  const dispatch = useDispatch();
  const [products, setProducts] = useState([]);

  const columns = [
    { title: "Product", dataIndex: "name" },
    {
      title: "Seller",
      dataIndex: "name",
      render: (text, record) => {
        return record.seller.name;
      },
    },
    { title: "Description", dataIndex: "description" },
    { title: "Price", dataIndex: "price" },
    { title: "Category", dataIndex: "category" },
    { title: "Age", dataIndex: "age" },
    {
      title: "Status",
      dataIndex: "status",
      render: (text, record) => {
        return record.status.toUpperCase();
      },
    },
    {
      title: "Added On",
      dataIndex: "createdAt",
      render: (text, record) => {
        return moment(record.createdAt).format("DD/MM/YYYY hh:mm A");
      },
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (text, record) => {
        const { status, _id } = record;
        return (
          <div className="flex gap-3">
            {status === "pending" && (
              <span
                onClick={() => onStatusUpdate(_id, "approved")}
                className="underline cursor-pointer"
              >
                Approved
              </span>
            )}
            {status === "pending" && (
              <span
                onClick={() => onStatusUpdate(_id, "rejected")}
                className="underline cursor-pointer"
              >
                Reject
              </span>
            )}
            {status === "approved" && (
              <span
                onClick={() => onStatusUpdate(_id, "blocked")}
                className="underline cursor-pointer"
              >
                Block
              </span>
            )}
            {status === "blocked" && (
              <span
                onClick={() => onStatusUpdate(_id, "approved")}
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
      const response = await UpdateProductStatus(id, status);
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
      const response = await GetProducts(null);
      console.log(response);
      dispatch(setLoader(false));
      if (response.success) {
        setProducts(response.data);
      }
    } catch (error) {
      dispatch(setLoader(false));
      return message.error(error.message);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  return (
    <div>
      <Table
        columns={columns}
        dataSource={products}
        rowKey={(record) => record._id}
      />
    </div>
  );
};

export default Products;
