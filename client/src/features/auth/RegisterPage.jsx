import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Alert, Button, Form, Input } from "antd";
import { authApi } from "../../services/endpoints";
import { signedIn } from "../../store/authSlice";
import { applyServerErrors, newPasswordRules } from "../../utils/forms";

export default function RegisterPage() {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Create account · SMP";
  }, []);

  const onFinish = async ({ name, email, password }) => {
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await authApi.register({ name, email, password });
      dispatch(signedIn(data.user));
    } catch (err) {
      if (!applyServerErrors(form, err)) setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <>
      <h1 className="text-[26px] font-semibold tracking-tight text-fg">Create your account</h1>
      <p className="mb-7 mt-1.5 text-sm text-muted">Start selling and bidding in a couple of minutes.</p>
      {error && <Alert className="mb-5" type="error" showIcon message={error} role="alert" />}
      <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false} size="large" disabled={submitting}>
        <Form.Item label="Full name" name="name" rules={[{ required: true, message: "Enter your name" }, { min: 2, max: 80, message: "Use 2–80 characters" }]}>
          <Input autoComplete="name" autoFocus />
        </Form.Item>
        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Enter your email address" },
            { type: "email", message: "Enter a valid email address" },
          ]}
        >
          <Input autoComplete="email" inputMode="email" />
        </Form.Item>
        <Form.Item label="Password" name="password" rules={newPasswordRules} extra="At least 8 characters, including a letter and a number." hasFeedback>
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          label="Confirm password"
          name="confirm"
          dependencies={["password"]}
          hasFeedback
          rules={[
            { required: true, message: "Confirm your password" },
            ({ getFieldValue }) => ({
              validator: (_, value) =>
                !value || getFieldValue("password") === value ? Promise.resolve() : Promise.reject(new Error("Passwords do not match")),
            }),
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block loading={submitting} className="mt-2">
          Create account
        </Button>
      </Form>
      <p className="mt-6 text-center text-sm text-muted">
        Already have an account? <Link to="/login" className="font-semibold">Sign in</Link>
      </p>
    </>
  );
}
