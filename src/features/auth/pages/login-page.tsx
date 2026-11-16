import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import ErrorState from "../../../components/shared/error-state";
import LoadingState from "../../../components/shared/loading-state";
import Button from "../../../components/ui/button";
import Input from "../../../components/ui/input";
import type { ApiError } from "../../../types/api";
import { useLoginMutation, useSessionQuery } from "../auth.queries";
import { loginSchema } from "../auth.schema";
import type { LoginInput } from "../auth.types";

export default function LoginPage() {
  const navigate = useNavigate();
  const loginMutation = useLoginMutation();
  const session = useSessionQuery();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const pending = isSubmitting || loginMutation.isPending;
  let requestError = "";

  if (loginMutation.isError) {
    const error = loginMutation.error;
    if (isAxiosError<ApiError>(error)) {
      if (!error.response) {
        requestError = "Unable to connect. Check your connection and try again";
      } else if (
        error.response.status === 401 &&
        error.response.data.code === "INVALID_CREDENTIALS"
      ) {
        requestError = "Invalid username or password";
      } else if (error.response.status === 403) {
        requestError = "Request denied. Please refresh the page and try again";
      } else {
        requestError =
          error.response.data.message || "Unable to sign in. Please try again";
      }
    } else {
      requestError = "Unable to sign in. Please try again";
    }
  }

  const onSubmit = async (input: LoginInput) => {
    try {
      await loginMutation.mutateAsync(input);
      navigate("/products", { replace: true });
    } catch {
      // The mutation error is displayed below; keep the entered values.
    }
  };

  if (session.isPending) {
    return (
      <main className="p-4 md:p-6">
        <LoadingState message="Checking your session…" />
      </main>
    );
  }

  if (session.isError) {
    return (
      <main className="p-4 md:p-6">
        <ErrorState
          title="Unable to verify your session"
          onRetry={() => void session.refetch()}
          isRetrying={session.isFetching}
        />
      </main>
    );
  }

  if (session.data) return <Navigate to="/products" replace />;

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-8">
      <section
        aria-labelledby="login-title"
        className="w-full max-w-sm rounded-panel border border-border bg-surface p-6 sm:p-8"
      >
        <div className="mb-6 flex items-center gap-2">
          <img src="/selo.svg" alt="" width={40} height={40} />
          <span className="text-3xl font-bold text-primary">Selo</span>
        </div>

        <h1 id="login-title" className="text-2xl font-semibold text-heading">
          Sign in
        </h1>
        <p className="mt-1 text-muted">Enter your staff account details</p>

        <form
          className="mt-6 space-y-4"
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          aria-busy={pending}
        >
          <div>
            <label
              htmlFor="username"
              className="mb-1.5 block font-medium text-heading"
            >
              Username
            </label>
            <Input
              id="username"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              disabled={pending}
              aria-invalid={Boolean(errors.username)}
              aria-describedby={errors.username ? "username-error" : undefined}
              {...register("username")}
            />
            {errors.username && (
              <p
                id="username-error"
                role="alert"
                className="mt-1 text-sm text-danger"
              >
                {errors.username.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block font-medium text-heading"
            >
              Password
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              disabled={pending}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : undefined}
              {...register("password")}
            />
            {errors.password && (
              <p
                id="password-error"
                role="alert"
                className="mt-1 text-sm text-danger"
              >
                {errors.password.message}
              </p>
            )}
          </div>

          {requestError && (
            <p
              role="alert"
              className="rounded-control bg-danger-soft p-3 text-sm text-danger"
            >
              {requestError}
            </p>
          )}

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </section>
    </main>
  );
}
