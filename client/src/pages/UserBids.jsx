import { Table, message } from "antd";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setLoader } from "../redux/loadersSlice";
import { GetAllBids } from "../apiCalls/products";
import moment from "moment";

const UserBids = () => {
  const [bidsData, setBidsData] = useState([]);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.users);
  const getData = async () => {
    try {
      dispatch(setLoader(true));
      const response = await GetAllBids({
        buyer: user._id,
      });
      dispatch(setLoader(false));
      if (response.success) {
        setBidsData(response.data);
      }
    } catch (error) {
      dispatch(setLoader(false));
      message.error(error.message);
    }
  };
  const column = [
    {
      title: "Product",
      dataIndex: "product",
      render: (text, record) => {
        return record.product.name;
      },
    },
    {
      title: "Bids placed on",
      dataIndex: "createdAt",
      render: (text, record) => {
        return moment(text).format("DD-MM-YY");
      },
    },
    {
      title: "Seller",
      dataIndex: "seller",
      render: (text, record) => {
        return record.seller.name;
      },
    },
    {
      title: "Offered Price",
      dataIndex: "offerPrice",
      render: (text, record) => {
        return record.product.price;
      },
    },
    {
      title: "Bid Amount",
      dataIndex: "bidAmount",
    },

    {
      title: "Message",
      dataIndex: "message",
    },
    {
      title: "Contact Details",
      dataIndex: "contactDetails",
      render: (text, record) => {
        return (
          <div>
            <p>Phone: {record.mobile}</p>
            <p>Email: {record.buyer.email}</p>
          </div>
        );
      },
    },
  ];

  useEffect(() => {
    getData();
  }, []);
  return (
    <div>
      <div className="flex flex-col gap-3">
        <Table columns={column} dataSource={bidsData} />
      </div>
    </div>
  );
};

export default UserBids;
