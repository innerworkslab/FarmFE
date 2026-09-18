"use client";

import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/redux/hook";
import { adminLogin } from "@/redux/http";
import { farmApi } from "@/redux/services/farmApi";
import { fcmService } from "@/services/fcmService";

type LoginFormValues = {
  login: string;
  password: string;
};

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();

  useEffect(() => {
    fcmService.initializeToken().then((fcmToken) => {
      console.log("Admin login page FCM token:", fcmToken);
    });
  }, []);

  const {
    register,
    setError,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ mode: "onTouched" });

  const onSubmit: SubmitHandler<LoginFormValues> = async (data) => {
    setLoading(true);

    try {
      const fcmToken = await fcmService.initializeToken();
      const response = await adminLogin({
        login: data.login,
        password: data.password,
        device_name: "web-browser",
        ...(fcmToken ? { fcm_token: fcmToken } : {}),
      });

      if (response.status === 422 && response.data?.errors) {
        const apiErrors = response.data.errors;
        Object.keys(apiErrors).forEach((key) => {
          const message = apiErrors[key]?.[0];
          if (message) {
            setError(key as keyof LoginFormValues, { type: "manual", message });
          }
        });
      } else if (response.status === 200) {
        dispatch(farmApi.util.resetApiState());
        toast.success("Login successful!", { description: "Welcome to Farm Executive Panel" });
        router.push("/");
      } else {
        toast.error("Login failed.", { description: "Invalid credentials." });
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Login failed.", {
        description: "Please check your credentials and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div className="rounded-2xl p-8 w-full border border-gray-100 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-xl">
          <div className="mb-6 text-center">
            <Link href="/login" className="mb-3 inline-block">
              <Image src="/images/logo/logo-icon.svg" alt="Logo" width={48} height={48} />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Farm Login
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Sign in to manage farm operations, setup, and business masters.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Label>Email or Username *</Label>
              <Input
                placeholder="e.g. superadmin@example.com"
                type="text"
                {...register("login", {
                  required: "Email or username is required.",
                })}
                error={!!errors.login}
                hint={errors.login?.message}
              />
            </div>

            <div>
              <Label>
                Password <span className="text-error-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  {...register("password", {
                    required: "Password is required.",
                  })}
                  error={!!errors.password}
                  hint={errors.password?.message}
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                >
                  {showPassword ? (
                    <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                  ) : (
                    <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                  )}
                </span>
              </div>
            </div>

            <div>
              <Button className="w-full font-medium py-3 rounded-xl shadow-md bg-[#15803d] hover:bg-[#14532d]" size="sm" disabled={loading} type="submit">
                {loading ? "Logging In..." : "Log In"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
