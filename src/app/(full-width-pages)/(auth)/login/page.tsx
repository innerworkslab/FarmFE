import { Metadata } from "next";
import LoginForm from "./components/LoginForm";

export const metadata: Metadata = {
  title: "Admin Login",
  description: "Log in to the Game admin dashboard.",
};

export default function LoginPage() {
  return <LoginForm />;
}
