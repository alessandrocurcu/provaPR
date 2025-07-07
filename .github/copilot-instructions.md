### General Instructions for Copilot

- Always write code in a clear and maintainable way
- Always respond in English
- Always provide examples in JavaScript

### Naming Conventions for variables (for JavaScript and TypeScript)

- Use camelCase for variables and parameters
- Use human-readable names like `userName` or `shoppingCart,` make them descriptive and concise. Examples of bad names are `data` and `value`.
- Stay away from abbreviations or short names like `a`, `b`, and `c`
- Define and use consistent terminology across the code and docs. Avoid synonyms in code (e.g., don’t mix `user`, `account`, `member` if they refer to the same thing). If a site visitor is called a “user” then we should name related variables `currentUser` or `newUser` instead of `currentVisitor` or `newManInTown`.
- A good name should reflects behavior or role (e.g., `getUser`), higher-level intent/context (e.g., `relocateDeviceAccurately`) and usage expectations (e.g., `isUser` for booleans)
- Avoid Hungarian notation unless it communicates clear DOM-related intent (`elHeader`, `$header`)

### JavaScript

- Avoid clever constructs and prefer simplicity, but accept some deviations for performance or practicality when necessary
- Use a functional style of coding
- Don’t use `for..in` loops for arrays
- Limit line length to 120 characters
- Prefer pattern matching and switch expressions for clarity
- Use template literals string interpolation (`Hello ${name}`) instead of string concatenation
- Prefer expression-bodied members for simple properties and methods
- Avoid magic numbers and strings — extract to constants/enums
- Keep functions small and focused (single responsibility)
- Use pure functions and avoid shared mutable state when possible
- Follow the Law of Demeter: limit knowledge of object internals, avoid chained access (`a.b().c()`) and expose only needed information via clear, narrow APIs
- Use ES modules with `.js` file extensions in import paths
- Use named exports only; avoid default exports
- Prevent cyclic dependencies between modules

### Error Handling Principles

- Prefer **explicit error handling** over silent failures — use try/catch, guard clauses, and clear error messages.
- Use custom error to distinguish error types (`ValidationError`, `AuthError`, etc.).
- Always fail fast and loudly in unexpected states to prevent silent corruption or undefined behavior.
- Return meaningful error payloads in APIs (include `message`, `code`, `context` where relevant).

### Comments

- Write meaningful comments only where intent isn’t obvious
