import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setLoader } from "../redux/loadersSlice";
import { GetProducts } from "../apiCalls/products";
import { message } from "antd";
import Divider from "../components/Divider";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const { user } = useSelector((state) => state.users);
  const [products, setProducts] = useState([]);
  const dispatch = useDispatch();
  const [filters, setFilters] = useState({
    status: "approved",
  });
  const navigate = useNavigate();
  const getData = async () => {
    try {
      dispatch(setLoader(true));
      const response = await GetProducts(filters);
      dispatch(setLoader(false));
      if (response.success) {
        setProducts(response.data);
      }
    } catch (error) {
      dispatch(setLoader(false));
      message.error(error.message);
    }
  };

  useEffect(() => {
    getData();
  }, []);
  console.log(products);
  return (
    <div>
      <div className="grid grid-cols-5 gap-5">
        {products?.map((product, i) => (
          <div
            onClick={() => navigate(`/product/${product._id}`)}
            className=" border-gray-300 rounded flex flex-col gap-5 border-solid cursor-pointer"
            key={i}
          >
            <img
              src={product?.images[0]}
              className="w-full h-40 object-cover"
            />

            <div className="px-2 flex flex-col gap-1">
              <h1 className="text-lg font-semibold">{product?.name} </h1>
              <p className="text-sm"> {product?.description}</p>
              <Divider />
              <span className="text-xl pb-2 font-semibold text-green-500">
                $ {product?.price}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
