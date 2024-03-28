import { Button, Upload, message } from "antd";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { setLoader } from "../redux/loadersSlice";
import {
  DeleteProduct,
  EditProduct,
  uploadProductImage,
} from "../apiCalls/products";

const Images = ({ selectedProduct, getData, setShowProductForm }) => {
  const [showPreview, setShowPreview] = useState(true);
  const [file, setFile] = useState(null);
  const [images, setImages] = useState(selectedProduct.images);
  const dispatch = useDispatch();
  const upload = async () => {
    try {
      dispatch(setLoader(true));
      // upload image to cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("productId", selectedProduct._id);
      const response = await uploadProductImage(formData);
      dispatch(setLoader(false));
      if (response.success) {
        message.success(response.message);
        setImages([...images, response.data]);
        setShowPreview(false);
        setFile(null);
        getData();
      }
    } catch (error) {
      dispatch(setLoader(false));
      return message.error(error.message);
    }
  };
  const deleteImage = async (image) => {
    const shouldDelete = window.confirm(
      "Are you sure you want to delete this product?"
    );
    if (!shouldDelete) return;
    try {
      dispatch(setLoader(true));

      const updatedImageArray = images?.filter((img) => img !== image);
      const updatedProduct = { ...selectedProduct, images: updatedImageArray };
      const response = await EditProduct(selectedProduct._id, updatedProduct);
      if (response.success) {
        message.success(response.message);
        setImages(updatedImageArray);
        getData();
      } else {
        throw new Error(response.message);
      }
      dispatch(setLoader(false));
    } catch (error) {
      dispatch(setLoader(false));
      return message.error(error.message);
    }
  };
  return (
    <div>
      <div className="flex gap-5">
        {images.map((image, i) => {
          return (
            <div
              className="flex gap-2 border-gray-300 border-solid p-2 items-end"
              key={i}
            >
              <img
                className=" w-20 h-20 rounded-md object-cover"
                src={image}
                alt="product-image"
              />
              <i
                onClick={() => deleteImage(image)}
                className="ri-delete-bin-6-line font-semibold text-red-400"
              ></i>
            </div>
          );
        })}
      </div>
      <Upload
        beforeUpload={() => false}
        listType="picture"
        onChange={(info) => {
          setShowPreview(true);
          setFile(info.file);
        }}
        showUploadList={showPreview}
      >
        <Button type="default" className="rounded-tl-md rounded-br-md mt-4">
          upload image
        </Button>
      </Upload>
      <div className="flex justify-end gap-5 mt-5">
        <Button
          className="rounded-tl-md rounded-br-md"
          type="default"
          onClick={() => {
            setShowProductForm(false);
          }}
        >
          cancel
        </Button>
        <Button
          type="primary"
          className="rounded-tl-md rounded-br-md hover:opacity-90"
          disabled={!file}
          onClick={upload}
        >
          upload
        </Button>
      </div>
    </div>
  );
};

export default Images;
