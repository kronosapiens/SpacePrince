import { afterEach, describe, expect, it } from "vitest";
import { TIMINGS, timings } from "@/svg/timings";
import { resetTuning, setTuning } from "@/svg/tuning";

describe("timings", () => {
  afterEach(resetTuning);

  it("equals the committed values at default tuning", () => {
    expect(timings()).toEqual(TIMINGS);
  });

  it("scales only the group its multiplier names", () => {
    setTuning({ necessityDurationScale: 2 });
    const { necessity, ...rest } = timings();
    expect(necessity).toEqual(
      Object.fromEntries(Object.entries(TIMINGS.necessity).map(([key, ms]) => [key, ms * 2])),
    );
    expect(rest).toEqual({ turn: TIMINGS.turn, leave: TIMINGS.leave, mint: TIMINGS.mint });
  });
});
