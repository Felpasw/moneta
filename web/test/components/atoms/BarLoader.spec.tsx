import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BarLoader } from "@/components/atoms/BarLoader";

describe("<BarLoader />", () => {
  it("renderiza 8 barras por default", () => {
    const { container } = render(<BarLoader />);
    expect(container.querySelectorAll("[data-slot='bar-loader-bar']")).toHaveLength(8);
  });

  it("respeita o prop bars", () => {
    const { container } = render(<BarLoader bars={5} />);
    expect(container.querySelectorAll("[data-slot='bar-loader-bar']")).toHaveLength(5);
  });

  it("expõe role=status pra acessibilidade", () => {
    const { container } = render(<BarLoader />);
    expect(container.querySelector("[role='status']")).not.toBeNull();
  });
});
