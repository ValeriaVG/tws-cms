import { describe, it } from "mocha";
import { expect } from "chai";
import { routes } from "./index";

describe("health", () => {
  it("responds with ok", async () => {
    expect(await routes.health.GET()).to.deep.equal({ status: "OK" });
  });
});