/* eslint-disable react/prop-types */
import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, App, Col, Form, Input, InputNumber, Modal, Row, Select, Switch } from "antd";
import { productsApi } from "../../services/endpoints";
import { CATEGORIES } from "../../constants";
import { applyServerErrors } from "../../utils/forms";

const FLAGS = [
  { name: "billAvailable", label: "Original bill" },
  { name: "warrantyAvailable", label: "Warranty" },
  { name: "accessoriesAvailable", label: "Accessories" },
  { name: "boxAvailable", label: "Original box" },
];
const FIELDS = ["name", "description", "price", "category", "age", "showBidsOnProductPage", ...FLAGS.map((f) => f.name)];

export default function ProductFormModal({ open, product, onClose, onCreated }) {
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const { message } = App.useApp();
  const editing = Boolean(product);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (product) {
      form.setFieldsValue({ ...Object.fromEntries(FIELDS.map((k) => [k, product[k]])), category: product.category?.toLowerCase() });
    }
  }, [open, product, form]);

  const save = useMutation({
    mutationFn: (values) => (editing ? productsApi.update(product._id, values) : productsApi.create(values)),
    onSuccess: (res) => {
      message.success(editing ? "Listing updated" : "Listing submitted for review");
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["product", res.data._id] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      onClose();
      if (!editing) onCreated?.(res.data);
    },
    onError: (err) => {
      if (!applyServerErrors(form, err)) message.error(err.message);
    },
  });

  return (
    <Modal
      open={open}
      title={editing ? "Edit listing" : "New listing"}
      okText={editing ? "Save changes" : "Submit for review"}
      onOk={() => form.submit()}
      confirmLoading={save.isPending}
      onCancel={onClose}
      width={640}
      forceRender
    >
      {!editing && (
        <Alert className="mb-5" type="info" showIcon message="New listings are reviewed by an administrator before buyers can see them. You can add photos after saving." />
      )}
      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
        onFinish={(values) => save.mutate(values)}
        initialValues={{ showBidsOnProductPage: false, ...Object.fromEntries(FLAGS.map((f) => [f.name, false])) }}
      >
        <Form.Item label="Title" name="name" rules={[{ required: true, whitespace: true, message: "Enter a title" }, { min: 2, max: 120 }]}>
          <Input maxLength={120} placeholder="e.g. Mirrorless camera with two lenses" />
        </Form.Item>
        <Form.Item label="Description" name="description" rules={[{ required: true, whitespace: true, message: "Describe the item" }, { min: 10, max: 2000, message: "Use 10–2,000 characters" }]}>
          <Input.TextArea autoSize={{ minRows: 3, maxRows: 8 }} showCount maxLength={2000} placeholder="Condition, what's included, reason for selling…" />
        </Form.Item>
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item label="Price (USD)" name="price" rules={[{ required: true, message: "Enter a price" }]}>
              <InputNumber className="w-full" min={0} precision={2} prefix="$" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item label="Category" name="category" rules={[{ required: true, message: "Choose a category" }]}>
              <Select options={CATEGORIES} placeholder="Select" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item label="Age (years)" name="age" rules={[{ required: true, message: "Enter the age" }]} tooltip="How long ago the item was bought">
              <InputNumber className="w-full" min={0} max={100} precision={0} />
            </Form.Item>
          </Col>
        </Row>
        <fieldset className="m-0 mb-4 rounded-lg border border-line p-4">
          <legend className="px-1 text-[13px] font-semibold text-fg">What&apos;s included</legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {FLAGS.map((f) => (
              <label key={f.name} className="flex items-center justify-between gap-3 text-sm text-fg">
                {f.label}
                <Form.Item name={f.name} valuePropName="checked" noStyle>
                  <Switch size="small" aria-label={f.label} />
                </Form.Item>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="flex items-center justify-between gap-3 text-sm text-fg">
          <span>
            Show bids publicly on the listing
            <span className="block text-xs text-muted">Buyers will see bidder names and amounts, never contact details.</span>
          </span>
          <Form.Item name="showBidsOnProductPage" valuePropName="checked" noStyle>
            <Switch aria-label="Show bids publicly" />
          </Form.Item>
        </label>
      </Form>
    </Modal>
  );
}
