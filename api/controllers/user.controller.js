import * as userService from "../services/user.service.js";
import { sendSuccess } from "../utils/response.js";
import { sendCsv, toCsv } from "../utils/csv.js";

export const getUsers = async (req, res) => {
  const { items, meta } = await userService.listUsers(req.valid.query);
  sendSuccess(res, { data: items, meta });
};

export const exportUsers = async (req, res) => {
  const users = await userService.exportUsers(req.valid.query);
  const csv = toCsv(
    [
      { label: "Name", value: (u) => u.name },
      { label: "Email", value: (u) => u.email },
      { label: "Role", value: (u) => u.role },
      { label: "Status", value: (u) => u.status },
      { label: "Created", value: (u) => u.createdAt },
      { label: "Last sign-in", value: (u) => u.lastLoginAt },
    ],
    users
  );
  sendCsv(res, `users-${new Date().toISOString().slice(0, 10)}.csv`, csv);
};

export const getUser = async (req, res) => {
  sendSuccess(res, { data: await userService.getUserDetail(req.valid.params.id) });
};

export const updateUserStatus = async (req, res) => {
  const user = await userService.updateUserStatus(req.user, req.valid.params.id, req.valid.body.status, req.id);
  sendSuccess(res, {
    message: user.status === "blocked" ? "User blocked and signed out" : "User unblocked",
    data: user,
  });
};

export const updateUserRole = async (req, res) => {
  const user = await userService.updateUserRole(req.user, req.valid.params.id, req.valid.body.role, req.id);
  sendSuccess(res, { message: `Role changed to ${user.role}`, data: user });
};
