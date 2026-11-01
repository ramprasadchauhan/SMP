import { useMutation, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import { CrownOutlined, EyeOutlined, StopOutlined, UnlockOutlined, UserOutlined } from "@ant-design/icons";
import { usersApi } from "../../services/endpoints";

export function useUserActions() {
  const qc = useQueryClient();
  const { modal, message } = App.useApp();
  const onDone = (res) => {
    message.success(res.message);
    qc.invalidateQueries({ queryKey: ["users"] });
    qc.invalidateQueries({ queryKey: ["user"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };
  const onError = (err) => message.error(err.message);
  const status = useMutation({ mutationFn: ({ id, status }) => usersApi.setStatus(id, status), onSuccess: onDone, onError });
  const role = useMutation({ mutationFn: ({ id, role }) => usersApi.setRole(id, role), onSuccess: onDone, onError });

  const confirmStatus = (u) => {
    const blocking = u.status === "active";
    modal.confirm({
      title: blocking ? `Block ${u.name}?` : `Unblock ${u.name}?`,
      content: blocking
        ? "They will be signed out everywhere immediately and won't be able to sign in until unblocked. This is recorded in the audit log."
        : "They will be able to sign in and use the marketplace again. This is recorded in the audit log.",
      okText: blocking ? "Block user" : "Unblock user",
      okButtonProps: { danger: blocking },
      onOk: () => status.mutateAsync({ id: u._id, status: blocking ? "blocked" : "active" }).catch(() => {}),
    });
  };
  const confirmRole = (u) => {
    const promote = u.role !== "admin";
    modal.confirm({
      title: promote ? `Make ${u.name} an administrator?` : `Remove admin access from ${u.name}?`,
      content: promote
        ? "Administrators can block users, change roles and moderate every listing."
        : "They will keep their account but lose access to administration pages.",
      okText: promote ? "Grant admin" : "Remove admin",
      okButtonProps: { danger: !promote },
      onOk: () => role.mutateAsync({ id: u._id, role: promote ? "admin" : "user" }).catch(() => {}),
    });
  };
  return { confirmStatus, confirmRole };
}

export function userMenuItems(u, currentUserId, { onView, confirmStatus, confirmRole }) {
  const self = u._id === currentUserId;
  return [
    onView && { key: "view", icon: <EyeOutlined />, label: "View details", onClick: () => onView(u) },
    onView && { type: "divider" },
    {
      key: "status",
      icon: u.status === "active" ? <StopOutlined /> : <UnlockOutlined />,
      label: u.status === "active" ? "Block user" : "Unblock user",
      danger: u.status === "active",
      disabled: self,
      onClick: () => confirmStatus(u),
    },
    {
      key: "role",
      icon: u.role === "admin" ? <UserOutlined /> : <CrownOutlined />,
      label: u.role === "admin" ? "Remove admin role" : "Make admin",
      disabled: self,
      onClick: () => confirmRole(u),
    },
  ].filter(Boolean);
}
