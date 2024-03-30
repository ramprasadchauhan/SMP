import { Button, Form, Input, message } from "antd";
import { Link, useNavigate } from "react-router-dom";
import Divider from "../components/Divider";
import { RegisterUser } from "../apiCalls/user";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setLoader } from "../redux/loadersSlice";

const rules = [
  {
    required: true,
    message: "required",
  },
];

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const onFinish = async (values) => {
    try {
      dispatch(setLoader(true));
      const response = await RegisterUser(values);
      dispatch(setLoader(false));

      if (response.success) {
        navigate("/login");
        message.success({
          type: "success",
          content: response.message,
        });
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      dispatch(setLoader(false));
      message.error(error.message);
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
          SMP ~ <span className="text-gray-400 text-2xl">REGISTER</span>
        </h1>
        <Divider />
        <Form onFinish={onFinish} layout="vertical">
          <Form.Item label="Name" name="name" rules={rules}>
            <Input placeholder="Name" />
          </Form.Item>
          <Form.Item label="Email" name="email" rules={rules}>
            <Input placeholder="Email" />
          </Form.Item>
          <Form.Item label="Password" name="password" rules={rules}>
            <Input type="password" placeholder="Password" />
          </Form.Item>
          <div className="">
            <Button
              type="primary"
              className="font-semibold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-tl-md rounded-br-md mt-2 "
              htmlType="submit"
              block
            >
              Register
            </Button>
          </div>
          <div className="mt-5 text-center">
            <span className="text-gray-500">
              Already have an account?
              <Link
                className="hover:underline text-primary pl-4 font-semibold"
                to="/login"
              >
                Login
              </Link>
            </span>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default Register;
