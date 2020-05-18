import mapping from "./mapping";

test("latLngIsNull() works", () => {
  expect(mapping.latLngIsNull([NaN, 1])).toBe(true);
  expect(mapping.latLngIsNull([1, NaN])).toBe(true);
  expect(mapping.latLngIsNull([NaN, NaN])).toBe(true);
  expect(mapping.latLngIsNull([1, 2])).toBe(false);
});

test("getBoundingBox() works", () => {
  expect(
    mapping.getBoundingBox([
      [2, 3],
      [0.5, 2.2],
      [0, 1],
    ])
  ).toEqual([
    [0, 1],
    [2, 3],
  ]);
});
