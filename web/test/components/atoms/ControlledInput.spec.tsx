import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";

import { ControlledInput } from "@/components/atoms/ControlledInput";

interface FormShape {
  email: string;
}

function Host({ defaultEmail = "" }: { defaultEmail?: string }) {
  const { control } = useForm<FormShape>({
    defaultValues: { email: defaultEmail },
  });
  return <ControlledInput control={control} name="email" label="Email" type="email" />;
}

function HostWithErrors() {
  const { control, handleSubmit } = useForm<FormShape>({
    defaultValues: { email: "" },
    resolver: async (values) => {
      if (!values.email) {
        return {
          values: {},
          errors: {
            email: { type: "required", message: "Email is required" },
          },
        };
      }
      return { values, errors: {} };
    },
    mode: "onSubmit",
  });
  return (
    <form onSubmit={handleSubmit(() => undefined)} noValidate>
      <ControlledInput control={control} name="email" label="Email" />
      <button type="submit">Submit</button>
    </form>
  );
}

describe("<ControlledInput />", () => {
  it("renders input controlled via react-hook-form", async () => {
    const user = userEvent.setup();
    render(<Host />);

    const input = screen.getByLabelText(/email/i);
    await user.type(input, "prima@moneta.com");
    expect(input).toHaveValue("prima@moneta.com");
  });

  it("respects the form's defaultValues", () => {
    render(<Host defaultEmail="cagao@moneta.com" />);
    expect(screen.getByLabelText(/email/i)).toHaveValue("cagao@moneta.com");
  });

  it("shows the error message coming from fieldState", async () => {
    const user = userEvent.setup();
    render(<HostWithErrors />);

    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/email is required/i);
  });
});
