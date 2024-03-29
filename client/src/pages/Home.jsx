import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setLoader } from "../redux/loadersSlice";
import { GetProducts } from "../apiCalls/products";
import { message } from "antd";
import Divider from "../components/Divider";
import { useNavigate } from "react-router-dom";
import Filter from "../components/Filter";

const Home = () => {
  const { user } = useSelector((state) => state.users);
  const [products, setProducts] = useState([]);
  const dispatch = useDispatch();
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState({
    status: "approved",
    category: [],
    age: [],
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

  // useEffect(() => {
  //   getData();
  // }, []);
  useEffect(() => {
    getData();
  }, [filters]);
  console.log(products);
  return (
    <div className="flex w-full gap-5">
      {showFilters && (
        <Filter
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          setFilters={setFilters}
          filters={filters}
        />
      )}

      <div className="flex flex-col gap-5">
        <div className="flex gap-5 items-center">
          {!showFilters && (
            <i
              onClick={() => setShowFilters(!showFilters)}
              className="ri-equalizer-line text-xl hover:scale-125"
            ></i>
          )}
          <input
            type="text"
            placeholder="Search products here"
            className="border border-gray-300 rounded border-solid w-full p-2 h-14"
          />
        </div>
        <div
          className={`grid gap-5 ${
            showFilters ? "grid-cols-4" : "grid-cols-5"
          } `}
        >
          {products?.map((product, i) => (
            <div
              onClick={() => navigate(`/product/${product._id}`)}
              className=" border-gray-300 rounded flex flex-col gap-5 border-solid cursor-pointer"
              key={i}
            >
              <img
                src={product?.images[0]}
                className="w-full h-52 object-cover p-3 rounded-lg hover:scale-105"
              />

              <div className="px-2 flex flex-col gap-1">
                <h1 className="text-lg font-semibold">{product?.name} </h1>
                <p className="text-sm max-h-8 truncate">
                  {product?.description}
                </p>
                <Divider />
                <span className="text-xl pb-2 font-semibold text-green-500">
                  $ {product?.price}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
