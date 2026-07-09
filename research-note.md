# Research note

**Source:** MDN Web Docs — "Using the Fetch API"
**Link:** https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch

**Keywords used to find it:** `fetch api error handling response.ok`

**Summary (in Georgian):**

MDN-ის დოკუმენტაცია განმარტავს, რომ `fetch()` ფუნქცია მხოლოდ ქსელური
შეცდომის დროს (მაგ. კავშირის გაწყვეტა) აგდებს exception-ს try/catch
ბლოკში — HTTP სტატუსის შეცდომებზე (404, 500) ის ავტომატურად არ
"იჭერს" შეცდომას, ამიტომ საჭიროა ხელით შემოწმდეს `response.ok`
თვისება. სწორედ ამიტომ, clients გვერდზე მონაცემების ჩატვირთვისას
ვამოწმებ ორივეს ერთად: `try/catch`-ს ქსელური პრობლემებისთვის და
`response.ok`-ს იმისთვის, რომ სერვერმა თავად დააბრუნა შეცდომის
სტატუსი. ეს პირდაპირ უკავშირდება P4.2-ში აღწერილ error handling-ის
მოთხოვნას — Retry ღილაკთან ერთად.
