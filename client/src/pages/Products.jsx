import { Button, Table, message } from "antd";
import { useEffect, useState } from "react";
import ProductForm from "./ProductForm";
import { useDispatch, useSelector } from "react-redux";
import { setLoader } from "../redux/loadersSlice";
import { DeleteProduct, GetProducts } from "../apiCalls/products";
import moment from "moment";
import Bids from "./Bids";

const Products = () => {
  const [showProductForm, setShowProductForm] = useState(false);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.users);
  const [products, setProducts] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showBids, setShowBids] = useState(false);

  const deleteProduct = async (id) => {
    const shouldDelete = window.confirm(
      "Are you sure you want to delete this product?"
    );
    if (!shouldDelete) return;
    try {
      dispatch(setLoader(true));
      const response = await DeleteProduct(id);
      dispatch(setLoader(false));
      if (response.success) {
        message.success(response.message);
        getData();
      } else {
        return message.error(response.message);
      }
    } catch (error) {
      dispatch(setLoader(false));
      return message.error(error.message);
    }
  };

  const columns = [
    {
      title: "Product",
      dataIndex: "image",
      render: (text, record) => {
        return (
          <img
            className="w-20 h-20 object-cover rounded-md hover:scale-105"
            src={record?.images?.length > 0 ? record?.images[0] : ""}
            alt="No image"
          />
        );
      },
    },
    { title: "Name", dataIndex: "name" },
    // { title: "Description", dataIndex: "description", ellipsis: true },
    { title: "Price", dataIndex: "price" },
    { title: "Category", dataIndex: "category" },
    { title: "Age", dataIndex: "age" },
    { title: "Status", dataIndex: "status" },
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
        return (
          <div className="flex gap-5 items-center cursor-pointer">
            <i
              className="ri-delete-bin-6-line font-semibold text-red-400"
              onClick={() => deleteProduct(record._id)}
            ></i>
            <i
              className="ri-edit-line font-semibold"
              onClick={() => {
                setSelectedProduct(record);
                setShowProductForm(true);
              }}
            ></i>
            <span
              onClick={() => {
                setSelectedProduct(record);
                setShowBids(true);
              }}
              className="underline"
            >
              show Bids
            </span>
          </div>
        );
      },
    },
  ];
  const getData = async () => {
    try {
      dispatch(setLoader(true));
      const response = await GetProducts({
        seller: user._id,
      });
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
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setSelectedProduct(null);
            setShowProductForm(true);
          }}
          className="rounded-md mb-2"
          type="default"
        >
          Add Products
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={products}
        rowKey={(record) => record._id}
      />
      {showProductForm && (
        <ProductForm
          showProductForm={showProductForm}
          setShowProductForm={setShowProductForm}
          selectedProduct={selectedProduct}
          getData={getData}
        />
      )}
      {showBids && (
        <Bids
          showBidsModal={showBids}
          setShowBidsModal={setShowBids}
          selectedProduct={selectedProduct}
        />
      )}
    </div>
  );
};

export default Products;
