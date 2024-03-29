/* eslint-disable react/prop-types */
import { Avatar, Badge, message } from "antd";
import { useEffect, useState } from "react";

import { GetCurrentUser } from "../apiCalls/user";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setLoader } from "../redux/loadersSlice";
import { setUser } from "../redux/userSlice";
import Notification from "./Notification";
import {
  GetAllNotification,
  ReadAllNotification,
} from "../apiCalls/notification";

const ProtectedPage = ({ children }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
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
  const getNotifications = async () => {
    try {
      const response = await GetAllNotification();

      if (response.success) {
        setNotifications(response.data);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      message.error(error.message);
    }
  };
  useEffect(() => {
    if (localStorage.getItem("token")) {
      validateToken();
      getNotifications();
    } else {
      navigate("/login");
    }
  }, []);

  const readNotification = async () => {
    try {
      const response = await ReadAllNotification();

      if (response.success) {
        getNotifications();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      message.error(error.message);
    }
  };

  return (
    user && (
      <div>
        {/* Header */}
        <div className="self-center whitespace-nowrap text-sm sm:text-xl font-semi-bold p-4 bg-slate-200 flex justify-between items-center">
          <p onClick={() => navigate("/")} className="cursor-pointer">
            <span className="px-2 py-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg text-white">
              SHEY
            </span>
            MP
          </p>
          <div className="bg-white py-2 px-5 rounded flex gap-1">
            <span
              onClick={() => {
                if (user.role === "user") {
                  navigate("/profile");
                } else {
                  navigate("/admin");
                }
              }}
              className="hover:underline cursor-pointer uppercase"
            >
              {user.name}
            </span>
            <Badge
              className="cursor-pointer"
              onClick={() => {
                readNotification();
                setShowNotifications(true);
              }}
              count={
                notifications.filter((notification) => !notification.read)
                  .length
              }
            >
              <Avatar
                style={{ backgroundColor: "white", borderColor: "lightblue" }}
                shape="circle"
                size="medium"
                icon={
                  <i className="ri-notification-line text-2xl text-green-400"></i>
                }
              />
            </Badge>
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
        {
          <Notification
            notifications={notifications}
            reloadNotifications={getNotifications}
            showNotification={showNotifications}
            setShowNotification={setShowNotifications}
          />
        }
      </div>
    )
  );
};

export default ProtectedPage;
