import { describe, it } from "mocha";
import { expect } from "chai";
import Redis from "ioredis";
import Styles from "./Styles";

const redis = new Redis({ db: 9 });

const styles = new Styles({ redis });

describe("Styles Integration Test", () => {
  before(async () => {
    redis
      .multi()
      .set("styles::source::colors", "$red: red;\n$blue: blue;")
      .set("styles::compiled::header", ".header{background:green}")
      .set("styles::compiled::body", "body{background:red}")
      .exec();
  });
  after(async () => {
    await redis.flushdb();
    redis.disconnect();
  });
  it("can compile simple scss", async () => {
    const result = await styles.compile("$color: red; body{background:$color}");
    const css = result.css.toString();
    expect(css).to.eq("body{background:red}");
  });

  it("can resolve imported scss", async () => {
    const result = await styles.compile(
      "@use 'colors'; body{background:colors.$red}"
    );
    const css = result.css.toString();
    expect(css).to.eq("body{background:red}");
  });

  it("stores compilation results", async () => {
    await styles.compiled.save(
      "name",
      "@use 'colors'; body{background:colors.$red}"
    );
    expect(await styles.compiled.get("name")).to.eq("body{background:red}");
  });

  it("stores compiled styles merged together", async () => {
    expect(await styles.merged(["header", "body"])).to.eq(
      ".header{background:green} body{background:red} "
    );
    expect(await styles.merged(["body", "header"])).to.eq(
      "body{background:red} .header{background:green} "
    );
  });
  it("lists all the styles");
});
