import { Tabs } from "antd";
import Products from "./Products";
import UserBids from "./UserBids";
import { useSelector } from "react-redux";
import moment from "moment";
const Profile = () => {
  const { user } = useSelector((state) => state.users);
  return (
    <div>
      <Tabs defaultActiveKey="1">
        <Tabs.TabPane tab="Products" key="1">
          <Products />
        </Tabs.TabPane>
        <Tabs.TabPane tab="My Bids" key="2">
          <UserBids />
        </Tabs.TabPane>
        <Tabs.TabPane tab="General" key="3">
          <div className="flex flex-col gap-2 w-1/3">
            <p className="text-primary flex justify-between text-xl">
              Name: <span className="text-xl">{user.name}</span>
            </p>
            <p className="text-primary flex justify-between text-xl">
              Email: <span className="text-xl">{user.email}</span>
            </p>
            <p className="text-primary flex justify-between text-xl">
              Created At:
              <span className="text-xl">
                {moment(user.createdAt).format("MMM D, YYYY")}
              </span>
            </p>
          </div>
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};

export default Profile;
