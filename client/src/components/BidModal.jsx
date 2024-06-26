import { Form, Input, Modal, message } from "antd";
import { useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setLoader } from "../redux/loadersSlice";
import { AddNewBid } from "../apiCalls/products";
import { AddNotification } from "../apiCalls/notification";

const BidModal = ({ showBidModal, setShowBidModal, product, reloadData }) => {
  const dispatch = useDispatch();
  const formRef = useRef();
  const { user } = useSelector((state) => state.users);
  const rules = [
    {
      required: true,
      message: "Required",
    },
  ];
  console.log(product);
  console.log(user.name);
  const onFinish = async (values) => {
    try {
      dispatch(setLoader(true));
      const response = await AddNewBid({
        ...values,
        product: product._id,
        seller: product.seller._id,
        buyer: user._id,
      });
      console.log(product);
      console.log(response);
      console.log(user.name);

      dispatch(setLoader(false));
      if (response.success) {
        message.success("Bid added successfully");
        // send notification
        await AddNotification({
          title: "New bid has been placed",
          message: `A new bid has been placed on Your product  ${product.name} by ${user.name} for ${values.bidAmount} `,
          user: product.seller._id,
          onClick: "/profile",
          read: false,
        });
        reloadData();
        setShowBidModal(false);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      message.error(error.message);
      dispatch(setLoader(false));
    }
  };
  return (
    <Modal
      onCancel={() => setShowBidModal(false)}
      open={showBidModal}
      centered
      width={600}
      onOk={() => formRef.current.submit()}
    >
      <div className="flex flex-col gap-5 mb-5">
        <h1 className="text-2xl font-semibold text-orange-900 text-center">
          New Bid
        </h1>
        <Form onFinish={onFinish} ref={formRef} layout="vertical">
          <Form.Item rules={rules} label="Bid Amount" name="bidAmount">
            <Input />
          </Form.Item>
          <Form.Item rules={rules} label="Message" name="message">
            <Input.TextArea />
          </Form.Item>
          <Form.Item rules={rules} label="Mobile" name="mobile">
            <Input type="number" />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};

export default BidModal;
