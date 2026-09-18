"use server";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

// const MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds
const MAX_AGE = 60 * 60 * 24 * 1; // 1 days in seconds
const ALGORITHM = "HS256";
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

const encrypt = async (data: Record<string, unknown>) => {
  const payload = await new SignJWT(data)
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime("1 day from now")
    .sign(JWT_SECRET);
  return payload;
};

const decrypt = async (data: string) => {
  const payload = (await jwtVerify(data, JWT_SECRET, { algorithms: [ALGORITHM] })).payload;
  return payload;
};

const setCookie = async (name: string, formData: FormData) => {
  const inputEmail = formData.get("email");
  const inputId = formData.get("id");
  const inputToken = formData.get("token");
  const inputName = formData.get("name");
  const inputRole = formData.get("role") || null;
  const inputStatus = formData.get("status");
  const inputPermissions = formData.get("permissions") || null;
  const inputAuthType = formData.get("authType");

  const userData = {
    id: inputId,
    email: inputEmail,
    token: inputToken,
    name: inputName,
    role: inputRole,
    status: inputStatus,
    permissions: inputPermissions,
    authType: inputAuthType,
  };

  const encryptedData = await encrypt({ userData });

  // cookies() returns an object directly, not a Promise
  const tempCookie = await cookies();
  tempCookie.set(name, encryptedData, {
    httpOnly: true,
    maxAge: MAX_AGE, // maxAge in seconds
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
};

const getCookie = async (name: string) => {
  // cookies() returns an object directly, not a Promise
  const tempCookie = await cookies();
  const cookieValue = tempCookie.get(name)?.value;
  if (!cookieValue) {
    return null;
  }
  const userData = await decrypt(cookieValue);
  const res = {
    status: 200,
    message: "success",
    data: userData,
  };

  return JSON.stringify(res);
};

const removeCookie = async (name: string) => {
  // cookies() returns an object directly, not a Promise
  const tempCookie = await cookies();
  tempCookie.delete(name);
};

export { setCookie, getCookie, removeCookie };
