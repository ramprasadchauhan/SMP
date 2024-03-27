/* eslint-disable react/prop-types */
import { Modal, Tabs, Form, Input, Row, Col, message } from "antd";
import TextArea from "antd/es/input/TextArea";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setLoader } from "../redux/loadersSlice";
import { AddProduct, EditProduct } from "../apiCalls/products";
import Images from "../components/Images";

const additionalThings = [
  {
    label: "Bill Available",
    name: "billAvailable",
  },
  {
    label: "Warranty Available",
    name: "warrantyAvailable",
  },
  {
    label: "Accessories Available",
    name: "accessoriesAvailable",
  },
  {
    label: "Box Available",
    name: "boxAvailable",
  },
];

const rules = [
  {
    required: true,
    message: "Required",
  },
];

const ProductForm = ({
  showProductForm,
  setShowProductForm,
  selectedProduct,
  getData,
}) => {
  const [selectedTab, setSelectedTab] = useState("1");
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.users);

  const formRef = useRef(null);
  useEffect(() => {
    if (selectedProduct) {
      formRef.current.setFieldsValue(selectedProduct);
    } else {
      formRef.current.setFieldsValue({
        name: "",
        description: "",
        price: "",
        category: "",
        age: "",
        billAvailable: false,
        warrantyAvailable: false,
        accessoriesAvailable: false,
        boxAvailable: false,
      });
    }
  }, [selectedProduct]);
  const onFinish = async (values) => {
    try {
      dispatch(setLoader(true));
      let response = null;
      if (selectedProduct) {
        response = await EditProduct(selectedProduct._id, values);
      } else {
        values.seller = user._id;
        values.status = "pending";
        response = await AddProduct(values);
      }
      console.log(response);
      dispatch(setLoader(false));
      if (response.success) {
        message.success(response.message);
        setShowProductForm(false);
        getData();
      }
    } catch (error) {
      dispatch(setLoader(false));
      return message.error(error.message);
    }
  };
  return (
    <Modal
      title=""
      open={showProductForm}
      onCancel={() => setShowProductForm(false)}
      width={1000}
      okText="save"
      onOk={() => {
        formRef.current.submit();
      }}
      {...(selectedTab === "2" && { footer: false })}
    >
      <div>
        <p className=" text-center font-semibold text-primary uppercase text-2xl">
          {selectedProduct ? "Edit product" : "Add product"}
        </p>
        <Tabs
          defaultActiveKey="1"
          activeKey={selectedTab}
          onChange={(key) => setSelectedTab(key)}
        >
          <Tabs.TabPane tab="Genral" key="1">
            <Form layout="vertical" ref={formRef} onFinish={onFinish}>
              <Form.Item label="Name" name="name" rules={rules}>
                <Input type="text" />
              </Form.Item>
              <Form.Item label="Description" name="description" rules={rules}>
                <TextArea type="text" rows={3} />
              </Form.Item>
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Form.Item label="Price" name="price" rules={rules}>
                    <Input type="number" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Category" name="category" rules={rules}>
                    <select className="py-3">
                      <option value="">Select</option>
                      <option value="electronics">Electronics</option>
                      <option value="fashion">Fashion</option>
                      <option value="home">Home</option>
                      <option value="sports">Sports</option>
                    </select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Age" name="age" rules={rules}>
                    <Input type="number" />
                  </Form.Item>
                </Col>
              </Row>
              <div className="flex gap-10">
                {additionalThings.map((item) => (
                  <Form.Item
                    valuePropName="checked"
                    label={item.label}
                    name={item.name}
                    key={item.name}
                  >
                    <Input
                      type="checkbox"
                      value={item.name}
                      onChange={(e) => {
                        formRef.current.setFieldsValue({
                          [item.name]: e.target.checked,
                        });
                      }}
                      checked={formRef.current?.getFieldsValue(item.name)}
                    />
                  </Form.Item>
                ))}
              </div>
            </Form>
          </Tabs.TabPane>
          <Tabs.TabPane disabled={!selectedProduct} tab="Images" key="2">
            <Images
              selectedProduct={selectedProduct}
              getData={getData}
              setShowProductForm={setShowProductForm}
            />
          </Tabs.TabPane>
        </Tabs>
      </div>
    </Modal>
  );
};

export default ProductForm;
