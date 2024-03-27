/* eslint-disable react/prop-types */
import { message } from "antd";
import { useEffect } from "react";

import { GetCurrentUser } from "../apiCalls/user";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setLoader } from "../redux/loadersSlice";
import { setUser } from "../redux/userSlice";

const ProtectedPage = ({ children }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.users);
  const validateToken = async () => {
    try {
      dispatch(setLoader(true));
      const response = await GetCurrentUser();
      dispatch(setLoader(false));
      if (response.success) {
        dispatch(setUser(response.data));
      } else {
        message.error(response.message);
      }
    } catch (error) {
      dispatch(setLoader(false));
      navigate("/login");
      message.error(error.message);
    }
  };

  useEffect(() => {
    if (localStorage.getItem("token")) {
      validateToken();
    } else {
      navigate("/login");
    }
  }, []);
  return (
    user && (
      <div>
        {/* Header */}
        <div className="self-center whitespace-nowrap text-sm sm:text-xl font-semi-bold p-4 bg-slate-200 flex justify-between items-center">
          <p className="cursor-pointer">
            <span className="px-2 py-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg text-white">
              SHEY
            </span>
            MP
          </p>
          <div className="bg-white py-2 px-5 rounded flex gap-1">
            <i className="ri-user-line"></i>
            <span
              onClick={() => navigate("/profile")}
              className="hover:underline cursor-pointer uppercase"
            >
              {user.name}
            </span>
            <i
              onClick={() => {
                localStorage.removeItem("token");
                navigate("/login");
              }}
              className="ri-logout-box-r-line cursor-pointer ml-10"
            ></i>
          </div>
        </div>
        <div className="p-5">{children} </div>
      </div>
    )
  );
};

export default ProtectedPage;
