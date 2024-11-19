import { jsonToHtml } from "../../main"; // htmlify-json if using via npm

const screwedUpJson = {
  level1: {
    level2: {
      level3: [
        {
          deepArray: [
            {
              deepObject: {
                key1: "value1",
                key2: ["a", "b", { nestedKey: "nestedValue" }],
                key3: 42,
                key4: null,
                key5: { "☃": "snowman", "key\u0001": "controlChar" },
              },
            },
          ],
        },
        [
          1,
          "string",
          false,
          { weirdKey: "value", moreLevels: { key: [{ deep: 3.14 }] } },
          [[[["nestedArray"]]]],
        ],
      ],
    },
  },
  mixedTypes: [
    1,
    "string",
    null,
    { complex: [{ key: [{ foo: "bar" }] }] },
    123456789012345678901234567890n,
    { unicode: "你好", emoji: "😀" },
    ["arrayWithinArray", { key: "value", tricky: ["another", "array"] }],
  ],
  cyclicReference: null,
  keysWithNewlines: {
    "key\nwith\nnewlines": "value",
    moreNewlines: { "\nkey\n": "\nvalue\n" },
  },
  emptyObjectsAndArrays: {
    emptyArray: [],
    emptyObject: {},
  },
  edgeCases: [{ key: "value" }, {}, [], null, ""],
};

screwedUpJson.cyclicReference = screwedUpJson;

const response = jsonToHtml(screwedUpJson, {
  formatKeys: true,
  listObjects: false,
  outputFormat: "pretty",
  styleLocation: "top",
  headers: {
    level1: 1,
    "level1.level2": 2,
    "level1.level2.level3": 3,
    mixedTypes: 4,
  },
});

console.log(response);
