import { Modal, message } from "antd";
import Divider from "./Divider";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { DeleteNotification } from "../apiCalls/notification";
import { useDispatch } from "react-redux";
import { setLoader } from "../redux/loadersSlice";

const Notification = ({
  notifications = [],
  reloadNotifications,
  showNotification,
  setShowNotification,
}) => {
  const navigate = useNavigate();
  console.log(notifications);
  const dispatch = useDispatch();
  const deleteNotification = async (id) => {
    try {
      dispatch(setLoader(true));
      const response = await DeleteNotification(id);
      dispatch(setLoader(false));
      if (response.success) {
        message.success(response.message);
        reloadNotifications();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      dispatch(setLoader(false));
      message.error(error.message);
    }
  };
  return (
    <Modal
      width={1000}
      title="Notification"
      open={showNotification}
      onCancel={() => setShowNotification(false)}
      footer={null}
      centered
    >
      <div className="flex flex-col gap-2">
        {notifications.map((notification) => (
          <div
            className="flex gap-2 border border-solid border-gray-300 rounded-md p-2 flex-col cursor-pointer"
            key={notification._id}
          >
            <div className="flex justify-between items-center">
              <div
                onClick={() => {
                  navigate(notification.onClick);
                  setShowNotification(false);
                }}
              >
                <h1 className="text-gray-700">{notification.title}</h1>
                <p className="text-gray-600">{notification.message} </p>
                <span className="text-gray-500 text-sm">
                  {moment(notification.createdAt).fromNow()}
                </span>
              </div>
              <i
                className="ri-delete-bin-6-line font-semibold text-red-400"
                onClick={() => deleteNotification(notification._id)}
              ></i>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default Notification;
