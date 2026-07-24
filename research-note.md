# Research note

**Source:** MDN Web Docs — "Using the Fetch API"
**Link:** https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch

**Keywords used to find it:** `fetch api error handling response.ok`

**Summary:**

The MDN documentation explains that `fetch()` only throws an exception
into a `try/catch` block on a *network* error (e.g. a dropped connection
or a DNS failure). It does **not** automatically treat HTTP status
errors (404, 500) as failures, because a server response — even one
carrying an error code — still counts as a *successful* network
request. That is why you have to check the `response.ok` property by
hand: it returns `true` only for statuses in the 200–299 range.

The docs also show that `fetch()` itself returns a Promise that
resolves to a `Response` object — which is exactly why `loadClients()`
in `data.js` is written as an `async` function using `await fetch(...)`,
so the code reads sequentially, without callbacks. It matters too that
`response.json()` is *itself* a separate Promise and takes time to parse
the body, so I `await` that separately as well before using the
`data.users` array.

For this reason, when the clients page loads its data I check both
things together: `try/catch` for network problems, and `response.ok`
for the case where the server itself returned an error status. This
maps directly to the error-handling requirement described in P4.2 —
together with the Retry button, which re-invokes `initClientsPage()`,
and that in turn runs the same `loadClients()` function again.
