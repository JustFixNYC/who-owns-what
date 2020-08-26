import mapping from "./mapping";

test("latLngIsNull() works", () => {
  expect(mapping.latLngIsNull([NaN, 1])).toBe(true);
  expect(mapping.latLngIsNull([1, NaN])).toBe(true);
  expect(mapping.latLngIsNull([NaN, NaN])).toBe(true);
  expect(mapping.latLngIsNull([1, 2])).toBe(false);
});

test("getBoundingBox() calculates bounding box", () => {
  expect(
    mapping.getBoundingBox(
      [
        [2, 3],
        [0.5, 2.2],
        [0, 1],
      ],
      [
        [0, 0],
        [0, 0],
      ]
    )
  ).toEqual([
    [0, 1],
    [2, 3],
  ]);
});

test("getBoundingBox() returns default if array is empty", () => {
  expect(
    mapping.getBoundingBox(
      [],
      [
        [1, 2],
        [3, 4],
      ]
    )
  ).toEqual([
    [1, 2],
    [3, 4],
  ]);
});
