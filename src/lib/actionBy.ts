export type ActionByUser = {
  id: number;
  name?: string | null;
  username?: string | null;
  phone_number?: string | null;
  status?: string | null;
  force_reset_password?: boolean;
  last_logined?: string | null;
  email_verified_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
};

export type ActionByValue = ActionByUser | number | null | undefined;

export const getActionByLabel = (actionBy: ActionByValue): string => {
  if (actionBy == null) {
    return "-";
  }

  if (typeof actionBy === "number") {
    return `#${actionBy}`;
  }

  const name = actionBy.name?.trim();
  if (name) {
    return name;
  }

  const username = actionBy.username?.trim();
  if (username) {
    return username;
  }

  const phoneNumber = actionBy.phone_number?.trim();
  if (phoneNumber) {
    return phoneNumber;
  }

  return `#${actionBy.id}`;
};
