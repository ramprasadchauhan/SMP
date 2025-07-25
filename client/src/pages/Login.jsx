import { Button, Form, Input, message } from "antd";
import { Link, useNavigate } from "react-router-dom";
import Divider from "../components/Divider";
import { GetCurrentUser, LoginUser } from "../apiCalls/user";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setLoader } from "../redux/loadersSlice";
import { setUser } from "../redux/userSlice";

const rules = [
  {
    required: true,
    message: "required",
  },
];

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const onFinish = async (values) => {
    try {
      dispatch(setLoader(true));
      const response = await LoginUser(values);
      console.log("response ", response);
      if (response.success) {
        message.success(response.message);
        localStorage.setItem("token", response.data);
        const user = await GetCurrentUser();
        console.log(user);
        dispatch(setUser(user.data));
        dispatch(setLoader(false));
        navigate("/");
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      dispatch(setLoader(false));
      console.log(error);
      return message.error(error.message);
    } finally {
      dispatch(setLoader(false));
    }
  };
  useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate("/");
    }
  }, []);
  return (
    <div className="min-h-screen bg-primary flex justify-center items-center">
      <div className="bg-white p-5 w-[450px] rounded">
        <h1 className="text-primary text-2xl">
          SMP ~ <span className="text-gray-400 text-2xl">LOGIN</span>
        </h1>
        <Divider />
        <Form onFinish={onFinish} layout="vertical">
          <Form.Item label="Email" name="email" rules={rules}>
            <Input placeholder="Email" />
          </Form.Item>
          <Form.Item label="Password" name="password" rules={rules}>
            <Input type="password" placeholder="Password" />
          </Form.Item>
          <Button
            type="primary"
            className="font-semibold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-tl-md rounded-br-md mt-2 "
            htmlType="submit"
            block
          >
            Login
          </Button>
          <div className="mt-5 text-center">
            <span className="text-gray-500">
              Don&apos;t have an account?
              <Link
                className="hover:underline text-primary pl-4 font-semibold"
                to="/register"
              >
                Register
              </Link>
            </span>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default Login;
