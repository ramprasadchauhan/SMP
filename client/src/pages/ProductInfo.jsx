import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setLoader } from "../redux/loadersSlice";
import { GetProductById } from "../apiCalls/products";
import { message } from "antd";
import { useParams } from "react-router-dom";
import Divider from "../components/Divider";
import moment from "moment";

const ProductInfo = () => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [product, setProduct] = useState(null);
  const dispatch = useDispatch();
  const { id } = useParams();
  const getData = async () => {
    try {
      dispatch(setLoader(true));
      const response = await GetProductById(id);
      dispatch(setLoader(false));
      if (response.success) {
        setProduct(response.data);
      }
    } catch (error) {
      dispatch(setLoader(false));
      message.error(error.message);
    }
  };

  useEffect(() => {
    getData();
  }, []);
  return (
    product && (
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Image */}

          <div className="flex flex-col gap-5">
            <img
              src={product.images[selectedImageIndex]}
              alt=""
              className={`w-full h-96 object-cover rounded`}
            />
            <div className="flex gap-5">
              {product.images.map((image, index) => (
                <img
                  src={image}
                  key={index}
                  className={`w-20 h-20 object-cover rounded-md cursor-pointer ${
                    selectedImageIndex === index
                      ? "border-2 border-green-600 border-dashed p-2"
                      : ""
                  } `}
                  alt=""
                  onClick={() => setSelectedImageIndex(index)}
                />
              ))}
            </div>
            <Divider />
            <div>
              <h1>Added On</h1>
              <span>{moment(product.createdAt).format("MMM D, YYYY")}</span>
            </div>
          </div>
          {/* details  */}
          <div className="flex flex-col gap-5">
            <div>
              <h1 className="text-2xl font-semibold text-amber-700">
                {product?.name}
              </h1>
              <span>{product?.description} </span>
            </div>
            <Divider />
            <div className="flex flex-col">
              <h1 className="text-2xl font-semibold text-orange-900">
                Product Details
              </h1>
              <div className="flex justify-between mt-2">
                <span>Price</span>
                <span>$ {product?.price} </span>
              </div>
              <div className="flex justify-between mt-2">
                <span>Category</span>
                <span className="uppercase"> {product?.category} </span>
              </div>
              <div className="flex justify-between mt-2">
                <span>Bill Available</span>
                <span> {product?.billAvailable ? "Yes" : "No"} </span>
              </div>
              <div className="flex justify-between mt-2">
                <span>Box Available</span>
                <span> {product?.boxAvailable ? "Yes" : "No"} </span>
              </div>
              <div className="flex justify-between mt-2">
                <span>Accessories Available</span>
                <span> {product?.accessoriesAvailable ? "Yes" : "No"} </span>
              </div>
              <div className="flex justify-between mt-2">
                <span>Warranty Available</span>
                <span> {product?.warrantyAvailable ? "Yes" : "No"} </span>
              </div>
            </div>
            <Divider />
            <div className="flex flex-col">
              <h1 className="text-2xl font-semibold text-orange-900">
                Seller Details
              </h1>
              <div className="flex justify-between mt-2">
                <span>Name</span>
                <span>{product?.seller.name} </span>
              </div>
              <div className="flex justify-between mt-2">
                <span>Email</span>
                <span> {product?.seller.email} </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  );
};

export default ProductInfo;
