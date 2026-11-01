import { useDispatch, useSelector } from "react-redux";
import { useMutation } from "@tanstack/react-query";
import { App, Button, Card, Descriptions, Form, Input } from "antd";
import { authApi } from "../../services/endpoints";
import { userUpdated } from "../../store/authSlice";
import { formatDateTime } from "../../utils/format";
import { applyServerErrors, newPasswordRules } from "../../utils/forms";
import { PageHeader, RoleTag, StatusTag, UserAvatar } from "../../components/ui";

export default function AccountPage() {
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const { message } = App.useApp();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const profile = useMutation({
    mutationFn: authApi.updateMe,
    onSuccess: (res) => {
      dispatch(userUpdated(res.data.user));
      message.success("Profile updated");
    },
    onError: (err) => {
      if (!applyServerErrors(profileForm, err)) message.error(err.message);
    },
  });
  const password = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: (res) => {
      passwordForm.resetFields();
      message.success(res.message);
    },
    onError: (err) => {
      if (err.code === "INVALID_CREDENTIALS") passwordForm.setFields([{ name: "currentPassword", errors: [err.message] }]);
      else if (!applyServerErrors(passwordForm, err)) message.error(err.message);
    },
  });

  return (
    <>
      <PageHeader title="Account settings" description="Manage your profile and sign-in security." />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card title="Profile">
          <div className="mb-6 flex items-center gap-4">
            <UserAvatar name={user.name} size={56} />
            <div className="min-w-0">
              <div className="truncate text-lg font-semibold text-fg">{user.name}</div>
              <div className="truncate text-sm text-muted">{user.email}</div>
              <div className="mt-2 flex gap-2">
                <RoleTag role={user.role} />
                <StatusTag status={user.status} />
              </div>
            </div>
          </div>
          <Form form={profileForm} layout="vertical" initialValues={{ name: user.name }} onFinish={(v) => profile.mutate(v)} requiredMark={false}>
            <Form.Item label="Full name" name="name" rules={[{ required: true, whitespace: true, message: "Enter your name" }, { min: 2, max: 80 }]}>
              <Input autoComplete="name" />
            </Form.Item>
            <Form.Item label="Email" tooltip="Contact an administrator to change your email address">
              <Input value={user.email} disabled />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={profile.isPending}>
              Save profile
            </Button>
          </Form>
          <Descriptions className="mt-6" column={1} size="small">
            <Descriptions.Item label="Member since">{formatDateTime(user.createdAt)}</Descriptions.Item>
            <Descriptions.Item label="Last sign-in">{user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "Not recorded"}</Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title="Change password">
          <p className="mb-5 text-sm text-muted">Changing your password signs you out on every other device.</p>
          <Form form={passwordForm} layout="vertical" onFinish={({ currentPassword, newPassword }) => password.mutate({ currentPassword, newPassword })} requiredMark={false}>
            <Form.Item label="Current password" name="currentPassword" rules={[{ required: true, message: "Enter your current password" }]}>
              <Input.Password autoComplete="current-password" />
            </Form.Item>
            <Form.Item label="New password" name="newPassword" rules={newPasswordRules} extra="At least 8 characters, including a letter and a number." hasFeedback>
              <Input.Password autoComplete="new-password" />
            </Form.Item>
            <Form.Item
              label="Confirm new password"
              name="confirm"
              dependencies={["newPassword"]}
              hasFeedback
              rules={[
                { required: true, message: "Confirm the new password" },
                ({ getFieldValue }) => ({
                  validator: (_, v) => (!v || getFieldValue("newPassword") === v ? Promise.resolve() : Promise.reject(new Error("Passwords do not match"))),
                }),
              ]}
            >
              <Input.Password autoComplete="new-password" />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={password.isPending}>
              Update password
            </Button>
          </Form>
        </Card>
      </div>
    </>
  );
}
