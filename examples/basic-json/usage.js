import { jsonToHtml } from "../../main"; // htmlify-json if using via npm

const basicJson = {
  user: {
    id: 12345,
    name: "John Doe",
    email: "john.doe@example.com",
    isActive: true,
  },
  profile: {
    age: 30,
    gender: "male",
    location: {
      city: "New York",
      state: "NY",
      country: "USA",
    },
  },
  preferences: {
    notifications: {
      email: true,
      sms: false,
    },
    theme: "dark",
  },
  hobbies: ["reading", "hiking", "coding"],
  createdAt: "2024-11-19T12:34:56Z",
};

const response = jsonToHtml(basicJson, {
  formatKeys: true,
  listObjects: true,
  styleLocation: "top",
});

console.log(response);
