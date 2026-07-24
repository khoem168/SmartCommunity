import { apiFetch } from "./api";

export const fetchProfileRequest = () => apiFetch("/profile");

export const createProfileItemRequest = (resource, payload) =>
  apiFetch(`/profile/${resource}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateProfileItemRequest = (resource, itemId, payload) =>
  apiFetch(`/profile/${resource}/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const deleteProfileItemRequest = (resource, itemId) =>
  apiFetch(`/profile/${resource}/${itemId}`, { method: "DELETE" });

const uploadImage = (path, file) => {
  const body = new FormData();
  body.append("image", file);
  return apiFetch(path, { method: "POST", body });
};

export const uploadAvatarRequest = (file) => uploadImage("/profile/avatar", file);

export const uploadProjectImageRequest = (file) =>
  uploadImage("/profile/project-image", file);
