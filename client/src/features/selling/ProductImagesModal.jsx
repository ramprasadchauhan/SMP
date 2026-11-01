/* eslint-disable react/prop-types */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { App, Button, Modal, Popconfirm, Progress, Upload } from "antd";
import { DeleteOutlined, InboxOutlined } from "@ant-design/icons";
import { productsApi } from "../../services/endpoints";

const MAX_IMAGES = 10;
const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function ProductImagesModal({ productId, onClose }) {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const [progress, setProgress] = useState(null);
  const { data } = useQuery({ queryKey: ["product", productId], queryFn: () => productsApi.get(productId), enabled: Boolean(productId) });
  const product = data?.data;
  const images = product?.images || [];

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["product", productId] });
    qc.invalidateQueries({ queryKey: ["products"] });
  };
  const upload = useMutation({
    mutationFn: (file) => productsApi.uploadImage(productId, file, (e) => setProgress(Math.round((e.loaded / (e.total || 1)) * 100))),
    onSuccess: () => message.success("Photo uploaded"),
    onError: (err) => message.error(err.message),
    onSettled: () => {
      setProgress(null);
      refresh();
    },
  });
  const remove = useMutation({
    mutationFn: (url) => productsApi.removeImage(productId, url),
    onSuccess: () => {
      message.success("Photo removed");
      refresh();
    },
    onError: (err) => message.error(err.message),
  });

  const beforeUpload = (file) => {
    if (!TYPES.includes(file.type)) message.error("Use a JPEG, PNG, WebP or GIF image");
    else if (file.size > MAX_BYTES) message.error("Images must be 5 MB or smaller");
    else upload.mutate(file);
    return Upload.LIST_IGNORE;
  };

  return (
    <Modal open={Boolean(productId)} onCancel={onClose} title={product ? `Photos · ${product.name}` : "Photos"} footer={<Button onClick={onClose}>Done</Button>} width={640} destroyOnHidden>
      <p className="mb-4 text-sm text-muted">The first photo is used as the cover image. Up to {MAX_IMAGES} photos, 5 MB each.</p>
      {images.length < MAX_IMAGES && (
        <Upload.Dragger accept={TYPES.join(",")} beforeUpload={beforeUpload} showUploadList={false} disabled={upload.isPending} multiple={false}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Click or drag a photo here to upload</p>
          {progress !== null && <Progress percent={progress} size="small" className="mx-auto max-w-xs" />}
        </Upload.Dragger>
      )}
      {images.length > 0 && (
        <ul className="m-0 mt-5 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-4">
          {images.map((src, i) => (
            <li key={src} className="group relative overflow-hidden rounded-lg border border-line">
              <img src={src} alt={`Photo ${i + 1}`} className="aspect-square w-full object-cover" />
              {i === 0 && <span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[11px] font-medium text-white">Cover</span>}
              <Popconfirm title="Remove this photo?" okText="Remove" okButtonProps={{ danger: true }} onConfirm={() => remove.mutateAsync(src).catch(() => {})}>
                <Button size="small" danger icon={<DeleteOutlined />} aria-label={`Remove photo ${i + 1}`} className="absolute right-2 top-2" />
              </Popconfirm>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
