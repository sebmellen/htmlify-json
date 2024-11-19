import { jsonToHtml } from "./main.js";

const complexData = {
  organization: {
    name: "TechCorp International",
    founded: 1985,
    active: true,
    dissolved: null,
    metrics: {
      revenue: {
        2021: 1000000.5,
        2022: 1500000.75,
        currency: "USD",
        quarterly: [250000, 350000, 400000, 500000.75],
      },
      employees: {
        total: 500,
        departments: {
          engineering: {
            total: 200,
            teams: [
              {
                name: "Frontend",
                headcount: 50,
                technologies: ["React", "Vue", "Angular"],
              },
              {
                name: "Backend",
                headcount: 100,
                technologies: ["Node", "Python", "Java"],
              },
              {
                name: "DevOps",
                headcount: 50,
                technologies: ["AWS", "Docker", "Kubernetes"],
              },
            ],
            locations: {
              primary: "New York",
              secondary: ["London", "Tokyo", "Berlin"],
              remote: true,
            },
          },
          marketing: {
            total: 100,
            campaigns: [
              { id: 1, name: "Summer Sale", budget: 50000 },
              { id: 2, name: "Product Launch", budget: 100000 },
            ],
          },
        },
        benefits: {
          health: true,
          dental: true,
          vision: false,
          retirement: {
            "401k": true,
            pension: false,
            matchPercentage: 6.5,
          },
        },
      },
    },
    contacts: [
      {
        type: "primary",
        details: {
          name: "John Smith",
          role: "CEO",
          email: "john@techcorp.com",
          phone: {
            office: "+1-555-0123",
            mobile: "+1-555-0124",
          },
        },
      },
      {
        type: "legal",
        details: {
          name: "Jane Doe",
          role: "General Counsel",
          email: "jane@techcorp.com",
          phone: {
            office: "+1-555-0125",
          },
        },
      },
    ],
    addresses: {
      headquarters: {
        street: "123 Tech Avenue",
        city: "San Francisco",
        state: "CA",
        zip: "94105",
        country: "USA",
        coordinates: {
          lat: 37.7749,
          lng: -122.4194,
        },
      },
      branches: [
        "New York",
        "London",
        "Tokyo",
        {
          city: "Berlin",
          opened: 2020,
          employees: 50,
        },
      ],
    },
  },
};

const nestedData = {
  additionalStatusDetails: {
    code: "1001",
    message: "Parent",
    nestedStatus: {
      additionalStatusDetails: {
        code: "2001",
        message: "Child",
        deeperStatus: {
          additionalStatusDetails: {
            code: "3001",
            message: "Grandchild",
          },
        },
      },
    },
  },
};

// Add new test data for case formatting
const caseFormattingData = {
  userProfile: {
    firstName: "John",
    last_name: "Doe",
    personalDetails: {
      date_of_birth: "1990-01-01",
      phoneNumber: "555-0123",
      emergency_contact: {
        fullName: "Jane Doe",
        relationship_type: "Spouse",
      },
    },
    employmentHistory: [
      {
        company_name: "TechCorp",
        jobTitle: "Senior Developer",
        years_of_service: 5,
      },
    ],
  },
};

const runAllTests = () => {
  const tests = [
    // Original styling tests
    {
      name: "Complex object with various styling options",
      input: complexData,
      options: {
        headers: {
          organization: 1,
          "organization.metrics": 2,
          "organization.metrics.employees": 2,
          "organization.contacts": 2,
          "organization.addresses": 2,
        },
      },
      assertions: [
        // Structure tests
        (html) => html.includes("<h1"),
        (html) => html.includes("<h2"),
        (html) => html.includes("<ul"),
        (html) => (html.match(/<h1/g) || []).length === 1,
        (html) => (html.match(/<h2/g) || []).length === 4,

        // Content tests
        (html) => html.includes("TechCorp International"),
        (html) => html.includes("1985"),
        (html) => html.includes("true"),
        (html) => html.includes("null"),
        (html) => html.includes("1000000.5") || html.includes("1000000.50"), // Allow both formats

        // Nested array tests
        (html) => html.includes("Frontend"),
        (html) => html.includes("Backend"),
        (html) => html.includes("DevOps"),

        // Deep object tests
        (html) => html.includes("headquarters"),
        (html) => html.includes("San Francisco"),
        (html) => html.includes("37.7749"),

        // Mixed array content tests
        (html) => html.includes("New York"),
        (html) => html.includes("Berlin"),

        // Style tests
        (html) => html.includes('style="font-weight: bold'),
        (html) => html.includes("margin-left: 8px"),
      ],
    },
    {
      name: "No styles option",
      input: complexData,
      options: {
        useStyles: "none",
        headers: {
          organization: 1,
        },
      },
      assertions: [
        (html) => !html.includes("style="),
        (html) => html.includes("<h1"),
        (html) => html.includes("TechCorp International"),
      ],
    },
    {
      name: "Custom styles",
      input: complexData,
      options: {
        useStyles: {
          container: "background: #f5f5f5;",
          key: "color: #FF0000;",
        },
        headers: {
          organization: 1,
        },
      },
      assertions: [
        (html) => html.includes("background: #f5f5f5"),
        (html) => html.includes("color: #FF0000"),
        (html) => !html.includes("font-family: system-ui"), // Should use custom styles only
      ],
    },
    {
      name: "Circular reference handling",
      input: (() => {
        const circular = { name: "test" };
        circular.self = circular;
        return circular;
      })(),
      options: {},
      assertions: [
        (html) => html.includes("[Circular Reference]"),
        (html) => html.includes("test"),
      ],
    },
    {
      name: "Empty containers",
      input: {
        emptyObject: {},
        emptyArray: [],
        nested: {
          empty: {},
        },
      },
      options: {},
      assertions: [
        (html) => html.includes("(empty object)"),
        (html) => html.includes("(empty array)"),
        (html) =>
          html.includes("empty") &&
          html.includes("object") &&
          html.includes("array"),
      ],
    },
    // Adding nesting test
    {
      name: "Proper list nesting",
      input: nestedData,
      options: {
        listObjects: ["additionalStatusDetails"],
      },
      assertions: [
        // Basic content checks
        (html) => html.includes("1001"),
        (html) => html.includes("2001"),
        (html) => html.includes("3001"),

        // Check proper list structure
        (html) => {
          const cleanHtml = html.replace(/\s+/g, " ");
          return /ul[^>]*>.*?code.*?1001.*?<\/ul/s.test(cleanHtml);
        },

        // Verify each nested list is inside a li of its parent
        (html) => {
          const cleanHtml = html.replace(/\s+/g, " ");
          // Check specific nesting patterns - more flexible matching
          const pattern1 = /<li[^>]*>.*?nestedStatus:.*?<ul/s;
          const pattern2 = /<li[^>]*>.*?deeperStatus:.*?<ul/s;
          return pattern1.test(cleanHtml) && pattern2.test(cleanHtml);
        },

        // Verify proper closing order
        (html) => {
          const cleanHtml = html.replace(/\s+/g, " ");
          // Check that lists are properly closed within their li elements
          // Allow for other potential HTML elements between ul and li closings
          const pattern = /<\/ul>(?:[^<]*|(?!<\/li>)<[^>]*>)*<\/li>/;
          return pattern.test(cleanHtml);
        },
      ],
    },
    // Add new test case
    {
      name: "Case formatting test",
      input: caseFormattingData,
      options: {
        formatKeys: true,
        headers: {
          userProfile: 1,
          "userProfile.personalDetails": 2,
          "userProfile.employmentHistory": 2,
        },
      },
      assertions: [
        // Test camelCase transformations
        (html) => html.includes("User Profile"),
        (html) => html.includes("First Name"),
        (html) => html.includes("Personal Details"),
        (html) => html.includes("Phone Number"),
        (html) => html.includes("Full Name"),
        (html) => html.includes("Job Title"),

        // Test snake_case transformations
        (html) => html.includes("Last Name"),
        (html) => html.includes("Date Of Birth"),
        (html) => html.includes("Relationship Type"),
        (html) => html.includes("Company Name"),
        (html) => html.includes("Years Of Service"),

        // Test that the values remain unchanged
        (html) => html.includes("John"),
        (html) => html.includes("Doe"),
        (html) => html.includes("TechCorp"),
        (html) => html.includes("Senior Developer"),

        // Test that formatting is applied in headers
        (html) => html.includes("<h1") && html.includes("User Profile"),
        (html) => html.includes("<h2") && html.includes("Personal Details"),
      ],
    },
    {
      name: "Case formatting disabled test",
      input: caseFormattingData,
      options: {
        formatKeys: false,
        headers: {
          userProfile: 1,
        },
      },
      assertions: [
        // Test that original cases are preserved
        (html) => html.includes("userProfile"),
        (html) => html.includes("firstName"),
        (html) => html.includes("last_name"),
        (html) => !html.includes("User Profile"),
        (html) => !html.includes("First Name"),
        (html) => !html.includes("Last Name"),
      ],
    },
  ];

  // Run tests and collect results
  const results = tests.map((test) => {
    const html = jsonToHtml(test.input, test.options);
    const failures = test.assertions
      .map((assertion, index) => {
        try {
          return assertion(html) ? null : `Assertion ${index + 1} failed`;
        } catch (error) {
          return `Assertion ${index + 1} threw error: ${error.message}`;
        }
      })
      .filter(Boolean);

    return {
      name: test.name,
      passed: failures.length === 0,
      failures,
    };
  });

  // Print results
  console.log("\nTest Results:\n");
  results.forEach((result) => {
    console.log(`${result.passed ? "✓" : "✗"} ${result.name}`);
    if (!result.passed) {
      result.failures.forEach((failure) => {
        console.log(`  - ${failure}`);
      });
    }
  });

  const totalTests = tests.length;
  const passedTests = results.filter((r) => r.passed).length;
  console.log(`\nSummary: ${passedTests}/${totalTests} tests passed\n`);

  return {
    success: passedTests === totalTests,
    results,
  };
};

// Run all tests
const testResults = runAllTests();
console.log("\nAll tests passed:", testResults.success);
