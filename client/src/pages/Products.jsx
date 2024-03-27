import { Button, Table, message } from "antd";
import { useEffect, useState } from "react";
import ProductForm from "./ProductForm";
import { useDispatch, useSelector } from "react-redux";
import { setLoader } from "../redux/loadersSlice";
import { DeleteProduct, GetProducts } from "../apiCalls/products";
import moment from "moment";

const Products = () => {
  const [showProductForm, setShowProductForm] = useState(false);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.users);
  const [products, setProducts] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

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
    { title: "Name", dataIndex: "name" },
    { title: "Description", dataIndex: "description" },
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
          <div className="flex gap-5">
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
        setProducts(response.products);
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
    </div>
  );
};

export default Products;
