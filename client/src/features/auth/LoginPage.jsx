import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Button, Form, Input } from "antd";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { authApi } from "../../services/endpoints";
import { noticeCleared, signedIn } from "../../store/authSlice";

const NOTICE_TEXT = {
  SESSION_EXPIRED: "Your session expired. Please sign in again.",
  SESSION_REVOKED: "You were signed out because your session is no longer valid.",
  ACCOUNT_BLOCKED: "Your account has been blocked. Please contact an administrator.",
};

export default function LoginPage() {
  const dispatch = useDispatch();
  const notice = useSelector((s) => s.auth.notice);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Sign in · SMP";
  }, []);

  const onFinish = async (values) => {
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await authApi.login(values);
      // GuestOnly redirects to the originally requested page.
      dispatch(signedIn(data.user));
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <>
      <h1 className="text-[26px] font-semibold tracking-tight text-fg">Welcome back</h1>
      <p className="mb-7 mt-1.5 text-sm text-muted">Sign in to manage your listings and bids.</p>

      {notice && !error && (
        <Alert
          className="mb-5"
          type={notice.code === "ACCOUNT_BLOCKED" ? "error" : "info"}
          showIcon
          message={NOTICE_TEXT[notice.code] || notice.message}
          closable
          onClose={() => dispatch(noticeCleared())}
        />
      )}
      {error && <Alert className="mb-5" type="error" showIcon message={error} role="alert" />}

      <Form layout="vertical" onFinish={onFinish} requiredMark={false} size="large" disabled={submitting}>
        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Enter your email address" },
            { type: "email", message: "Enter a valid email address" },
          ]}
        >
          <Input prefix={<MailOutlined className="text-subtle" />} autoComplete="email" autoFocus inputMode="email" />
        </Form.Item>
        <Form.Item label="Password" name="password" rules={[{ required: true, message: "Enter your password" }]}>
          <Input.Password prefix={<LockOutlined className="text-subtle" />} autoComplete="current-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block loading={submitting} className="mt-2">
          Sign in
        </Button>
      </Form>

      <p className="mt-6 text-center text-sm text-muted">
        New to SMP? <Link to="/register" className="font-semibold">Create an account</Link>
      </p>
    </>
  );
}
