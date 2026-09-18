import { useMemo } from "react";
import { useAppSelector } from "@/redux/hook";

export const useCheckPermission = (permission: string): boolean => {
  const permissions = useAppSelector((state) => state.auth.permissions);

  return useMemo(() => {
    console.log(" permissions", permissions);
    console.log("check permission", permission, permissions?.includes(permission) ?? false);
    return permissions?.includes(permission) ?? false;
  }, [permissions, permission]);
};
