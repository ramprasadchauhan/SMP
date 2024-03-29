import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setLoader } from "../redux/loadersSlice";
import { GetAllBids, GetProductById } from "../apiCalls/products";
import { Button, message } from "antd";
import { useParams } from "react-router-dom";
import Divider from "../components/Divider";
import moment from "moment";
import BidModal from "../components/BidModal";

const ProductInfo = () => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [product, setProduct] = useState(null);
  const [showAddNewBid, setShowAddNewBid] = useState("");
  const dispatch = useDispatch();
  const { id } = useParams();
  const { user } = useSelector((state) => state.users);
  const getData = async () => {
    try {
      dispatch(setLoader(true));
      const response = await GetProductById(id);
      dispatch(setLoader(false));
      if (response.success) {
        const bidsResponse = await GetAllBids({ product: id });
        // const bidsResponse = await GetAllBids(id);

        setProduct({
          ...response.data,
          bids: bidsResponse.data,
        });
      }
    } catch (error) {
      dispatch(setLoader(false));
      message.error(error.message);
    }
  };

  useEffect(() => {
    getData();
  }, []);
  console.log(product);
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
              <div className="flex justify-between mt-2">
                <span>Purchaged Year</span>
                <span>
                  {moment().subtract(product.age, "years").format("YYYY")} (
                  {product.age} years ago)
                </span>
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
            <Divider />
            <div className="flex flex-col">
              <div className="flex justify-between">
                <h1 className="text-2xl font-semibold text-orange-900">Bids</h1>
                <Button
                  onClick={() => {
                    setShowAddNewBid(!showAddNewBid);
                  }}
                  disabled={user._id === product.seller._id}
                >
                  New Bid
                </Button>
              </div>
            </div>
            {product.showBidsOnProductPage &&
              product?.bids?.map((bid, i) => (
                <div
                  className="border border-gray-300 border-solid p-3 rounded mt-5"
                  key={i}
                >
                  <div className="flex justify-between mt-2 text-gray-600 p-2">
                    <span>Name</span>
                    <span> {bid.buyer.name} </span>
                  </div>
                  <div className="flex justify-between mt-2 text-gray-600">
                    <span>Bid Amount</span>
                    <span>$ {bid.bidAmount} </span>
                  </div>
                  <div className="flex justify-between mt-2 text-gray-600">
                    <span>Bid place On</span>
                    <span> {moment(bid.createdAt).format("MMM D, YYYY")}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
        {showAddNewBid && (
          <BidModal
            product={product}
            reloadData={getData}
            showBidModal={showAddNewBid}
            setShowBidModal={setShowAddNewBid}
          />
        )}
      </div>
    )
  );
};

export default ProductInfo;
