export const idText = (id: number) => String(id).padStart(3, "0");
export const avatar = (id: number) => "/avatars/" + idText(id) + ".png";
