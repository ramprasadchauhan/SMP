/* eslint-disable react/prop-types */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { App, Form, Input, InputNumber, Modal } from "antd";
import { productsApi } from "../../services/endpoints";
import { formatPrice } from "../../utils/format";
import { applyServerErrors } from "../../utils/forms";

export default function BidModal({ product, open, onClose }) {
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const { message } = App.useApp();

  const place = useMutation({
    mutationFn: (values) => productsApi.placeBid(product._id, values),
    onSuccess: () => {
      message.success("Your bid was sent to the seller");
      qc.invalidateQueries({ queryKey: ["product", product._id] });
      qc.invalidateQueries({ queryKey: ["bids"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      onClose();
    },
    onError: (err) => {
      if (!applyServerErrors(form, err)) message.error(err.message);
    },
  });

  return (
    <Modal
      open={open}
      title={`Bid on “${product.name}”`}
      okText="Send bid"
      onOk={() => form.submit()}
      confirmLoading={place.isPending}
      onCancel={onClose}
      destroyOnHidden
    >
      <p className="mb-5 text-sm text-muted">
        Asking price {formatPrice(product.price)}. Your message and phone number are shared only with the seller.
      </p>
      <Form form={form} layout="vertical" onFinish={(v) => place.mutate(v)} requiredMark="optional">
        <Form.Item label="Your offer (USD)" name="bidAmount" rules={[{ required: true, message: "Enter an amount" }, { type: "number", min: 1, message: "Offer must be at least $1" }]}>
          <InputNumber className="w-full" min={1} precision={2} prefix="$" autoFocus />
        </Form.Item>
        <Form.Item label="Message to the seller" name="message" rules={[{ required: true, whitespace: true, message: "Add a short message" }, { max: 500 }]}>
          <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} showCount maxLength={500} />
        </Form.Item>
        <Form.Item
          label="Phone number"
          name="mobile"
          rules={[
            { required: true, message: "Enter a phone number" },
            { pattern: /^\+?[0-9][0-9\s-]{6,18}$/, message: "Enter a valid phone number" },
          ]}
        >
          <Input inputMode="tel" autoComplete="tel" placeholder="+1 555 0100" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
