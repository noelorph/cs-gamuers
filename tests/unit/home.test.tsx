import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import Home from "@/app/page";

test("home renders the application heading", () => {
  render(<Home />);
  expect(
    screen.getByRole("heading", { level: 1, name: "CS-GAMUERS" }),
  ).toBeDefined();
});
